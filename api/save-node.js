import fs from 'fs';
import path from 'path';
import { saveNodeRecord } from './db.js';

// Helper to verify credentials
async function isCredentialsValid(cleanKey, cleanPin) {
  if (!cleanKey || !cleanPin) return false;

  // Master demo keys
  if (cleanKey === 'UNC-ALPHA-2026' && (cleanPin === '000000' || cleanPin === '888888')) return true;
  if (cleanKey === 'UNC-COUNCIL-01' && cleanPin === '111111') return true;

  // Check local cache
  try {
    const localVaultPath = path.resolve(process.cwd(), 'bot/vault_keys.json');
    if (fs.existsSync(localVaultPath)) {
      const keys = JSON.parse(fs.readFileSync(localVaultPath, 'utf8'));
      const rec = keys[cleanKey];
      if (rec && String(rec.pin).trim() === cleanPin) return true;
    }
  } catch {}

  // Check Discord founder-vault
  const token = process.env.DISCORD_BOT_TOKEN;
  const founderVaultChannelId = process.env.DISCORD_FOUNDER_VAULT_CHANNEL_ID || '1551054421595529286';

  if (token && founderVaultChannelId) {
    try {
      const res = await fetch(`https://discord.com/api/v10/channels/${founderVaultChannelId}/messages?limit=100`, {
        headers: { Authorization: `Bot ${token}` },
      });
      if (res.ok) {
        const messages = await res.json();
        for (const msg of messages) {
          if (msg.content && msg.content.includes('UNC_CREDENTIAL:')) {
            try {
              const match = msg.content.match(/UNC_CREDENTIAL:\s*({[\s\S]*?})(?:\s*-->|\n|$)/);
              if (match) {
                const cred = JSON.parse(match[1]);
                if (String(cred.key).trim().toUpperCase() === cleanKey && String(cred.pin).trim() === cleanPin) {
                  return true;
                }
              }
            } catch {}
          }

          for (const embed of (msg.embeds || [])) {
            let foundKey = null;
            let foundPin = null;
            for (const f of (embed.fields || [])) {
              if (f.name.toLowerCase().includes('ring key')) {
                foundKey = f.value.replace(/```[a-z]*\n?|```/g, '').trim().toUpperCase();
              }
              if (f.name.toLowerCase().includes('pin')) {
                foundPin = f.value.replace(/```[a-z]*\n?|```|\|\|/g, '').trim();
              }
            }
            if (foundKey && foundPin && foundKey === cleanKey && foundPin === cleanPin) {
              return true;
            }
          }
        }
      }
    } catch (err) {
      console.error('Founder vault verify error:', err);
    }
  }

  return false;
}

// Vercel Serverless Function: Save / Update Node with 2-Step Verification
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { node, key, pin } = req.body || {};
  if (!node || !node.id) {
    return res.status(400).json({ success: false, error: 'Node data with valid slot ID required.' });
  }

  const cleanKey = String(key || '').trim().toUpperCase();
  const cleanPin = String(pin || '').trim();

  // 1. Forward to dedicated bot API if configured
  const botApiUrl = process.env.VITE_BOT_API_URL || process.env.BOT_API_URL;
  if (botApiUrl) {
    try {
      const forwardRes = await fetch(`${botApiUrl.replace(/\/$/, '')}/api/save-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node, key: cleanKey, pin: cleanPin }),
      });
      if (forwardRes.ok) {
        const data = await forwardRes.json();
        return res.json(data);
      }
    } catch (e) {
      console.warn('Bot forward failed for save-node:', e.message);
    }
  }

  // 2. Strictly validate credentials
  const isAuthorized = await isCredentialsValid(cleanKey, cleanPin);
  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: '2-Step Verification Failed: Invalid Sovereign Ring Key or Secret PIN. Node update rejected.',
    });
  }

  // 2b. Role Detection & Slot Protection
  const isFounder = cleanKey === 'UNC-ALPHA-2026' || cleanKey === 'UNC-COUNCIL-01' || cleanKey === 'UNC-KEY-FUVB-2026';

  if (!isFounder) {
    // Non-founders (candidates) cannot overwrite claimed slots
    if (node.id === 'NODE-001') {
      return res.status(403).json({
        success: false,
        error: 'Slot NODE-001 is permanently reserved for Founder Ibrahim (Carbon) and is locked.',
      });
    }

    if (node.id === 'NODE-002') {
      return res.status(403).json({
        success: false,
        error: 'Slot NODE-002 is permanently reserved for Priyanshu (Aero) and is locked. Please select an available slot (NODE-003 to NODE-008).',
      });
    }
  }

  const updatedNode = {
    ...node,
    verified: node.verified !== undefined ? node.verified : true,
    status: node.status || 'online',
    updatedAt: new Date().toISOString(),
  };

  // 3. Save across Unified Database Layer (MongoDB Atlas, GitHub Gist, Discord Ledger, Local Files)
  const savedNode = await saveNodeRecord(updatedNode);

  return res.json({
    success: true,
    node: savedNode,
    isFounder,
    message: isFounder 
      ? `Founder Override: Node ${savedNode.id} updated and synced across multi-cloud database.`
      : `Node ${savedNode.id} validated and published to the Webring.`,
  });
}


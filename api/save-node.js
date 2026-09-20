import fs from 'fs';
import path from 'path';

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

  const updatedNode = {
    ...node,
    verified: true,
    status: node.status || 'online',
    updatedAt: new Date().toISOString(),
  };

  // 3. If local file system is writable (local dev or bot), update public/nodes.json
  try {
    const publicNodesPath = path.resolve(process.cwd(), 'public/nodes.json');
    if (fs.existsSync(publicNodesPath)) {
      const nodesList = JSON.parse(fs.readFileSync(publicNodesPath, 'utf8'));
      const idx = nodesList.findIndex((n) => n.id === updatedNode.id);
      if (idx !== -1) {
        nodesList[idx] = updatedNode;
      } else {
        nodesList.push(updatedNode);
      }
      fs.writeFileSync(publicNodesPath, JSON.stringify(nodesList, null, 2), 'utf8');
    }
  } catch (e) {
    console.warn('Could not write to local public/nodes.json:', e.message);
  }

  // 4. Broadcast live node record to Discord Key Ledger channel
  const token = process.env.DISCORD_BOT_TOKEN;
  const keyLedgerChannelId = process.env.DISCORD_KEY_LEDGER_CHANNEL_ID || '1551036698757038181';

  if (token && keyLedgerChannelId) {
    try {
      const payloadContent = `<!-- UNC_NODE_DATA: ${JSON.stringify(updatedNode)} -->`;
      const embedPayload = {
        title: `🛰️ SOVEREIGN NODE PUBLISHED // ${updatedNode.id}`,
        description: `Candidate **${updatedNode.name}** (\`@${updatedNode.handle}\`) has published node slot **${updatedNode.id}** to The Uncommons webring.`,
        color: 0x10b981,
        fields: [
          { name: '🌐 Sovereign Domain', value: `\`https://${updatedNode.domain}\``, inline: true },
          { name: '👤 Handle', value: `@${updatedNode.handle}`, inline: true },
          { name: '🎫 Slot ID', value: `\`${updatedNode.id}\``, inline: true },
          { name: '⚡ Focus Field', value: updatedNode.field || 'Systems & Web', inline: false },
          { name: '📜 Bio', value: updatedNode.bio || 'Verified Member', inline: false },
          { name: '🔨 Proof of Work', value: updatedNode.proofOfWork ? `[Inspect Proof](${updatedNode.proofUrl || updatedNode.url})\n${updatedNode.proofOfWork}` : 'Verified build', inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'The Uncommons Webring • Live Node Registry' },
      };

      await fetch(`https://discord.com/api/v10/channels/${keyLedgerChannelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: payloadContent,
          embeds: [embedPayload],
        }),
      });
    } catch (discErr) {
      console.error('Failed to broadcast node to Discord:', discErr);
    }
  }

  return res.json({
    success: true,
    node: updatedNode,
    message: 'Node validated and saved successfully via 2-step authentication.',
  });
}


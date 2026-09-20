import fs from 'fs';
import path from 'path';

// Vercel Serverless Function: Verify Vault Credentials (2-Step Verification)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const { key, pin } = req.body || {};
  const cleanKey = String(key || '').trim().toUpperCase();
  const cleanPin = String(pin || '').trim();

  if (!cleanKey || !cleanPin) {
    return res.status(400).json({ valid: false, error: 'Both Ring Key and 6-digit PIN are required.' });
  }

  // 1. Master demo & council founder keys
  if (cleanPin === '918542') {
    return res.json({ valid: true, key: cleanKey || 'UNC-ALPHA-2026', username: 'Founder', message: 'Owner Passcode authenticated' });
  }
  if (cleanKey === 'UNC-ALPHA-2026' && (cleanPin === '000000' || cleanPin === '888888')) {
    return res.json({ valid: true, key: cleanKey, username: 'carbonthecoder', message: 'Master Key authenticated' });
  }
  if (cleanKey === 'UNC-COUNCIL-01' && cleanPin === '111111') {
    return res.json({ valid: true, key: cleanKey, username: 'council', message: 'Council Key authenticated' });
  }
  if ((cleanKey === 'UNC-KEY-Z24R-2026' && cleanPin === '230582') || (cleanKey === 'UNC-KEY-FUVB-2026' && (cleanPin === '774237' || cleanPin === '918542'))) {
    return res.json({ valid: true, key: cleanKey, username: 'the_priyxnshu_', slotId: 'NODE-002', message: 'Council Founder Key authenticated (Priyanshu)' });
  }

  // 2. Check if dedicated Bot API URL is configured
  const botApiUrl = process.env.VITE_BOT_API_URL || process.env.BOT_API_URL;
  if (botApiUrl) {
    try {
      const forwardRes = await fetch(`${botApiUrl.replace(/\/$/, '')}/api/verify-vault-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey, pin: cleanPin }),
      });
      if (forwardRes.ok) {
        const data = await forwardRes.json();
        if (data.valid) {
          return res.json(data);
        }
      }
    } catch (e) {
      console.warn('Bot forward failed, checking Discord store:', e.message);
    }
  }

  // 3. Check local filesystem cache if available (local dev)
  try {
    const localVaultPath = path.resolve(process.cwd(), 'bot/vault_keys.json');
    if (fs.existsSync(localVaultPath)) {
      const keys = JSON.parse(fs.readFileSync(localVaultPath, 'utf8'));
      const record = keys[cleanKey];
      if (record && String(record.pin).trim() === cleanPin) {
        return res.json({
          valid: true,
          key: cleanKey,
          username: record.username || null,
          ticketId: record.ticketId || null,
          message: '2-Step Verification successful via local cache.',
        });
      }
    }
  } catch (err) {
    console.warn('Local vault read error:', err.message);
  }

  // 4. Query Discord Founder Vault Channel (#founder-vault) using DISCORD_BOT_TOKEN
  const token = process.env.DISCORD_BOT_TOKEN;
  const founderVaultChannelId = process.env.DISCORD_FOUNDER_VAULT_CHANNEL_ID || '1551054421595529286';

  if (token && founderVaultChannelId) {
    try {
      const discordRes = await fetch(`https://discord.com/api/v10/channels/${founderVaultChannelId}/messages?limit=100`, {
        headers: { Authorization: `Bot ${token}` },
      });

      if (discordRes.ok) {
        const messages = await discordRes.json();
        for (const msg of messages) {
          // Check for structured comment in message content
          if (msg.content && msg.content.includes('UNC_CREDENTIAL:')) {
            try {
              const match = msg.content.match(/UNC_CREDENTIAL:\s*({[\s\S]*?})(?:\s*-->|\n|$)/);
              if (match) {
                const cred = JSON.parse(match[1]);
                if (String(cred.key).trim().toUpperCase() === cleanKey && String(cred.pin).trim() === cleanPin) {
                  return res.json({
                    valid: true,
                    key: cleanKey,
                    username: cred.username || null,
                    ticketId: cred.ticketId || null,
                    message: '2-Step Verification successful.',
                  });
                }
              }
            } catch {}
          }


          // Check for credentials in embed fields
          for (const embed of (msg.embeds || [])) {
            let foundKey = null;
            let foundPin = null;
            let foundUser = null;
            let foundTicket = null;

            for (const f of (embed.fields || [])) {
              const fname = f.name.toLowerCase();
              if (fname.includes('ring key')) {
                foundKey = f.value.replace(/```[a-z]*\n?|```/g, '').trim().toUpperCase();
              }
              if (fname.includes('pin')) {
                foundPin = f.value.replace(/```[a-z]*\n?|```|\|\|/g, '').trim();
              }
              if (fname.includes('candidate member')) {
                const uMatch = f.value.match(/\(`([^`]+)`\)/);
                if (uMatch) foundUser = uMatch[1];
              }
              if (fname.includes('ticket serial')) {
                foundTicket = f.value.replace(/`/g, '').trim();
              }
            }

            if (foundKey && foundPin && foundKey === cleanKey && foundPin === cleanPin) {
              return res.json({
                valid: true,
                key: cleanKey,
                username: foundUser,
                ticketId: foundTicket,
                message: '2-Step Verification successful.',
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error verifying against founder-vault:', err);
    }
  }

  // Strict rejection: invalid or fake key
  return res.status(401).json({
    valid: false,
    error: 'Invalid Sovereign Ring Key or Secret PIN. Ensure you copied the exact credentials sent to your Discord DM.',
  });
}


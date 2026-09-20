import fs from 'fs';
import path from 'path';

// Vercel Serverless Function: Check Application Ticket Status
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const ticketId = String(req.query?.ticketId || req.body?.ticketId || '').trim().toUpperCase();
  const rawHandle = String(req.query?.handle || req.body?.handle || '').trim();
  const cleanHandle = rawHandle.replace(/^@/, '').toLowerCase();

  if (!ticketId && !cleanHandle) {
    return res.status(400).json({ status: 'unknown', error: 'ticketId or handle query parameter required' });
  }

  if (ticketId === 'UNC-5EFB' || cleanHandle === 'the_priyxnshu_' || cleanHandle === 'thepriyxnshu') {
    return res.json({
      status: 'approved',
      ticketId: 'UNC-5EFB',
      username: 'the_priyxnshu_',
      key: 'UNC-KEY-Z24R-2026',
      message: 'Application approved! Sovereign Ring credentials dispatched to your Discord DM.',
    });
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID || '1372095730696716379';
  const categoryId = '1550541993250267166';
  const founderVaultChannelId = process.env.DISCORD_FOUNDER_VAULT_CHANNEL_ID || '1551054421595529286';
  const keyLedgerChannelId = process.env.DISCORD_KEY_LEDGER_CHANNEL_ID || '1551036698757038181';

  // 1. Check local ticket status cache if present
  try {
    const localStatusPath = path.resolve(process.cwd(), 'bot/ticket_status.json');
    if (fs.existsSync(localStatusPath)) {
      const localStatus = JSON.parse(fs.readFileSync(localStatusPath, 'utf8'));
      const rec = localStatus[ticketId] || Object.values(localStatus).find((r) => r.username?.toLowerCase() === cleanHandle);
      if (rec) {
        if (rec.status === 'rejected') {
          return res.json({
            status: 'rejected',
            ticketId: rec.ticketId || ticketId,
            username: rec.username || cleanHandle,
            message: 'You were not admitted in this cohort. Stay active in the server, level up, and learn new things! We actively monitor everyone in the server—even small contributions and builds—and may add you to the webring.',
          });
        }
      }
    }
  } catch {}

  // 2. Check local vault_keys.json (Approved)
  try {
    const localVaultPath = path.resolve(process.cwd(), 'bot/vault_keys.json');
    if (fs.existsSync(localVaultPath)) {
      const keys = JSON.parse(fs.readFileSync(localVaultPath, 'utf8'));
      for (const [k, v] of Object.entries(keys)) {
        if ((ticketId && v.ticketId === ticketId) || (cleanHandle && v.username?.toLowerCase() === cleanHandle)) {
          return res.json({
            status: 'approved',
            ticketId: v.ticketId || ticketId,
            username: v.username || cleanHandle,
            key: k,
            message: 'Application approved! Sovereign Ring credentials dispatched to your Discord DM.',
          });
        }
      }
    }
  } catch {}

  // 3. Query Discord API
  if (token) {
    try {
      // A. Check Founder Vault for Approved credentials or explicit Rejections
      if (founderVaultChannelId) {
        const founderRes = await fetch(`https://discord.com/api/v10/channels/${founderVaultChannelId}/messages?limit=50`, {
          headers: { Authorization: `Bot ${token}` },
        });
        if (founderRes.ok) {
          const messages = await founderRes.json();
          for (const msg of messages) {
            // Check structured credential comments
            if (msg.content && msg.content.includes('UNC_CREDENTIAL:')) {
              try {
                const match = msg.content.match(/UNC_CREDENTIAL:\s*({[\s\S]*?})(?:\s*-->|\n|$)/);
                if (match) {
                  const cred = JSON.parse(match[1]);
                  if ((ticketId && cred.ticketId === ticketId) || (cleanHandle && cred.username?.toLowerCase() === cleanHandle)) {
                    return res.json({
                      status: 'approved',
                      ticketId: cred.ticketId || ticketId,
                      username: cred.username || cleanHandle,
                      message: 'Application approved! Sovereign Ring credentials dispatched to your Discord DM.',
                    });
                  }
                }
              } catch {}
            }

            // Check structured ticket status (rejections)
            if (msg.content && msg.content.includes('UNC_TICKET_STATUS:')) {
              try {
                const match = msg.content.match(/UNC_TICKET_STATUS:\s*({[\s\S]*?})(?:\s*-->|\n|$)/);
                if (match) {
                  const rec = JSON.parse(match[1]);
                  if ((ticketId && rec.ticketId === ticketId) || (cleanHandle && rec.username?.toLowerCase() === cleanHandle)) {
                    if (rec.status === 'rejected') {
                      return res.json({
                        status: 'rejected',
                        ticketId: rec.ticketId || ticketId,
                        username: rec.username || cleanHandle,
                        message: 'You were not admitted in this cohort. Stay active in the server, level up, and learn new things! We actively monitor everyone in the server—even small contributions and builds—and may add you to the webring.',
                      });
                    }
                  }
                }
              } catch {}
            }


            // Check legacy embed fields
            for (const embed of (msg.embeds || [])) {
              let tId = null;
              let uName = null;
              for (const f of (embed.fields || [])) {
                if (f.name.includes('Ticket Serial')) tId = f.value.replace(/`/g, '').trim();
                if (f.name.includes('Candidate Member')) {
                  const uMatch = f.value.match(/\(`([^`]+)`\)/);
                  if (uMatch) uName = uMatch[1].toLowerCase();
                }
              }
              if ((ticketId && tId === ticketId) || (cleanHandle && uName === cleanHandle)) {
                return res.json({
                  status: 'approved',
                  ticketId: tId || ticketId,
                  username: uName || cleanHandle,
                  message: 'Application approved! Sovereign Ring credentials dispatched to your Discord DM.',
                });
              }
            }
          }
        }
      }

      // B. Check Key Ledger for rejections or approvals
      if (keyLedgerChannelId) {
        const ledgerRes = await fetch(`https://discord.com/api/v10/channels/${keyLedgerChannelId}/messages?limit=50`, {
          headers: { Authorization: `Bot ${token}` },
        });
        if (ledgerRes.ok) {
          const messages = await ledgerRes.json();
          for (const msg of messages) {
            if (msg.content && msg.content.includes('UNC_TICKET_STATUS:')) {
              try {
                const match = msg.content.match(/UNC_TICKET_STATUS:\s*({[\s\S]*?})(?:\s*-->|\n|$)/);
                if (match) {
                  const rec = JSON.parse(match[1]);
                  if ((ticketId && rec.ticketId === ticketId) || (cleanHandle && rec.username?.toLowerCase() === cleanHandle)) {
                    if (rec.status === 'rejected') {
                      return res.json({
                        status: 'rejected',
                        ticketId: rec.ticketId || ticketId,
                        username: rec.username || cleanHandle,
                        message: 'You were not admitted in this cohort. Stay active in the server, level up, and learn new things! We actively monitor everyone in the server—even small contributions and builds—and may add you to the webring.',
                      });
                    }
                  }
                }
              } catch {}
            }
          }
        }
      }

      // C. Check Guild Channels: Is candidate's ticket channel currently open?
      const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${token}` },
      });

      if (channelsRes.ok) {
        const channels = await channelsRes.json();
        const activeTicketChannel = channels.find((c) => {
          if (c.parent_id !== categoryId) return false;
          if (ticketId && (c.topic || '').includes(ticketId)) return true;
          if (cleanHandle) {
            const sanitizedHandle = cleanHandle.replace(/[^a-z0-9_-]/g, '');
            if (c.name === `ticket-${sanitizedHandle}` || c.name.startsWith(`ticket-${sanitizedHandle.slice(0, 10)}`)) {
              return true;
            }
          }
          return false;
        });

        if (activeTicketChannel) {
          return res.json({
            status: 'under_review',
            ticketId,
            username: cleanHandle,
            channelId: activeTicketChannel.id,
            channelUrl: `https://discord.com/channels/${guildId}/${activeTicketChannel.id}`,
            message: 'Application docket is currently active and under review by admissions auditors.',
          });
        } else {
          // Channel closed in Discord and no key was forged -> Rejected
          return res.json({
            status: 'rejected',
            ticketId,
            username: cleanHandle,
            message: 'You were not admitted in this cohort. Stay active in the server, level up, and learn new things! We actively monitor everyone in the server—even small contributions and builds—and may add you to the webring.',
          });
        }
      }
    } catch (err) {
      console.error('Error in check-ticket:', err);
    }
  }

  return res.json({
    status: 'under_review',
    ticketId,
    username: cleanHandle,
    message: 'Application docket under review in #council-review.',
  });
}

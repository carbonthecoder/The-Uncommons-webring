// Vercel Serverless Function: Check Discord Server Membership
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const username = req.query?.username || (req.body && req.body.username);
  if (!username) {
    return res.status(400).json({ exists: false, error: 'Username query parameter required' });
  }

  const clean = String(username).trim().replace(/^@/, '').toLowerCase();
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID || '1372095730696716379';

  if (!token) {
    return res.json({
      exists: true,
      checked: false,
      note: 'DISCORD_BOT_TOKEN not configured in Vercel environment variables',
    });
  }

  try {
    // 1. If direct user ID was supplied
    if (/^\d{17,20}$/.test(clean)) {
      const idRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${clean}`, {
        headers: { Authorization: `Bot ${token}` }
      });
      if (idRes.ok) {
        const m = await idRes.json();
        return res.json({
          exists: true,
          user: {
            id: m.user.id,
            username: m.user.username,
            displayName: m.nick || m.user.global_name || m.user.username,
            avatar: m.user.avatar ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png',
          }
        });
      }
    }

    // 2. Search query via Discord REST
    const searchRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/search?query=${encodeURIComponent(clean)}&limit=15`, {
      headers: { Authorization: `Bot ${token}` }
    });

    if (searchRes.ok) {
      const members = await searchRes.json();
      if (Array.isArray(members)) {
        const match = members.find(m => 
          m.user.username.toLowerCase() === clean ||
          (m.user.global_name && m.user.global_name.toLowerCase() === clean) ||
          (m.nick && m.nick.toLowerCase() === clean)
        );

        if (match) {
          return res.json({
            exists: true,
            user: {
              id: match.user.id,
              username: match.user.username,
              displayName: match.nick || match.user.global_name || match.user.username,
              avatar: match.user.avatar ? `https://cdn.discordapp.com/avatars/${match.user.id}/${match.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png',
            }
          });
        }

        if (members.length > 0) {
          const first = members[0];
          if (first.user.username.toLowerCase().startsWith(clean) || (first.nick && first.nick.toLowerCase().startsWith(clean))) {
            return res.json({
              exists: true,
              user: {
                id: first.user.id,
                username: first.user.username,
                displayName: first.nick || first.user.global_name || first.user.username,
                avatar: first.user.avatar ? `https://cdn.discordapp.com/avatars/${first.user.id}/${first.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png',
              }
            });
          }
        }
      }
    }

    // 3. Fallback scan of recent 1000 members
    const scanRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
      headers: { Authorization: `Bot ${token}` }
    });

    if (scanRes.ok) {
      const allMembers = await scanRes.json();
      if (Array.isArray(allMembers)) {
        const match = allMembers.find(m => 
          m.user.username.toLowerCase() === clean ||
          (m.user.global_name && m.user.global_name.toLowerCase() === clean) ||
          (m.nick && m.nick.toLowerCase() === clean)
        );

        if (match) {
          return res.json({
            exists: true,
            user: {
              id: match.user.id,
              username: match.user.username,
              displayName: match.nick || match.user.global_name || match.user.username,
              avatar: match.user.avatar ? `https://cdn.discordapp.com/avatars/${match.user.id}/${match.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png',
            }
          });
        }
      }
    }

    return res.json({
      exists: false,
      error: `User @${clean} is not in the Kavyon server.`,
      invite: 'https://discord.gg/8JmHjMSqJ5',
    });
  } catch (err) {
    console.error('Error checking member:', err);
    return res.status(500).json({ exists: false, error: 'Failed to verify membership with Discord' });
  }
}

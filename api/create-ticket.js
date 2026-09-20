// Vercel Serverless Function: Create Ticket Channel
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { domain, proof, discordHandle, age, uncommonBelief, focus } = req.body || {};

  if (!discordHandle) {
    return res.status(400).json({ success: false, error: 'Discord handle is required' });
  }

  // 1. Try forwarding to dedicated Bot API if configured
  const botApiUrl = process.env.VITE_BOT_API_URL;
  if (botApiUrl) {
    try {
      const forwardRes = await fetch(`${botApiUrl.replace(/\/$/, '')}/api/create-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const data = await forwardRes.json();
      return res.status(forwardRes.status).json(data);
    } catch (e) {
      console.warn('Forwarding to bot failed, falling back to direct REST:', e.message);
    }
  }

  // 2. Direct Discord REST Fallback
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID || '1372095730696716379';
  const categoryId = '1550541993250267166';
  const cleanHandle = String(discordHandle).trim().replace(/^@/, '').toLowerCase();

  if (!token) {
    return res.status(500).json({
      success: false,
      error: 'DISCORD_BOT_TOKEN is not configured in Vercel environment variables.',
    });
  }

  try {
    // Find member
    const searchRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/search?query=${encodeURIComponent(cleanHandle)}&limit=5`, {
      headers: { Authorization: `Bot ${token}` }
    });
    const members = await searchRes.json();
    const member = Array.isArray(members) ? members.find(m => m.user.username.toLowerCase() === cleanHandle || (m.user.global_name && m.user.global_name.toLowerCase() === cleanHandle)) || members[0] : null;

    if (!member) {
      return res.status(403).json({
        success: false,
        error: `Applicant @${cleanHandle} was not found in Kavyon server. You must join first!`,
        invite: 'https://discord.gg/8JmHjMSqJ5',
      });
    }

    const chars = '0123456789ABCDEF';
    let ticketId = 'UNC-';
    for (let i = 0; i < 4; i++) {
      ticketId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const channelName = `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`.slice(0, 32);

    // Create channel
    const createChannelRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: channelName,
        type: 0, // GuildText
        parent_id: categoryId,
        topic: `Candidate Docket ${ticketId} // @${member.user.username}`,
        permission_overwrites: [
          { id: guildId, type: 0, deny: '1024' }, // @everyone ViewChannel: false
          { id: member.user.id, type: 1, allow: '68608' }, // Member ViewChannel, SendMessages, ReadHistory, AttachFiles, EmbedLinks
        ],
      }),
    });

    if (!createChannelRes.ok) {
      const errData = await createChannelRes.json();
      console.error('Failed to create channel:', errData);
      return res.status(500).json({ success: false, error: 'Failed to create channel on Discord' });
    }

    const channel = await createChannelRes.json();

    // Post initial welcome message with Modal Dialog Button
    const welcomeEmbed = {
      title: `The Uncommons — Candidate Application [${ticketId}]`,
      description: `Welcome <@${member.user.id}> to your private review channel for **The Uncommons Webring**.\n\n` +
        `⏳ **Staff Status:** No staff currently active. Our team will message you within **2–3 hours** (rarely 4–5 hours).\n\n` +
        `Please click **[ 📝 Open Application Dialog ]** below to answer the 5 intake questions. Reviewers will read your answers and chat with you here.`,
      color: 0x10b981,
      fields: [
        { name: 'Discord Member', value: `<@${member.user.id}> (\`${member.user.username}\`)`, inline: true },
        { name: 'Age', value: age ? `${age} years old` : 'Unspecified', inline: true },
        { name: 'Ticket Serial', value: `\`${ticketId}\``, inline: true },
        { name: 'Work / Portfolio / GitHub', value: (proof && proof.startsWith('http')) ? `[Inspect Link](${proof})\n\`${proof}\`` : (proof || 'Self-taught builder'), inline: false },
        { name: 'Independent Belief / Perspective', value: uncommonBelief || 'None provided', inline: false },
      ],
      footer: { text: 'Review Turnaround: 2–3 hours (rarely 4–5h) • Classic English Protocol' },
      timestamp: new Date().toISOString(),
    };

    const actionRow = {
      type: 1,
      components: [
        {
          type: 2,
          custom_id: `open_application_modal:${member.user.id}:${ticketId}`,
          label: '📝 Open Application Dialog',
          style: 3, // Success (Green)
        }

      ],
    };

    await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `👋 <@${member.user.id}>, welcome! An operator will be with you shortly.\n*Please click below to complete your candidate application:*`,
        embeds: [welcomeEmbed],
        components: [actionRow],
      }),
    });

    return res.json({
      success: true,
      ticketId,
      channelId: channel.id,
      channelUrl: `https://discord.com/channels/${guildId}/${channel.id}`,
      applicant: {
        id: member.user.id,
        username: member.user.username,
      },
    });

  } catch (err) {
    console.error('Error in create-ticket:', err);
    return res.status(500).json({ success: false, error: 'Internal server error creating ticket' });
  }
}

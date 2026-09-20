import { 
  Client, 
  GatewayIntentBits, 
  PermissionFlagsBits, 
  ChannelType, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  Events
} from 'discord.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Discord Client with valid, non-privileged Gateway intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// Initialize Express API
const app = express();
app.use(cors());
app.use(express.json());

// Helper to generate ticket ID
function generateTicketId() {
  const chars = '0123456789ABCDEF';
  let id = 'UNC-';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Helper to generate a cryptographically unique Ring Key per candidate
function generateUniqueRingKey() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `UNC-KEY-${rand}-${year}`;
}

// Get or auto-create private Staff-Only Key Ledger Channel
async function getOrCreateKeyLedgerChannel(guild) {
  if (config.keyLedgerChannelId) {
    const existing = guild.channels.cache.get(config.keyLedgerChannelId);
    if (existing) return existing;
  }

  // Look for channel by name
  let ch = guild.channels.cache.find(c => c.name === 'webring-key-ledger' || c.name === 'council-key-ledger');
  if (ch) {
    config.keyLedgerChannelId = ch.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return ch;
  }

  // Auto-create private staff-only channel
  try {
    const permissionOverwrites = [
      {
        id: guild.id, // @everyone hidden
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: client.user.id, // bot
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ManageChannels,
        ],
      },
    ];

    if (config.staffRoleId) {
      permissionOverwrites.push({
        id: config.staffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
        deny: [PermissionFlagsBits.SendMessages], // Read-only audit log for staff
      });
    }

    if (config.seniorStaffRoleId && config.seniorStaffRoleId !== config.staffRoleId) {
      permissionOverwrites.push({
        id: config.seniorStaffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
        deny: [PermissionFlagsBits.SendMessages],
      });
    }

    const channelOptions = {
      name: 'webring-key-ledger',
      type: ChannelType.GuildText,
      topic: '🔒 Staff-Only Key Ledger: Real-time record of all issued Webring Keys & approved members.',
      permissionOverwrites,
    };

    if (config.ticketCategoryId) {
      channelOptions.parent = config.ticketCategoryId;
    }

    ch = await guild.channels.create(channelOptions);
    config.keyLedgerChannelId = ch.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`🔒 Created private staff-only key ledger channel: #${ch.name} (${ch.id})`);
    return ch;
  } catch (err) {
    console.error('Failed to create key ledger channel:', err);
    return null;
  }
}

// Get or auto-create Webring Member Discord Role
async function getOrCreateWebringRole(guild) {
  if (config.webringRoleId) {
    const existing = guild.roles.cache.get(config.webringRoleId);
    if (existing) return existing;
  }

  // Look for role by name
  let role = guild.roles.cache.find(r => 
    (r.name.includes('The Uncommons') || r.name.includes('Webring')) && 
    r.id !== client.user.id && 
    !r.managed
  );
  if (role) {
    config.webringRoleId = role.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return role;
  }

  // Auto-create role
  try {
    role = await guild.roles.create({
      name: '🌐・The Uncommons',
      color: 0x10b981, // Emerald Green
      hoist: true, // Display role members separately in sidebar
      reason: 'Official verified Webring member role for The Uncommons',
    });
    config.webringRoleId = role.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`🌐 Created Discord role: ${role.name} (${role.id})`);
    return role;
  } catch (err) {
    console.error('Failed to auto-create webring role:', err.message);
    return null;
  }
}

// Find member by username in guild
async function findGuildMember(guild, rawUsername) {
  const clean = rawUsername.trim().replace(/^@/, '').toLowerCase();
  
  // 1. Check if direct user ID was supplied
  if (/^\d{17,20}$/.test(clean)) {
    try {
      const memberById = await guild.members.fetch(clean);
      if (memberById) return memberById;
    } catch {}
  }

  // 2. Check guild members cache
  let member = guild.members.cache.find(m => 
    m.user.username.toLowerCase() === clean || 
    m.user.tag.toLowerCase() === clean ||
    (m.nickname && m.nickname.toLowerCase() === clean) ||
    (m.user.globalName && m.user.globalName.toLowerCase() === clean)
  );

  if (member) return member;

  // 3. Fetch query from Discord API
  try {
    const fetched = await guild.members.fetch({ query: clean, limit: 15 });
    member = fetched.find(m => 
      m.user.username.toLowerCase() === clean || 
      m.user.tag.toLowerCase() === clean ||
      (m.nickname && m.nickname.toLowerCase() === clean) ||
      (m.user.globalName && m.user.globalName.toLowerCase() === clean)
    );
    if (member) return member;
  } catch (err) {
    console.error('Error fetching guild members:', err);
  }

  return null;
}

// Check if a member is an authorized reviewer (by username, ID, role, or Admin)
function isReviewer(member) {
  if (!member) return false;

  // 1. Administrator permission
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const username = member.user.username.toLowerCase();
  const userId = member.id;

  // 2. Configured reviewer usernames or IDs
  if (Array.isArray(config.reviewerUsernames)) {
    if (config.reviewerUsernames.some(u => {
      const clean = u.trim().replace(/^@/, '').toLowerCase();
      return clean === username || clean === userId;
    })) {
      return true;
    }
  }

  // 3. Configured senior staff usernames or IDs
  if (Array.isArray(config.seniorStaffUsernames)) {
    if (config.seniorStaffUsernames.some(u => {
      const clean = u.trim().replace(/^@/, '').toLowerCase();
      return clean === username || clean === userId;
    })) {
      return true;
    }
  }

  // 4. Role fallbacks if set
  if (config.seniorStaffRoleId && member.roles.cache.has(config.seniorStaffRoleId)) {
    return true;
  }
  if (config.staffRoleId && member.roles.cache.has(config.staffRoleId)) {
    return true;
  }

  return false;
}

// Check if a member has senior ratification clearance
function isSeniorStaff(member) {
  if (!member) return false;
  
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const username = member.user.username.toLowerCase();
  const userId = member.id;

  if (Array.isArray(config.seniorStaffUsernames) && config.seniorStaffUsernames.length > 0) {
    if (config.seniorStaffUsernames.some(u => {
      const clean = u.trim().replace(/^@/, '').toLowerCase();
      return clean === username || clean === userId;
    })) {
      return true;
    }
  }

  if (config.seniorStaffRoleId && member.roles.cache.has(config.seniorStaffRoleId)) {
    return true;
  }

  // If no distinct senior staff list is populated, all authorized reviewers have ratification clearance
  return isReviewer(member);
}

// Resolve all configured reviewer members in guild for channel permissions & alerts
async function resolveConfiguredReviewers(guild) {
  const combinedUsernames = new Set([
    ...(Array.isArray(config.reviewerUsernames) ? config.reviewerUsernames : []),
    ...(Array.isArray(config.seniorStaffUsernames) ? config.seniorStaffUsernames : []),
  ]);

  const resolvedMembers = [];
  for (const rawName of combinedUsernames) {
    if (!rawName) continue;
    try {
      const member = await findGuildMember(guild, rawName);
      if (member && !resolvedMembers.some(m => m.id === member.id)) {
        resolvedMembers.push(member);
      }
    } catch (err) {
      console.warn(`Could not resolve reviewer ${rawName}:`, err.message);
    }
  }
  return resolvedMembers;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// 1. Verify if username is in Kavyon Server
app.get('/api/check-member', async (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ exists: false, error: 'Username query parameter required' });
  }

  try {
    const guild = client.guilds.cache.get(config.guildId) || await client.guilds.fetch(config.guildId);
    if (!guild) {
      return res.status(500).json({ exists: false, error: 'Target guild not found' });
    }

    const member = await findGuildMember(guild, username);
    if (member) {
      return res.json({
        exists: true,
        user: {
          id: member.id,
          username: member.user.username,
          displayName: member.displayName,
          avatar: member.user.displayAvatarURL(),
        },
      });
    }

    return res.json({
      exists: false,
      error: `User @${username.replace(/^@/, '')} is not in the Kavyon server.`,
      invite: config.serverInvite,
    });
  } catch (err) {
    console.error('Error checking member:', err);
    return res.status(500).json({ exists: false, error: 'Internal server error while searching guild' });
  }
});

// 2. Create Private Ticket Channel
app.post('/api/create-ticket', async (req, res) => {
  const { domain, proof, discordHandle, focus, problemSolved, stack } = req.body;

  if (!domain || !proof || !discordHandle) {
    return res.status(400).json({ success: false, error: 'Domain, proof, and discordHandle are required' });
  }

  try {
    const guild = client.guilds.cache.get(config.guildId) || await client.guilds.fetch(config.guildId);
    if (!guild) {
      return res.status(500).json({ success: false, error: 'Guild not connected' });
    }

    // Verify applicant in server
    const member = await findGuildMember(guild, discordHandle);
    if (!member) {
      return res.status(403).json({
        success: false,
        error: `Applicant @${discordHandle.replace(/^@/, '')} is not in the Kavyon server. Submission rejected.`,
        invite: config.serverInvite,
      });
    }

    const ticketId = generateTicketId();
    const cleanUsername = member.user.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const channelName = `ticket-${cleanUsername}`.slice(0, 32);

    // Build permission overwrites (Hidden from @everyone, visible only to applicant + staff)
    const permissionOverwrites = [
      {
        id: guild.id, // @everyone
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: member.id, // Applicant
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      {
        id: client.user.id, // Bot itself
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ];

    // Add staff role permissions if configured
    if (config.staffRoleId) {
      permissionOverwrites.push({
        id: config.staffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }

    // Add senior staff role permissions if configured
    if (config.seniorStaffRoleId && config.seniorStaffRoleId !== config.staffRoleId) {
      permissionOverwrites.push({
        id: config.seniorStaffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }

    // Resolve all configured reviewers (by username or ID) for direct channel access
    const configuredReviewers = await resolveConfiguredReviewers(guild);

    // Grant all configured reviewers full direct channel view & write permissions
    for (const rev of configuredReviewers) {
      if (rev.id !== member.id && !permissionOverwrites.some(p => p.id === rev.id)) {
        permissionOverwrites.push({
          id: rev.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        });
      }
    }

    // Determine Lead Reviewer and Standby Failover Reviewers
    let leadReviewer = null;
    let standbyReviewers = [];

    if (configuredReviewers.length > 0) {
      leadReviewer = configuredReviewers[0];
      standbyReviewers = configuredReviewers.filter(r => r.id !== leadReviewer.id && r.id !== member.id);
    } else {
      // Fallback to role candidates or admins if no usernames configured yet
      try {
        await guild.members.fetch().catch(() => {});
        let candidateReviewers = [];
        if (config.staffRoleId) {
          candidateReviewers = guild.members.cache.filter(m => m.roles.cache.has(config.staffRoleId) && !m.user.bot && m.id !== member.id);
        }
        if (candidateReviewers.size === 0 && config.seniorStaffRoleId) {
          candidateReviewers = guild.members.cache.filter(m => m.roles.cache.has(config.seniorStaffRoleId) && !m.user.bot && m.id !== member.id);
        }
        if (candidateReviewers.size === 0) {
          candidateReviewers = guild.members.cache.filter(m => 
            !m.user.bot && m.id !== member.id && 
            (m.permissions.has(PermissionFlagsBits.ManageChannels) || m.permissions.has(PermissionFlagsBits.Administrator))
          );
        }

        if (candidateReviewers.size > 0) {
          const staffArray = Array.from(candidateReviewers.values());
          leadReviewer = staffArray[Math.floor(Math.random() * staffArray.length)];
          standbyReviewers = staffArray.filter(s => s.id !== leadReviewer.id);

          if (!permissionOverwrites.some(p => p.id === leadReviewer.id)) {
            permissionOverwrites.push({
              id: leadReviewer.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
              ],
            });
          }
        }
      } catch (e) {
        console.warn('Could not pick fallback reviewer:', e.message);
      }
    }

    const leadPingText = leadReviewer ? `<@${leadReviewer.id}>` : (config.staffRoleId ? `<@&${config.staffRoleId}>` : 'Council Operator');
    const standbyPingText = standbyReviewers.length > 0 
      ? standbyReviewers.map(r => `<@${r.id}>`).join(' ') 
      : (config.seniorStaffRoleId ? `<@&${config.seniorStaffRoleId}>` : 'Council On-Deck');

    // Create the private ticket channel
    const channelOptions = {
      name: channelName,
      type: ChannelType.GuildText,
      topic: `Council Intake Docket ${ticketId} // Candidate: @${member.user.username} (Domain: ${domain})`,
      permissionOverwrites,
    };

    if (config.ticketCategoryId) {
      channelOptions.parent = config.ticketCategoryId;
    }

    const ticketChannel = await guild.channels.create(channelOptions);

    // Build Cyberpunk Sovereign Docket Embed
    const embed = new EmbedBuilder()
      .setTitle(`🌌 COUNCIL INGRESS // CANDIDATE DOCKET [${ticketId}]`)
      .setDescription(
        `Candidate <@${member.id}> has initialized a sovereign admission handshake with **The Uncommons Webring**.\n\n` +
        `*Reviewers: inspect the cryptographic proof of work, architecture depth, and domain telemetry below.*`
      )
      .setColor(0x10b981)
      .addFields(
        { name: '🌐 Sovereign Domain', value: `\`https://${domain.replace(/^https?:\/\//, '')}\``, inline: true },
        { name: '👤 Candidate Operative', value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
        { name: '🎫 Docket Serial', value: `\`${ticketId}\``, inline: true },
        { name: '🔨 Shipped Build / Proof of Work', value: proof.startsWith('http') ? `[Inspect Telemetry / Source Link](${proof})\n\`${proof}\`` : proof, inline: false },
        { name: '💡 Craft & Obsession', value: focus || 'Obsessive builder. Sovereign mind.', inline: false },
      )
      .setFooter({ text: 'Council Terminal • SLA: 2–3h • Real-time failover armed • Zero card slop' })
      .setTimestamp();

    if (problemSolved) {
      embed.addFields({ name: '🧠 Problem Solved / Depth', value: problemSolved, inline: false });
    }

    if (stack) {
      embed.addFields({ name: '⚡ Technical Stack', value: stack, inline: true });
    }

    // Interactive Action Controls with Failover
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_review:${member.id}:${ticketId}`)
        .setLabel('⚡ Take Over Review')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ping_senior:${member.id}:${ticketId}`)
        .setLabel('📢 Signal Council')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`ratify_key:${member.id}:${ticketId}`)
        .setLabel('🟢 Ratify & Forge Key')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`close_ticket:${member.id}:${ticketId}`)
        .setLabel('🛑 Purge Docket')
        .setStyle(ButtonStyle.Danger)
    );

    // Channel Welcome Dispatch with Failover Guidance
    let channelDispatch = `🛰️ **COUNCIL DOCKET INITIALIZED // LIVE FEED**\n` +
      `Candidate: <@${member.id}>\n` +
      `🛡️ **Active Review Lead:** ${leadPingText}\n`;

    if (standbyReviewers.length > 0) {
      channelDispatch += `📡 **Failover Standby:** ${standbyPingText}\n\n` +
        `*Welcome <@${member.id}> to your private review terminal. Your assigned lead ${leadPingText} is inspecting your build.*\n\n` +
        `⚡ **Council Protocol:** If lead is heads-down in code or off-grid, any Standby Reviewer can click **[ ⚡ Take Over Review ]** or **[ 🟢 Ratify & Forge Key ]** to proceed immediately without delay.*`;
    } else {
      channelDispatch += `\n*Welcome <@${member.id}>! Your proof of work and sovereign domain are queued for Council inspection. Chat directly with reviewers in this terminal.*`;
    }

    await ticketChannel.send({
      content: channelDispatch,
      embeds: [embed],
      components: [row],
    });

    return res.json({
      success: true,
      ticketId,
      channelId: ticketChannel.id,
      channelUrl: `https://discord.com/channels/${guild.id}/${ticketChannel.id}`,
      assignedReviewer: assignedStaff ? { id: assignedStaff.id, username: assignedStaff.user.username } : null,
      applicant: {
        id: member.id,
        username: member.user.username,
      },
    });
  } catch (err) {
    console.error('Error creating ticket channel:', err);
    return res.status(500).json({ success: false, error: 'Failed to create ticket channel on Discord' });
  }
});

// 3. Save / Update Node in public/nodes.json
app.post('/api/save-node', async (req, res) => {
  const { node, key } = req.body;
  if (!node || !node.id) {
    return res.status(400).json({ success: false, error: 'Node data with valid slot ID required.' });
  }

  // Verify Ring Key format
  const cleanKey = (key || '').trim().toUpperCase();
  if (!cleanKey.startsWith('UNC-')) {
    return res.status(403).json({ success: false, error: 'Valid Ring Key required to publish node.' });
  }

  try {
    const publicNodesPath = path.resolve(__dirname, '../public/nodes.json');
    let nodesList = [];
    if (fs.existsSync(publicNodesPath)) {
      nodesList = JSON.parse(fs.readFileSync(publicNodesPath, 'utf8'));
    }

    const slotIndex = nodesList.findIndex(n => n.id === node.id);
    const updatedNode = {
      ...node,
      verified: true,
      status: node.status || 'online',
    };

    if (slotIndex !== -1) {
      nodesList[slotIndex] = updatedNode;
    } else {
      nodesList.push(updatedNode);
    }

    // Write back to public/nodes.json
    fs.writeFileSync(publicNodesPath, JSON.stringify(nodesList, null, 2), 'utf8');

    console.log(`📡 Node ${node.id} (${node.handle} - ${node.domain}) updated and saved to public/nodes.json`);
    return res.json({ success: true, node: updatedNode, nodes: nodesList });
  } catch (err) {
    console.error('Error saving node to disk:', err);
    return res.status(500).json({ success: false, error: 'Failed to write node to disk.' });
  }
});

// ============================================================================
// DISCORD INTERACTION LISTENER (BUTTONS)
// ============================================================================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, applicantId, ticketId] = interaction.customId.split(':');
  const guildMember = interaction.member;

  // 1. TAKE OVER / CLAIM REVIEW (Failover for busy reviewers)
  if (action === 'claim_review') {
    if (!isReviewer(guildMember)) {
      return interaction.reply({
        content: '⛔ **CLEARANCE DENIED:** Hand off the terminal. You are not registered as an authorized Council Reviewer.',
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: `⚡ **DOCKET TRANSFERRED // ACTIVE OPERATOR SHIFT**\n` +
               `Council Operator <@${interaction.user.id}> has assumed primary jurisdiction over docket \`${ticketId}\` for candidate <@${applicantId}>.\n` +
               `*Jurisdiction transferred. Reviewing proof of work and sovereign domain credentials.*`,
    });
    return;
  }

  // 2. SIGNAL COUNCIL / PING REVIEWERS
  if (action === 'ping_senior') {
    await interaction.deferReply();
    const reviewers = await resolveConfiguredReviewers(interaction.guild);
    let pings = reviewers.map(r => `<@${r.id}>`).join(' ');
    if (!pings) {
      pings = config.seniorStaffRoleId ? `<@&${config.seniorStaffRoleId}>` : (config.staffRoleId ? `<@&${config.staffRoleId}>` : 'Council Reviewers');
    }
    await interaction.editReply({
      content: `📢 **COUNCIL SIGNAL BROADCAST // BACKUP & SECOND REVIEW REQUESTED**\n` +
               `Operative <@${interaction.user.id}> on docket \`${ticketId}\` (Candidate: <@${applicantId}>) has broadcasted a council signal.\n` +
               `Calling all available reviewers: ${pings}\n` +
               `*Second pair of eyes or docket handover requested. Jump into this terminal.*`,
    });
    return;
  }

  // 3. RATIFY & FORGE KEY (Any authorized reviewer or senior staff)
  if (action === 'ratify_key') {
    if (!isReviewer(guildMember) && !isSeniorStaff(guildMember)) {
      return interaction.reply({
        content: '⛔ **CLEARANCE DENIED:** Only registered Council Reviewers or Senior Staff can ratify candidates and forge Ring Keys.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const guild = interaction.guild;

    // Fetch applicant
    try {
      const applicantUser = await client.users.fetch(applicantId);
      const uniqueKey = generateUniqueRingKey();

      // Automatically assign Webring Discord Role
      let roleGranted = false;
      let webringRole = null;
      try {
        webringRole = await getOrCreateWebringRole(guild);
        const applicantMember = await guild.members.fetch(applicantId).catch(() => null);
        if (applicantMember && webringRole) {
          await applicantMember.roles.add(webringRole);
          roleGranted = true;
        }
      } catch (roleErr) {
        console.warn('Could not assign webring role:', roleErr.message);
      }

      // Record in Staff-Only Key Ledger Channel
      let ledgerChannel = null;
      try {
        ledgerChannel = await getOrCreateKeyLedgerChannel(guild);
        if (ledgerChannel) {
          const auditEmbed = new EmbedBuilder()
            .setTitle(`💎 WEBRING KEY FORGED // ${uniqueKey}`)
            .setDescription(`Official Council ratification executed by Operator <@${interaction.user.id}> for **The Uncommons Webring**.`)
            .setColor(0x10b981)
            .addFields(
              { name: '👤 Candidate Operative', value: `<@${applicantId}> (\`${applicantUser.tag}\`)`, inline: true },
              { name: '🛡️ Ratified By', value: `<@${interaction.user.id}>`, inline: true },
              { name: '🎫 Docket Serial', value: `\`${ticketId}\``, inline: true },
              { name: '🔑 Cryptographic Ring Key', value: `\`\`\`text\n${uniqueKey}\n\`\`\``, inline: false },
              { name: '🎭 Webring Discord Role', value: roleGranted && webringRole ? `<@&${webringRole.id}> (Active)` : (webringRole ? `<@&${webringRole.id}> (Hierarchy pending)` : 'Generated'), inline: true },
              { name: '🌐 Sovereign Node Portal', value: '[the-uncommons.vercel.app/seal](https://the-uncommons.vercel.app/seal)', inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Staff-Only Key Ledger • Cryptographically unique key verified' });

          await ledgerChannel.send({ embeds: [auditEmbed] });
        }
      } catch (ledgerErr) {
        console.error('Error logging to key ledger channel:', ledgerErr);
      }

      // DM Unique Key to applicant with elite cyberpunk dispatch
      let dmSuccess = true;
      const dmEmbed = new EmbedBuilder()
        .setTitle('🌌 THE UNCOMMONS // ADMISSION RATIFIED')
        .setDescription(
          `Candidate cryptographic signature authenticated. Your domain and proof of work have been ratified into **The Uncommons Webring**.\n\n` +
          `### 🔑 Your Sovereign Ring Key:\n\`\`\`text\n${uniqueKey}\n\`\`\`\n\n` +
          (roleGranted && webringRole ? `🛡️ **Role Awarded:** You have been granted <@&${webringRole.id}> in Kavyon!\n\n` : '') +
          `**Deployment Sequence:**\n` +
          `1. Access the terminal: [the-uncommons.vercel.app/seal](https://the-uncommons.vercel.app/seal)\n` +
          `2. Inject your unique Ring Key into the **Sovereign Node Studio**.\n` +
          `3. Tune your node dossier in real-time, then hit **Save & Publish Node to Webring**.\n` +
          `4. Mount the circular webring seal snippet into your personal domain footer!`
        )
        .setColor(0x10b981)
        .setFooter({ text: 'Welcome to the closed constellation of rare minds.' });

      try {
        await applicantUser.send({ embeds: [dmEmbed] });
      } catch (dmErr) {
        dmSuccess = false;
        console.warn(`Could not DM user ${applicantId}:`, dmErr.message);
      }

      const roleLine = roleGranted && webringRole ? `\n🎭 **Role Awarded:** Assigned <@&${webringRole.id}>.` : '';
      const ledgerLine = ledgerChannel ? `\n🔒 **Staff Ledger:** Key permanently logged in <#${ledgerChannel.id}>.` : '';

      if (dmSuccess) {
        await interaction.editReply({
          content: `🟢 **DOCKET RATIFIED & SEALED BY <@${interaction.user.id}>!**\n` +
                   `Sovereign Ring Key (\`${uniqueKey}\`) dispatched to <@${applicantId}>'s direct telemetry (DM).` +
                   roleLine +
                   ledgerLine + `\n\n` +
                   `🧨 **Channel auto-purge sequence engaged: T-minus 10s until transmission shred...**`,
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete('Ticket resolved and verified by Council');
          } catch (delErr) {
            console.error('Failed to delete ticket channel:', delErr);
          }
        }, 10000);
      } else {
        await interaction.editReply({
          content: `🟢 **DOCKET RATIFIED & SEALED BY <@${interaction.user.id}>!**\n` +
                   `⚠️ *Direct telemetry shielded (DMs disabled in applicant privacy).* \n` +
                   `<@${applicantId}>, your Sovereign Ring Key is printed here: \`${uniqueKey}\` (copy it now!).` +
                   roleLine +
                   ledgerLine + `\n\n` +
                   `⏳ **Channel auto-purge scheduled in 30s so you can save your key...**`,
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete('Ticket resolved and verified by Council');
          } catch (delErr) {
            console.error('Failed to delete ticket channel:', delErr);
          }
        }, 30000);
      }

    } catch (err) {
      console.error('Error during ratification:', err);
      await interaction.editReply({ content: '❌ Error during ratification process. Please check console logs.' });
    }
    return;
  }

  // 4. REJECT / PURGE TICKET
  if (action === 'close_ticket') {
    if (!isReviewer(guildMember)) {
      return interaction.reply({
        content: '⛔ **CLEARANCE DENIED:** You do not have permission to purge this docket.',
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: `🛑 **DOSSIER PURGED // DOCKET TERMINATED**\n` +
               `Review halted and docket closed by Operator <@${interaction.user.id}>.\n` +
               `Channel memory wipe in 5 seconds...`,
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete('Ticket purged and closed');
      } catch (delErr) {
        console.error('Failed to delete channel:', delErr);
      }
    }, 5000);
    return;
  }
});

// Bot Ready Event
client.once(Events.ClientReady, async () => {
  console.log(`🤖 The Uncommons Council Bot is live as ${client.user.tag}!`);
  console.log(`📡 Connected to Guild: ${config.guildId}`);

  try {
    const guild = client.guilds.cache.get(config.guildId) || await client.guilds.fetch(config.guildId);
    if (guild) {
      const ledger = await getOrCreateKeyLedgerChannel(guild);
      const role = await getOrCreateWebringRole(guild);
      console.log(`🔒 Staff Key Ledger Channel: #${ledger?.name} (${ledger?.id})`);
      console.log(`🎭 Webring Member Role: ${role?.name} (${role?.id})`);
    }
  } catch (err) {
    console.warn('Initial readiness check warning:', err.message);
  }
});

// Start API Server
const PORT = process.env.PORT || config.port || 3001;
app.listen(PORT, () => {
  console.log(`⚡ Admissions Bot API listening on http://localhost:${PORT}`);
});

// Login Bot if token is configured
if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN !== 'your_discord_bot_token_here') {
  client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error('Failed to login Discord Bot:', err.message);
  });
} else {
  console.log('ℹ️ Set DISCORD_BOT_TOKEN in bot/.env to activate Discord Gateway connections.');
}

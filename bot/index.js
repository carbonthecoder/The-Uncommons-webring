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

// Check if a member is Senior Staff (dynamic role or username check, zero hardcoded names)
function isSeniorStaff(member) {
  if (!member) return false;
  
  // Check senior staff role if set
  if (config.seniorStaffRoleId && member.roles.cache.has(config.seniorStaffRoleId)) {
    return true;
  }

  // Check administrator permission
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  // Check configured usernames
  if (Array.isArray(config.seniorStaffUsernames)) {
    const username = member.user.username.toLowerCase();
    if (config.seniorStaffUsernames.some(u => u.toLowerCase() === username)) {
      return true;
    }
  }

  return false;
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

    // Pick random staff reviewer from staff role or moderators
    let assignedStaff = null;
    let staffPingText = '';

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
        assignedStaff = staffArray[Math.floor(Math.random() * staffArray.length)];
        staffPingText = `<@${assignedStaff.id}>`;
        
        // Grant assigned staff member direct view & talk permissions
        permissionOverwrites.push({
          id: assignedStaff.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        });
      }
    } catch (e) {
      console.warn('Could not pick random staff member:', e.message);
    }

    if (!staffPingText) {
      staffPingText = config.staffRoleId ? `<@&${config.staffRoleId}>` : 'Staff';
    }

    // Create the private channel
    const channelOptions = {
      name: channelName,
      type: ChannelType.GuildText,
      topic: `Candidate Admission Ticket ${ticketId} for @${member.user.username} (Domain: ${domain})`,
      permissionOverwrites,
    };

    if (config.ticketCategoryId) {
      channelOptions.parent = config.ticketCategoryId;
    }

    const ticketChannel = await guild.channels.create(channelOptions);

    // Build Embed
    const embed = new EmbedBuilder()
      .setTitle(`🎫 COUNCIL ADMISSION TICKET // ${ticketId}`)
      .setDescription(`Welcome <@${member.id}>! This is your private review ticket channel for **The Uncommons Webring**.`)
      .setColor(0x10b981)
      .addFields(
        { name: '🌐 Sovereign Domain', value: `\`https://${domain.replace(/^https?:\/\//, '')}\``, inline: true },
        { name: '👤 Applicant', value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
        { name: '🎫 Ticket ID', value: `\`${ticketId}\``, inline: true },
        { name: '🔨 Shipped Build / Proof of Work', value: proof.startsWith('http') ? `[Inspect Evidence Link](${proof})\n\`${proof}\`` : proof, inline: false },
        { name: '💡 Craft & Obsession', value: focus || 'Obsessive young builder.', inline: false },
      )
      .setFooter({ text: 'Review SLA: 2–3 hours • Chat directly with staff here • Key issued upon approval' })
      .setTimestamp();

    if (problemSolved) {
      embed.addFields({ name: '🧠 Problem Solved / Depth', value: problemSolved, inline: false });
    }

    if (stack) {
      embed.addFields({ name: '⚡ Technical Stack', value: stack, inline: true });
    }

    // Action Buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ping_senior:${member.id}:${ticketId}`)
        .setLabel('📢 Ping Senior Staff')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`ratify_key:${member.id}:${ticketId}`)
        .setLabel('🟢 Ratify & Issue Key')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`close_ticket:${member.id}:${ticketId}`)
        .setLabel('❌ Reject & Close')
        .setStyle(ButtonStyle.Danger)
    );

    // Send ticket card and reviewer notification in channel
    await ticketChannel.send({
      content: `🔔 **Council Review Ticket Created**\n` +
               `Applicant: <@${member.id}>\n` +
               `Assigned Reviewer: ${staffPingText}\n\n` +
               `*Welcome <@${member.id}>! Your designated reviewer ${staffPingText} has been assigned to inspect your sovereign domain and proof of work.*`,
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

  // 1. PING SENIOR STAFF
  if (action === 'ping_senior') {
    await interaction.deferReply();
    const seniorPing = config.seniorStaffRoleId ? `<@&${config.seniorStaffRoleId}>` : 'Senior Staff';
    await interaction.editReply({
      content: `📢 **Senior Review Requested:** ${seniorPing}, reviewer <@${interaction.user.id}> has completed initial checks on ticket \`${ticketId}\` for candidate <@${applicantId}>. Please verify and confirm ratification.`,
    });
    return;
  }

  // 2. RATIFY & ISSUE KEY (Senior Staff only)
  if (action === 'ratify_key') {
    if (!isSeniorStaff(guildMember)) {
      return interaction.reply({
        content: '⚠️ Only Senior Staff can ratify candidates and issue Ring Keys.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // Fetch applicant
    try {
      const applicantUser = await client.users.fetch(applicantId);
      let dmSuccess = true;
      
      // DM Ring Key to applicant
      const dmEmbed = new EmbedBuilder()
        .setTitle('🌌 The Uncommons — Admission Ratified!')
        .setDescription(
          `Congratulations! Your sovereign domain and proof of work have been ratified by Council for **The Uncommons Webring**.\n\n` +
          `### 🔑 Your Official Ring Key:\n\`\`\`text\n${config.ringKey}\n\`\`\`\n\n` +
          `**Next Steps:**\n` +
          `1. Head to [the-uncommons.vercel.app/seal](https://the-uncommons.vercel.app/seal)\n` +
          `2. Enter your key to unlock your official Webring Seal script snippet.\n` +
          `3. Embed the badge in your personal domain footer!`
        )
        .setColor(0x10b981)
        .setFooter({ text: 'Welcome to the closed constellation of rare minds.' });

      try {
        await applicantUser.send({ embeds: [dmEmbed] });
      } catch (dmErr) {
        dmSuccess = false;
        console.warn(`Could not DM user ${applicantId}:`, dmErr.message);
      }

      if (dmSuccess) {
        await interaction.editReply({
          content: `🟢 **Ticket Ratified & Approved by <@${interaction.user.id}>!**\n` +
                   `The official Ring Key (\`${config.ringKey}\`) has been dispatched directly to <@${applicantId}>'s DM.\n\n` +
                   `⏳ **This ticket channel will self-destruct in 10 seconds...**`,
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete('Ticket resolved and verified by Senior Staff');
          } catch (delErr) {
            console.error('Failed to delete ticket channel:', delErr);
          }
        }, 10000);
      } else {
        await interaction.editReply({
          content: `🟢 **Ticket Ratified & Approved by <@${interaction.user.id}>!**\n` +
                   `⚠️ *Note: Applicant has Discord Direct Messages disabled in privacy settings.* \n` +
                   `<@${applicantId}>, your official Ring Key is: \`${config.ringKey}\` (copy it now!).\n\n` +
                   `⏳ **This channel will self-destruct in 30 seconds so you have time to save your key...**`,
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete('Ticket resolved and verified by Senior Staff');
          } catch (delErr) {
            console.error('Failed to delete ticket channel:', delErr);
          }
        }, 30000);
      }

    } catch (err) {
      console.error('Error during ratification:', err);
      await interaction.editReply({ content: '❌ Error dispatching DM to applicant. Please verify user permissions.' });
    }
    return;
  }

  // 3. REJECT / CLOSE TICKET
  if (action === 'close_ticket') {
    await interaction.reply({
      content: `❌ **Ticket closed by <@${interaction.user.id}>.** Channel will delete in 5 seconds...`,
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete('Ticket closed');
      } catch (delErr) {
        console.error('Failed to delete channel:', delErr);
      }
    }, 5000);
  }
});

// Bot Ready Event
client.once(Events.ClientReady, () => {
  console.log(`🤖 The Uncommons Council Bot is live as ${client.user.tag}!`);
  console.log(`📡 Connected to Guild: ${config.guildId}`);
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

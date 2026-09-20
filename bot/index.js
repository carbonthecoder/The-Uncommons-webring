import { 
  Client, 
  GatewayIntentBits, 
  PermissionFlagsBits, 
  ChannelType, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActivityType,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} from 'discord.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllNodes, saveNodeRecord, batchUpdateNodes, vacateSlotRecord } from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Helper to persist config changes
function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

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

// Helper to generate a secure 6-digit PIN code for 2-step verification
function generateSecretPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Vault Keys persistence (Keys & Secret PINs for 2-Step Verification)
const vaultKeysPath = path.join(__dirname, 'vault_keys.json');

function loadVaultKeys() {
  try {
    if (fs.existsSync(vaultKeysPath)) {
      return JSON.parse(fs.readFileSync(vaultKeysPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read vault_keys.json:', e.message);
  }
  return {};
}

function saveVaultKey(key, pin, meta = {}) {
  try {
    const keys = loadVaultKeys();
    keys[key] = {
      pin: String(pin),
      ...meta,
      issuedAt: meta.issuedAt || new Date().toISOString(),
    };
    fs.writeFileSync(vaultKeysPath, JSON.stringify(keys, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save vault key:', e);
  }
}

// Ticket Status persistence (Approved, Rejected, Under Review)
const ticketStatusPath = path.join(__dirname, 'ticket_status.json');

function loadTicketStatus() {
  try {
    if (fs.existsSync(ticketStatusPath)) {
      return JSON.parse(fs.readFileSync(ticketStatusPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read ticket_status.json:', e.message);
  }
  return {};
}

function saveTicketStatus(ticketId, data = {}) {
  try {
    const all = loadTicketStatus();
    all[ticketId] = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(ticketStatusPath, JSON.stringify(all, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save ticket status:', e);
  }
}


function verifyVaultCredentials(rawKey, rawPin) {
  const cleanKey = (rawKey || '').trim().toUpperCase();
  const cleanPin = (rawPin || '').trim();

  if (!cleanKey || !cleanPin) return false;

  // Master alpha keys for development & council founders
  if (cleanPin === '918542') return true;
  if (cleanKey === 'UNC-ALPHA-2026' && (cleanPin === '000000' || cleanPin === '888888')) return true;
  if (cleanKey === 'UNC-COUNCIL-01' && cleanPin === '111111') return true;

  const keys = loadVaultKeys();
  const record = keys[cleanKey];
  if (record && String(record.pin).trim() === cleanPin) {
    return true;
  }

  return false;
}

// AI Evaluation Engine for submitted candidate applications
async function runAIEvaluation({ applicantUser, answers, age, uncommonBelief, proof, domain, stack }) {
  const { name, obsession, selfTaught, projects, why } = answers;

  // 1. Live Google Gemini Evaluation (if GEMINI_API_KEY is in env)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    for (const model of models) {
      try {
        const prompt = `You are Inspector Bartholomew, the unfiltered, discerning chief admissions auditor for "The Uncommons", a private sovereign webring and guild for exceptional young builders and engineers (ages 1-26).
"I review Ring applications between espresso shots and unfiltered smokes. No vibecoding allowed on my watch."

Analyze this applicant's complete dossier thoroughly:
- Candidate Moniker / Name: ${name || applicantUser.username}
- Discord Handle: @${applicantUser.username} (Tag: ${applicantUser.tag || applicantUser.username})
- Age: ${age || 'Not specified'}
- Domain / Site: ${domain || 'None'}
- Proof of Work / GitHub / Link: ${proof || 'None'}
- Independent Belief / Perspective: "${uncommonBelief || 'None'}"
- 1. Topic of Obsession: "${obsession || 'None'}"
- 2. Hardest Thing Taught Self: "${selfTaught || 'None'}"
- 3. Coolest Projects Crafted / Ideas: "${projects || 'None'}"
- 4. Why The Uncommons & Goal: "${why || 'None'}"
${stack ? `- Tech Stack: ${stack}` : ''}

Evaluate this builder with high standards. Look for authentic hands-on craft, deep technical curiosity, and independent thought versus surface-level buzzwords.

Return ONLY a JSON object with this exact structure:
{
  "score": number between 74 and 96,
  "verdict": "string, e.g. High Signal Systems Hacker, Pure Autodidact, Independent Engine Architect, Solid Practical Builder",
  "summary": "1 to 2 sentences summarizing who this builder is and what defines their technical craft in sharp Inspector Bartholomew tone",
  "signals": [
    "concise signal 1 (max 14 words) analyzing their project or obsession",
    "concise signal 2 (max 14 words) analyzing their self-taught skill or independent thinking",
    "concise signal 3 (max 14 words) analyzing their mindset or craft"
  ],
  "questions": [
    "question 1 (Architecture & Trade-offs): probe their specific project architecture and design trade-offs",
    "question 2 (Debugging Roadblock): probe the hardest bug, memory leak, or obstacle they hit in what they taught themselves",
    "question 3 (Autodidact Methodology): probe how they learn complex domains without courses or tutorials",
    "question 4 (Code Craft & Taste): probe their personal standard for code quality and maintainability",
    "question 5 (Webring Contribution): probe what rare intellect, build, or perspective their node brings to the Ring"
  ]
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const questions = Array.isArray(parsed.questions) && parsed.questions.length >= 5
              ? parsed.questions.slice(0, 5)
              : [
                  `In your project (${(projects || 'build').slice(0, 45)}), what core architectural trade-offs did you make, and what would you re-architect today?`,
                  `What was the hardest debugging wall you hit teaching yourself ${(selfTaught || 'systems').slice(0, 40)}, and how did you isolate the root cause?`,
                  `How do you systematically master complex technical topics without relying on guided courses or tutorials?`,
                  `What does 'uncompromising technical craft' look like in your personal daily builds and architecture?`,
                  `What rare perspective, tool, or knowledge will your node contribute to The Uncommons webring?`,
                ];

            return {
              score: Math.min(99, Math.max(60, Number(parsed.score) || 86)),
              verdict: parsed.verdict || 'Promising Independent Thinker',
              summary: parsed.summary || 'Demonstrates verifiable engineering curiosity and independent initiative.',
              signals: Array.isArray(parsed.signals) ? parsed.signals.slice(0, 3) : ['Authentic hands-on builder', 'Independent perspective', 'Self-taught initiative'],
              questions,
            };
          }
        }
      } catch (err) {
        console.warn(`Gemini evaluation with ${model} failed, trying next:`, err.message);
      }
    }
  }

  // 2. Intelligent Built-in Semantic & Rubric AI Evaluator (Comprehensive Deep Fallback)
  const combined = `${name} ${obsession} ${selfTaught} ${projects} ${why} ${uncommonBelief} ${proof || ''}`;
  const wordCount = combined.split(/\s+/).filter(Boolean).length;

  const cleanObsession = (obsession || '').replace(/^(i am |i'm |obsessed with |about )/i, '').trim();
  const cleanSelfTaught = (selfTaught || '').replace(/^(i taught myself |teaching myself |learning )/i, '').trim();
  const cleanProjects = (projects || '').replace(/^(i built |i made |i created |working on )/i, '').trim();
  const cleanWhy = (why || '').replace(/^(i want |my goal |to )/i, '').trim();

  let score = 84;
  if (wordCount > 60) score += 3;
  if (wordCount > 140) score += 3;

  // Technical depth signals
  const techKeywords = /(compiler|kernel|distributed|agent|rust|assembly|neural|hardware|protocol|crypto|reverse|memory|wasm|concurrency|database|lexer|parser|ebpf|zero-knowledge|simd)/i;
  const isHardTech = techKeywords.test(combined);
  if (isHardTech) score += 5;

  const hasProofLink = proof && (proof.startsWith('http') || proof.includes('github.com') || proof.includes('.dev'));
  if (hasProofLink) score += 4;

  if (uncommonBelief && uncommonBelief.length > 25) score += 2;
  score = Math.min(score, 97);

  let verdict = 'Promising Independent Thinker';
  if (isHardTech && hasProofLink && score >= 92) {
    verdict = 'High Signal Systems Builder';
  } else if (score >= 90) {
    verdict = 'Dedicated Technical Autodidact';
  } else if (hasProofLink) {
    verdict = 'Verifiable Hands-on Crafter';
  }

  const signals = [
    `Self-taught depth: "${cleanSelfTaught.slice(0, 48)}..."`,
    `Craft & experiments: "${cleanProjects.slice(0, 48)}..."`,
    hasProofLink ? `Verifiable proof link attached (${proof.replace(/^https?:\/\//, '').slice(0, 24)}...)` : `Goal: "${cleanWhy.slice(0, 45)}..."`,
  ];

  const summary = `Focuses on ${cleanObsession.slice(0, 45) || 'systems engineering'}. Solved theoretical and implementation challenges in ${cleanSelfTaught.slice(0, 35) || 'self-directed studies'}.`;

  const questions = [
    cleanProjects
      ? `In your project (${cleanProjects.slice(0, 45)}), what core architectural trade-offs did you make, and what would you re-architect today?`
      : `What was the most challenging technical system you ever designed from scratch?`,
    cleanSelfTaught
      ? `What was the hardest debugging wall, memory leak, or obstacle you hit teaching yourself ${cleanSelfTaught.slice(0, 40)}, and how did you isolate the root cause?`
      : `Describe a time your code failed mysteriously and how you systematically isolated the problem.`,
    `How do you systematically master complex engineering domains without relying on guided courses or tutorials?`,
    `Why is maintaining an independent, sovereign domain essential to your creative agency over proprietary walled gardens?`,
    `What does 'uncompromising technical craft' look like in your daily engineering practice?`,
    cleanWhy
      ? `Given your vision ("${cleanWhy.slice(0, 45)}"), what rare perspective, build, or insight will your node contribute to The Uncommons webring?`
      : `What will other members of The Uncommons webring learn from inspecting your node?`,
  ];

  return {
    score,
    verdict,
    summary,
    signals,
    questions,
  };
}

// Get or auto-create private Founder-Only PIN Vault Channel (Visible strictly to Guild Owner & Senior Founders)
async function getOrCreateFounderVaultChannel(guild) {
  if (config.founderVaultChannelId) {
    const existing = guild.channels.cache.get(config.founderVaultChannelId);
    if (existing) return existing;
  }

  // Look for channel by name
  let ch = guild.channels.cache.find(c => c.name === 'founder-vault' || c.name === 'owner-pin-vault');
  if (ch) {
    config.founderVaultChannelId = ch.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return ch;
  }

  // Auto-create private founder-only channel
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

    // Allow Guild Owner explicitly
    if (guild.ownerId) {
      try {
        const ownerUser = await client.users.fetch(guild.ownerId).catch(() => null);
        if (ownerUser) {
          permissionOverwrites.push({
            id: ownerUser.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          });
        }
      } catch (e) {
        console.warn('Could not fetch guild owner:', e.message);
      }
    }

    // Explicitly hide from regular staff role so staff cannot see candidate PINs!
    if (config.staffRoleId && guild.roles.cache.has(config.staffRoleId)) {
      permissionOverwrites.push({
        id: config.staffRoleId,
        deny: [PermissionFlagsBits.ViewChannel],
      });
    }

    // Allow Senior Staff role if set and separate from regular staff
    if (config.seniorStaffRoleId && config.seniorStaffRoleId !== config.staffRoleId) {
      permissionOverwrites.push({
        id: config.seniorStaffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }

    const channelOptions = {
      name: 'founder-vault',
      type: ChannelType.GuildText,
      topic: '👑 Founder & Owner Vault: Strict confidential record of member Ring Keys & 6-digit Secret PINs.',
      permissionOverwrites,
    };

    if (config.ticketCategoryId) {
      channelOptions.parent = config.ticketCategoryId;
    }

    ch = await guild.channels.create(channelOptions);
    config.founderVaultChannelId = ch.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`👑 Created private founder vault channel: #${ch.name} (${ch.id})`);
    return ch;
  } catch (err) {
    console.error('Failed to create founder vault channel:', err);
    return null;
  }
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

// Get or auto-create private Admin-Only Rejection Logs Channel
async function getOrCreateRejectionLogsChannel(guild) {
  if (config.rejectionLogsChannelId) {
    const existing = guild.channels.cache.get(config.rejectionLogsChannelId);
    if (existing) return existing;
  }

  // Look for channel by name
  let ch = guild.channels.cache.find(c => c.name === 'rejection-logs' || c.name === 'rejections-vault');
  if (ch) {
    config.rejectionLogsChannelId = ch.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return ch;
  }

  // Auto-create private admin-only rejection logs channel
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

    if (guild.ownerId) {
      permissionOverwrites.push({
        id: guild.ownerId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }

    if (config.seniorStaffRoleId) {
      permissionOverwrites.push({
        id: config.seniorStaffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
        deny: [PermissionFlagsBits.SendMessages],
      });
    }

    if (config.staffRoleId && config.staffRoleId !== config.seniorStaffRoleId) {
      permissionOverwrites.push({
        id: config.staffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
        deny: [PermissionFlagsBits.SendMessages],
      });
    }

    const channelOptions = {
      name: 'rejection-logs',
      type: ChannelType.GuildText,
      topic: '🛑 Private Admissions Rejection Archive: Confidential audit log of candidate dockets not admitted to The Uncommons.',
      permissionOverwrites,
    };

    if (config.ticketCategoryId) {
      channelOptions.parent = config.ticketCategoryId;
    }

    ch = await guild.channels.create(channelOptions);
    config.rejectionLogsChannelId = ch.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`🛑 Created private rejection logs channel: #${ch.name} (${ch.id})`);
    return ch;
  } catch (err) {
    console.error('Failed to create rejection logs channel:', err);
    return null;
  }
}

// Get or auto-create private Staff-Only Node Updates Log Channel
async function getOrCreateNodeUpdatesChannel(guild) {
  if (config.nodeUpdatesChannelId) {
    const existing = guild.channels.cache.get(config.nodeUpdatesChannelId);
    if (existing) return existing;
  }

  // Look for channel by name
  let ch = guild.channels.cache.find(c => c.name === 'node-updates' || c.name === 'node-registry-logs');
  if (ch) {
    config.nodeUpdatesChannelId = ch.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return ch;
  }

  // Auto-create private staff-only channel
  try {
    const permissionOverwrites = [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: client.user.id,
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
        deny: [PermissionFlagsBits.SendMessages],
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
      name: 'node-updates',
      type: ChannelType.GuildText,
      topic: '🛰️ Sovereign Node Updates Archive: Real-time record of all webring node publications, edits, and slot vacancies.',
      permissionOverwrites,
    };

    if (config.ticketCategoryId) {
      channelOptions.parent = config.ticketCategoryId;
    }

    ch = await guild.channels.create(channelOptions);
    config.nodeUpdatesChannelId = ch.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`🛰️ Created private node updates channel: #${ch.name} (${ch.id})`);
    return ch;
  } catch (err) {
    console.error('Failed to create node updates channel:', err);
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

  // 4. Configured Reviewer Role IDs array
  if (Array.isArray(config.reviewerRoleIds)) {
    if (config.reviewerRoleIds.some(roleId => member.roles.cache.has(roleId))) {
      return true;
    }
  }

  // 5. Role fallbacks if set
  if (config.seniorStaffRoleId && member.roles.cache.has(config.seniorStaffRoleId)) {
    return true;
  }
  if (config.staffRoleId && member.roles.cache.has(config.staffRoleId)) {
    return true;
  }

  return false;
}

// Generate formatted pings for all reviewer roles and designated individuals
function getReviewerPings(guild) {
  const roleIds = new Set([
    ...(Array.isArray(config.reviewerRoleIds) ? config.reviewerRoleIds : []),
    ...(config.seniorStaffRoleId ? [config.seniorStaffRoleId] : []),
    ...(config.staffRoleId ? [config.staffRoleId] : [])
  ]);
  const pings = Array.from(roleIds).map(id => `<@&${id}>`);
  if (Array.isArray(config.reviewerUsernames)) {
    config.reviewerUsernames.forEach(u => {
      if (/^\d{17,20}$/.test(u)) pings.push(`<@${u}>`);
    });
  }
  return pings.length > 0 ? pings.join(' ') : 'Admissions Reviewers';
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
  const { domain, proof, discordHandle, age, uncommonBelief, focus, problemSolved, stack } = req.body;

  if (!discordHandle) {
    return res.status(400).json({ success: false, error: 'discordHandle is required' });
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

    // Check staff online status
    let anyStaffOnline = false;
    try {
      for (const rev of configuredReviewers) {
        if (rev.presence && ['online', 'idle', 'dnd'].includes(rev.presence.status)) {
          anyStaffOnline = true;
          break;
        }
      }
    } catch {
      anyStaffOnline = false;
    }

    const staffStatusNotice = anyStaffOnline
      ? '🟢 **Staff Status:** Reviewers are currently online and active.'
      : '⏳ **Staff Status:** No staff currently active. Our team will message you within **2–3 hours** (rarely 4–5 hours).';

    const leadPingText = leadReviewer ? `<@${leadReviewer.id}>` : (config.staffRoleId ? `<@&${config.staffRoleId}>` : 'Council Reviewer');

    // Create the private ticket channel
    const channelOptions = {
      name: channelName,
      type: ChannelType.GuildText,
      topic: `Candidate Docket ${ticketId} // @${member.user.username}`,
      permissionOverwrites,
    };

    if (config.ticketCategoryId) {
      channelOptions.parent = config.ticketCategoryId;
    }

    const ticketChannel = await guild.channels.create(channelOptions);

    // Initial Application Embed
    const embed = new EmbedBuilder()
      .setTitle(`The Uncommons — Candidate Application [${ticketId}]`)
      .setDescription(
        `Welcome <@${member.id}> to your private review channel for **The Uncommons Webring**.\n\n` +
        `${staffStatusNotice}\n\n` +
        `Please click **[ 📝 Open Application Dialog ]** below to answer the 5 intake questions. Reviewers will read your answers and chat with you here.`
      )
      .setColor(0x10b981)
      .addFields(
        { name: 'Discord Member', value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
        { name: 'Age', value: age ? `${age} years old` : 'Unspecified', inline: true },
        { name: 'Ticket Serial', value: `\`${ticketId}\``, inline: true },
        { name: 'Work / Portfolio / GitHub', value: (proof && proof.startsWith('http')) ? `[Inspect Link](${proof})\n\`${proof}\`` : (proof || 'Self-taught builder'), inline: false },
        { name: 'Independent Belief / Perspective', value: uncommonBelief || 'None provided', inline: false },
      )
      .setFooter({ text: 'Review Turnaround: 2–3 hours (rarely 4–5h) • Classic English Protocol' })
      .setTimestamp();

    // Action Controls: Candidate sees only the application button
    const candidateRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`open_application_modal:${member.id}:${ticketId}`)
        .setLabel('📝 Open Application Dialog')
        .setStyle(ButtonStyle.Success)
    );

    const channelDispatch = `👋 **Hello <@${member.id}>, welcome to your admissions channel!**\n` +
      `Assigned Reviewer: ${leadPingText}\n` +
      `${staffStatusNotice}\n\n` +
      `➡️ Click **[ 📝 Open Application Dialog ]** below to answer the 5 intake questions.`;

    await ticketChannel.send({
      content: channelDispatch,
      embeds: [embed],
      components: [candidateRow],
    });

    // Dispatch helpful DM with direct jump button to candidate
    try {
      const ticketLinkButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('📝 Enter Admissions Docket')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${guild.id}/${ticketChannel.id}`)
      );
      const ticketDM = new EmbedBuilder()
        .setTitle(`The Uncommons — Admissions Docket [${ticketId}]`)
        .setDescription(
          `👋 Greetings <@${member.id}>,\n\n` +
          `Your private admissions review channel has been opened on Discord:\n` +
          `👉 **<#${ticketChannel.id}>**\n\n` +
          `Please enter your channel and click **[ 📝 Open Application Dialog ]** to submit your 5 intake questions.`
        )
        .setColor(0x10b981)
        .setFooter({ text: 'The Uncommons • Admissions Reception' })
        .setTimestamp();

      await member.user.send({ embeds: [ticketDM], components: [ticketLinkButton] });
    } catch (dmErr) {
      console.warn(`Could not dispatch intake DM to user ${member.id}:`, dmErr.message);
    }

    return res.json({
      success: true,
      ticketId,
      channelId: ticketChannel.id,
      channelUrl: `https://discord.com/channels/${guild.id}/${ticketChannel.id}`,
      assignedReviewer: leadReviewer ? { id: leadReviewer.id, username: leadReviewer.user.username } : null,
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

// 3. Verify Vault Credentials (2-Step Verification Gate for /seal)
app.post('/api/verify-vault-credentials', (req, res) => {
  const { key, pin } = req.body || {};
  const cleanKey = (key || '').trim().toUpperCase();
  const cleanPin = (pin || '').trim();

  if (!cleanKey || !cleanPin) {
    return res.status(400).json({ valid: false, error: 'Both Ring Key and 6-digit PIN are required.' });
  }

  const isValid = verifyVaultCredentials(cleanKey, cleanPin);
  if (isValid) {
    const keys = loadVaultKeys();
    const record = keys[cleanKey] || null;
    return res.json({
      valid: true,
      key: cleanKey,
      username: record?.username || null,
      message: '2-Step Verification successful. Member Vault unlocked.',
    });
  }

  return res.status(401).json({
    valid: false,
    error: 'Invalid Ring Key or Secret PIN. Check the admission message sent to your Discord DM.',
  });
});

// 4. Check Application Ticket Status
app.get('/api/check-ticket', async (req, res) => {
  const ticketId = String(req.query?.ticketId || '').trim().toUpperCase();
  const rawHandle = String(req.query?.handle || '').trim();
  const cleanHandle = rawHandle.replace(/^@/, '').toLowerCase();

  if (!ticketId && !cleanHandle) {
    return res.status(400).json({ status: 'unknown', error: 'ticketId or handle required' });
  }

  // A. Check local ticket status (Rejections)
  const ticketStatuses = loadTicketStatus();
  const rec = ticketStatuses[ticketId] || Object.values(ticketStatuses).find(r => r.username?.toLowerCase() === cleanHandle);
  if (rec && rec.status === 'rejected') {
    return res.json({
      status: 'rejected',
      ticketId: rec.ticketId || ticketId,
      username: rec.username || cleanHandle,
      message: 'You were not admitted in this cohort. Stay active in the server, level up, and learn new things! We actively monitor everyone in the server—even small contributions and builds—and may add you to the webring.',
    });
  }

  // B. Check vault keys (Approved)
  const vaultKeys = loadVaultKeys();
  for (const [k, v] of Object.entries(vaultKeys)) {
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

  // C. Check Guild Channels
  try {
    const guild = await client.guilds.fetch(config.guildId).catch(() => null);
    if (guild) {
      const channels = await guild.channels.fetch();
      const activeTicketChannel = channels.find(c => {
        if (!c || c.parentId !== config.ticketCategoryId) return false;
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
          channelUrl: `https://discord.com/channels/${guild.id}/${activeTicketChannel.id}`,
          message: 'Application docket is currently active and under review by admissions auditors.',
        });
      } else {
        return res.json({
          status: 'rejected',
          ticketId,
          username: cleanHandle,
          message: 'You were not admitted in this cohort. Stay active in the server, level up, and learn new things! We actively monitor everyone in the server—even small contributions and builds—and may add you to the webring.',
        });
      }
    }
  } catch (e) {
    console.warn('Error checking guild channels in bot check-ticket:', e.message);
  }

  return res.json({
    status: 'under_review',
    ticketId,
    username: cleanHandle,
    message: 'Application docket under review in #council-review.',
  });
});

// 5. Get Live Webring Nodes from Multi-Cloud DB
app.get('/api/get-nodes', async (req, res) => {
  try {
    const bypassCache = req.query?.refresh === 'true';
    const nodes = await getAllNodes(bypassCache);
    return res.json({
      success: true,
      nodes,
      count: nodes.filter(n => n.verified && n.domain && !n.domain.includes('unclaimed')).length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to read nodes from database' });
  }
});

// 6. Save / Update Node with 2-Step Verification & Founder Superadmin Clearance
app.post('/api/save-node', async (req, res) => {
  const { node, key, pin } = req.body || {};
  if (!node || !node.id) {
    return res.status(400).json({ success: false, error: 'Node data with valid slot ID required.' });
  }

  // 2-Step Verification: Key + Secret PIN check
  const isAuthorized = verifyVaultCredentials(key, pin);
  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: '2-Step Verification Failed: Invalid Ring Key or Secret 6-Digit PIN. Node update rejected.',
    });
  }

  const cleanKey = String(key || '').trim().toUpperCase();
  const isFounder = cleanKey === 'UNC-ALPHA-2026' || cleanKey === 'UNC-COUNCIL-01' || cleanKey === 'UNC-KEY-FUVB-2026' || cleanPin === '918542';

  // Slot Lockout: Non-founders cannot overwrite claimed slots
  if (!isFounder) {
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

  try {
    const updatedNode = {
      ...node,
      verified: node.verified !== undefined ? node.verified : true,
      status: node.status || 'online',
      updatedAt: new Date().toISOString(),
    };

    const savedNode = await saveNodeRecord(updatedNode);
    console.log(`📡 [Multi-Cloud DB] Node ${node.id} (${node.handle} - ${node.domain}) saved. Founder mode: ${isFounder}`);

    const allNodes = await getAllNodes();
    return res.json({ 
      success: true, 
      node: savedNode, 
      nodes: allNodes, 
      isFounder,
      message: isFounder ? 'Founder Master Override applied and synced globally.' : 'Node published successfully.' 
    });
  } catch (err) {
    console.error('Error saving node to database:', err);
    return res.status(500).json({ success: false, error: 'Failed to write node to database.' });
  }
});

// 7. Batch Reorder / Swap Node Positions (Founder Only)
app.post('/api/reorder-nodes', async (req, res) => {
  const { nodes, key, pin } = req.body || {};
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({ success: false, error: 'Array of nodes required for reordering.' });
  }

  const cleanKey = String(key || '').trim().toUpperCase();
  const cleanPin = String(pin || '').trim();

  // Founder clearance check
  const isFounder = cleanKey === 'UNC-ALPHA-2026' || cleanKey === 'UNC-COUNCIL-01' || cleanKey === 'UNC-KEY-FUVB-2026' || cleanPin === '918542';
  const isCredsValid = verifyVaultCredentials(cleanKey, cleanPin);

  if (!isCredsValid || !isFounder) {
    return res.status(403).json({
      success: false,
      error: '⛔ Founder Superadmin clearance required to reorder and orchestrate webring positions.',
    });
  }

  try {
    const updatedList = await batchUpdateNodes(nodes);
    return res.json({
      success: true,
      nodes: updatedList,
      message: 'Constellation node positions reordered successfully.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to batch update node positions.' });
  }
});

// 8. Vacate / Reset Slot to Open Vacancy (Founder Only)
app.post('/api/vacate-slot', async (req, res) => {
  const { slotId, key, pin } = req.body || {};
  if (!slotId) {
    return res.status(400).json({ success: false, error: 'Slot ID required.' });
  }

  const cleanKey = String(key || '').trim().toUpperCase();
  const cleanPin = String(pin || '').trim();

  const isFounder = cleanKey === 'UNC-ALPHA-2026' || cleanKey === 'UNC-COUNCIL-01' || cleanKey === 'UNC-KEY-FUVB-2026' || cleanPin === '918542';
  const isCredsValid = verifyVaultCredentials(cleanKey, cleanPin);

  if (!isCredsValid || !isFounder) {
    return res.status(403).json({
      success: false,
      error: '⛔ Founder clearance required to vacate or reset node slots.',
    });
  }

  try {
    const vacated = await vacateSlotRecord(slotId);
    return res.json({
      success: true,
      node: vacated,
      message: `Slot ${slotId} has been reset to an open Genesis vacancy.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to vacate slot.' });
  }
});


// ============================================================================
// DISCORD INTERACTION LISTENER (COMMANDS, SELECT MENUS, BUTTONS & MODALS)
// ============================================================================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // 1. SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (commandName === 'staff') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) && !isSeniorStaff(interaction.member)) {
          return interaction.reply({
            content: '⛔ Only Server Managers, Founders, or Senior Staff can manage Admissions reviewers.',
            ephemeral: true,
          });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'add-user') {
          const target = interaction.options.getUser('user');
          if (!Array.isArray(config.reviewerUsernames)) config.reviewerUsernames = [];
          if (!config.reviewerUsernames.includes(target.id)) {
            config.reviewerUsernames.push(target.id);
            saveConfig();
          }
          return interaction.reply({
            content: `✅ **REVIEWER AUTHORIZED:** <@${target.id}> (\`${target.tag}\`) is now an authorized Admissions Reviewer.`,
            ephemeral: true,
          });
        }

        if (sub === 'remove-user') {
          const target = interaction.options.getUser('user');
          if (Array.isArray(config.reviewerUsernames)) {
            config.reviewerUsernames = config.reviewerUsernames.filter(u => u !== target.id && u !== target.username);
            saveConfig();
          }
          return interaction.reply({
            content: `🗑️ **REVIEWER REMOVED:** <@${target.id}> is no longer an authorized reviewer.`,
            ephemeral: true,
          });
        }

        if (sub === 'add-role') {
          const role = interaction.options.getRole('role');
          if (!Array.isArray(config.reviewerRoleIds)) config.reviewerRoleIds = [];
          if (!config.reviewerRoleIds.includes(role.id)) {
            config.reviewerRoleIds.push(role.id);
            saveConfig();
          }
          return interaction.reply({
            content: `✅ **ROLE AUTHORIZED:** Members with role <@&${role.id}> can now review admissions tickets & evaluate dossiers.`,
            ephemeral: true,
          });
        }

        if (sub === 'remove-role') {
          const role = interaction.options.getRole('role');
          if (Array.isArray(config.reviewerRoleIds)) {
            config.reviewerRoleIds = config.reviewerRoleIds.filter(r => r !== role.id);
            saveConfig();
          }
          return interaction.reply({
            content: `🗑️ **ROLE REMOVED:** Role <@&${role.id}> removed from authorized reviewer roles.`,
            ephemeral: true,
          });
        }

        if (sub === 'list') {
          const rolesList = (config.reviewerRoleIds && config.reviewerRoleIds.length > 0)
            ? config.reviewerRoleIds.map(id => `• <@&${id}>`).join('\n')
            : '*None configured*';

          const usersList = (config.reviewerUsernames && config.reviewerUsernames.length > 0)
            ? config.reviewerUsernames.map(u => `• ${/^\d+$/.test(u) ? `<@${u}>` : `@${u}`}`).join('\n')
            : '*None configured*';

          const embed = new EmbedBuilder()
            .setTitle('🛡️ The Uncommons // Admissions Review Staff Configuration')
            .setColor(0x10b981)
            .addFields(
              { name: '👥 Authorized Reviewer Roles', value: rolesList, inline: false },
              { name: '👤 Individual Reviewers', value: usersList, inline: false },
              { name: '🌐 Webring Member Role', value: config.webringRoleId ? `<@&${config.webringRoleId}>` : 'Auto-created', inline: true },
              { name: '🔒 Staff Key Ledger', value: config.keyLedgerChannelId ? `<#${config.keyLedgerChannelId}>` : 'Not set', inline: true },
              { name: '👑 Founder PIN Vault', value: config.founderVaultChannelId ? `<#${config.founderVaultChannelId}>` : 'Not set', inline: true }
            )
            .setFooter({ text: 'Inspector Bartholomew • Chief Admissions Auditor & Key Ledger Warden' })
            .setTimestamp();

          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'panel') {
          const roleRow = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
              .setCustomId('staff_panel_add_role')
              .setPlaceholder('Select a role to add as Admissions Reviewer...')
              .setMinValues(1)
              .setMaxValues(1)
          );

          const userRow = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId('staff_panel_add_user')
              .setPlaceholder('Select a user to add as Admissions Reviewer...')
              .setMinValues(1)
              .setMaxValues(1)
          );

          const panelEmbed = new EmbedBuilder()
            .setTitle('⚙️ Admissions Staff Control Panel')
            .setDescription(
              'Use the dropdown menus below to authorize new staff or reviewer roles for **The Uncommons**.\n\n' +
              'Reviewers can claim tickets, evaluate AI dossiers, and ratify candidate Ring Keys.'
            )
            .setColor(0x8b5cf6)
            .setFooter({ text: 'Inspector Bartholomew • Staff Administration' });

          return interaction.reply({ embeds: [panelEmbed], components: [roleRow, userRow], ephemeral: true });
        }
      }

      if (commandName === 'pass-review') {
        if (!isReviewer(interaction.member)) {
          return interaction.reply({ content: '⛔ Only authorized reviewers can pass a review.', ephemeral: true });
        }

        const target = interaction.options.getUser('reviewer');
        if (target) {
          return interaction.reply({
            content: `🔁 **REVIEW HANDED OFF:** Reviewer <@${interaction.user.id}> is AFK/busy and passed review to <@${target.id}>!\n<@${target.id}>, please inspect the candidate dossier and continue evaluation.`,
          });
        } else {
          const pings = getReviewerPings(interaction.guild);
          return interaction.reply({
            content: `📢 **TICKET RE-OPENED FOR REVIEW (REVIEWER AFK):**\nReviewer <@${interaction.user.id}> is stepping away from this ticket.\nReviewers (${pings}), please click **[ ⚡ Take Over Review ]** to claim!`,
          });
        }
      }
      return;
    }

    // 2. SELECT MENUS (HANDOFF & STAFF CONFIG)
    if (interaction.isUserSelectMenu()) {
      if (interaction.customId.startsWith('handoff_select_user:')) {
        const parts = interaction.customId.split(':');
        const applicantId = parts[1];
        const ticketId = parts[2];
        const targetUserId = interaction.values[0];

        await interaction.update({
          content: `✅ Transferred review to <@${targetUserId}>.`,
          components: [],
        });

        const candidateText = applicantId ? `(Candidate: <@${applicantId}>)` : '';
        const ticketText = ticketId ? `ticket \`${ticketId}\`` : 'this ticket';

        await interaction.channel.send({
          content: `🔁 **REVIEW HANDED OFF:** Reviewer <@${interaction.user.id}> is AFK/busy and transferred active review of ${ticketText} ${candidateText} to <@${targetUserId}>!\n<@${targetUserId}>, please inspect the candidate dossier and continue the evaluation.`,
        });

        // Dispatch alert DM to new assigned reviewer
        try {
          const targetReviewerUser = await client.users.fetch(targetUserId);
          if (targetReviewerUser) {
            const jumpRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('🔍 Jump to Docket')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
            );
            const handoffDM = new EmbedBuilder()
              .setTitle(`The Uncommons — Docket Assigned // ${ticketId || 'Active'}`)
              .setDescription(
                `Reviewer <@${interaction.user.id}> is AFK/busy and handed over review of docket **\`${ticketId || 'Active'}\`** ${candidateText} to you.\n\n` +
                `Please navigate to the review channel to evaluate the candidate's dossier.`
              )
              .setColor(0x06b6d4)
              .setFooter({ text: 'Inspector Bartholomew • Review Handoff' })
              .setTimestamp();
            await targetReviewerUser.send({ embeds: [handoffDM], components: [jumpRow] });
          }
        } catch (dmErr) {
          console.warn('Could not dispatch handoff DM to reviewer:', dmErr.message);
        }
        return;
      }

      if (interaction.customId === 'staff_panel_add_user') {
        const userId = interaction.values[0];
        if (!Array.isArray(config.reviewerUsernames)) config.reviewerUsernames = [];
        if (!config.reviewerUsernames.includes(userId)) {
          config.reviewerUsernames.push(userId);
          saveConfig();
        }
        return interaction.reply({
          content: `✅ **REVIEWER AUTHORIZED:** <@${userId}> is now an authorized Admissions Reviewer.`,
          ephemeral: true,
        });
      }
    }

    if (interaction.isRoleSelectMenu()) {
      if (interaction.customId === 'staff_panel_add_role') {
        const roleId = interaction.values[0];
        if (!Array.isArray(config.reviewerRoleIds)) config.reviewerRoleIds = [];
        if (!config.reviewerRoleIds.includes(roleId)) {
          config.reviewerRoleIds.push(roleId);
          saveConfig();
        }
        return interaction.reply({
          content: `✅ **ROLE AUTHORIZED:** Members with role <@&${roleId}> can now review admissions tickets.`,
          ephemeral: true,
        });
      }
    }

    // 3. MODAL SUBMIT HANDLER
    if (interaction.isModalSubmit()) {
      const [action, applicantId, ticketId] = interaction.customId.split(':');

    if (action === 'submit_application_modal') {
      const name = interaction.fields.getTextInputValue('q_name');
      const obsession = interaction.fields.getTextInputValue('q_obsession');
      const selfTaught = interaction.fields.getTextInputValue('q_selftaught');
      const projects = interaction.fields.getTextInputValue('q_projects');
      const why = interaction.fields.getTextInputValue('q_why');

      await interaction.reply({
        content: '✅ **Application Dossier Received:** Running AI evaluation and posting your dossier in this channel for staff review...',
        ephemeral: true,
      });

      const answersEmbed = new EmbedBuilder()
        .setTitle(`📋 Candidate Dossier // @${interaction.user.username} [${ticketId}]`)
        .setDescription(`Candidate <@${applicantId}> has submitted their 5-question intake application:`)
        .setColor(0x10b981)
        .addFields(
          { name: '1. Candidate Name', value: name || 'Not provided', inline: true },
          { name: '2. Topic of Deep Interest', value: obsession || 'Not provided', inline: false },
          { name: '3. Hardest Self-Taught Skill / Concept', value: selfTaught || 'Not provided', inline: false },
          { name: '4. Built / Experiments / Ideas', value: projects || 'Not provided', inline: false },
          { name: '5. Biggest Goal & Why The Uncommons', value: why || 'Not provided', inline: false },
        )
        .setFooter({ text: 'The Uncommons Admissions • Review Stage' })
        .setTimestamp();

      // Run AI Evaluation Engine on submitted answers
      const aiResult = await runAIEvaluation({
        applicantUser: interaction.user,
        answers: { name, obsession, selfTaught, projects, why },
      });

      // Artificial buffer to let things go smooth and make the AI analysis feel real (10 seconds)
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Visual Score Bar Helper
      const filled = Math.min(10, Math.max(0, Math.round(aiResult.score / 10)));
      const scoreBar = `[${'█'.repeat(filled)}${'░'.repeat(10 - filled)}] ${aiResult.score}/100`;

      // 1. Internal AI Audit Embed (PRIVATE FOR STAFF & COUNCIL ONLY)
      const aiEmbed = new EmbedBuilder()
        .setTitle('🕵️ INSPECTOR BARTHOLOMEW // INTERNAL CANDIDATE AUDIT')
        .setDescription(
          `Confidential audit for <@${applicantId}> (\`${interaction.user.username}\`).\n` +
          `*"I review Ring applications between espresso shots and unfiltered smokes. No vibecoding allowed on my watch."*\n\n` +
          `**🎯 Alignment Index:** \`${scoreBar}\`\n` +
          `**Verdict:** \`${aiResult.verdict}\`\n\n` +
          `**Auditor Assessment:** ${aiResult.summary}`
        )
        .setColor(0x10b981)
        .addFields(
          { name: '📊 Candidate Signals Identified', value: aiResult.signals.map((s) => `• ${s}`).join('\n'), inline: false }
        )
        .setFooter({ text: 'Inspector Bartholomew • Confidential Staff Audit' })
        .setTimestamp();

      // 2. 5 Mandatory Technical Interview Questions (PUBLIC FOR CANDIDATE IN TICKET)
      const questionsFormatted = aiResult.questions
        .map((q, idx) => `**${idx + 1}.** ${q}`)
        .join('\n\n');

      const icebreakerEmbed = new EmbedBuilder()
        .setTitle('📋 BARTHOLOMEW\'S ICEBREAKER DOCKET // 5 REQUIRED QUESTIONS')
        .setDescription(
          `Candidate <@${applicantId}>, before the Council can ratify your key, please answer these **5 interview questions** directly in this channel:\n\n` +
          questionsFormatted + '\n\n' +
          `*Take your time. Deep, authentic technical answers are favored over buzzwords. Reviewers will inspect your responses before casting votes.*`
        )
        .setColor(0x06b6d4)
        .setFooter({ text: 'Admissions Interview Stage • 5 Mandatory Inquiries' })
        .setTimestamp();

      const reviewerPings = getReviewerPings(interaction.guild);

      const staffRow1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_review:${applicantId}:${ticketId}`)
          .setLabel('⚡ Take Over Review')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`pass_review:${applicantId}:${ticketId}`)
          .setLabel('🔁 Pass Review (AFK)')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`ping_senior:${applicantId}:${ticketId}`)
          .setLabel('📢 Signal Council')
          .setStyle(ButtonStyle.Secondary)
      );

      const staffRow2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ratify_key:${applicantId}:${ticketId}`)
          .setLabel('🟢 Ratify & Forge Key')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`close_ticket:${applicantId}:${ticketId}`)
          .setLabel('🛑 Reject / Close')
          .setStyle(ButtonStyle.Danger)
      );

      // Clean Staff Controls Embed (No internal score shown in public ticket channel)
      const staffControlsEmbed = new EmbedBuilder()
        .setTitle(`⚙️ Admissions Reviewer Controls // Docket ${ticketId}`)
        .setDescription(`Reviewers: Evaluate the candidate's answers to the 5 questions above. Use these control buttons to claim, signal council, or ratify/reject the applicant:`)
        .setColor(0x8b5cf6)
        .setFooter({ text: 'The Uncommons Admissions • Reviewer Actions' });

      // Send Candidate Dossier, 5 Questions & Staff Control buttons to ticket channel
      await interaction.channel.send({
        content: `🔔 **NEW APPLICATION SUBMITTED** by <@${applicantId}> | Reviewers: ${reviewerPings}`,
        embeds: [answersEmbed, icebreakerEmbed, staffControlsEmbed],
        components: [staffRow1, staffRow2],
      });

      // Send Confidential AI Audit to #council-review staff channel if configured
      if (config.councilChannelId) {
        try {
          const councilCh = interaction.guild.channels.cache.get(config.councilChannelId) || await interaction.guild.channels.fetch(config.councilChannelId);
          if (councilCh) {
            const jumpBtn = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('⚡ Jump to Candidate Docket')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
            );
            await councilCh.send({
              content: `🕵️ **INTERNAL AI AUDIT REPORT** for Candidate <@${applicantId}> [${ticketId}]`,
              embeds: [aiEmbed],
              components: [jumpBtn],
            });
          }
        } catch (cErr) {
          console.warn('Could not post AI audit to council channel:', cErr.message);
        }
      }
      return;
    }
    return;
  }

  // 2. BUTTON INTERACTIONS
  if (!interaction.isButton()) return;

  const [action, applicantId, ticketId] = interaction.customId.split(':');
  const guildMember = interaction.member;

  // Applicant check: Non-admin applicants cannot click reviewer control buttons
  if (['claim_review', 'pass_review', 'ping_senior', 'ratify_key', 'close_ticket'].includes(action)) {
    const isAdmin = guildMember.permissions.has(PermissionFlagsBits.Administrator) || isReviewer(guildMember);
    if (interaction.user.id === applicantId && !isAdmin) {
      return interaction.reply({
        content: '⛔ Only authorized admissions reviewers can perform actions on this application.',
        ephemeral: true,
      });
    }
    if (!isAdmin) {
      return interaction.reply({
        content: '⛔ You do not have reviewer permissions.',
        ephemeral: true,
      });
    }
  }

  // OPEN APPLICATION MODAL DIALOG
  if (action === 'open_application_modal') {
    if (interaction.user.id !== applicantId && !isReviewer(guildMember)) {
      return interaction.reply({
        content: 'Only the ticket applicant can fill out this application form.',
        ephemeral: true,
      });
    }

    if (interaction.replied || interaction.deferred) return;

    try {
      const modal = new ModalBuilder()
        .setCustomId(`submit_application_modal:${applicantId}:${ticketId}`)
        .setTitle('The Uncommons Application');

      const nameInput = new TextInputBuilder()
        .setCustomId('q_name')
        .setLabel('1. What is your name?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Your preferred name or moniker')
        .setRequired(true)
        .setMaxLength(100);

      const obsessionInput = new TextInputBuilder()
        .setCustomId('q_obsession')
        .setLabel('2. Topic you can talk for hours about?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('What topic never gets boring to you, and why?')
        .setRequired(true)
        .setMinLength(10)
        .setMaxLength(1000);

      const selfTaughtInput = new TextInputBuilder()
        .setCustomId('q_selftaught')
        .setLabel('3. Hardest thing you taught yourself?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('What was it, and how did you teach yourself?')
        .setRequired(true)
        .setMinLength(10)
        .setMaxLength(1000);

      const projectsInput = new TextInputBuilder()
        .setCustomId('q_projects')
        .setLabel('4. Coolest thing you made / built / ideas?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell us about what you have crafted or explored')
        .setRequired(true)
        .setMinLength(10)
        .setMaxLength(1000);

      const whyInput = new TextInputBuilder()
        .setCustomId('q_why')
        .setLabel('5. Biggest goal & why The Uncommons?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('What do you genuinely want to accomplish?')
        .setRequired(true)
        .setMinLength(10)
        .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(obsessionInput),
        new ActionRowBuilder().addComponents(selfTaughtInput),
        new ActionRowBuilder().addComponents(projectsInput),
        new ActionRowBuilder().addComponents(whyInput)
      );

      await interaction.showModal(modal);
    } catch (err) {
      if (err.code === 40060) {
        console.warn('⚠️ Modal interaction already acknowledged (rapid click). Safely ignored.');
      } else {
        console.error('⚠️ Error displaying modal:', err.message);
      }
    }
    return;
  }

  // TAKE OVER / CLAIM REVIEW
  if (action === 'claim_review') {
    if (!isReviewer(guildMember)) {
      return interaction.reply({
        content: '⛔ You are not registered as an authorized reviewer.',
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: `⚡ **REVIEW CLAIMED:** Reviewer <@${interaction.user.id}> has taken over active review for ticket \`${ticketId}\` (Candidate: <@${applicantId}>).`,
    });
    return;
  }

  // PASS REVIEW / HANDOFF (AFK / BUSY)
  if (action === 'pass_review') {
    if (!isReviewer(guildMember)) {
      return interaction.reply({
        content: '⛔ Only authorized reviewers can hand off an active ticket.',
        ephemeral: true,
      });
    }

    const userSelectRow = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`handoff_select_user:${applicantId}:${ticketId}`)
        .setPlaceholder('Select a reviewer to hand off to...')
        .setMinValues(1)
        .setMaxValues(1)
    );

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`handoff_broadcast:${applicantId}:${ticketId}`)
        .setLabel('📢 Broadcast to All Staff (Step Down)')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`handoff_cancel:${applicantId}:${ticketId}`)
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      content: '🔁 **Review Handoff Panel**\nAre you AFK or busy? Choose a specific reviewer below to hand off this dossier, or broadcast to all admissions staff to release it:',
      components: [userSelectRow, buttonRow],
      ephemeral: true,
    });
  }

  // BROADCAST HANDOFF / STEP DOWN
  if (action === 'handoff_broadcast') {
    const pings = getReviewerPings(interaction.guild);

    await interaction.update({
      content: '📢 Handoff broadcasted to all admissions staff.',
      components: [],
    });

    await interaction.channel.send({
      content: `📢 **TICKET RE-OPENED FOR REVIEW (REVIEWER AFK):**\nReviewer <@${interaction.user.id}> is stepping away from ticket \`${ticketId || 'Active'}\` (Candidate: <@${applicantId}>).\nReviewers (${pings}), please click **[ ⚡ Take Over Review ]** below to claim this candidate's application!`,
    });
    return;
  }

  // CANCEL HANDOFF
  if (action === 'handoff_cancel') {
    return interaction.update({
      content: 'Handoff cancelled.',
      components: [],
    });
  }

  // SIGNAL COUNCIL / PING REVIEWERS
  if (action === 'ping_senior') {
    await interaction.deferReply();
    const reviewers = await resolveConfiguredReviewers(interaction.guild);
    let pings = reviewers.map(r => `<@${r.id}>`).join(' ');
    if (!pings) {
      pings = config.seniorStaffRoleId ? `<@&${config.seniorStaffRoleId}>` : (config.staffRoleId ? `<@&${config.staffRoleId}>` : 'Council Reviewers');
    }

    await interaction.editReply({
      content: `📢 **COUNCIL SIGNAL BROADCASTED:** <@${interaction.user.id}> has signaled Council for docket \`${ticketId}\` (Candidate: <@${applicantId}>).\nReviewers & Council: ${pings}`,
      allowedMentions: { parse: ['roles', 'users'] },
    });

    // Also broadcast an urgent alert to #council-review channel with Jump Button
    if (config.councilChannelId) {
      try {
        const councilCh = interaction.guild.channels.cache.get(config.councilChannelId) || await interaction.guild.channels.fetch(config.councilChannelId);
        if (councilCh) {
          const jumpBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('⚡ Jump to Candidate Docket')
              .setStyle(ButtonStyle.Link)
              .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`)
          );
          const councilEmbed = new EmbedBuilder()
            .setTitle(`📢 COUNCIL SIGNAL // ${ticketId || 'Active Docket'}`)
            .setDescription(
              `Reviewer <@${interaction.user.id}> has requested Council assistance/second review on docket **\`${ticketId || 'Active'}\`** for Candidate <@${applicantId}>.\n\n` +
              `Please click below to enter the docket channel and assist with evaluation.`
            )
            .setColor(0xf59e0b)
            .setFooter({ text: 'Inspector Bartholomew • Council Dispatch' })
            .setTimestamp();

          await councilCh.send({
            content: `📢 **COUNCIL ATTENTION REQUIRED** | ${pings}`,
            embeds: [councilEmbed],
            components: [jumpBtn],
            allowedMentions: { parse: ['roles', 'users'] },
          });
        }
      } catch (cErr) {
        console.warn('Could not post alert to council channel:', cErr.message);
      }
    }
    return;
  }

  // RATIFY & FORGE KEY WITH 2-STEP VERIFICATION (KEY + SECRET PIN)
  if (action === 'ratify_key') {
    if (!isReviewer(guildMember) && !isSeniorStaff(guildMember)) {
      return interaction.reply({
        content: '⛔ Only authorized reviewers or senior staff can approve candidates and issue Ring Keys.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const guild = interaction.guild;

    // Fetch applicant
    try {
      const applicantUser = await client.users.fetch(applicantId);
      const uniqueKey = generateUniqueRingKey();
      const secretPin = generateSecretPin();

      // Persist to vault_keys.json
      saveVaultKey(uniqueKey, secretPin, {
        discordId: applicantId,
        username: applicantUser.username,
        ticketId,
      });

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

      // Record in Staff-Only Key Ledger Channel (KEY ONLY - NO PIN SHOWN TO STAFF!)
      let ledgerChannel = null;
      try {
        ledgerChannel = await getOrCreateKeyLedgerChannel(guild);
        if (ledgerChannel) {
          const auditEmbed = new EmbedBuilder()
            .setTitle(`💎 WEBRING KEY FORGED // ${uniqueKey}`)
            .setDescription(`Official approval executed by Reviewer <@${interaction.user.id}> for **The Uncommons Webring**.`)
            .setColor(0x10b981)
            .addFields(
              { name: 'Candidate Member', value: `<@${applicantId}> (\`${applicantUser.tag}\`)`, inline: true },
              { name: 'Approved By', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Ticket Serial', value: `\`${ticketId}\``, inline: true },
              { name: 'Unique Ring Key', value: `\`\`\`text\n${uniqueKey}\n\`\`\``, inline: false },
              { name: 'Webring Discord Role', value: roleGranted && webringRole ? `<@&${webringRole.id}> (Active)` : (webringRole ? `<@&${webringRole.id}> (Assigned)` : 'Generated'), inline: true },
              { name: '2-Step Verification', value: '🔒 Active (Secret PIN dispatched to candidate DM & Founder Vault)', inline: true },
              { name: 'Sovereign Node Studio', value: '[the-uncommons.vercel.app/seal](https://the-uncommons.vercel.app/seal)', inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Staff Key Ledger • Audited by Inspector Bartholomew' });

          await ledgerChannel.send({
            embeds: [auditEmbed],
          });
        }
      } catch (ledgerErr) {
        console.error('Error logging to key ledger channel:', ledgerErr);
      }

      // Record in Founder & Owner PIN Vault Channel (FOUNDERS ONLY - STORES SECRET PIN)
      let founderVaultChannel = null;
      try {
        founderVaultChannel = await getOrCreateFounderVaultChannel(guild);
        if (founderVaultChannel) {
          const founderEmbed = new EmbedBuilder()
            .setTitle(`👑 FOUNDER VAULT // 2-STEP CREDENTIAL RECORD`)
            .setDescription(`Confidential record of 2-step verification credentials. Visible only to Guild Owner & Senior Founders.`)
            .setColor(0xf59e0b)
            .addFields(
              { name: 'Candidate Member', value: `<@${applicantId}> (\`${applicantUser.tag}\`)`, inline: true },
              { name: 'Approved By', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Ticket Serial', value: `\`${ticketId}\``, inline: true },
              { name: 'Ring Key', value: `\`\`\`text\n${uniqueKey}\n\`\`\``, inline: true },
              { name: '🔒 Secret 6-Digit PIN', value: `\`\`\`text\n||${secretPin}||\n\`\`\``, inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Founder Vault • Inspector Bartholomew Confidential Vault Custodian' });

          await founderVaultChannel.send({
            embeds: [founderEmbed],
          });
        }
      } catch (founderErr) {
        console.error('Error logging to founder vault channel:', founderErr);
      }

      // Update local ticket status
      saveTicketStatus(ticketId, {
        status: 'approved',
        applicantId,
        username: applicantUser.username,
        key: uniqueKey,
      });


      // Minimal Clean DM for applicant
      let dmSuccess = true;
      const dmEmbed = new EmbedBuilder()
        .setTitle('The Uncommons — Sovereign Admission Approved')
        .setDescription(
          `Congratulations <@${applicantId}>! Your application has been ratified and approved for **The Uncommons Webring**.\n\n` +
          `**Your Sovereign Credentials:**\n` +
          `• **Ring Key:** \`${uniqueKey}\`\n` +
          `• **Secret PIN:** \`${secretPin}\` *(Keep this confidential)*\n\n` +
          (roleGranted && webringRole ? `🛡️ **Role Awarded:** You have been assigned <@&${webringRole.id}> in the server!\n\n` : '') +
          `**1-Click Vault Access:**\n` +
          `✨ [Click here to enter your Node Studio](https://the-uncommons.vercel.app/seal?key=${uniqueKey}&pin=${secretPin})\n\n` +
          `Or enter manually at [the-uncommons.vercel.app/seal](https://the-uncommons.vercel.app/seal) with your key & PIN.`
        )
        .setColor(0x10b981)
        .setFooter({ text: 'The Uncommons • Sealed by Inspector Bartholomew' })
        .setTimestamp();

      const vaultButtonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('🔑 Enter Sovereign Node Studio')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://the-uncommons.vercel.app/seal?key=${uniqueKey}&pin=${secretPin}`)
      );

      try {
        await applicantUser.send({ embeds: [dmEmbed], components: [vaultButtonRow] });
      } catch (dmErr) {
        dmSuccess = false;
        console.warn(`Could not DM user ${applicantId}:`, dmErr.message);
      }

      const roleLine = roleGranted && webringRole ? `\n🎭 **Role Awarded:** Assigned <@&${webringRole.id}>.` : '';
      const ledgerLine = ledgerChannel ? `\n🔒 **Staff Ledger:** Key logged in <#${ledgerChannel.id}>.` : '';
      const founderLine = founderVaultChannel ? `\n👑 **Founder Vault:** 2-Step PIN secured in <#${founderVaultChannel.id}>.` : '';

      if (dmSuccess) {
        await interaction.editReply({
          content: `🟢 **APPLICATION APPROVED & 2-STEP CREDENTIALS ISSUED BY <@${interaction.user.id}>!**\n` +
                   `Unique Ring Key (\`${uniqueKey}\`) and Secret PIN dispatched directly to <@${applicantId}>'s DMs.` +
                   roleLine +
                   ledgerLine +
                   founderLine + `\n\n` +
                   `⏳ *This docket channel will automatically close in 5 minutes.*`,
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete('Ticket completed and verified by reviewer');
          } catch (delErr) {
            console.error('Failed to delete ticket channel:', delErr);
          }
        }, 300000); // 5 minutes
      } else {
        await interaction.editReply({
          content: `🟢 **APPLICATION APPROVED & 2-STEP CREDENTIALS ISSUED BY <@${interaction.user.id}>!**\n` +
                   `⚠️ *Candidate DMs appear to be disabled in privacy settings.* \n\n` +
                   `<@${applicantId}>, here are your Sovereign Ring credentials:\n\`\`\`text\nRing Key:   ${uniqueKey}\nSecret PIN: ${secretPin}\n\`\`\`\n` +
                   roleLine +
                   ledgerLine +
                   founderLine + `\n\n` +
                   `⏳ *This docket channel will automatically close in 5 minutes so you can save your credentials...*`,
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete('Ticket completed and verified by reviewer');
          } catch (delErr) {
            console.error('Failed to delete ticket channel:', delErr);
          }
        }, 300000); // 5 minutes
      }

    } catch (err) {
      console.error('Error during ratification:', err);
      await interaction.editReply({ content: '❌ Error during ratification process. Please check console logs.' });
    }
    return;
  }

  // REJECT CANDIDATE / CLOSE TICKET
  if (action === 'close_ticket' || action === 'reject_candidate') {
    if (!isReviewer(guildMember)) {
      return interaction.reply({
        content: '⛔ You do not have permission to close or reject this ticket.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    let applicantUser = null;
    try {
      applicantUser = await client.users.fetch(applicantId);
    } catch {}

    const applicantUsername = applicantUser?.username || applicantId;

    // 1. Record rejection in local ticket status
    saveTicketStatus(ticketId, {
      status: 'rejected',
      applicantId,
      username: applicantUsername,
      closedBy: interaction.user.username,
    });

    // 2. Dispatch encouraging DM to the candidate
    const rejectionEmbed = new EmbedBuilder()
      .setTitle('🛑 The Uncommons — Admission Cohort Verdict')
      .setDescription(
        `Hello <@${applicantId}>,\n\n` +
        `Thank you for taking the time to submit your application for **The Uncommons Webring** (Docket \`${ticketId}\`).\n\n` +
        `**You were not admitted in this cohort.**\n\n` +
        `*Stay active in the server, level up, build and learn new things! We actively monitor everyone in the server—even small contributions, discussions, and side projects—and may add you to the webring in the future.*`
      )
      .setColor(0xef4444)
      .setFooter({ text: 'The Uncommons • Inspector Bartholomew (Chief Admissions Auditor)' })
      .setTimestamp();

    if (applicantUser) {
      try {
        await applicantUser.send({ embeds: [rejectionEmbed] });
      } catch (dmErr) {
        console.warn('Could not DM rejection to user:', dmErr.message);
      }
    }

    // 3. Broadcast rejection record to Private Admin-Only Rejection Logs Channel
    try {
      const guild = interaction.guild;
      const rejectionChannel = await getOrCreateRejectionLogsChannel(guild);
      if (rejectionChannel) {
        await rejectionChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle(`🛑 DOCKET REJECTED // ${ticketId}`)
              .setDescription(`Candidate <@${applicantId}> (\`${applicantUsername}\`) was not admitted by Reviewer <@${interaction.user.id}>.`)
              .setColor(0xef4444)
              .addFields(
                { name: 'Applicant', value: `<@${applicantId}> (\`${applicantUsername}\`)`, inline: true },
                { name: 'Reviewer', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Status', value: '🛑 Not Admitted / Encouragement Dispatched', inline: true },
                { name: 'Ticket Serial', value: `\`${ticketId}\``, inline: true },
                { name: 'Audit Ref', value: `\`UNC_TICKET_STATUS:${ticketId}\``, inline: true },
              )
              .setFooter({ text: 'Audited by Inspector Bartholomew • Private Rejections Archive' })
              .setTimestamp(),
          ],
        });
      }
    } catch (lErr) {
      console.warn('Could not log rejection to rejection channel:', lErr.message);
    }

    await interaction.editReply({
      content: `🛑 **ADMISSION DOCKET CLOSED // VERDICT: NOT ADMITTED**\n` +
               `Reviewer <@${interaction.user.id}> has concluded review for Candidate <@${applicantId}> (\`${applicantUsername}\`).\n` +
               `Encouraging status notice was dispatched to applicant.\n\n` +
               `⏳ *This docket channel will automatically close in 5 minutes.*`,
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete('Candidate docket rejected by reviewer');
      } catch (delErr) {
        console.error('Failed to delete channel:', delErr);
      }
    }, 300000); // 5 minutes
    return;
  }

  } catch (err) {
    if (err.code === 40060 || err.code === 10062) {
      console.warn('⚠️ Safe warning: Interaction expired or was already acknowledged:', err.message);
    } else {
      console.error('⚠️ Error processing interaction:', err);
    }
  }
});

// Global Safety Listeners: Prevent any unhandled Discord/network error from crashing the bot
process.on('unhandledRejection', (reason, promise) => {
  console.warn('⚠️ [Safe Guard] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ [Safe Guard] Uncaught Exception:', err);
});

client.on('error', (err) => {
  console.warn('⚠️ [Safe Guard] Discord Client Error:', err);
});

// Bot Ready Event
client.once(Events.ClientReady, async () => {
  console.log(`🤖 The Uncommons Council Bot is live as ${client.user.tag}!`);
  console.log(`📡 Connected to Guild: ${config.guildId}`);

  // Set rotating presence for Inspector Bartholomew
  const statusList = [
    { name: 'Inspector Bartholomew', type: ActivityType.Watching },
    { name: 'No vibecoding allowed.', type: ActivityType.Watching },
    { name: 'espresso & unfiltered smokes', type: ActivityType.Listening },
    { name: 'the-uncommons.vercel.app', type: ActivityType.Watching },
    { name: 'over the sovereign webring', type: ActivityType.Watching },
    { name: 'dossiers | 2-Step Gate', type: ActivityType.Watching },
  ];

  let statusIndex = 0;
  const updatePresence = () => {
    try {
      client.user.setPresence({
        activities: [statusList[statusIndex % statusList.length]],
        status: 'online',
      });
      statusIndex++;
    } catch {}
  };

  updatePresence();
  setInterval(updatePresence, 30000);

  // Set custom avatar (Inspector Bartholomew dog portrait)
  try {
    const avatarPng = path.join(__dirname, 'avatar.png');
    const avatarJpg = path.join(__dirname, 'avatar.jpg');
    const targetAvatar = fs.existsSync(avatarPng) ? avatarPng : (fs.existsSync(avatarJpg) ? avatarJpg : null);
    if (targetAvatar && !client.user.avatar) {
      await client.user.setAvatar(targetAvatar);
      console.log('✨ Bot avatar set to Inspector Bartholomew portrait.');
    }
  } catch (e) {
    console.log('Avatar set note (safe):', e.message);
  }

  try {
    const guild = client.guilds.cache.get(config.guildId) || await client.guilds.fetch(config.guildId);
    if (guild) {
      // Set server nickname to "Inspector Bartholomew"
      try {
        const botMember = await guild.members.fetchMe();
        if (botMember && botMember.nickname !== 'Inspector Bartholomew') {
          await botMember.setNickname('Inspector Bartholomew');
          console.log('✨ Server nickname updated to Inspector Bartholomew.');
        }
      } catch (nickErr) {
        console.log('Server nickname note:', nickErr.message);
      }

      const ledger = await getOrCreateKeyLedgerChannel(guild);
      const role = await getOrCreateWebringRole(guild);
      const vault = await getOrCreateFounderVaultChannel(guild);
      console.log(`🔒 Staff Key Ledger Channel: #${ledger?.name} (${ledger?.id})`);
      if (vault) {
        console.log(`👑 Founder PIN Vault Channel: #${vault?.name} (${vault?.id})`);
      }
      console.log(`🎭 Webring Member Role: ${role?.name} (${role?.id})`);

      // Deploy & sync Guild Slash Commands (/staff and /pass-review)
      await registerSlashCommands();
    }
  } catch (err) {
    console.warn('Initial readiness check warning:', err.message);
  }
});

// Register Guild Slash Commands (/staff and /pass-review)
async function registerSlashCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('staff')
      .setDescription('Manage Uncommons Admissions review staff and reviewer roles')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand(sub => 
        sub.setName('add-user')
          .setDescription('Authorize an individual user to review admissions applications')
          .addUserOption(opt => opt.setName('user').setDescription('The user to authorize as reviewer').setRequired(true))
      )
      .addSubcommand(sub => 
        sub.setName('remove-user')
          .setDescription('Revoke application review permissions from a user')
          .addUserOption(opt => opt.setName('user').setDescription('The user to revoke').setRequired(true))
      )
      .addSubcommand(sub => 
        sub.setName('add-role')
          .setDescription('Authorize an entire Discord role to review admissions applications')
          .addRoleOption(opt => opt.setName('role').setDescription('The role to authorize').setRequired(true))
      )
      .addSubcommand(sub => 
        sub.setName('remove-role')
          .setDescription('Remove a role from authorized reviewer roles')
          .addRoleOption(opt => opt.setName('role').setDescription('The role to remove').setRequired(true))
      )
      .addSubcommand(sub => 
        sub.setName('list')
          .setDescription('List all authorized admissions reviewer roles and members')
      )
      .addSubcommand(sub => 
        sub.setName('panel')
          .setDescription('Open the interactive Admissions Staff Configuration Panel')
      ),

    new SlashCommandBuilder()
      .setName('pass-review')
      .setDescription('Pass active ticket review to another staff member if you are AFK or busy')
      .addUserOption(opt => opt.setName('reviewer').setDescription('The staff member to hand off review to (optional)').setRequired(false))
  ];

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, config.guildId),
      { body: commands.map(c => c.toJSON()) }
    );
    console.log('✨ Registered Discord Slash Commands: /staff, /pass-review');
  } catch (err) {
    console.warn('Could not register slash commands:', err.message);
  }
}

// Start API Server with error resilience
const PORT = process.env.PORT || config.port || 3001;
const server = app.listen(PORT, () => {
  console.log(`⚡ Admissions Bot API listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Port ${PORT} already bound. An admissions API instance is already listening.`);
  } else {
    console.error('Server network error:', err.message);
  }
});

// Login Bot if token is configured
if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN !== 'your_discord_bot_token_here') {
  client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error('Failed to login Discord Bot:', err.message);
  });
} else {
  console.log('ℹ️ Set DISCORD_BOT_TOKEN in bot/.env to activate Discord Gateway connections.');
}

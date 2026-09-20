import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Cached connections for Vercel Serverless environment
let cachedMongoClient = null;
let cachedMongoDb = null;
let memoryCacheNodes = null;
let memoryCacheExpiry = 0;
const CACHE_TTL_MS = 5000; // 5-second in-memory cache for sub-5ms reads

// 1. MONGODB ATLAS CONNECTION POOL
async function getMongoDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (cachedMongoDb) {
    return cachedMongoDb;
  }

  try {
    if (!cachedMongoClient) {
      cachedMongoClient = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
      await cachedMongoClient.connect();
      console.log('⚡ Connected to MongoDB Atlas cluster');
    }
    const dbName = process.env.MONGODB_DB_NAME || 'the_uncommons';
    cachedMongoDb = cachedMongoClient.db(dbName);
    return cachedMongoDb;
  } catch (err) {
    console.warn('MongoDB Atlas connection warning:', err.message);
    return null;
  }
}

// 2. GITHUB GIST DB ADAPTER
async function getGistData() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const gistId = process.env.GIST_ID;
  if (!token || !gistId) return null;

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'The-Uncommons-Webring',
        Accept: 'application/vnd.github+json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      const rawContent = data.files?.['nodes.json']?.content;
      if (rawContent) {
        return JSON.parse(rawContent);
      }
    }
  } catch (err) {
    console.warn('GitHub Gist DB read warning:', err.message);
  }
  return null;
}

async function saveGistData(nodesList) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  let gistId = process.env.GIST_ID;
  if (!token) return null;

  try {
    const payload = {
      description: 'The Uncommons Webring Live Node Registry Database',
      files: {
        'nodes.json': {
          content: JSON.stringify(nodesList, null, 2),
        },
      },
    };

    if (gistId) {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'The-Uncommons-Webring',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } else {
      // Auto-create private Gist if no ID provided
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'The-Uncommons-Webring',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, public: false }),
      });
      if (res.ok) {
        const created = await res.json();
        console.log(`✨ Created GitHub Gist DB: ${created.id}`);
        return true;
      }
    }
  } catch (err) {
    console.warn('GitHub Gist DB write warning:', err.message);
  }
  return false;
}

// 3. DISCORD KEY LEDGER ADAPTER
async function fetchDiscordLedgerNodes() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const keyLedgerChannelId = process.env.DISCORD_KEY_LEDGER_CHANNEL_ID || '1551036698757038181';

  if (!token || !keyLedgerChannelId) return [];

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${keyLedgerChannelId}/messages?limit=100`, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (res.ok) {
      const messages = await res.json();
      const ledgerNodes = [];
      for (const msg of messages.reverse()) {
        // 1. Check embed footer base64 (clean & hidden from UI)
        for (const embed of (msg.embeds || [])) {
          if (embed.footer?.text && embed.footer.text.includes('UNC_NODE_DATA:')) {
            try {
              const b64 = embed.footer.text.split('UNC_NODE_DATA:')[1].trim();
              const jsonStr = Buffer.from(b64, 'base64').toString('utf8');
              const nodeData = JSON.parse(jsonStr);
              if (nodeData && nodeData.id) {
                ledgerNodes.push(nodeData);
              }
            } catch {}
          } else if (msg.content && msg.content.includes('UNC_NODE_DATA:')) {
            try {
              const match = msg.content.match(/UNC_NODE_DATA:\s*({[\s\S]*?})(?:\s*-->|\n|$)/);
              if (match) {
                const nodeData = JSON.parse(match[1]);
                if (nodeData && nodeData.id) {
                  ledgerNodes.push(nodeData);
                }
              }
            } catch {}
          }
        }
      }
      return ledgerNodes;
    }
  } catch (err) {
    console.warn('Discord ledger fetch warning:', err.message);
  }
  return [];
}

async function broadcastToDiscordLedger(node) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const keyLedgerChannelId = process.env.DISCORD_KEY_LEDGER_CHANNEL_ID || '1551036698757038181';

  if (!token || !keyLedgerChannelId) return;

  try {
    const isVacant = !node.verified || node.domain?.includes('unclaimed') || node.handle === 'vacant';
    const b64Data = Buffer.from(JSON.stringify(node)).toString('base64');
    
    const embedPayload = {
      title: isVacant ? `🔄 SLOT VACATED / RESET // ${node.id}` : `🛰️ SOVEREIGN NODE PUBLISHED // ${node.id}`,
      description: isVacant
        ? `Founder Orchestrator reset **${node.id}** to an open Genesis vacancy.`
        : `Builder **${node.name}** (\`@${node.handle}\`) has updated node slot **${node.id}** on The Uncommons webring.`,
      color: isVacant ? 0x71717a : 0x10b981,
      fields: isVacant ? [
        { name: '🎫 Slot ID', value: `\`${node.id}\``, inline: true },
        { name: '📍 Ring Position', value: `#${node.ringPosition || 'Auto'}`, inline: true },
        { name: 'Status', value: 'Open Genesis Vacancy', inline: true },
      ] : [
        { name: '🌐 Sovereign Domain', value: `\`https://${node.domain}\``, inline: true },
        { name: '👤 Handle', value: `@${node.handle}`, inline: true },
        { name: '🎫 Slot ID', value: `\`${node.id}\``, inline: true },
        { name: '⚡ Focus Field', value: node.field || 'Systems & Web', inline: false },
        { name: '📜 Bio', value: node.bio || 'Verified Member', inline: false },
        { name: '🔨 Proof of Work', value: node.proofOfWork ? `[Inspect Proof](${node.proofUrl || node.url})\n${node.proofOfWork}` : 'Verified build', inline: false },
        { name: '📍 Ring Position', value: `#${node.ringPosition || 'Auto'}`, inline: true },
        { name: '🟢 Status', value: node.status || 'online', inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: `The Uncommons Webring • UNC_NODE_DATA:${b64Data}` },
    };

    await fetch(`https://discord.com/api/v10/channels/${keyLedgerChannelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embedPayload],
      }),
    });
  } catch (discErr) {
    console.warn('Failed to broadcast node to Discord:', discErr.message);
  }
}

// 4. DEFAULT 8 GENESIS SLOTS (Guarantees slots 1 to 8 always exist)
export const DEFAULT_GENESIS_NODES = [
  {
    id: 'NODE-001',
    name: 'Ibrahim (Carbon)',
    handle: 'carbonthecoder',
    domain: 'carbonthecoder.github.io',
    url: 'https://carbonthecoder.github.io',
    field: 'Autonomous Agentic Systems & Sovereign Web',
    bio: 'Founder of The Uncommons. Architect of distributed cognitive loops, high-autonomy agents, and sovereign digital gardens.',
    proofOfWork: 'Agentic orchestration engines & persistent local-first knowledge systems.',
    proofUrl: 'https://github.com/carbonthecoder',
    tags: ['Founder', 'Systems', 'AI Agents', 'Architecture'],
    joinDate: '2026-01-01',
    verified: true,
    ringPosition: 1,
    status: 'online',
  },
  {
    id: 'NODE-002',
    name: 'Priyanshu (Aero)',
    handle: 'the_priyxnshu_',
    domain: 'aero.build',
    url: 'https://aero.build',
    field: 'Distributed Systems & Low-Level Agent Runtimes',
    bio: 'Architecting deterministic multi-agent systems and compiler IR pipelines.',
    proofOfWork: 'High-throughput agent orchestration engine with zero IPC overhead.',
    proofUrl: 'https://github.com/carbonthecoder/The-Uncommons-webring',
    tags: ['Systems', 'Rust', 'Compilers', 'AI'],
    joinDate: '2026-01-15',
    verified: true,
    ringPosition: 2,
    status: 'online',
  },
  ...Array.from({ length: 6 }, (_, i) => {
    const num = i + 3;
    return {
      id: `NODE-00${num}`,
      name: 'Awaiting Council Review',
      handle: 'vacant',
      domain: `unclaimed-slot-00${num}.xyz`,
      url: 'https://the-uncommons.vercel.app/apply',
      field: 'Open to polymaths, systems hackers & sovereign creators',
      bio: `Genesis vacancy slot #${num}. Applications open via #council-review in Kavyon Discord.`,
      proofOfWork: 'Awaiting candidate build submission.',
      proofUrl: 'https://the-uncommons.vercel.app/apply',
      tags: ['Genesis', 'Vacancy'],
      joinDate: '2026-01-01',
      verified: false,
      ringPosition: num,
      status: 'reviewing',
    };
  }),
];

// 5. LOCAL FILE SYSTEM BACKUP & LIVE CODE FILE UPDATE
function getLocalFileNodes() {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'public/nodes.json'),
      path.resolve(process.cwd(), '../public/nodes.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read local public/nodes.json:', e.message);
  }
  return [];
}

function writeLocalFileNodes(nodesList) {
  try {
    const paths = [
      path.resolve(process.cwd(), 'public/nodes.json'),
      path.resolve(process.cwd(), '../public/nodes.json'),
    ];
    for (const p of paths) {
      const dir = path.dirname(p);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(p, JSON.stringify(nodesList, null, 2), 'utf8');
        console.log(`💾 Live updated local code file: ${p}`);
      }
    }
  } catch (e) {
    console.warn('Could not write to local public/nodes.json:', e.message);
  }
}

// 6. GITHUB REPOSITORY DIRECT GIT COMMIT ("Change in code live update")
async function commitToGitHubRepo(nodesList, commitMessage = 'chore(webring): live update nodes registry [skip ci]') {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) return false;

  const repoFullName = process.env.GITHUB_REPOSITORY || 'carbonthecoder/The-Uncommons-webring';
  const filePath = 'public/nodes.json';
  const branch = process.env.GITHUB_BRANCH || 'main';

  try {
    // 1. Get existing file SHA from GitHub Contents API
    const getRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'The-Uncommons-Webring',
        Accept: 'application/vnd.github+json',
      },
    });

    let sha = null;
    if (getRes.ok) {
      const getData = await getRes.json();
      sha = getData.sha;
    }

    const contentBase64 = Buffer.from(JSON.stringify(nodesList, null, 2)).toString('base64');
    const putPayload = {
      message: commitMessage,
      content: contentBase64,
      branch: branch,
    };
    if (sha) {
      putPayload.sha = sha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'The-Uncommons-Webring',
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify(putPayload),
    });

    if (putRes.ok) {
      console.log(`🐙 [GitHub Code Commit] Successfully committed live update to ${repoFullName}/${filePath} on branch ${branch}`);
      return true;
    } else {
      const errText = await putRes.text();
      console.warn('GitHub Code Commit warning:', errText);
    }
  } catch (err) {
    console.warn('GitHub Code Commit error:', err.message);
  }
  return false;
}

// ============================================================================
// PUBLIC EXPORTED DATABASE INTERFACES
// ============================================================================

/**
 * Get all nodes with multi-layer fallback & memory cache
 */
export async function getAllNodes(bypassCache = false) {
  const now = Date.now();
  if (!bypassCache && memoryCacheNodes && now < memoryCacheExpiry) {
    return memoryCacheNodes;
  }

  const nodeMap = new Map();

  // Step 0: Base Genesis Slots 1 through 8
  for (const genNode of DEFAULT_GENESIS_NODES) {
    nodeMap.set(genNode.id, genNode);
  }

  // Step 1: Base local nodes
  const baseNodes = getLocalFileNodes();
  for (const n of baseNodes) {
    if (n && n.id) {
      nodeMap.set(n.id, {
        ...nodeMap.get(n.id),
        ...n,
      });
    }
  }

  // Step 2: GitHub Gist DB (if configured fallback)
  const gistNodes = await getGistData();
  if (Array.isArray(gistNodes) && gistNodes.length > 0) {
    for (const gn of gistNodes) {
      if (gn.id) {
        nodeMap.set(gn.id, {
          ...nodeMap.get(gn.id),
          ...gn,
        });
      }
    }
  }

  // Step 3: Discord Key Ledger real-time updates
  const ledgerNodes = await fetchDiscordLedgerNodes();
  for (const ln of ledgerNodes) {
    if (ln && ln.id) {
      nodeMap.set(ln.id, {
        ...nodeMap.get(ln.id),
        ...ln,
      });
    }
  }

  // Step 4: MongoDB Atlas (HIGHEST PRIORITY - PRIMARY AUTHORITY)
  try {
    const mongoDb = await getMongoDatabase();
    if (mongoDb) {
      const collection = mongoDb.collection('nodes');
      const docs = await collection.find({}).toArray();
      if (docs && docs.length > 0) {
        for (const doc of docs) {
          const { _id, ...cleanNode } = doc;
          nodeMap.set(cleanNode.id, {
            ...nodeMap.get(cleanNode.id),
            ...cleanNode,
          });
        }
      }
    }
  } catch (mErr) {
    console.warn('MongoDB read fallback:', mErr.message);
  }

  // Deterministic sorting: ringPosition or numeric ID
  const sorted = Array.from(nodeMap.values()).sort((a, b) => {
    const numA = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 999;
    const numB = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 999;
    const posA = typeof a.ringPosition === 'number' ? a.ringPosition : numA;
    const posB = typeof b.ringPosition === 'number' ? b.ringPosition : numB;
    return posA - posB;
  });

  memoryCacheNodes = sorted;
  memoryCacheExpiry = now + CACHE_TTL_MS;
  return sorted;
}

/**
 * Save / Upsert single node across MongoDB, Gist, GitHub Repo Commit, Discord, and Local Files
 */
export async function saveNodeRecord(updatedNode) {
  const node = {
    ...updatedNode,
    updatedAt: new Date().toISOString(),
  };

  // 1. Write to MongoDB Atlas
  try {
    const mongoDb = await getMongoDatabase();
    if (mongoDb) {
      const collection = mongoDb.collection('nodes');
      await collection.updateOne(
        { id: node.id },
        { $set: node },
        { upsert: true }
      );
      console.log(`💾 Saved ${node.id} to MongoDB Atlas`);
    }
  } catch (err) {
    console.warn('MongoDB write error:', err.message);
  }

  // 2. Fetch full 8-node state and write to Local File
  const currentNodes = await getAllNodes(true);
  const idx = currentNodes.findIndex((n) => n.id === node.id);
  if (idx !== -1) {
    currentNodes[idx] = node;
  } else {
    currentNodes.push(node);
  }
  writeLocalFileNodes(currentNodes);

  // 3. Write to GitHub Gist DB
  await saveGistData(currentNodes);

  // 4. Commit directly to GitHub Repository ("Change in code live update")
  await commitToGitHubRepo(currentNodes, `chore(registry): update node ${node.id} (${node.handle}) [skip ci]`);

  // 5. Broadcast to Discord Key Ledger (live multi-cloud event log)
  await broadcastToDiscordLedger(node);

  // Invalidate memory cache
  memoryCacheNodes = null;

  return node;
}

/**
 * Batch update/reorder all nodes (e.g. Founder changing positions)
 */
export async function batchUpdateNodes(updatedNodesList) {
  // Merge into full 8-node list
  const allNodes = await getAllNodes(true);
  for (const updated of updatedNodesList) {
    const idx = allNodes.findIndex((n) => n.id === updated.id);
    if (idx !== -1) {
      allNodes[idx] = { ...allNodes[idx], ...updated, updatedAt: new Date().toISOString() };
    } else {
      allNodes.push({ ...updated, updatedAt: new Date().toISOString() });
    }
  }
  allNodes.sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));

  // 1. Write to MongoDB Atlas
  try {
    const mongoDb = await getMongoDatabase();
    if (mongoDb) {
      const collection = mongoDb.collection('nodes');
      const ops = updatedNodesList.map((n) => ({
        updateOne: {
          filter: { id: n.id },
          update: { $set: { ...n, updatedAt: new Date().toISOString() } },
          upsert: true,
        },
      }));
      await collection.bulkWrite(ops);
    }
  } catch (err) {
    console.warn('MongoDB bulk write error:', err.message);
  }

  // 2. Write full list to Local File
  writeLocalFileNodes(allNodes);

  // 3. Write full list to GitHub Gist DB
  await saveGistData(allNodes);

  // 4. Commit full list directly to GitHub Repository
  await commitToGitHubRepo(allNodes, 'chore(registry): batch reorder ring positions [skip ci]');

  // Invalidate memory cache
  memoryCacheNodes = null;

  return allNodes;
}

/**
 * Vacate/Reset a slot back to an open Genesis vacancy
 */
export async function vacateSlotRecord(slotId) {
  const slotNum = parseInt(slotId.replace(/\D/g, ''), 10) || 1;
  const vacantNode = {
    id: slotId,
    name: 'Awaiting Candidate',
    handle: 'vacant',
    domain: `unclaimed-slot-00${slotNum}.xyz`,
    url: 'https://the-uncommons.vercel.app/apply',
    field: 'Open Genesis Vacancy',
    bio: `Genesis vacancy slot #${slotNum}. Applications open via #council-review in Kavyon Discord.`,
    proofOfWork: 'Awaiting candidate build submission.',
    proofUrl: 'https://the-uncommons.vercel.app/apply',
    tags: ['Genesis', 'Vacancy'],
    joinDate: '2026-01-01',
    verified: false,
    ringPosition: slotNum,
    status: 'reviewing',
    updatedAt: new Date().toISOString(),
  };

  return await saveNodeRecord(vacantNode);
}

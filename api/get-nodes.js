import fs from 'fs';
import path from 'path';

// Vercel Serverless Function: Get Live Webring Nodes
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Load base nodes from public/nodes.json
  let baseNodes = [];
  try {
    const publicNodesPath = path.resolve(process.cwd(), 'public/nodes.json');
    if (fs.existsSync(publicNodesPath)) {
      baseNodes = JSON.parse(fs.readFileSync(publicNodesPath, 'utf8'));
    }
  } catch (err) {
    console.warn('Could not read public/nodes.json:', err.message);
  }

  // 2. Fetch live published node updates from Discord Key Ledger
  const token = process.env.DISCORD_BOT_TOKEN;
  const keyLedgerChannelId = process.env.DISCORD_KEY_LEDGER_CHANNEL_ID || '1551036698757038181';

  const nodeMap = new Map();
  for (const n of baseNodes) {
    nodeMap.set(n.id, n);
  }

  if (token && keyLedgerChannelId) {
    try {
      const ledgerRes = await fetch(`https://discord.com/api/v10/channels/${keyLedgerChannelId}/messages?limit=50`, {
        headers: { Authorization: `Bot ${token}` },
      });

      if (ledgerRes.ok) {
        const messages = await ledgerRes.json();
        // Messages are reverse chronological (newest first)
        for (const msg of messages.reverse()) {
          if (msg.content && msg.content.includes('UNC_NODE_DATA:')) {
            try {
              const match = msg.content.match(/UNC_NODE_DATA:\s*({[^}]+})/);
              if (match) {
                const nodeData = JSON.parse(match[1]);
                if (nodeData && nodeData.id) {
                  nodeMap.set(nodeData.id, {
                    ...nodeMap.get(nodeData.id),
                    ...nodeData,
                    verified: true,
                  });
                }
              }
            } catch (pErr) {
              console.warn('Failed to parse UNC_NODE_DATA message:', pErr);
            }
          }
        }
      }
    } catch (discErr) {
      console.error('Failed to fetch ledger messages for nodes:', discErr);
    }
  }

  const mergedNodes = Array.from(nodeMap.values()).sort((a, b) => {
    const posA = a.ringPosition || 999;
    const posB = b.ringPosition || 999;
    return posA - posB;
  });

  return res.json({
    success: true,
    nodes: mergedNodes,
    count: mergedNodes.filter((n) => n.verified).length,
  });
}

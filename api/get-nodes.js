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
              const match = msg.content.match(/UNC_NODE_DATA:\s*({[\s\S]*?})(?:\s*-->|\n|$)/);
              if (match) {
                const nodeData = JSON.parse(match[1]);
                if (nodeData && nodeData.id) {
                  // Filter out test nodes or spam submissions
                  if (/^test/i.test(nodeData.name) || /^test/i.test(nodeData.handle) || /test/i.test(nodeData.domain)) {
                    continue;
                  }
                  // Slot protection: NODE-001 is exclusively Ibrahim (Carbon)
                  if (nodeData.id === 'NODE-001' && nodeData.handle !== 'carbonthecoder') {
                    continue;
                  }
                  // Slot protection: NODE-002 is exclusively Priyanshu (Aero)
                  if (nodeData.id === 'NODE-002' && !String(nodeData.handle).includes('priyxnshu')) {
                    continue;
                  }

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
    const numA = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 999;
    const numB = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 999;
    const posA = typeof a.ringPosition === 'number' ? a.ringPosition : numA;
    const posB = typeof b.ringPosition === 'number' ? b.ringPosition : numB;
    return posA - posB;
  });

  return res.json({
    success: true,
    nodes: mergedNodes,
    count: mergedNodes.filter((n) => n.verified).length,
  });
}

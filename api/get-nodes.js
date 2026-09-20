import { getAllNodes } from './db.js';

// Vercel Serverless Function: Get Live Webring Nodes from Multi-Cloud Database
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const bypassCache = req.query?.refresh === 'true' || req.query?.force === 'true';
    const nodes = await getAllNodes(bypassCache);

    return res.json({
      success: true,
      nodes,
      count: nodes.filter((n) => n.verified && n.domain && !n.domain.includes('unclaimed')).length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('get-nodes error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve nodes registry' });
  }
}

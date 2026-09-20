import { batchUpdateNodes } from './db.js';
import fs from 'fs';
import path from 'path';

// Helper to verify founder credentials
async function isFounderAuthorized(cleanKey, cleanPin) {
  if (!cleanKey || !cleanPin) return false;

  // Master founder keys
  if (cleanPin === '918542') return true;
  if (cleanKey === 'UNC-ALPHA-2026' && (cleanPin === '000000' || cleanPin === '888888')) return true;
  if (cleanKey === 'UNC-COUNCIL-01' && cleanPin === '111111') return true;
  if ((cleanKey === 'UNC-KEY-Z24R-2026' && cleanPin === '230582') || (cleanKey === 'UNC-KEY-FUVB-2026' && (cleanPin === '774237' || cleanPin === '918542'))) return true;

  // Check local cache
  try {
    const localVaultPath = path.resolve(process.cwd(), 'bot/vault_keys.json');
    if (fs.existsSync(localVaultPath)) {
      const keys = JSON.parse(fs.readFileSync(localVaultPath, 'utf8'));
      const rec = keys[cleanKey];
      if (rec && String(rec.pin).trim() === cleanPin && (rec.role === 'founder' || rec.role === 'admin')) {
        return true;
      }
    }
  } catch {}

  return false;
}

// Vercel Serverless Function: Batch Reorder / Swap Node Positions
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { nodes, key, pin } = req.body || {};
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({ success: false, error: 'Array of nodes required for reordering.' });
  }

  const cleanKey = String(key || '').trim().toUpperCase();
  const cleanPin = String(pin || '').trim();

  // Founder Authorization Check
  const isAuthorized = await isFounderAuthorized(cleanKey, cleanPin);
  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: '⛔ Founder Superadmin clearance required to reorder and orchestrate webring node positions.',
    });
  }

  try {
    const updated = await batchUpdateNodes(nodes);
    return res.json({
      success: true,
      nodes: updated,
      message: 'Constellation node positions successfully reordered and persisted to multi-cloud database.',
    });
  } catch (err) {
    console.error('Reorder error:', err);
    return res.status(500).json({ success: false, error: 'Failed to reorder nodes in database.' });
  }
}

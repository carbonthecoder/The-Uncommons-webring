import { useState, useEffect } from 'react';

export interface Member {
  id: string;
  name: string;
  handle: string;
  domain: string;
  url: string;
  field: string;
  bio: string;
  proofOfWork: string;
  proofUrl: string;
  tags: string[];
  joinDate: string;
  verified: boolean;
  ringPosition: number;
  status: 'online' | 'dormant' | 'reviewing';
}

export const MEMBERS: Member[] = [
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
    status: 'online'
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
    status: 'online'
  }
];

let serverNodesCache: Member[] = [];
let allGenesisSlotsCache: Member[] = [];

let ringChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    ringChannel = new BroadcastChannel('unc_ring_sync');
    ringChannel.onmessage = (event) => {
      if (event.data?.type === 'NODES_UPDATED') {
        syncServerNodes(true);
      }
    };
  }
} catch {}

export function broadcastRingUpdate() {
  window.dispatchEvent(new Event('unc_nodes_updated'));
  if (ringChannel) {
    try {
      ringChannel.postMessage({ type: 'NODES_UPDATED', timestamp: Date.now() });
    } catch {}
  }
}

export async function syncServerNodes(bypassCache: boolean = false): Promise<Member[]> {
  try {
    const url = bypassCache ? `/api/get-nodes?refresh=true&t=${Date.now()}` : `/api/get-nodes?t=${Date.now()}`;
    let res = await fetch(url);
    if (!res.ok) {
      res = await fetch('/nodes.json?t=' + Date.now());
    }
    if (res.ok) {
      const result = await res.json();
      const data = Array.isArray(result) ? result : (result.nodes || []);
      if (Array.isArray(data) && data.length > 0) {
        allGenesisSlotsCache = data.map((d: any, i: number) => ({
          id: d.id || `NODE-00${i + 1}`,
          name: d.name || 'Awaiting Candidate',
          handle: d.handle || 'vacant',
          domain: d.domain || `unclaimed-slot-00${i + 1}.xyz`,
          url: d.url || (d.domain && !d.domain.includes('unclaimed') ? (d.domain.startsWith('http') ? d.domain : `https://${d.domain}`) : 'https://the-uncommons.vercel.app/apply'),
          field: d.field || 'Open Genesis Vacancy',
          bio: d.bio || 'Genesis slot. Applications open via Discord.',
          proofOfWork: d.proofOfWork || 'Awaiting candidate build submission.',
          proofUrl: d.proofUrl || 'https://the-uncommons.vercel.app/apply',
          tags: d.tags || ['Genesis', 'Vacancy'],
          joinDate: d.joinDate || '2026-01-01',
          verified: !!d.verified && !d.domain?.includes('unclaimed') && d.handle !== 'vacant',
          ringPosition: d.ringPosition || (i + 1),
          status: d.status || 'online',
        }));

        serverNodesCache = allGenesisSlotsCache.filter((s) => s.verified);
        window.dispatchEvent(new Event('unc_nodes_updated'));
      }
    }
  } catch (err) {
    console.warn('syncServerNodes error:', err);
  }
  return getAllMembers();
}

export function getAllGenesisSlots(): Member[] {
  if (allGenesisSlotsCache.length > 0) {
    return allGenesisSlotsCache;
  }
  return Array.from({ length: 8 }, (_, i) => {
    const num = i + 1;
    const id = `NODE-00${num}`;
    const found = MEMBERS.find((m) => m.id === id);
    if (found) return found;
    return {
      id,
      name: 'Awaiting Candidate',
      handle: 'vacant',
      domain: `unclaimed-slot-00${num}.xyz`,
      url: 'https://the-uncommons.vercel.app/apply',
      field: 'Open Genesis Vacancy',
      bio: `Genesis vacancy slot #${num}. Applications open via Discord.`,
      proofOfWork: 'Awaiting candidate build submission.',
      proofUrl: 'https://the-uncommons.vercel.app/apply',
      tags: ['Genesis', 'Vacancy'],
      joinDate: '2026-01-01',
      verified: false,
      ringPosition: num,
      status: 'reviewing' as const,
    };
  });
}

export function vacateCustomNode(slotId: string) {
  try {
    const existing = getCustomActiveNodes();
    const updated = existing.filter((m) => m.id !== slotId);
    localStorage.setItem('unc_custom_nodes', JSON.stringify(updated));

    serverNodesCache = serverNodesCache.filter((m) => m.id !== slotId);
    const slotNum = parseInt(slotId.replace(/\D/g, ''), 10) || 1;
    const idx = allGenesisSlotsCache.findIndex((s) => s.id === slotId);
    const vacantObj: Member = {
      id: slotId,
      name: 'Awaiting Candidate',
      handle: 'vacant',
      domain: `unclaimed-slot-00${slotNum}.xyz`,
      url: 'https://the-uncommons.vercel.app/apply',
      field: 'Open Genesis Vacancy',
      bio: `Genesis vacancy slot #${slotNum}. Applications open via Discord.`,
      proofOfWork: 'Awaiting candidate build submission.',
      proofUrl: 'https://the-uncommons.vercel.app/apply',
      tags: ['Genesis', 'Vacancy'],
      joinDate: '2026-01-01',
      verified: false,
      ringPosition: slotNum,
      status: 'reviewing',
    };
    if (idx !== -1) {
      allGenesisSlotsCache[idx] = vacantObj;
    } else {
      allGenesisSlotsCache.push(vacantObj);
    }

    broadcastRingUpdate();
  } catch {}
}

export function getAllMembers(): Member[] {
  const custom = getCustomActiveNodes();
  const map = new Map<string, Member>();

  if (allGenesisSlotsCache.length > 0) {
    for (const s of allGenesisSlotsCache) {
      if (s.verified && s.domain && !s.domain.includes('unclaimed') && s.handle !== 'vacant') {
        map.set(s.id, s);
      }
    }
  } else {
    for (const m of MEMBERS) {
      map.set(m.id, m);
    }
    for (const s of serverNodesCache) {
      if (s.verified && s.domain && !s.domain.includes('unclaimed') && s.handle !== 'vacant') {
        map.set(s.id, s);
      }
    }
  }

  for (const c of custom) {
    if (c.verified && c.domain && !c.domain.includes('unclaimed') && c.handle !== 'vacant') {
      map.set(c.id, c);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.ringPosition - b.ringPosition);
}

export function getNextMember(currentDomain: string): Member {
  const members = getAllMembers();
  const clean = currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const index = members.findIndex(m => m.domain.toLowerCase() === clean);
  if (index === -1) return members[0];
  return members[(index + 1) % members.length];
}

export function getPrevMember(currentDomain: string): Member {
  const members = getAllMembers();
  const clean = currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const index = members.findIndex(m => m.domain.toLowerCase() === clean);
  if (index === -1) return members[members.length - 1];
  return members[(index - 1 + members.length) % members.length];
}

export function getRandomMember(currentDomain?: string): Member {
  const members = getAllMembers();
  const clean = currentDomain ? currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase() : '';
  const filtered = currentDomain ? members.filter(m => m.domain.toLowerCase() !== clean) : members;
  const pool = filtered.length > 0 ? filtered : members;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export const GENESIS_TOTAL_SLOTS = 8;

export function getCustomActiveNodes(): Member[] {
  try {
    const raw = localStorage.getItem('unc_custom_nodes');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Sanitize against test submissions or corrupted slots
    const sanitized = parsed.filter((m: any) => {
      if (!m || typeof m !== 'object' || !m.id || !m.domain) return false;
      // Strip test submissions
      if (/^test/i.test(m.handle) || /^test/i.test(m.name) || /test/i.test(m.domain)) return false;
      // Protect NODE-001
      if (m.id === 'NODE-001' && m.handle !== 'carbonthecoder') return false;
      // Protect NODE-002
      if (m.id === 'NODE-002' && !String(m.handle).includes('priyxnshu')) return false;
      return true;
    });

    if (sanitized.length !== parsed.length) {
      localStorage.setItem('unc_custom_nodes', JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return [];
  }
}

export function saveCustomNode(newMember: Member) {
  try {
    const existing = getCustomActiveNodes();
    const updated = [...existing.filter(m => m.id !== newMember.id), newMember];
    localStorage.setItem('unc_custom_nodes', JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function validateActivationKey(key: string): { valid: boolean; targetSlot: string; error?: string } {
  const cleanKey = key.trim().toUpperCase();
  if (!cleanKey) return { valid: false, targetSlot: '', error: 'Please enter your Sovereign Ring Key.' };
  
  if (cleanKey === 'UNC-ALPHA-2026') {
    return { valid: true, targetSlot: 'NODE-001' };
  }
  if (cleanKey === 'UNC-COUNCIL-01') {
    return { valid: true, targetSlot: 'NODE-002' };
  }

  // Format matching candidate keys issued by bot: UNC-KEY-XXXX-YYYY
  if (/^UNC-KEY-[A-Z0-9]{4}-\d{4}$/.test(cleanKey)) {
    return { valid: true, targetSlot: 'NODE-003' };
  }

  // Legacy slot format UNC-NODE-00X-XXXX
  if (/^UNC-NODE-(00[1-8])-[A-Z0-9]+$/.test(cleanKey)) {
    const match = cleanKey.match(/NODE-(00[1-8])/);
    const targetSlot = match ? `NODE-${match[1]}` : 'NODE-003';
    return { valid: true, targetSlot };
  }

  return { 
    valid: false, 
    targetSlot: '', 
    error: 'Invalid activation key format. Example: UNC-KEY-CMCX-2026' 
  };
}


export function useLiveMembers(): Member[] {
  const [members, setMembers] = useState<Member[]>(() => getAllMembers());

  useEffect(() => {
    syncServerNodes().then(m => setMembers(m));

    const handleUpdate = () => {
      setMembers(getAllMembers());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('unc_nodes_updated', handleUpdate);

    // Periodic cloud refresh every 15 seconds to keep all devices globally in sync
    const pollInterval = setInterval(() => {
      syncServerNodes().then(m => setMembers(m));
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('unc_nodes_updated', handleUpdate);
    };
  }, []);

  return members;
}



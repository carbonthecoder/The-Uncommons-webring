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

export async function syncServerNodes(): Promise<Member[]> {
  try {
    // 1. Try live cloud registry endpoint
    let res = await fetch('/api/get-nodes');
    if (!res.ok) {
      // 2. Fallback to static public/nodes.json
      res = await fetch('/nodes.json');
    }
    if (res.ok) {
      const result = await res.json();
      const data = Array.isArray(result) ? result : (result.nodes || []);
      if (Array.isArray(data)) {
        serverNodesCache = data
          .filter((d: any) => d.verified && d.domain && !d.domain.includes('unclaimed'))
          .map((d: any, i: number) => ({
            id: d.id || `NODE-00${i + 1}`,
            name: d.name || 'Builder',
            handle: d.handle || 'builder',
            domain: d.domain,
            url: d.url || (d.domain.startsWith('http') ? d.domain : `https://${d.domain}`),
            field: d.field || 'Sovereign Systems & Web',
            bio: d.bio || 'Verified member of The Uncommons webring.',
            proofOfWork: d.proofOfWork || 'Shipped verified production runtime.',
            proofUrl: d.proofUrl || `https://github.com/${d.handle}`,
            tags: d.tags || ['Verified', 'Systems'],
            joinDate: d.joinDate || '2026-01-01',
            verified: true,
            ringPosition: d.ringPosition || (i + 1),
            status: d.status || 'online',
          }));
        window.dispatchEvent(new Event('unc_nodes_updated'));
      }
    }
  } catch (err) {
    console.warn('syncServerNodes error:', err);
  }
  return getAllMembers();
}

export function getAllMembers(): Member[] {
  const custom = getCustomActiveNodes();
  const map = new Map<string, Member>();
  for (const m of MEMBERS) {
    map.set(m.id, m);
  }
  for (const s of serverNodesCache) {
    map.set(s.id, s);
  }
  for (const c of custom) {
    map.set(c.id, c);
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
    return JSON.parse(raw);
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
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('unc_nodes_updated', handleUpdate);
    };
  }, []);

  return members;
}


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
  }
];

export function getNextMember(currentDomain: string): Member {
  const clean = currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const index = MEMBERS.findIndex(m => m.domain.toLowerCase() === clean);
  if (index === -1) return MEMBERS[0];
  return MEMBERS[(index + 1) % MEMBERS.length];
}

export function getPrevMember(currentDomain: string): Member {
  const clean = currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const index = MEMBERS.findIndex(m => m.domain.toLowerCase() === clean);
  if (index === -1) return MEMBERS[MEMBERS.length - 1];
  return MEMBERS[(index - 1 + MEMBERS.length) % MEMBERS.length];
}

export function getRandomMember(currentDomain?: string): Member {
  const clean = currentDomain ? currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase() : '';
  const filtered = currentDomain ? MEMBERS.filter(m => m.domain.toLowerCase() !== clean) : MEMBERS;
  const pool = filtered.length > 0 ? filtered : MEMBERS;
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
  if (!cleanKey) return { valid: false, targetSlot: '', error: 'Please enter an activation key.' };
  
  // Format matching UNC-NODE-00X-XXXX or UNC-ALPHA-2026 or UNC-KEY-XXXX
  if (cleanKey.startsWith('UNC-NODE-') || cleanKey.startsWith('UNC-ALPHA-') || cleanKey.startsWith('UNC-KEY-')) {
    // Extract slot if specified, e.g. UNC-NODE-002-8F9A -> NODE-002
    const match = cleanKey.match(/NODE-(00[2-8])/);
    const targetSlot = match ? `NODE-${match[1]}` : 'NODE-002';
    return { valid: true, targetSlot };
  }

  return { 
    valid: false, 
    targetSlot: '', 
    error: 'Invalid activation key. Obtain key in Discord #council-review after ratification.' 
  };
}


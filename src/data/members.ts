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

export const GENESIS_TOTAL_SLOTS = 8;
const GENESIS_SLOTS_KEY = 'unc_genesis_slots';
const CUSTOM_NODES_KEY = 'unc_custom_nodes';
const VACATED_SLOTS_KEY = 'unc_vacated_slots';

let allGenesisSlotsCache: Member[] = [];
let ringChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    ringChannel = new BroadcastChannel('unc_ring_sync');
    ringChannel.onmessage = (event) => {
      if (event.data?.type === 'NODES_UPDATED') {
        loadGenesisSlotsFromStorage();
        syncServerNodes(true).then(() => {
          window.dispatchEvent(new Event('unc_nodes_updated'));
        });
        window.dispatchEvent(new Event('unc_nodes_updated'));
      }
    };
  }
} catch {}

function getVacatedSlots(): Set<string> {
  try {
    const raw = localStorage.getItem(VACATED_SLOTS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveVacatedSlots(set: Set<string>) {
  try {
    localStorage.setItem(VACATED_SLOTS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}



function loadGenesisSlotsFromStorage(): Member[] | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(GENESIS_SLOTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      allGenesisSlotsCache = parsed;
      return parsed;
    }
  } catch {}
  return null;
}

export function broadcastRingUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('unc_nodes_updated'));
  }
  if (ringChannel) {
    try {
      ringChannel.postMessage({ type: 'NODES_UPDATED', timestamp: Date.now() });
    } catch {}
  }
}

export function getAllGenesisSlots(): Member[] {
  if (allGenesisSlotsCache.length > 0) {
    return allGenesisSlotsCache.filter((s) => s.verified && !s.domain?.includes('unclaimed') && s.handle !== 'vacant');
  }

  const fromStorage = loadGenesisSlotsFromStorage();
  if (fromStorage && fromStorage.length > 0) {
    const filtered = fromStorage.filter((s) => s.verified && !s.domain?.includes('unclaimed') && s.handle !== 'vacant');
    if (filtered.length > 0) return filtered;
  }

  // Return static verified members only
  return MEMBERS.filter((m) => m.verified);
}

export function saveGenesisSlot(newMember: Member) {
  try {
    const slots = [...getAllGenesisSlots()];
    const idx = slots.findIndex((s) => s.id === newMember.id);
    if (idx !== -1) {
      slots[idx] = { ...newMember };
    } else {
      slots.push({ ...newMember });
    }

    slots.sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
    allGenesisSlotsCache = slots;

    if (typeof window !== 'undefined') {
      localStorage.setItem(GENESIS_SLOTS_KEY, JSON.stringify(slots));

      // Remove from vacated tracking if now active
      const vacated = getVacatedSlots();
      if (vacated.has(newMember.id)) {
        vacated.delete(newMember.id);
        saveVacatedSlots(vacated);
      }

      // Sync to custom nodes storage
      if (newMember.verified && !newMember.domain.includes('unclaimed') && newMember.handle !== 'vacant') {
        saveCustomNode(newMember);
      }
    }

    broadcastRingUpdate();
  } catch (err) {
    console.error('Failed to save genesis slot:', err);
  }
}

export function reorderGenesisSlots(updatedList: Member[]) {
  try {
    const current = [...getAllGenesisSlots()];
    for (const item of updatedList) {
      const idx = current.findIndex((s) => s.id === item.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...item };
      }
    }

    current.sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
    allGenesisSlotsCache = current;

    if (typeof window !== 'undefined') {
      localStorage.setItem(GENESIS_SLOTS_KEY, JSON.stringify(current));

      // Keep custom nodes storage in sync with updated positions
      const existingCustom = getCustomActiveNodes();
      const updatedCustom = existingCustom.map((c) => {
        const found = current.find((s) => s.id === c.id);
        return found ? { ...c, ringPosition: found.ringPosition } : c;
      });
      localStorage.setItem(CUSTOM_NODES_KEY, JSON.stringify(updatedCustom));
    }

    broadcastRingUpdate();
  } catch (err) {
    console.error('Failed to reorder genesis slots:', err);
  }
}

export function vacateCustomNode(slotId: string) {
  try {
    const slotNum = parseInt(slotId.replace(/\D/g, ''), 10) || 1;
    const vacantObj: Member = {
      id: slotId,
      name: 'Awaiting Candidate',
      handle: 'vacant',
      domain: `unclaimed-slot-00${slotNum}.xyz`,
      url: 'https://the-uncommons.vercel.app/apply',
      field: 'Open Genesis Vacancy',
      bio: `Genesis vacancy slot #${slotNum}. Applications open via Kavyon Discord community.`,
      proofOfWork: 'Awaiting candidate build submission.',
      proofUrl: 'https://the-uncommons.vercel.app/apply',
      tags: ['Genesis', 'Vacancy'],
      joinDate: '2026-01-01',
      verified: false,
      ringPosition: slotNum,
      status: 'reviewing',
    };

    const slots = [...getAllGenesisSlots()];
    const idx = slots.findIndex((s) => s.id === slotId);
    if (idx !== -1) {
      slots[idx] = vacantObj;
    } else {
      slots.push(vacantObj);
    }
    slots.sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
    allGenesisSlotsCache = slots;

    if (typeof window !== 'undefined') {
      localStorage.setItem(GENESIS_SLOTS_KEY, JSON.stringify(slots));

      // Remove from custom active nodes
      const existing = getCustomActiveNodes();
      const updated = existing.filter((m) => m.id !== slotId);
      localStorage.setItem(CUSTOM_NODES_KEY, JSON.stringify(updated));

      // Mark as vacated to prevent resurrecting from static fallbacks
      const vacated = getVacatedSlots();
      vacated.add(slotId);
      saveVacatedSlots(vacated);
    }

    broadcastRingUpdate();
  } catch (err) {
    console.error('Failed to vacate slot:', err);
  }
}

export function getAllMembers(): Member[] {
  const slots = getAllGenesisSlots();
  return slots
    .filter((s) => s.verified && s.domain && !s.domain.includes('unclaimed') && s.handle !== 'vacant')
    .sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
}
export function ensureHttps(urlOrDomain?: string, fallback: string = 'https://theuncommons.vercel.app'): string {
  if (!urlOrDomain) return fallback;
  const clean = urlOrDomain.trim();
  if (!clean) return fallback;
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
}

export async function syncServerNodes(bypassCache: boolean = false): Promise<Member[]> {
  try {
    const url = bypassCache ? `/api/get-nodes?refresh=true&t=${Date.now()}` : `/api/get-nodes?t=${Date.now()}`;
    let res = await fetch(url).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch('/nodes.json?t=' + Date.now()).catch(() => null);
    }

    if (res && res.ok) {
      const result = await res.json();
      const data = Array.isArray(result) ? result : (result.nodes || []);
      if (Array.isArray(data) && data.length > 0) {
        const mergedSlots: Member[] = data.map((d: any, i: number) => {
          const slotId = d.id || `NODE-00${i + 1}`;
          const isClaimed = !!d.verified && !d.domain?.includes('unclaimed') && d.handle !== 'vacant';
          const cleanDomain = d.domain ? d.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase() : `unclaimed-slot-00${i + 1}.xyz`;
          const formattedUrl = isClaimed ? ensureHttps(d.url || cleanDomain) : 'https://theuncommons.vercel.app/apply';
          const formattedProofUrl = isClaimed ? ensureHttps(d.proofUrl || `https://github.com/${d.handle || 'builder'}`) : 'https://theuncommons.vercel.app/apply';

          return {
            id: slotId,
            name: d.name || 'Awaiting Candidate',
            handle: d.handle || 'vacant',
            domain: cleanDomain,
            url: formattedUrl,
            field: d.field || 'Open Genesis Vacancy',
            bio: d.bio || 'Genesis slot. Applications open via Discord.',
            proofOfWork: d.proofOfWork || 'Awaiting candidate build submission.',
            proofUrl: formattedProofUrl,
            tags: d.tags || ['Genesis', 'Vacancy'],
            joinDate: d.joinDate || '2026-01-01',
            verified: isClaimed,
            ringPosition: d.ringPosition || (i + 1),
            status: d.status || (isClaimed ? 'online' : 'reviewing'),
          };
        });

        mergedSlots.sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
        allGenesisSlotsCache = mergedSlots;

        if (typeof window !== 'undefined') {
          localStorage.setItem(GENESIS_SLOTS_KEY, JSON.stringify(mergedSlots));
          // Keep custom nodes storage in sync with active verified slots
          const customActive = mergedSlots.filter((s) => s.verified && !s.domain.includes('unclaimed') && s.handle !== 'vacant');
          localStorage.setItem(CUSTOM_NODES_KEY, JSON.stringify(customActive));
        }

        broadcastRingUpdate();
      }
    }
  } catch (err) {
    console.warn('syncServerNodes error:', err);
  }
  return getAllMembers();
}

export function getCustomActiveNodes(): Member[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(CUSTOM_NODES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const sanitized = parsed.filter((m: any) => {
      if (!m || typeof m !== 'object' || !m.id || !m.domain) return false;
      if (/^test_submission/i.test(m.handle) || /^test_builder/i.test(m.name)) return false;
      return true;
    });

    if (sanitized.length !== parsed.length) {
      localStorage.setItem(CUSTOM_NODES_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return [];
  }
}

export function saveCustomNode(newMember: Member) {
  try {
    if (typeof window === 'undefined') return;
    const existing = getCustomActiveNodes();
    const updated = [...existing.filter(m => m.id !== newMember.id), newMember];
    localStorage.setItem(CUSTOM_NODES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function getNextMember(currentDomain: string): Member {
  const members = getAllMembers();
  if (members.length === 0) return MEMBERS[0];
  const clean = currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const index = members.findIndex(m => m.domain.toLowerCase() === clean);
  if (index === -1) return members[0];
  return members[(index + 1) % members.length];
}

export function getPrevMember(currentDomain: string): Member {
  const members = getAllMembers();
  if (members.length === 0) return MEMBERS[MEMBERS.length - 1];
  const clean = currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const index = members.findIndex(m => m.domain.toLowerCase() === clean);
  if (index === -1) return members[members.length - 1];
  return members[(index - 1 + members.length) % members.length];
}

export function getRandomMember(currentDomain?: string): Member {
  const members = getAllMembers();
  if (members.length === 0) return MEMBERS[0];
  const clean = currentDomain ? currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase() : '';
  const filtered = currentDomain ? members.filter(m => m.domain.toLowerCase() !== clean) : members;
  const pool = filtered.length > 0 ? filtered : members;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
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

    const handleFocus = () => {
      syncServerNodes(true).then(m => setMembers(m));
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('unc_nodes_updated', handleUpdate);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const pollInterval = setInterval(() => {
      syncServerNodes().then(m => setMembers(m));
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('unc_nodes_updated', handleUpdate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  return members;
}

export function useGenesisSlots(): Member[] {
  const [slots, setSlots] = useState<Member[]>(() => getAllGenesisSlots());

  useEffect(() => {
    syncServerNodes().then(() => {
      setSlots([...getAllGenesisSlots()]);
    });

    const handleUpdate = () => {
      setSlots([...getAllGenesisSlots()]);
    };

    const handleFocus = () => {
      syncServerNodes(true).then(() => {
        setSlots([...getAllGenesisSlots()]);
      });
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('unc_nodes_updated', handleUpdate);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const pollInterval = setInterval(() => {
      syncServerNodes().then(() => {
        setSlots([...getAllGenesisSlots()]);
      });
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('unc_nodes_updated', handleUpdate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  return slots;
}

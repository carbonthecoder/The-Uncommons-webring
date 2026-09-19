import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MEMBERS, GENESIS_TOTAL_SLOTS, getCustomActiveNodes, saveCustomNode, validateActivationKey } from '../data/members';
import type { Member } from '../data/members';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { sound } from '../utils/audio';
import { dispatchNodeActivationToDiscord, DISCORD_LINKS } from '../utils/discord';
import { 
  Search, 
  ExternalLink, 
  Terminal, 
  ArrowRight, 
  ShieldCheck, 
  Disc, 
  Code, 
  Key, 
  Copy, 
  Check, 
  X, 
  RefreshCw,
  Layers,
} from 'lucide-react';

export const NodesPage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'verified' | 'vacant'>('all');
  const [viewFormat, setViewFormat] = useState<'table' | 'json'>('table');
  const [copiedJson, setCopiedJson] = useState(false);
  const [customNodes, setCustomNodes] = useState<Member[]>(getCustomActiveNodes());

  // Key Activation State
  const [claimingSlot, setClaimingSlot] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyValidatedSlot, setKeyValidatedSlot] = useState<string | null>(null);

  // Activation Setup Form State
  const [actDomain, setActDomain] = useState('');
  const [actName, setActName] = useState('');
  const [actField, setActField] = useState('');
  const [actBio, setActBio] = useState('');
  const [actProof, setActProof] = useState('');
  const [actTags, setActTags] = useState('Systems, Polymath, Rust');
  const [activatedSuccessMember, setActivatedSuccessMember] = useState<Member | null>(null);
  const [copiedSeal, setCopiedSeal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Combine static MEMBERS + dynamic custom nodes
  const activeNodes = useMemo(() => {
    const combined = [...MEMBERS];
    customNodes.forEach(cn => {
      if (!combined.some(m => m.id === cn.id)) {
        combined.push(cn);
      }
    });
    return combined;
  }, [customNodes]);

  // Construct full genesis 8-node registry list
  const fullRegistry = useMemo(() => {
    const list: Array<{ id: string; member?: Member; isVacant: boolean }> = [];
    for (let i = 1; i <= GENESIS_TOTAL_SLOTS; i++) {
      const slotId = `NODE-00${i}`;
      const found = activeNodes.find(m => m.id === slotId || m.ringPosition === i);
      if (found) {
        list.push({ id: slotId, member: found, isVacant: false });
      } else {
        list.push({ id: slotId, isVacant: true });
      }
    }
    return list;
  }, [activeNodes]);

  // Filtered registry based on query and filter mode
  const filteredRegistry = useMemo(() => {
    return fullRegistry.filter(item => {
      // Filter Mode
      if (filterMode === 'verified' && item.isVacant) return false;
      if (filterMode === 'vacant' && !item.isVacant) return false;

      // Search Query
      if (!query.trim()) return true;
      const q = query.toLowerCase();

      if (item.id.toLowerCase().includes(q)) return true;
      if (item.isVacant) {
        return q.includes('vacant') || q.includes('open') || q.includes('claim');
      }

      const m = item.member!;
      return (
        m.name.toLowerCase().includes(q) ||
        m.domain.toLowerCase().includes(q) ||
        m.field.toLowerCase().includes(q) ||
        m.proofOfWork.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [fullRegistry, filterMode, query]);

  // Keyboard Shortcuts: '/' to search, 'S' to surf random, 'Esc' to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        sound.playClick();
        const verifiedOnly = activeNodes.filter(m => m.verified);
        if (verifiedOnly.length > 0) {
          const rand = verifiedOnly[Math.floor(Math.random() * verifiedOnly.length)];
          setSelectedMember(rand);
        }
      }

      if (e.key === 'Escape') {
        setSelectedMember(null);
        setClaimingSlot(null);
        setActivatedSuccessMember(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNodes]);

  // Handle Activation Key Verification
  const handleVerifyKey = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setKeyError('');

    const res = validateActivationKey(keyInput);
    if (!res.valid) {
      setKeyError(res.error || 'Invalid key');
      return;
    }

    setKeyValidatedSlot(res.targetSlot || claimingSlot || 'NODE-002');
  };

  // Handle Submitting Activation Setup Form
  const handleFinalizeActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!actDomain || !actName || !actField) {
      setKeyError('Domain, name, and field are required.');
      return;
    }

    const targetId = keyValidatedSlot || claimingSlot || 'NODE-002';
    const slotNum = parseInt(targetId.replace('NODE-00', ''), 10) || 2;

    const newMember: Member = {
      id: targetId,
      name: actName.trim(),
      handle: actName.toLowerCase().replace(/\s+/g, ''),
      domain: actDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
      url: `https://${actDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`,
      field: actField.trim(),
      bio: actBio.trim() || 'Vetted sovereign builder in The Uncommons.',
      proofOfWork: actProof.trim() || 'Verified build ratified by Council.',
      proofUrl: `https://${actDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`,
      tags: actTags.split(',').map(t => t.trim()).filter(Boolean),
      joinDate: new Date().toISOString().split('T')[0],
      verified: true,
      ringPosition: slotNum,
      status: 'online',
    };

    saveCustomNode(newMember);
    setCustomNodes(getCustomActiveNodes());
    setActivatedSuccessMember(newMember);

    // Dispatch webhook to Discord #council-review
    dispatchNodeActivationToDiscord(targetId, newMember.domain, newMember.name, newMember.field);
  };

  const copyJsonManifest = () => {
    sound.playClick();
    const jsonStr = JSON.stringify(activeNodes, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const verifiedCount = activeNodes.filter(m => m.verified).length;
  const vacantCount = GENESIS_TOTAL_SLOTS - verifiedCount;

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto px-2 sm:px-4">
      {/* 1. Page Header */}
      <div className="border-b border-white/[0.08] pb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>LEDGER // CONSTELLATION NODES</span>
            <span className="text-zinc-600 hidden sm:inline">&bull;</span>
            <span className="text-zinc-400 hidden sm:inline">GENESIS EPOCH MMXXVI</span>
          </div>

          {/* Quick Surfer trigger */}
          <button
            onClick={() => {
              sound.playClick();
              const verifiedOnly = activeNodes.filter(m => m.verified);
              if (verifiedOnly.length > 0) {
                const rand = verifiedOnly[Math.floor(Math.random() * verifiedOnly.length)];
                setSelectedMember(rand);
              }
            }}
            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span>Surf Random Node <kbd className="px-1 py-0.5 text-[10px] bg-zinc-800 border border-white/10 rounded text-zinc-400">S</kbd></span>
          </button>
        </div>

        <div className="space-y-1">
          <h1 className="font-syne text-3xl sm:text-5xl font-bold tracking-tight text-white">
            The Sovereign Ledger
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
            The canonical directory of vetted nodes and genesis vacancies. Every entry operates on a personal domain with verified proof of work. Zero algorithmic feeds, no corporate clout.
          </p>
        </div>

        {/* Telemetry Strip (Single horizontal bar with vertical dividers, zero cards) */}
        <div className="pt-2 flex items-center gap-4 sm:gap-6 overflow-x-auto text-[11px] font-mono text-zinc-400 border-t border-white/[0.06] pb-1">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">CAPACITY:</span>
            <span className="text-white font-semibold">{GENESIS_TOTAL_SLOTS} SLOTS</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">VERIFIED:</span>
            <span className="text-emerald-400 font-semibold">{verifiedCount} ACTIVE</span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">VACANCIES:</span>
            <span className="text-amber-400 font-semibold">{vacantCount} OPEN</span>
          </div>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap hidden sm:flex">
            <span className="text-zinc-500">ADMISSIONS:</span>
            <a href={DISCORD_LINKS.councilReview} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white underline underline-offset-2">
              KAVYON #COUNCIL-REVIEW
            </a>
          </div>
          <span className="text-zinc-700 hidden md:inline">|</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap hidden md:flex">
            <span className="text-zinc-500">LATENCY:</span>
            <span className="text-emerald-400">24ms (TLS 1.3)</span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search domain, builder, field, or slot ID..."
            className="w-full pl-9 pr-12 py-2 bg-zinc-950 border border-white/10 rounded-md text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-mono cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-600 pointer-events-none hidden sm:inline">
              <kbd className="px-1 bg-zinc-900 border border-white/10 rounded">/</kbd>
            </span>
          )}
        </div>

        {/* Filter Tabs + View Format Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filters */}
          <div className="flex items-center p-1 bg-zinc-950 border border-white/10 rounded-md">
            <button
              onClick={() => { sound.playClick(); setFilterMode('all'); }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                filterMode === 'all' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({fullRegistry.length})
            </button>
            <button
              onClick={() => { sound.playClick(); setFilterMode('verified'); }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                filterMode === 'verified' ? 'bg-emerald-400 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Verified ({verifiedCount})
            </button>
            <button
              onClick={() => { sound.playClick(); setFilterMode('vacant'); }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                filterMode === 'vacant' ? 'bg-amber-400 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Vacancies ({vacantCount})
            </button>
          </div>

          {/* View Format Switcher: Table vs JSON */}
          <div className="flex items-center p-1 bg-zinc-950 border border-white/10 rounded-md">
            <button
              onClick={() => { sound.playClick(); setViewFormat('table'); }}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1 cursor-pointer ${
                viewFormat === 'table' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Table Directory View"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ledger</span>
            </button>
            <button
              onClick={() => { sound.playClick(); setViewFormat('json'); }}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1 cursor-pointer ${
                viewFormat === 'json' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Raw JSON Stream API"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Directory Display */}
      {viewFormat === 'json' ? (
        /* RAW JSON STREAM VIEW */
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-zinc-950 border border-white/10 p-3 rounded-lg text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>API ENDPOINT // GET /nodes.json</span>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-500 font-mono">curl https://the-uncommons.vercel.app/nodes.json</span>
            </div>
            <button
              onClick={copyJsonManifest}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied Manifest' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="p-4 bg-zinc-950 border border-white/10 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed selection:bg-emerald-950">
            {JSON.stringify(activeNodes, null, 2)}
          </pre>
        </div>
      ) : (
        /* HIGH-DENSITY LEDGER DIRECTORY (ZERO CARD SLOP) */
        <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-zinc-950/80 shadow-2xl">
          {/* Table Header (Desktop) */}
          <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-3 bg-zinc-900/60 border-b border-white/[0.08] text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            <div className="col-span-2">Slot / ID</div>
            <div className="col-span-3">Sovereign Identity</div>
            <div className="col-span-3">Field of Obsession</div>
            <div className="col-span-2">Network State</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Directory Rows */}
          <div className="divide-y divide-white/[0.06]">
            {filteredRegistry.map((item) => {
              if (!item.isVacant && item.member) {
                const m = item.member;
                return (
                  <div
                    key={m.id}
                    className="p-4 lg:py-3.5 lg:px-4 hover:bg-zinc-900/50 transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-3 items-start lg:items-center text-xs font-mono group"
                  >
                    {/* Slot ID */}
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-300 font-semibold">
                        {m.id}
                      </span>
                      {m.tags.includes('Founder') && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          FOUNDER
                        </span>
                      )}
                    </div>

                    {/* Sovereign Identity */}
                    <div className="col-span-3 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-emerald-300 transition-colors">
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1 truncate"
                        >
                          {m.domain}
                          <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />
                        </a>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-sans">
                        {m.name}
                      </div>
                    </div>

                    {/* Field of Obsession */}
                    <div className="col-span-3 text-zinc-300 line-clamp-2 lg:line-clamp-1 font-sans text-xs">
                      {m.field}
                    </div>

                    {/* Network State */}
                    <div className="col-span-2 flex items-center gap-1.5 text-emerald-400 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span>ONLINE &bull; VERIFIED</span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t border-white/[0.04] lg:border-0">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setSelectedMember(m);
                        }}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                      >
                        Inspect Dossier
                      </button>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-zinc-400 hover:text-white transition-colors"
                        title="Visit Sovereign Site"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              }

              // OPEN GENESIS CANDIDATE SLOT ROW
              return (
                <div
                  key={item.id}
                  className="p-4 lg:py-3.5 lg:px-4 bg-zinc-950/40 hover:bg-zinc-950 transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-3 items-start lg:items-center text-xs font-mono group"
                >
                  {/* Slot ID */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20 text-amber-400 font-semibold">
                      {item.id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-500 border border-white/5">
                      GENESIS
                    </span>
                  </div>

                  {/* Sovereign Identity */}
                  <div className="col-span-3 space-y-0.5">
                    <div className="font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors italic">
                      unclaimed-slot.xyz
                    </div>
                    <div className="text-[11px] text-zinc-500 font-sans">
                      Awaiting Council Review in Kavyon
                    </div>
                  </div>

                  {/* Field of Obsession */}
                  <div className="col-span-3 text-zinc-500 italic text-xs font-sans">
                    Open to polymaths, systems hackers &amp; sovereign creators
                  </div>

                  {/* Network State */}
                  <div className="col-span-2 flex items-center gap-1.5 text-amber-400 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span>VACANT &bull; READY TO CLAIM</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t border-white/[0.04] lg:border-0">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setClaimingSlot(item.id);
                        setKeyInput('');
                        setKeyError('');
                        setKeyValidatedSlot(null);
                      }}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      <span>Claim Slot</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRegistry.length === 0 && (
            <div className="p-12 text-center font-mono text-xs text-zinc-500 space-y-2">
              <div>No nodes or slots matched &quot;{query}&quot;.</div>
              <button
                onClick={() => setQuery('')}
                className="text-emerald-400 underline hover:text-emerald-300 cursor-pointer"
              >
                Reset search query
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Admissions & Ledger Protocol Guide (Editorial, Zero Cards) */}
      <div className="pt-8 border-t border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>RATIFICATION PROTOCOL</span>
            </div>
            <h2 className="font-syne text-xl sm:text-2xl font-bold text-white tracking-tight">
              How Genesis Slots Are Claimed
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/apply"
              onClick={() => sound.playClick()}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <span>Submit Domain Ticket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href={DISCORD_LINKS.councilReview}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono text-xs rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Disc className="w-3.5 h-3.5 text-zinc-400" />
              <span>#council-review</span>
            </a>
          </div>
        </div>

        {/* 3 Simple Protocol Rules (Line dividers, zero cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="border-l border-white/15 pl-4 space-y-1.5">
            <div className="text-xs font-mono text-zinc-500 uppercase">01 // SOVEREIGN DOMAIN</div>
            <div className="text-sm font-semibold text-white font-sans">Host Your Own Infrastructure</div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              You must own and operate a personal site or dev garden. Social media profiles, Substack, Medium, or Notion links are rejected.
            </p>
          </div>

          <div className="border-l border-white/15 pl-4 space-y-1.5">
            <div className="text-xs font-mono text-zinc-500 uppercase">02 // PROOF OF WORK</div>
            <div className="text-sm font-semibold text-white font-sans">Evidence of Obsession</div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Provide a direct link to your proudest build &mdash; a shipped system, custom language compiler, deep research paper, or non-trivial software artifact.
            </p>
          </div>

          <div className="border-l border-white/15 pl-4 space-y-1.5">
            <div className="text-xs font-mono text-zinc-500 uppercase">03 // COUNCIL RATIFICATION</div>
            <div className="text-sm font-semibold text-white font-sans">Activation Key Grant</div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Applications are reviewed in real-time in Kavyon&apos;s <code className="text-zinc-200">#council-review</code>. Upon approval, your Activation Key is issued to claim your slot.
            </p>
          </div>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* MODAL 2: KEY ACTIVATION & NODE CLAIMING FORM */}
      {/* ========================================================================= */}
      {claimingSlot && !activatedSuccessMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setClaimingSlot(null)}
        >
          <div
            className="relative w-full max-w-lg bg-zinc-950 border border-white/20 rounded-2xl p-6 shadow-2xl space-y-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Key className="w-4 h-4" />
                <span>SLOT ACTIVATION // {claimingSlot}</span>
              </div>
              <button
                onClick={() => setClaimingSlot(null)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!keyValidatedSlot ? (
              /* STEP 1: Enter Activation Key */
              <form onSubmit={handleVerifyKey} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-syne text-lg font-bold text-white">
                    Enter Activation Key
                  </h3>
                  <p className="text-xs font-sans text-zinc-400 leading-relaxed">
                    If your domain was ratified in Kavyon&apos;s <code className="text-zinc-200">#council-review</code>, enter your issued Ring Token below to unlock your slot setup.
                  </p>
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="e.g. UNC-NODE-002-8F9A or UNC-ALPHA-2026"
                    className="w-full px-3 py-2.5 bg-black border border-white/10 rounded text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 uppercase"
                  />
                  {keyError && (
                    <div className="text-[11px] font-mono text-rose-400 pt-1">
                      {keyError}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <a
                    href={DISCORD_LINKS.councilReview}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Don&apos;t have a key? Apply on Discord
                  </a>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-mono text-xs font-bold rounded transition-all cursor-pointer shadow"
                  >
                    Verify Key &rarr;
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: Fill Sovereign Node Details */
              <form onSubmit={handleFinalizeActivation} className="space-y-4 text-xs font-mono">
                <div className="space-y-1 pb-2 border-b border-white/[0.06]">
                  <div className="text-[11px] text-emerald-400">KEY RATIFIED // UNLOCKED {keyValidatedSlot}</div>
                  <h3 className="font-syne text-lg font-bold text-white">
                    Publish Node Dossier
                  </h3>
                </div>

                {keyError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-500/30 rounded text-rose-300">
                    {keyError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Sovereign Domain *</label>
                    <input
                      type="text"
                      required
                      value={actDomain}
                      onChange={(e) => setActDomain(e.target.value)}
                      placeholder="yoursite.dev"
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Full Name / Builder Alias *</label>
                    <input
                      type="text"
                      required
                      value={actName}
                      onChange={(e) => setActName(e.target.value)}
                      placeholder="e.g. Alex (polymath)"
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Field of Obsession *</label>
                    <input
                      type="text"
                      required
                      value={actField}
                      onChange={(e) => setActField(e.target.value)}
                      placeholder="e.g. Autonomous Agents & Local AI"
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Proof of Work Link / GitHub</label>
                    <input
                      type="text"
                      value={actProof}
                      onChange={(e) => setActProof(e.target.value)}
                      placeholder="https://github.com/yourname/your-project"
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Bio Statement</label>
                    <textarea
                      rows={2}
                      value={actBio}
                      onChange={(e) => setActBio(e.target.value)}
                      placeholder="Obsessive builder upskilling daily..."
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white focus:outline-none focus:border-white/30 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Stack Tags (comma separated)</label>
                    <input
                      type="text"
                      value={actTags}
                      onChange={(e) => setActTags(e.target.value)}
                      placeholder="Systems, Polymath, Rust"
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setKeyValidatedSlot(null)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    &larr; Back
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold rounded transition-all cursor-pointer shadow"
                  >
                    Activate {keyValidatedSlot} &rarr;
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ACTIVATION SUCCESS & EMBED CODE ISSUANCE */}
      {/* ========================================================================= */}
      {activatedSuccessMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActivatedSuccessMember(null)}
        >
          <div
            className="relative w-full max-w-lg bg-zinc-950 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Check className="w-4 h-4" />
                <span>SLOT {activatedSuccessMember.id} ACTIVATED LIVE</span>
              </div>
              <button
                onClick={() => setActivatedSuccessMember(null)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-syne text-xl font-bold text-white">
                Welcome to The Uncommons
              </h3>
              <p className="text-xs font-sans text-zinc-400">
                Your domain <code className="text-emerald-300 font-mono">{activatedSuccessMember.domain}</code> is now live on the sovereign registry!
              </p>
            </div>

            {/* Generated Seal Code */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>YOUR WEBRING SEAL EMBED SCRIPT:</span>
                <button
                  onClick={() => {
                    sound.playClick();
                    const code = `<script src="https://the-uncommons.vercel.app/seal.js" data-node="${activatedSuccessMember.id}"></script>`;
                    navigator.clipboard.writeText(code);
                    setCopiedSeal(true);
                    setTimeout(() => setCopiedSeal(false), 2000);
                  }}
                  className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedSeal ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSeal ? 'Copied Seal' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="p-3 bg-black border border-white/10 rounded text-xs font-mono text-emerald-300 overflow-x-auto">
                {`<script src="https://the-uncommons.vercel.app/seal.js" data-node="${activatedSuccessMember.id}"></script>`}
              </pre>
            </div>

            {/* GitHub Auto PR link */}
            <div className="p-3 bg-zinc-900 border border-white/10 rounded-lg text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-semibold">Automatic Repo Sync</span>
                <a
                  href="https://github.com/carbonthecoder/The-Uncommons-webring/edit/main/src/data/members.ts"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Create GitHub PR</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Your node is active locally on this browser and broadcasted to Discord. To lock it permanently into the GitHub repo, submit your member JSON to Ibrahim (Carbon).
              </p>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setActivatedSuccessMember(null)}
                className="w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Dossier Modal */}
      <MemberDossierModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onNavigate={(newMember) => setSelectedMember(newMember)}
      />
    </div>
  );
};

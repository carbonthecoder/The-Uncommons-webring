import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GENESIS_TOTAL_SLOTS, useLiveMembers, useGenesisSlots } from '../data/members';
import type { Member } from '../data/members';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { sound } from '../utils/audio';
import { DISCORD_LINKS } from '../utils/discord';
import { 
  Search, 
  ExternalLink, 
  Terminal, 
  ArrowRight, 
  ShieldCheck, 
  Disc, 
  Code, 
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

  const liveMembers = useLiveMembers();
  const genesisSlots = useGenesisSlots();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Construct full genesis 8-node registry list ordered by ringPosition
  const fullRegistry = useMemo(() => {
    return [...genesisSlots].sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1)).map(slot => {
      const isClaimed = !!(slot.verified && slot.domain && !slot.domain.includes('unclaimed') && slot.handle !== 'vacant');
      return {
        id: slot.id,
        member: isClaimed ? slot : undefined,
        isVacant: !isClaimed,
      };
    });
  }, [genesisSlots]);

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
        return q.includes('vacant') || q.includes('open') || q.includes('claim') || q.includes('genesis');
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
        const verifiedOnly = liveMembers.filter(m => m.verified);
        if (verifiedOnly.length > 0) {
          const rand = verifiedOnly[Math.floor(Math.random() * verifiedOnly.length)];
          setSelectedMember(rand);
        }
      }

      if (e.key === 'Escape') {
        setSelectedMember(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [liveMembers]);

  const copyJsonManifest = () => {
    sound.playClick();
    const dataToExport = filterMode === 'verified' ? liveMembers : genesisSlots;
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const verifiedCount = fullRegistry.filter(item => !item.isVacant).length;
  const vacantCount = fullRegistry.filter(item => item.isVacant).length;

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
              const verifiedOnly = liveMembers.filter(m => m.verified);
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
            The canonical directory of vetted nodes and genesis vacancies. Every verified entry operates on an autonomous personal domain with shipped proof of work.
          </p>
        </div>

        {/* Telemetry Strip */}
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

          {/* View Format Switcher */}
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
            {JSON.stringify(filterMode === 'verified' ? liveMembers : genesisSlots, null, 2)}
          </pre>
        </div>
      ) : (
        /* CANONICAL CARD GRID DIRECTORY */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredRegistry.map((item) => {
              if (!item.isVacant && item.member) {
                const m = item.member;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedMember(m);
                    }}
                    className="group relative bg-[#09090b] border border-white/10 hover:border-emerald-500/40 rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-0.5 select-none overflow-hidden"
                  >
                    {/* Top Row: Slot ID & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-white font-mono text-xs font-bold">
                          {m.id}
                        </span>
                        {m.tags.includes('Founder') && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            FOUNDER
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span>ONLINE &bull; VERIFIED</span>
                      </div>
                    </div>

                    {/* Builder Profile Info */}
                    <div className="space-y-1.5">
                      <h3 className="font-syne text-lg font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                        <span>{m.name}</span>
                      </h3>
                      
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
                      >
                        <span>{m.domain}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>

                      <p className="text-xs text-zinc-400 font-sans line-clamp-2 leading-relaxed pt-1">
                        {m.field}
                      </p>
                    </div>

                    {/* Stack Tags */}
                    {m.tags && m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-400 font-mono text-[10px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Row: Actions */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          setSelectedMember(m);
                        }}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-md text-zinc-200 hover:text-white transition-colors cursor-pointer text-xs font-medium flex items-center gap-1.5"
                      >
                        <span>Inspect Dossier</span>
                        <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        title="Visit Sovereign Site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              }

              // VACANT SLOT CARD
              return (
                <div
                  key={item.id}
                  className="relative bg-[#09090b]/60 border border-white/10 hover:border-amber-500/30 rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 shadow-md select-none overflow-hidden"
                >
                  {/* Top Row: Slot ID & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                        {item.id}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-500 border border-white/5">
                        GENESIS
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                      <span>VACANT &bull; OPEN TO APPLY</span>
                    </div>
                  </div>

                  {/* Vacant Info */}
                  <div className="space-y-1.5">
                    <h3 className="font-mono text-sm font-semibold text-zinc-400 italic">
                      unclaimed-slot.xyz
                    </h3>
                    <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                      Open to polymaths, systems hackers &amp; sovereign creators. Applications reviewed in Kavyon Discord.
                    </p>
                  </div>

                  {/* Bottom Row: Apply Button */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs">
                    <Link
                      to="/apply"
                      onClick={() => sound.playClick()}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-md text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <span>Apply for Slot</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRegistry.length === 0 && (
            <div className="p-12 bg-zinc-950 border border-white/10 rounded-xl text-center font-mono text-xs text-zinc-500 space-y-2">
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

      {/* 4. Admissions Protocol Guide */}
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

        {/* 3 Simple Protocol Rules */}
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
            <div className="text-sm font-semibold text-white font-sans">Verified on Discord</div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Applications are reviewed in real-time in Kavyon&apos;s <code className="text-zinc-200">#council-review</code>. Upon approval by founders and mods, your Ring Key is issued.
            </p>
          </div>
        </div>
      </div>

      {/* Member Dossier Modal */}
      <MemberDossierModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onNavigate={(newMember) => setSelectedMember(newMember)}
      />
    </div>
  );
};

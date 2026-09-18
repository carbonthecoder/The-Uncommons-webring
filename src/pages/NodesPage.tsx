import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MEMBERS } from '../data/members';
import type { Member } from '../data/members';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { sound } from '../utils/audio';
import { Search, ExternalLink, Terminal, ArrowRight } from 'lucide-react';

export const NodesPage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const tags = ['All', 'Systems', 'Cryptography', 'AI Research', 'Math', 'Hardware'];

  const filtered = useMemo(() => {
    return MEMBERS.filter((m) => {
      const matchesSearch =
        query === '' ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.domain.toLowerCase().includes(query.toLowerCase()) ||
        m.field.toLowerCase().includes(query.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));

      const matchesTag =
        selectedTag === 'All' ||
        m.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase())) ||
        m.field.toLowerCase().includes(selectedTag.toLowerCase());

      return matchesSearch && matchesTag;
    });
  }, [query, selectedTag]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1.5">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>REGISTRY // {MEMBERS.length} VETTED SOVEREIGN NODES</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
          Vetted Nodes
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-sans max-w-xl leading-relaxed">
          The closed constellation of independent thinkers. Each node operates a personal domain with verified proof of work.
        </p>
      </div>

      {/* Minimal Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search domain, builder, or field..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-white/10 rounded-md text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Minimal Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => {
                sound.playClick();
                setSelectedTag(t);
              }}
              className={`px-3 py-1 text-xs font-mono rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === t
                  ? 'bg-zinc-100 text-zinc-950 font-medium'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Redesigned Minimal Node Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((member) => (
          <div
            key={member.id}
            onClick={() => {
              sound.playClick();
              setSelectedMember(member);
            }}
            className="group p-4 bg-zinc-950 hover:bg-zinc-900 border border-white/[0.08] hover:border-white/20 rounded-lg transition-all cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div>
              {/* Top Row: Node ID + Status */}
              <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-white/5">
                  {member.id}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>

              {/* Domain & Author */}
              <div className="font-mono text-sm font-semibold text-white group-hover:text-zinc-100 truncate">
                {member.domain}
              </div>
              <div className="text-xs text-zinc-400 font-sans mt-0.5">
                {member.name}
              </div>

              {/* Field of Obsession */}
              <div className="text-[11px] font-mono text-zinc-400 mt-2 line-clamp-1">
                {member.field}
              </div>
            </div>

            {/* Bottom Proof Preview */}
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span className="truncate max-w-[180px] text-zinc-400">
                {member.proofOfWork}
              </span>
              <span className="text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors shrink-0 ml-2">
                Inspect <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}

        {/* Open Genesis Candidate Slot Card */}
        <Link
          to="/apply"
          onClick={() => sound.playClick()}
          className="group p-4 bg-zinc-950/60 hover:bg-zinc-950 border border-dashed border-emerald-500/30 hover:border-emerald-500/60 rounded-lg transition-all cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono mb-2">
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                NODE-002
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SLOT OPEN
              </span>
            </div>

            <div className="font-mono text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
              claim-slot-002.xyz
            </div>
            <div className="text-xs text-zinc-400 font-sans mt-0.5">
              Awaiting Council Review
            </div>

            <div className="text-[11px] font-mono text-zinc-400 mt-2 line-clamp-2">
              Have a personal domain and a proud build? Submit your domain to claim Node #002.
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-emerald-400">
            <span>Apply in #council-review</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>

      {filtered.length === 0 && (
        <div className="p-12 border border-dashed border-white/10 rounded-lg text-center font-mono text-xs text-zinc-500">
          No nodes matched &quot;{query}&quot;.
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

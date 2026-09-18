import React, { useState, useMemo } from 'react';
import type { Member } from '../data/members';
import { sound } from '../utils/audio';
import { Search, ExternalLink, ShieldCheck, Cpu, Terminal, Filter } from 'lucide-react';

interface DossierDirectoryProps {
  members: Member[];
  onSelectMember: (member: Member) => void;
}

export const DossierDirectory: React.FC<DossierDirectoryProps> = ({
  members,
  onSelectMember,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Systems', 'Cryptography', 'AI Research', 'Math', 'Hardware'];

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        query === '' ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.domain.toLowerCase().includes(query.toLowerCase()) ||
        m.field.toLowerCase().includes(query.toLowerCase()) ||
        m.proofOfWork.toLowerCase().includes(query.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));

      const matchesCat =
        selectedCategory === 'All' ||
        m.tags.some((t) => t.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        m.field.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [members, query, selectedCategory]);

  return (
    <div className="w-full space-y-6">
      {/* Directory Title & Manifesto */}
      <div className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>REGISTRY ARCHIVE // VETTED RESEARCH DOMAINS</span>
        </div>
        <h1 className="text-3xl font-mono font-bold text-white tracking-tight">
          Vetted Member Dossiers
        </h1>
        <p className="mt-2 text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
          The sovereign nodes comprising The Uncommons ring. Every member has demonstrated verifiable, rare proof-of-work and passed direct conversational vetting with the council.
        </p>
      </div>

      {/* Search & Category Filter Controls (Vercel style) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search domain, obsession, proof, or tag..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-white/10 rounded-lg text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-white"
            >
              ESC
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-zinc-500 hidden sm:block mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-zinc-100 text-zinc-950 font-medium shadow-sm'
                  : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Dossier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            onClick={() => {
              sound.playClick();
              onSelectMember(member);
            }}
            className="group relative bg-zinc-950 hover:bg-zinc-900/60 border border-white/[0.08] hover:border-white/20 rounded-xl p-5 transition-all duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Card top bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400">
                  {member.id}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  VETTED
                </span>
              </div>

              {/* Title & Domain */}
              <h3 className="font-mono text-base font-bold text-white group-hover:text-zinc-100 transition-colors">
                {member.domain}
              </h3>
              <div className="text-xs text-zinc-400 font-sans mt-0.5">
                {member.name}
              </div>

              {/* Field */}
              <div className="mt-3 flex items-start gap-1.5 text-xs font-mono text-zinc-300">
                <Cpu className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{member.field}</span>
              </div>

              {/* Proof summary */}
              <p className="mt-2.5 text-xs text-zinc-400 font-sans line-clamp-2 leading-relaxed bg-black/40 p-2.5 rounded border border-white/5">
                {member.proofOfWork}
              </p>
            </div>

            {/* Card footer */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <div className="flex items-center gap-1.5 overflow-hidden">
                {member.tags.slice(0, 2).map((t) => (
                  <span key={t} className="text-zinc-400">
                    #{t}
                  </span>
                ))}
              </div>
              <span className="text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors">
                Inspect <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-zinc-950/40 font-mono text-zinc-500 text-xs">
          No nodes matched query &quot;{query}&quot;. Search by domain, theorem, or tag.
        </div>
      )}
    </div>
  );
};

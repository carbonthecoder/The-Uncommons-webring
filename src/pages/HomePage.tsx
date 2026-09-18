import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MEMBERS } from '../data/members';
import type { Member } from '../data/members';
import { ConstellationCanvas } from '../components/ConstellationCanvas';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { sound } from '../utils/audio';
import { ArrowRight, Disc, Globe, Cpu, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  return (
    <div className="space-y-12">
      {/* Minimal Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-5 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>THE UNCOMMONS // SOVEREIGN WEBRING</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-zinc-400">{MEMBERS.length} VETTED NODES</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-mono font-bold tracking-tight text-white leading-tight">
          A sovereign webring for rare intellects.
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-xl mx-auto leading-relaxed">
          The internet lost its depth to algorithmic feeds. The Uncommons connects exceptional builders, polymaths, and independent researchers across sovereign personal domains.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
          <Link
            to="/members"
            onClick={() => sound.playClick()}
            className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow-md flex items-center gap-2"
          >
            <span>Explore Members ({MEMBERS.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/apply"
            onClick={() => sound.playClick()}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-mono text-xs font-medium rounded-md transition-all flex items-center gap-2"
          >
            <Disc className="w-3.5 h-3.5 text-zinc-400" />
            <span>Apply via Discord</span>
          </Link>

          <Link
            to="/seal"
            onClick={() => sound.playClick()}
            className="px-4 py-2.5 text-zinc-400 hover:text-white font-mono text-xs transition-colors"
          >
            <span>The Member Seal &rarr;</span>
          </Link>
        </div>
      </section>

      {/* The Visual Constellation Ring */}
      <section className="space-y-2">
        <ConstellationCanvas
          members={MEMBERS}
          onSelectMember={setSelectedMember}
        />
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
          <span>Click any node to inspect their proof of work</span>
          <Link to="/members" className="hover:text-zinc-300 transition-colors">
            View full directory &rarr;
          </Link>
        </div>
      </section>

      {/* 3 Ultra-Clean Tenets (Fast to scan) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold">
            <Globe className="w-4 h-4 text-zinc-400" />
            <span>1. Sovereign Domains</span>
          </div>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Only personal websites, blogs, and digital gardens. We reject social media handles as primary nodes.
          </p>
        </div>

        <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold">
            <Cpu className="w-4 h-4 text-zinc-400" />
            <span>2. Proof of Work</span>
          </div>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            No corporate resumes. We require evidence of extreme intellectual obsession—custom code, theorems, or writing.
          </p>
        </div>

        <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>3. Discord Dialogue</span>
          </div>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            No automated gatekeeping. You talk directly with the founders on Discord to ensure mutual resonance.
          </p>
        </div>
      </section>

      {/* Member Dossier Modal */}
      <MemberDossierModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onNavigate={(newMember) => setSelectedMember(newMember)}
      />
    </div>
  );
};

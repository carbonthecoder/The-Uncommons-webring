import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MEMBERS } from '../data/members';
import type { Member } from '../data/members';
import { ConstellationCanvas } from '../components/ConstellationCanvas';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { sound } from '../utils/audio';
import { ArrowRight, Disc, Globe, Cpu, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  return (
    <div className="space-y-12 sm:space-y-16 max-w-full overflow-hidden">
      {/* 1. Hero with Combo Tagline */}
      <section className="text-center max-w-3xl mx-auto space-y-5 pt-2 sm:pt-6 px-2">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-[11px] sm:text-xs font-mono text-zinc-300 max-w-full truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">THE UNCOMMONS // CLOSED WEBRING</span>
          <span className="text-zinc-600 hidden sm:inline">&bull;</span>
          <span className="text-zinc-400 hidden sm:inline">{MEMBERS.length} VETTED NODES</span>
        </div>

        {/* Headline with responsive wrapping */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight text-white leading-tight break-words">
          A private constellation of the web&apos;s rarest minds.
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-zinc-400 font-sans max-w-xl mx-auto leading-relaxed break-words px-2">
          A closed webring for the 1% who still build sovereign real estate. Obsessive craft. Zero algorithms.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 pt-2 flex-wrap">
          <Link
            to="/nodes"
            onClick={() => sound.playClick()}
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Nodes ({MEMBERS.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/apply"
            onClick={() => sound.playClick()}
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-mono text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Disc className="w-3.5 h-3.5 text-zinc-400" />
            <span>Apply via Discord</span>
          </Link>

          <Link
            to="/manifesto"
            onClick={() => sound.playClick()}
            className="w-full sm:w-auto px-4 py-2 text-zinc-400 hover:text-white font-mono text-xs transition-colors flex items-center justify-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read The Manifesto &rarr;</span>
          </Link>
        </div>
      </section>

      {/* 2. Who Belongs Here? (Archetypes Box) */}
      <section className="max-w-3xl mx-auto px-2">
        <div className="p-5 sm:p-6 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold uppercase tracking-wider text-zinc-300">
              Who Belongs Here?
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed break-words">
            Built for systems hackers, category theorists, zero-knowledge cryptographers, esoteric compiler designers, and independent researchers. If you are possessed by a problem that 99% of people misunderstand, you are home.
          </p>
        </div>
      </section>

      {/* 3. The Visual Constellation Ring */}
      <section className="space-y-2 px-1">
        <ConstellationCanvas
          members={MEMBERS}
          onSelectMember={setSelectedMember}
        />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] font-mono text-zinc-500 px-1 text-center sm:text-left">
          <span>Click any node to view proof &bull; Use [ and ] to surf</span>
          <Link to="/nodes" className="hover:text-zinc-300 transition-colors">
            View full node registry ({MEMBERS.length}) &rarr;
          </Link>
        </div>
      </section>

      {/* 4. The 3 Inviolable Rules */}
      <section className="space-y-4 px-1">
        <div className="text-center sm:text-left space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            CANONICAL CODE
          </span>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
            The Three Inviolable Rules
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold">
              <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>1. Sovereign Domains Only</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed break-words">
              You must own your own website, blog, or digital garden. We reject rented social media handles as primary nodes.
            </p>
          </div>

          <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold">
              <Cpu className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>2. Proof of Work</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed break-words">
              What did you build when nobody paid you to? We require proof of extreme intellectual depth, not titles or resumes.
            </p>
          </div>

          <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>3. Conversational Review</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed break-words">
              No automated forms. You talk directly with the founders on Discord in <code className="text-zinc-200">#council-review</code> to verify mutual resonance.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Heartfelt Exit Quote */}
      <section className="p-6 sm:p-8 bg-zinc-950/80 border border-white/10 rounded-2xl text-center space-y-2 max-w-2xl mx-auto">
        <p className="font-mono text-sm sm:text-base text-zinc-200 italic leading-relaxed break-words">
          &ldquo;The web didn&apos;t lose its genius. It just retreated to personal domains.&rdquo;
        </p>
        <div className="text-[11px] font-mono text-zinc-500">
          The Uncommons Webring Guild &bull; Est. MMXXVI
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

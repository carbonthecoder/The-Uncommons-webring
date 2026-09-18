import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MEMBERS } from '../data/members';
import type { Member } from '../data/members';
import { ConstellationCanvas } from '../components/ConstellationCanvas';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { sound } from '../utils/audio';
import { ArrowRight, Disc, BookOpen, Sparkles, ExternalLink } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  return (
    <div className="space-y-16 sm:space-y-20 max-w-4xl mx-auto px-2 sm:px-4">
      {/* 1. Hero Section */}
      <section className="text-center space-y-5 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-[11px] sm:text-xs font-mono text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>THE UNCOMMONS // CLOSED WEBRING</span>
          <span className="text-zinc-600 hidden sm:inline">&bull;</span>
          <span className="text-zinc-400 hidden sm:inline">{MEMBERS.length} VETTED NODES</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight text-white leading-tight break-words">
          A private constellation of the web&apos;s rarest minds.
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-zinc-400 font-sans max-w-2xl mx-auto leading-relaxed break-words">
          The Uncommons is an invite-only webring connecting personal sites, dev gardens, and deep research logs into one closed loop. A place for cracked builders and rare thinkers to showcase their most precious, obsessive work and who they actually are &mdash; zero algorithms, no engagement farming, and no corporate slop.
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
            <span>Manifesto &rarr;</span>
          </Link>
        </div>
      </section>

      {/* 2. The 3D Orbital Canvas */}
      <section className="space-y-3">
        <ConstellationCanvas
          members={MEMBERS}
          onSelectMember={setSelectedMember}
        />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] font-mono text-zinc-500 px-1 text-center sm:text-left">
          <span>Drag orbit to rotate &bull; Click any node to view proof &bull; [ and ] to surf</span>
          <Link to="/nodes" className="hover:text-zinc-300 transition-colors">
            View full node registry ({MEMBERS.length}) &rarr;
          </Link>
        </div>
      </section>

      {/* 3. What We're Cooking (Single Pure Sentence, NO CARDS!) */}
      <section className="text-center py-6 border-y border-white/[0.08] space-y-3 px-2">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="uppercase tracking-widest font-semibold">The Mindset</span>
        </div>
        <p className="text-sm sm:text-lg md:text-xl font-mono text-zinc-200 leading-relaxed max-w-3xl mx-auto break-words font-medium">
          &ldquo;We&apos;re young, curious, and upskilling every single day &mdash; leveraging AI, low-level code, and relentless curiosity to build literally anything we set our minds to.&rdquo;
        </p>
        <p className="text-xs sm:text-sm text-zinc-500 font-sans max-w-xl mx-auto">
          No corporate gatekeeping, no cringe tech clout. Just young builders who stay up late obsessed with what they can create next.
        </p>
      </section>

      {/* 4. How The Ring Works (Flowing Typography, NO CARDS!) */}
      <section className="space-y-6 px-2">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            HOW IT WORKS
          </span>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
            Three simple truths.
          </h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed divide-y divide-white/[0.04]">
          <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="font-mono text-xs text-white font-semibold shrink-0 sm:w-44">
              1. You own your spot
            </span>
            <p className="text-zinc-400">
              You host your precious projects, writings, and experiments on a personal site or dev garden you actually own. No social media algorithms controlling your reach.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="font-mono text-xs text-white font-semibold shrink-0 sm:w-44">
              2. You wear the seal
            </span>
            <p className="text-zinc-400">
              You place our quiet, minimal badge in your site footer. When someone clicks <code className="text-zinc-300">Next</code>, it hops them to another cracked peer in the ring.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
            <span className="font-mono text-xs text-white font-semibold shrink-0 sm:w-44">
              3. Real eyes, zero noise
            </span>
            <p className="text-zinc-400">
              Curious visitors who appreciate high-effort work circulate continuously between our sites. Pure human discovery with zero advertising or engagement farming.
            </p>
          </div>
        </div>
      </section>

      {/* 5. How to Join (Direct, Conversational) */}
      <section className="p-6 sm:p-8 bg-zinc-950 border border-white/[0.08] rounded-2xl space-y-4 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-lg font-mono font-bold text-white tracking-tight">
              Think you belong in the ring?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              We don&apos;t do formal resumes or automated rejections. If you have an active personal site and something you&apos;re cooking, hop into our Discord and chat with Ibrahim (Carbon) and the crew. If you have that curious mindset, you get your Ring Key.
            </p>
          </div>

          <a
            href="https://discord.gg"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Disc className="w-4 h-4" />
            <span>Join Discord Queue</span>
            <ExternalLink className="w-3 h-3 text-zinc-600" />
          </a>
        </div>
      </section>

      {/* 6. Exit Quote */}
      <section className="text-center py-4 space-y-1">
        <p className="font-mono text-xs sm:text-sm text-zinc-400 italic">
          &ldquo;The web didn&apos;t lose its genius. It just retreated to personal domains.&rdquo;
        </p>
        <div className="text-[11px] font-mono text-zinc-600">
          The Uncommons &bull; Est. 2026
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

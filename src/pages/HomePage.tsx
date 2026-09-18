import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MEMBERS } from '../data/members';
import type { Member } from '../data/members';
import { ConstellationCanvas } from '../components/ConstellationCanvas';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { sound } from '../utils/audio';
import { ArrowRight, Disc, BookOpen, ExternalLink } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  return (
    <div className="space-y-16 sm:space-y-20 w-full">
      {/* 1. Hero Section (Full width, bold, effortless) */}
      <section className="text-center space-y-6 pt-4 sm:pt-8 max-w-3xl mx-auto px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-[11px] sm:text-xs font-mono text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>THE UNCOMMONS // CLOSED WEBRING</span>
          <span className="text-zinc-600 hidden sm:inline">&bull;</span>
          <span className="text-zinc-400 hidden sm:inline">{MEMBERS.length} VETTED NODES</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08] sm:leading-[1.05] text-balance max-w-4xl mx-auto break-words">
          A private constellation of the web&apos;s rarest minds.
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 font-sans max-w-2xl mx-auto leading-relaxed break-words">
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
          <span>Drag orbit to rotate &bull; Click any node to view proof &bull; Use [ and ] to surf</span>
          <Link to="/nodes" className="hover:text-zinc-300 transition-colors">
            View full node registry ({MEMBERS.length}) &rarr;
          </Link>
        </div>
      </section>

      {/* 3. Three Simple Truths (Clean vertical line alignment) */}
      <section className="space-y-8 pt-4 max-w-3xl mx-auto px-4">
        <div className="space-y-1.5 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
            Three simple truths.
          </h2>
        </div>

        {/* Clean vertical aligned spine */}
        <div className="relative border-l border-white/15 pl-6 sm:pl-8 ml-2 sm:ml-4 space-y-8">
          {/* Truth 1 */}
          <div className="relative group">
            <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3 h-3 rounded-full bg-black border-2 border-white/40 group-hover:border-white transition-colors" />
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                01 // SOVEREIGNTY
              </span>
              <h3 className="text-base sm:text-xl font-display font-bold text-white tracking-tight">
                You own your spot
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed max-w-2xl">
                You host your precious projects, writings, and experiments on a personal site or dev garden you actually own. No social media algorithms controlling your reach.
              </p>
            </div>
          </div>

          {/* Truth 2 */}
          <div className="relative group">
            <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3 h-3 rounded-full bg-black border-2 border-white/40 group-hover:border-white transition-colors" />
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                02 // THE EMBED
              </span>
              <h3 className="text-base sm:text-xl font-display font-bold text-white tracking-tight">
                You wear the seal
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed max-w-2xl">
                You place our quiet, minimal badge in your site footer. When someone clicks <code className="text-zinc-200 px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-xs font-mono">Next</code>, it hops them to another cracked peer in the ring.
              </p>
            </div>
          </div>

          {/* Truth 3 */}
          <div className="relative group">
            <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3 h-3 rounded-full bg-black border-2 border-white/40 group-hover:border-white transition-colors" />
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                03 // HUMAN CIRCULATION
              </span>
              <h3 className="text-base sm:text-xl font-display font-bold text-white tracking-tight">
                Real eyes, zero noise
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed max-w-2xl">
                Curious visitors who appreciate high-effort work circulate continuously between our sites. Pure human discovery with zero advertising or engagement farming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How to Join (Direct, Conversational) */}
      <section className="p-6 sm:p-8 bg-zinc-950 border border-white/[0.08] rounded-2xl space-y-4 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight">
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

      {/* 5. Exit Quote */}
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

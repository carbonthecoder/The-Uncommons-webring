import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGenesisSlots, getNextMember, getPrevMember, getRandomMember } from '../data/members';
import type { Member } from '../data/members';
import { ConstellationCanvas } from '../components/ConstellationCanvas';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { sound } from '../utils/audio';
import { ArrowRight, ArrowLeft, Disc, BookOpen, ExternalLink, Shuffle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeSurfedDomain, setActiveSurfedDomain] = useState<string>('');
  const genesisSlots = useGenesisSlots();

  const verifiedMembers = useMemo(() => {
    return genesisSlots.filter(
      (m) => m.verified && m.domain && !m.domain.includes('unclaimed') && m.handle !== 'vacant'
    );
  }, [genesisSlots]);

  const verifiedCount = verifiedMembers.length;

  const handlePrevNode = () => {
    sound.playClick();
    const target = getPrevMember(activeSurfedDomain || (verifiedMembers[0]?.domain || ''));
    if (target) {
      setActiveSurfedDomain(target.domain);
      setSelectedMember(target);
    }
  };

  const handleNextNode = () => {
    sound.playClick();
    const target = getNextMember(activeSurfedDomain || (verifiedMembers[0]?.domain || ''));
    if (target) {
      setActiveSurfedDomain(target.domain);
      setSelectedMember(target);
    }
  };

  const handleRandomNode = () => {
    sound.playHarmonic();
    const target = getRandomMember(activeSurfedDomain);
    if (target) {
      setActiveSurfedDomain(target.domain);
      setSelectedMember(target);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-20 w-full">
      {/* 1. Hero Section (Full width, bold, effortless) */}
      <section className="text-center space-y-6 pt-4 sm:pt-8 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-[11px] sm:text-xs font-mono text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>THE UNCOMMONS // CLOSED WEBRING</span>
          <span className="text-zinc-600 hidden sm:inline">&bull;</span>
          <span className="text-zinc-400 hidden sm:inline">{verifiedCount === 1 ? '1 VETTED NODE' : `${verifiedCount} VETTED NODES`}</span>
        </div>

        <h1 className="font-syne text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.12] sm:leading-[1.15] text-balance max-w-4xl mx-auto">
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
            <span>Explore Nodes ({verifiedCount})</span>
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

        {/* The Official Webring Seal Component (Interactive Traversal Badge in 1st Section) */}
        <div className="pt-3 flex flex-col items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-4 py-2 bg-zinc-950 border border-white/15 rounded-md text-xs font-mono text-zinc-300 shadow-xl select-none hover:border-white/30 transition-all">
            <button
              onClick={handlePrevNode}
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Navigate to previous node in webring"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="text-zinc-700 select-none">|</span>

            <button
              onClick={() => {
                sound.playHarmonic();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wider hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>[ THE UNCOMMONS ]</span>
            </button>

            <span className="text-zinc-700 select-none">|</span>

            <button
              onClick={handleNextNode}
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Navigate to next node in webring"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <span className="text-zinc-700 select-none">|</span>

            <button
              onClick={handleRandomNode}
              className="flex items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Hop to random sovereign node"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Random</span>
            </button>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 tracking-wider">
            {activeSurfedDomain ? (
              <span className="text-emerald-400">
                ACTIVE HOP: <strong className="text-white">{activeSurfedDomain}</strong> &bull; CLICK ANY ACTION TO TRAVERSE
              </span>
            ) : (
              <span>OFFICIAL EMBED SEAL &bull; LIVE RING TRAVERSAL ENGINE</span>
            )}
          </div>
        </div>
      </section>

      {/* 2. The 3D Orbital Canvas */}
      <section className="space-y-3">
        <ConstellationCanvas
          members={genesisSlots}
          onSelectMember={setSelectedMember}
        />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] font-mono text-zinc-500 px-1 text-center sm:text-left">
          <span>Drag orbit to rotate &bull; Click any node to view proof &bull; Use [ and ] to surf</span>
          <Link to="/nodes" className="hover:text-zinc-300 transition-colors">
            View full node registry ({verifiedCount}) &rarr;
          </Link>
        </div>
      </section>

      {/* 3. Three Simple Truths (Full-width 3-column layout, zero empty left space, zero cards) */}
      <section className="space-y-8 pt-6 max-w-5xl mx-auto px-4">
        <div className="space-y-1.5 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Three simple truths.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {/* Truth 1 */}
          <div className="space-y-2 border-l border-white/15 pl-4 sm:pl-5">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
              01 // SOVEREIGNTY
            </span>
            <h3 className="text-base sm:text-lg font-display font-semibold text-white tracking-tight">
              You own your spot
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              You host your precious projects, writings, and experiments on a personal site or dev garden you actually own. No social media algorithms controlling your reach.
            </p>
          </div>

          {/* Truth 2 */}
          <div className="space-y-2 border-l border-white/15 pl-4 sm:pl-5">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
              02 // THE EMBED
            </span>
            <h3 className="text-base sm:text-lg font-display font-semibold text-white tracking-tight">
              You wear the seal
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              You place our quiet, minimal badge in your site footer. When someone clicks <code className="text-zinc-200 px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-xs font-mono">Next</code>, it hops them to another cracked peer in the ring.
            </p>
          </div>

          {/* Truth 3 */}
          <div className="space-y-2 border-l border-white/15 pl-4 sm:pl-5">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
              03 // HUMAN DISCOVERY
            </span>
            <h3 className="text-base sm:text-lg font-display font-semibold text-white tracking-tight">
              Real eyes, zero noise
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              Curious visitors who appreciate high-effort work circulate continuously between our sovereign sites. Pure human discovery with zero advertising or engagement farming.
            </p>
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
              We don&apos;t do formal resumes or automated rejections. If you have an active personal site and something you&apos;re cooking, submit your domain or hop into Kavyon&apos;s <code className="text-zinc-200">#council-review</code> to chat with Ibrahim (Carbon) and the crew. If you have that curious mindset, you get your Ring Key.
            </p>
          </div>

          <a
            href="https://discord.gg/3PCeDNebXG"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Disc className="w-4 h-4" />
            <span>Join #council-review</span>
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

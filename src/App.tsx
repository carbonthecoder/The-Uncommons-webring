import { useState, useEffect } from 'react';
import { MEMBERS, getNextMember, getPrevMember, getRandomMember } from './data/members';
import type { Member } from './data/members';
import { Navbar } from './components/Navbar';
import { ConstellationCanvas } from './components/ConstellationCanvas';
import { MemberDossierModal } from './components/MemberDossierModal';
import { DossierDirectory } from './components/DossierDirectory';
import { ManifestoExplanation } from './components/ManifestoExplanation';
import { OfficialSealSection } from './components/OfficialSealSection';
import { ApplicationTerminalSection } from './components/ApplicationTerminalSection';
import { sound } from './utils/audio';
import {
  Disc,
  ExternalLink,
  Radio,
  FileCode2,
  Compass
} from 'lucide-react';

export default function App() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Check URL query parameters for webring routing: ?from=...&action=next|prev|random
  const [routingState, setRoutingState] = useState<{
    isRouting: boolean;
    from: string;
    action: string;
    target: Member | null;
  }>({
    isRouting: false,
    from: '',
    action: '',
    target: null,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const action = params.get('action');

    if (from && action) {
      let target: Member;
      if (action === 'next') target = getNextMember(from);
      else if (action === 'prev') target = getPrevMember(from);
      else target = getRandomMember(from);

      setRoutingState({
        isRouting: true,
        from,
        action,
        target,
      });

      // Subtle redirect interstitial
      const timer = setTimeout(() => {
        window.location.href = target.url;
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, []);

  const scrollTo = (id: string) => {
    sound.playClick();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Interstitial redirect screen when traversing the ring
  if (routingState.isRouting && routingState.target) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 select-none">
        <div className="max-w-md w-full bg-zinc-950 border border-white/20 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="relative w-12 h-12 mx-auto flex items-center justify-center border border-white/20 rounded-full">
            <div className="w-6 h-6 border border-dashed border-zinc-400 rounded-full animate-spin" />
            <div className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
              The Uncommons // Peer Traversal
            </div>
            <h1 className="text-xl font-mono font-bold text-white">
              Navigating Webring...
            </h1>
            <p className="text-xs text-zinc-400 font-sans">
              Routing from <code className="text-zinc-200">{routingState.from}</code> &rarr;
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black border border-white/10 text-left space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
              <span>TARGET NODE RESOLVED</span>
              <span>{routingState.target.id}</span>
            </div>
            <div className="font-mono text-sm font-semibold text-white">
              {routingState.target.domain}
            </div>
            <div className="text-xs text-zinc-400">
              {routingState.target.name} &bull; {routingState.target.field}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <a
              href={routingState.target.url}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-medium rounded-lg shadow transition-all flex items-center gap-1.5"
            >
              <span>Jump Now</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => {
                setRoutingState({ isRouting: false, from: '', action: '', target: null });
                window.history.replaceState({}, '', '/');
              }}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono rounded-lg border border-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Top Navbar */}
      <Navbar nodeCount={MEMBERS.length} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-20">
        {/* 1. Hero Section */}
        <section className="space-y-6 pt-6 sm:pt-12 text-center max-w-3xl mx-auto">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-300 shadow-sm">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>COUNCIL WEBRING</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="text-zinc-400">PRIVATE GUILD FOR THE 1% MINDS</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-mono font-bold tracking-tight text-white leading-tight">
            A sovereign webring for the internet&apos;s rarest intellects.
          </h1>

          {/* Manifesto copy */}
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans max-w-2xl mx-auto">
            The modern web collapsed into algorithmic rage loops and synthetic slop. In response, genuine polymaths and obsessive builders retreated to sovereign personal domains. The Uncommons links these exceptional nodes into a circular constellation of mutual gravity.
          </p>

          {/* Action CTAs */}
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => scrollTo('apply')}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-lg shadow-lg hover:shadow-white/10 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Disc className="w-4 h-4" />
              <span>Apply via Discord Council ↓</span>
            </button>

            <button
              onClick={() => scrollTo('orbit')}
              className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/15 text-zinc-300 hover:text-white font-mono text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-zinc-400" />
              <span>Explore Constellation</span>
            </button>

            <button
              onClick={() => scrollTo('seal-section')}
              className="px-4 py-2.5 bg-black hover:bg-zinc-950 border border-white/10 text-zinc-400 hover:text-zinc-200 font-mono text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Member Seal</span>
            </button>
          </div>

          {/* 4-Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/[0.08]">
            <div className="p-3 bg-zinc-950/60 border border-white/[0.06] rounded-lg text-left">
              <div className="font-mono text-xl font-bold text-white">{MEMBERS.length}</div>
              <div className="text-[11px] font-mono text-zinc-400">Vetted Nodes</div>
            </div>
            <div className="p-3 bg-zinc-950/60 border border-white/[0.06] rounded-lg text-left">
              <div className="font-mono text-xl font-bold text-white">&lt; 3%</div>
              <div className="text-[11px] font-mono text-zinc-400">Acceptance Rate</div>
            </div>
            <div className="p-3 bg-zinc-950/60 border border-white/[0.06] rounded-lg text-left">
              <div className="font-mono text-xl font-bold text-white">100%</div>
              <div className="text-[11px] font-mono text-zinc-400">Sovereign Domains</div>
            </div>
            <div className="p-3 bg-zinc-950/60 border border-white/[0.06] rounded-lg text-left">
              <div className="font-mono text-xl font-bold text-white">0</div>
              <div className="text-[11px] font-mono text-zinc-400">Algorithmic Feeds</div>
            </div>
          </div>
        </section>

        {/* 2. Interactive Constellation Canvas */}
        <section id="orbit" className="space-y-3">
          <ConstellationCanvas
            members={MEMBERS}
            onSelectMember={setSelectedMember}
          />
        </section>

        {/* 3. "What Actually Is The Uncommons?" & Vetting Narrative */}
        <ManifestoExplanation onScrollToApply={() => scrollTo('apply')} />

        {/* 4. Vetted Member Dossiers Directory */}
        <section id="dossiers">
          <DossierDirectory
            members={MEMBERS}
            onSelectMember={setSelectedMember}
          />
        </section>

        {/* 5. The Official Member Seal */}
        <OfficialSealSection />

        {/* 6. The Candidate Application Terminal */}
        <ApplicationTerminalSection />
      </main>

      {/* Member Dossier Modal */}
      <MemberDossierModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onNavigate={(newMember) => setSelectedMember(newMember)}
      />

      {/* Vercel-Style Dark Minimal Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-black py-12 mt-20 text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="text-zinc-200 font-semibold tracking-widest uppercase">
              The Uncommons Webring
            </div>
            <div className="text-zinc-400">
              A private sovereign network for rare intellects &bull; Est. MMXXVI
            </div>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <button
              onClick={() => scrollTo('orbit')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Constellation
            </button>
            <button
              onClick={() => scrollTo('manifesto')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Thesis
            </button>
            <button
              onClick={() => scrollTo('dossiers')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Dossiers
            </button>
            <button
              onClick={() => scrollTo('seal-section')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Member Seal
            </button>
            <button
              onClick={() => scrollTo('apply')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Apply via Discord
            </button>
          </div>

          <div className="flex items-center gap-3 text-zinc-400">
            <a
              href="https://github.com/carbonthecoder/The-Uncommons-webring"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">HASH: 0x9f7a...3c21</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

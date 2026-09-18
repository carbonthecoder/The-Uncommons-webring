import React from 'react';
import { Link } from 'react-router-dom';
import { sound } from '../utils/audio';
import { Terminal, ArrowRight } from 'lucide-react';

export const ManifestoPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-4">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>CANONICAL ESSAY // THE UNCOMMONS</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight">
          The Manifesto
        </h1>
        <p className="text-sm font-mono text-zinc-400">
          On sovereign real estate, obsessive depth, and the resurrection of the webring.
        </p>
      </div>

      {/* Narrative Essay Content */}
      <article className="space-y-8 font-sans text-sm sm:text-base text-zinc-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white tracking-tight">
            I. The Great Enclosure
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            The early internet was an infinite frontier of idiosyncratic personal websites, oddball hypertexts, and handmade research logs. People built sovereign digital homes simply because they were possessed by an obsession.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Over two decades, this creative wilderness was enclosed. Platforms convinced a generation of brilliant minds to trade their sovereign domains for algorithmic feed accounts, where complex thoughts are pulverized into 280-character rage loops and synthetic engagement bait.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white tracking-tight">
            II. The Return to Sovereignty
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            True thinkers do not post for algorithmic distribution. In response to the decay of the modern web, the most serious builders, cryptographers, mathematicians, and systems architects have quietly retreated to their own sovereign real estate: personal websites, digital gardens, and self-hosted logs.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Yet sovereign islands risk becoming isolated. We built <strong className="text-white">The Uncommons</strong> to connect these islands through an ancient, uncorrupted mechanism: the webring.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-mono font-bold text-white tracking-tight">
            III. The Four Axioms
          </h2>
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-zinc-950 border border-white/[0.08] rounded-lg space-y-1">
              <span className="font-mono text-xs text-zinc-500 uppercase">Axiom 1</span>
              <div className="font-mono text-sm font-semibold text-white">Sovereignty Over Rented Land</div>
              <p className="text-xs text-zinc-400 font-sans">
                You must own your domain. No Twitter handles, Substack subdomains, or Notion links as primary nodes.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-white/[0.08] rounded-lg space-y-1">
              <span className="font-mono text-xs text-zinc-500 uppercase">Axiom 2</span>
              <div className="font-mono text-sm font-semibold text-white">Obsession Over Credentials</div>
              <p className="text-xs text-zinc-400 font-sans">
                Degrees and corporate titles are meaningless here. We care only about proof of extreme original craft.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-white/[0.08] rounded-lg space-y-1">
              <span className="font-mono text-xs text-zinc-500 uppercase">Axiom 3</span>
              <div className="font-mono text-sm font-semibold text-white">Conversational Consensus</div>
              <p className="text-xs text-zinc-400 font-sans">
                Admissions are human and conversational. Candidates speak directly with the founders on Discord.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-white/[0.08] rounded-lg space-y-1">
              <span className="font-mono text-xs text-zinc-500 uppercase">Axiom 4</span>
              <div className="font-mono text-sm font-semibold text-white">Mutual Circular Circulation</div>
              <p className="text-xs text-zinc-400 font-sans">
                Every node hosts the quiet official seal in their footer, circulating curious minds across the ring without tracking.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Sign-off */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="font-mono text-xs text-zinc-400">FOUNDED BY</div>
            <div className="font-mono text-sm font-semibold text-white">Ibrahim (Carbon) &amp; The Founding Council</div>
            <div className="text-xs text-zinc-500 font-mono">EST. MMXXVI &bull; VERIFIED PROTOCOL</div>
          </div>

          <Link
            to="/apply"
            onClick={() => sound.playClick()}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow flex items-center gap-1.5"
          >
            <span>Apply to Council</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>
    </div>
  );
};

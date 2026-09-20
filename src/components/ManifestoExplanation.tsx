import React from 'react';
import { sound } from '../utils/audio';
import { ShieldAlert, Cpu, Terminal, Compass, Globe } from 'lucide-react';

interface ManifestoExplanationProps {
  onScrollToApply: () => void;
}

export const ManifestoExplanation: React.FC<ManifestoExplanationProps> = ({ onScrollToApply }) => {
  return (
    <section id="manifesto" className="space-y-8 pt-6">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>CANONICAL THESIS // WHY THE UNCOMMONS EXISTS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
          What is The Uncommons?
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
          A decentralized guild and sovereign webring for idiosyncratic builders, polymaths, and independent researchers. Here is how it works and how members are vetted.
        </p>
      </div>

      {/* 3 Editorial Narrative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="p-6 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white">
              The Sovereign Web
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Algorithmic feeds flattened human thought into 280-character outrage cycles. The rarest minds stopped posting for algorithms and retreated to sovereign personal websites, digital gardens, and self-hosted research logs.
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500">
            TENET I: ZERO SOCIAL RENT
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-6 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white">
              The Resurrected Webring
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              A classic 90s concept resurrected with modern aesthetic craft. Each vetted node embeds our minimal seal. Readers visiting one site can seamlessly traverse to the next rare mind in the ring—creating mutual gravity without algorithms.
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500">
            TENET II: CIRCULAR GRAVITY
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-6 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-base font-semibold text-white">
              Proof over Credentials
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              We discard corporate resumes and titles. We care only about proof of extreme intellectual obsession: custom microkernels, formal mathematical theorems, novel cryptography, hardware silicon, or essays of singular depth.
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500">
            TENET III: UNCOMMON DEPTH
          </div>
        </div>
      </div>

      {/* How To Join / Discord Admissions Process (Visual 3-Step Bar) */}
      <div className="bg-zinc-950 border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div>
            <span className="text-[11px] font-mono text-zinc-500 tracking-wider uppercase block">
              ADMISSIONS PIPELINE
            </span>
            <h3 className="text-lg font-mono font-bold text-white">
              How Vetting &amp; Discord Dialogue Works
            </h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onScrollToApply();
            }}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow cursor-pointer w-fit"
          >
            Start Application ↓
          </button>
        </div>

        {/* 3 Step Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="space-y-2 relative">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-900 border border-white/15 text-xs font-mono font-bold text-white flex items-center justify-center">
                1
              </span>
              <span className="font-mono text-xs font-semibold text-zinc-200">
                Generate Your Dossier
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed pl-8">
              Fill out the terminal below with your personal domain and one link to your proudest Proof of Work. Click to generate your official Discord candidate ticket.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2 relative">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-900 border border-white/15 text-xs font-mono font-bold text-white flex items-center justify-center">
                2
              </span>
              <span className="font-mono text-xs font-semibold text-zinc-200">
                Discord Council Dialogue
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed pl-8">
              Join the Kavyon Discord community to submit your ticket. You will converse directly with the founders in a private ticket. No automated filters—just rare minds discussing ideas.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-2 relative">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-900 border border-white/15 text-xs font-mono font-bold text-white flex items-center justify-center">
                3
              </span>
              <span className="font-mono text-xs font-semibold text-zinc-200">
                Receive Permanent Seal
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed pl-8">
              Upon council consensus, your domain is assigned a permanent Node ID (e.g. <code className="text-zinc-200 bg-zinc-900 px-1 py-0.5 rounded">NODE-013</code>) and added to the official circular routing cycle.
            </p>
          </div>
        </div>

        {/* Council Standard Note */}
        <div className="p-4 bg-black/60 border border-white/[0.06] rounded-lg flex items-start gap-3 text-xs font-sans text-zinc-400">
          <ShieldAlert className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong className="text-zinc-200 font-mono">Admission Standard:</strong> We deliberately cap the ring to high-signal nodes only. If your website is a cookie-cutter portfolio or corporate pitch, we will pass. If you are genuinely obsessed with a rare problem, you will find a home here.
          </p>
        </div>
      </div>
    </section>
  );
};

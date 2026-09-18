import React from 'react';
import { ApplicationTerminalSection } from '../components/ApplicationTerminalSection';
import { Terminal } from 'lucide-react';

export const ApplyPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Fast 20-second summary */}
      <div className="bg-zinc-950 border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>COUNCIL PROTOCOL // HOW ADMISSIONS WORK</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
          How to Join The Uncommons
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
          We don&apos;t use automated resumes or corporate screening. We review your proof of work and speak with you directly on Discord.
        </p>

        {/* 3 Step List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-black/60 border border-white/5 rounded-lg space-y-1.5">
            <div className="text-xs font-mono font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-900 border border-white/20 text-[11px] flex items-center justify-center">1</span>
              <span>Compile Dossier</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Enter your personal site domain and one link to your proudest proof of work.
            </p>
          </div>

          <div className="p-4 bg-black/60 border border-white/5 rounded-lg space-y-1.5">
            <div className="text-xs font-mono font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-900 border border-white/20 text-[11px] flex items-center justify-center">2</span>
              <span>Discord Dialogue</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Join our Discord and drop your compiled ticket in <code className="text-zinc-200">#council-review</code>.
            </p>
          </div>

          <div className="p-4 bg-black/60 border border-white/5 rounded-lg space-y-1.5">
            <div className="text-xs font-mono font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-900 border border-white/20 text-[11px] flex items-center justify-center">3</span>
              <span>Mint Node Key</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Once approved by consensus, you receive your permanent Node ID and ring seal.
            </p>
          </div>
        </div>
      </div>

      {/* The Application Terminal */}
      <ApplicationTerminalSection />
    </div>
  );
};

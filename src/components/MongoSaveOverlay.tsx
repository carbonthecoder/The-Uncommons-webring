import React, { useState, useEffect } from 'react';
import { Database, GitCommit, FileCode, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface MongoSaveOverlayProps {
  isSaving: boolean;
  targetDomain: string;
  slotId: string;
}

export const MongoSaveOverlay: React.FC<MongoSaveOverlayProps> = ({ isSaving, targetDomain, slotId }) => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isSaving) {
      setStep(1);
      setProgress(15);
      return;
    }

    const t1 = setTimeout(() => {
      setStep(2);
      setProgress(45);
    }, 400);

    const t2 = setTimeout(() => {
      setStep(3);
      setProgress(75);
    }, 950);

    const t3 = setTimeout(() => {
      setStep(4);
      setProgress(100);
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isSaving]);

  if (!isSaving) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-md rounded-xl animate-in fade-in duration-200 text-zinc-100 font-sans border border-amber-500/30">
      {/* High-Tech Orbital Ring Animation */}
      <div className="relative w-20 h-20 mb-6 flex items-center justify-center select-none">
        {/* Outer dashed spinning ring */}
        <div className="absolute inset-0 border-2 border-dashed border-zinc-600 rounded-full animate-[spin_8s_linear_infinite]" />
        {/* Inner counter-spinning amber ring */}
        <div className="absolute inset-2 border-2 border-amber-400/80 border-t-transparent rounded-full animate-[spin_3s_linear_infinite_reverse]" />
        {/* Core pulse dot */}
        <div className="relative w-4 h-4 bg-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
        </div>
      </div>

      {/* Title & Target readout */}
      <div className="text-center space-y-1 mb-5">
        <div className="font-mono text-xs font-bold tracking-widest text-amber-400 uppercase flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>PERSISTING TO MONGODB ATLAS &amp; GLOBAL CLOUD</span>
        </div>
        <p className="font-mono text-[11px] text-zinc-400">
          Syncing <span className="text-white font-semibold">{slotId}</span> ({targetDomain || 'builder.domain'}) across cloud registry
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs bg-zinc-900 border border-white/10 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Live Step Checklist */}
      <div className="w-full max-w-sm space-y-2 font-mono text-[11px]">
        <div className={`flex items-center justify-between p-2 rounded border transition-colors ${step >= 1 ? 'bg-zinc-900/80 border-amber-500/40 text-amber-300' : 'bg-zinc-950/40 border-white/5 text-zinc-600'}`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Authenticating 2-Step Sovereign Credentials</span>
          </div>
          {step > 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[9px] animate-pulse text-amber-400">RUNNING</span>}
        </div>

        <div className={`flex items-center justify-between p-2 rounded border transition-colors ${step >= 2 ? 'bg-zinc-900/80 border-amber-500/40 text-amber-300' : 'bg-zinc-950/40 border-white/5 text-zinc-600'}`}>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Writing Document Record to MongoDB Atlas</span>
          </div>
          {step > 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : step === 2 ? <span className="text-[9px] animate-pulse text-amber-400">WRITING...</span> : <span className="text-[9px]">WAITING</span>}
        </div>

        <div className={`flex items-center justify-between p-2 rounded border transition-colors ${step >= 3 ? 'bg-zinc-900/80 border-amber-500/40 text-amber-300' : 'bg-zinc-950/40 border-white/5 text-zinc-600'}`}>
          <div className="flex items-center gap-2">
            <GitCommit className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Direct Committing public/nodes.json to GitHub</span>
          </div>
          {step > 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : step === 3 ? <span className="text-[9px] animate-pulse text-amber-400">COMMITTING...</span> : <span className="text-[9px]">WAITING</span>}
        </div>

        <div className={`flex items-center justify-between p-2 rounded border transition-colors ${step >= 4 ? 'bg-zinc-900/80 border-amber-500/40 text-amber-300' : 'bg-zinc-950/40 border-white/5 text-zinc-600'}`}>
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>4. Broadcasting Embed to Discord Key Ledger</span>
          </div>
          {step >= 4 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[9px]">WAITING</span>}
        </div>
      </div>
    </div>
  );
};

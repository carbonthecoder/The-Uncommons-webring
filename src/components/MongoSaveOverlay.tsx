import React, { useState, useEffect } from 'react';
import { Terminal, Check, ArrowRight } from 'lucide-react';

interface MongoSaveOverlayProps {
  isSaving: boolean;
  targetDomain: string;
  slotId: string;
  onFinished?: () => void;
}

export const MongoSaveOverlay: React.FC<MongoSaveOverlayProps> = ({
  isSaving,
  targetDomain,
  slotId,
  onFinished,
}) => {
  const [step, setStep] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isSaving) {
      setStep(0);
      setIsDone(false);
      return;
    }

    setStep(1);

    const t1 = setTimeout(() => setStep(2), 1500);
    const t2 = setTimeout(() => setStep(3), 3200);
    const t3 = setTimeout(() => setStep(4), 4800);
    const t4 = setTimeout(() => {
      setIsDone(true);
      if (onFinished) onFinished();
    }, 6200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isSaving, onFinished]);

  if (!isSaving) return null;

  const handleGoToNodes = () => {
    window.location.href = '/nodes';
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/98 rounded-xl animate-in fade-in duration-150 text-zinc-300 font-mono select-none">
      <div className="w-full max-w-lg p-6 rounded-lg border border-zinc-800 bg-[#0c0c0e] shadow-2xl space-y-5 text-left">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Terminal className="w-3.5 h-3.5 text-zinc-300" />
            <span>CLUSTERSYNC // {slotId}</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            {isDone ? (
              <span className="text-zinc-200 font-semibold">[READY]</span>
            ) : (
              <span className="animate-pulse">[RUNNING]</span>
            )}
          </div>
        </div>

        {/* Command Line */}
        <div className="text-xs text-zinc-500">
          <span className="text-zinc-400">$</span> mongosh &quot;cluster0.uncommons/nodes&quot; --sync --slot={slotId}
        </div>

        {/* Progress Log Lines */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1">
            <span className={step >= 1 ? 'text-zinc-200' : 'text-zinc-600'}>
              [01/04] Authenticating cryptographic signature
            </span>
            <span className="text-[11px] shrink-0 font-sans">
              {step > 1 ? (
                <span className="text-zinc-300 flex items-center gap-1"><Check className="w-3 h-3" /> OK</span>
              ) : step === 1 ? (
                <span className="text-zinc-500 animate-pulse">...</span>
              ) : (
                <span className="text-zinc-700">WAIT</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className={step >= 2 ? 'text-zinc-200' : 'text-zinc-600'}>
              [02/04] Writing document record to MongoDB Atlas
            </span>
            <span className="text-[11px] shrink-0 font-sans">
              {step > 2 ? (
                <span className="text-zinc-300 flex items-center gap-1"><Check className="w-3 h-3" /> OK</span>
              ) : step === 2 ? (
                <span className="text-zinc-500 animate-pulse">...</span>
              ) : (
                <span className="text-zinc-700">WAIT</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className={step >= 3 ? 'text-zinc-200' : 'text-zinc-600'}>
              [03/04] Committing sha update to origin/main
            </span>
            <span className="text-[11px] shrink-0 font-sans">
              {step > 3 ? (
                <span className="text-zinc-300 flex items-center gap-1"><Check className="w-3 h-3" /> OK</span>
              ) : step === 3 ? (
                <span className="text-zinc-500 animate-pulse">...</span>
              ) : (
                <span className="text-zinc-700">WAIT</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className={step >= 4 ? 'text-zinc-200' : 'text-zinc-600'}>
              [04/04] Synchronizing node state across webring edge
            </span>
            <span className="text-[11px] shrink-0 font-sans">
              {isDone ? (
                <span className="text-zinc-200 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> LIVE</span>
              ) : step === 4 ? (
                <span className="text-zinc-500 animate-pulse">...</span>
              ) : (
                <span className="text-zinc-700">WAIT</span>
              )}
            </span>
          </div>
        </div>

        {/* Minimal Progress Rule */}
        <div className="w-full bg-zinc-900 h-[2px] rounded-full overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500"
            style={{
              width: `${isDone ? 100 : step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 90}%`,
            }}
          />
        </div>

        {/* Target Info & Navigation Action */}
        <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500 border-t border-zinc-850">
          <div>
            TARGET: <span className="text-zinc-300">{targetDomain || slotId}</span>
          </div>
          {isDone && (
            <button
              onClick={handleGoToNodes}
              className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-[11px] font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>View /nodes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

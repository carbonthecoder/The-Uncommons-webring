import React from 'react';
import { SovereignOrbitalLoader } from './SovereignOrbitalLoader';

interface MongoSaveOverlayProps {
  isSaving: boolean;
  targetDomain?: string;
  slotId?: string;
  onFinished?: () => void;
}

export const MongoSaveOverlay: React.FC<MongoSaveOverlayProps> = ({
  isSaving,
  targetDomain,
  slotId,
}) => {
  if (!isSaving) return null;

  const displayTarget = targetDomain
    ? targetDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : slotId || 'Genesis Slot';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/96 backdrop-blur-md rounded-xl select-none">
      <div className="w-full max-w-sm p-6 rounded-lg border border-zinc-800 bg-[#0c0c0e] shadow-2xl flex flex-col items-center text-center space-y-4">
        {/* Orbital Theme Animation */}
        <SovereignOrbitalLoader size={56} />

        {/* Authentic Monospace Status */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="font-semibold tracking-wider uppercase text-zinc-200">
              SYNCHRONIZING REGISTRY
            </span>
            {slotId && (
              <>
                <span className="text-zinc-600">//</span>
                <span className="text-zinc-300 font-semibold">{slotId}</span>
              </>
            )}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 truncate max-w-[260px] mx-auto">
            {displayTarget}
          </div>
        </div>

        {/* Minimalist Shimmer Bar */}
        <div className="w-44 bg-zinc-900 h-[1.5px] rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-zinc-200 to-transparent shimmer-line" />
        </div>

        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Sovereign Edge Node
        </div>
      </div>
    </div>
  );
};

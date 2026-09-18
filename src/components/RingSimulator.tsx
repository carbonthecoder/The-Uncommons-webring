import React, { useState } from 'react';
import { getNextMember, getPrevMember, getRandomMember } from '../data/members';
import type { Member } from '../data/members';
import { sound } from '../utils/audio';
import { ArrowLeft, ArrowRight, Shuffle, ShieldCheck, Terminal } from 'lucide-react';

interface RingSimulatorProps {
  initialMember: Member;
  onSelectMember: (member: Member) => void;
}

export const RingSimulator: React.FC<RingSimulatorProps> = ({
  initialMember,
  onSelectMember,
}) => {
  const [current, setCurrent] = useState<Member>(initialMember);
  const [animating, setAnimating] = useState<boolean>(false);

  const handleHop = (getter: () => Member) => {
    sound.playClick();
    setAnimating(true);
    setTimeout(() => {
      setCurrent(getter());
      setAnimating(false);
    }, 120);
  };

  return (
    <div className="w-full bg-zinc-950 border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="font-mono text-xs text-zinc-300 font-semibold tracking-wider uppercase">
            Live Ring Traversal Simulator
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
          <span>CYCLE: CLOSED 12-NODE LOOP</span>
        </div>
      </div>

      {/* Center Interactive Display */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-black/60 border border-white/[0.06] transition-all duration-150 ${
          animating ? 'opacity-40 scale-[0.99]' : 'opacity-100 scale-100'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-white/10">
              {current.id}
            </span>
            <span className="font-mono text-sm font-semibold text-white">
              {current.domain}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RESOLVED
            </span>
          </div>
          <div className="text-xs text-zinc-400 font-sans">
            {current.name} &mdash; <span className="text-zinc-500">{current.field}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleHop(() => getPrevMember(current.domain))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Navigate to previous webring node"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <button
            onClick={() => handleHop(() => getRandomMember(current.domain))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Jump to a random peer node"
          >
            <Shuffle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Random</span>
          </button>

          <button
            onClick={() => handleHop(() => getNextMember(current.domain))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Navigate to next webring node"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectMember(current);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-medium transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dossier</span>
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span>Current Ring Index: {current.ringPosition} of 12</span>
        <span>Simulating /go?from={current.domain}&amp;action=next</span>
      </div>
    </div>
  );
};

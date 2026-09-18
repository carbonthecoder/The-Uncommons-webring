import React, { useState } from 'react';
import { MEMBERS, getNextMember, getPrevMember, getRandomMember } from '../data/members';
import type { Member } from '../data/members';
import { sound } from '../utils/audio';
import { Terminal, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';

export const RingEngineView: React.FC = () => {
  const [selectedOrigin, setSelectedOrigin] = useState<string>(MEMBERS[0].domain);
  const [action, setAction] = useState<'next' | 'prev' | 'random'>('next');
  const [targetNode, setTargetNode] = useState<Member>(MEMBERS[1]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [latency, setLatency] = useState<number>(0.3);

  const handleHopTest = (overrideAction?: 'next' | 'prev' | 'random') => {
    sound.playClick();
    setIsExecuting(true);
    const chosenAction = overrideAction || action;

    setTimeout(() => {
      let result: Member;
      if (chosenAction === 'next') result = getNextMember(selectedOrigin);
      else if (chosenAction === 'prev') result = getPrevMember(selectedOrigin);
      else result = getRandomMember(selectedOrigin);

      setTargetNode(result);
      setLatency(Math.round((0.2 + Math.random() * 0.4) * 10) / 10);
      setIsExecuting(false);
    }, 150);
  };

  return (
    <div className="w-full space-y-8">
      {/* Title */}
      <div className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>ROUTER PROTOCOL // PEER DISCOVERY SPEC</span>
        </div>
        <h1 className="text-3xl font-mono font-bold text-white tracking-tight">
          Ring Navigation Engine
        </h1>
        <p className="mt-2 text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
          The Uncommons uses a deterministic circular routing engine. Member widgets query the ring router with their origin domain, which dynamically computes the next or previous peer in the cycle.
        </p>
      </div>

      {/* Interactive Simulator Card */}
      <div className="bg-zinc-950 border border-white/[0.08] rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isExecuting ? 'animate-spin' : ''}`} />
            RING ROUTER SIMULATION CONSOLE
          </span>
          <span className="text-[10px] font-mono text-zinc-500">ENDPOINT: /go</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Origin selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
              1. ORIGIN PEER (FROM)
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/30"
            >
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.domain}>
                  {m.id} &mdash; {m.domain}
                </option>
              ))}
            </select>
          </div>

          {/* Action selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
              2. ROUTING ACTION
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  setAction('prev');
                  handleHopTest('prev');
                }}
                className={`px-2 py-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                  action === 'prev'
                    ? 'bg-zinc-800 border-white/30 text-white'
                    : 'bg-black border-white/5 text-zinc-400'
                }`}
              >
                &larr; Prev
              </button>
              <button
                onClick={() => {
                  setAction('next');
                  handleHopTest('next');
                }}
                className={`px-2 py-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                  action === 'next'
                    ? 'bg-zinc-800 border-white/30 text-white'
                    : 'bg-black border-white/5 text-zinc-400'
                }`}
              >
                Next &rarr;
              </button>
              <button
                onClick={() => {
                  setAction('random');
                  handleHopTest('random');
                }}
                className={`px-2 py-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                  action === 'random'
                    ? 'bg-zinc-800 border-white/30 text-white'
                    : 'bg-black border-white/5 text-zinc-400'
                }`}
              >
                Random
              </button>
            </div>
          </div>

          {/* Resolved Target */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
              3. RESOLVED PEER TARGET
            </label>
            <div className="px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-emerald-400 flex items-center justify-between">
              <span className="font-semibold">{targetNode.domain}</span>
              <span className="text-[10px] text-zinc-500">{targetNode.id}</span>
            </div>
          </div>
        </div>

        {/* Live Interstitial Screen Preview */}
        <div className="mt-4 p-5 bg-black rounded-xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>INTERSTITIAL HOP PREVIEW (HTTP 302 / CLIENT TRANSITION)</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              RESOLVED IN {latency}ms
            </span>
          </div>

          <div className="p-4 bg-zinc-950 rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <span>Traversing The Uncommons Ring...</span>
              </div>
              <div className="text-sm font-mono text-white font-semibold">
                Navigating to: {targetNode.domain}
              </div>
              <div className="text-xs text-zinc-500">
                {targetNode.name} &bull; {targetNode.field}
              </div>
            </div>

            <a
              href={targetNode.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-medium rounded-lg transition-transform hover:scale-[1.02]"
            >
              <span>Visit Node</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* HTTP API Specs Table */}
      <div className="bg-zinc-950 border border-white/[0.08] rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          Public HTTP Query Parameters
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400">
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Example</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">from</td>
                <td className="py-2.5 px-3 text-zinc-500">string</td>
                <td className="py-2.5 px-3 text-zinc-400">cipher.sh</td>
                <td className="py-2.5 px-3 text-zinc-400">The member domain making the request</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">action</td>
                <td className="py-2.5 px-3 text-zinc-500">enum</td>
                <td className="py-2.5 px-3 text-zinc-400">next | prev | random</td>
                <td className="py-2.5 px-3 text-zinc-400">Routing destination relative to &apos;from&apos;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

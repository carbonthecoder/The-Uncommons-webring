import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getNextMember, getPrevMember, getRandomMember } from '../data/members';
import type { Member } from '../data/members';
import { ExternalLink } from 'lucide-react';

export const GoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '';
  const action = searchParams.get('action') || 'next';
  const [target, setTarget] = useState<Member | null>(null);

  useEffect(() => {
    let resolved: Member;
    if (action === 'next') resolved = getNextMember(from);
    else if (action === 'prev') resolved = getPrevMember(from);
    else resolved = getRandomMember(from);

    setTarget(resolved);

    // Auto forward after 1.4s
    const timer = setTimeout(() => {
      window.location.href = resolved.url;
    }, 1400);

    return () => clearTimeout(timer);
  }, [from, action]);

  if (!target) return null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-950 border border-white/20 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        <div className="relative w-12 h-12 mx-auto flex items-center justify-center border border-white/20 rounded-full">
          <div className="w-6 h-6 border border-dashed border-zinc-400 rounded-full animate-spin" />
          <div className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
            The Uncommons // Peer Hop
          </div>
          <h1 className="text-xl font-mono font-bold text-white">
            Traversing Webring...
          </h1>
          {from && (
            <p className="text-xs text-zinc-400 font-sans">
              Routing from <code className="text-zinc-200">{from}</code> &rarr;
            </p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-black border border-white/10 text-left space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
            <span>RESOLVED NODE</span>
            <span>{target.id}</span>
          </div>
          <div className="font-mono text-sm font-semibold text-white">
            {target.domain}
          </div>
          <div className="text-xs text-zinc-400">
            {target.name} &bull; {target.field}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <a
            href={target.url}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-semibold rounded-lg shadow transition-all flex items-center gap-1.5"
          >
            <span>Jump Instantly</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            to="/"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono rounded-lg border border-white/10 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

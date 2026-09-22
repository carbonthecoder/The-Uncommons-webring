import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLiveMembers, getNextMember, getPrevMember, getRandomMember } from '../data/members';
import type { Member } from '../data/members';
import { SovereignOrbitalLoader } from '../components/SovereignOrbitalLoader';
import { ExternalLink } from 'lucide-react';

export const GoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '';
  const action = searchParams.get('action') || 'next';
  const liveMembers = useLiveMembers();
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
  }, [from, action, liveMembers]);

  if (!target) return null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-950 border border-white/20 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        <div className="flex items-center justify-center py-2">
          <SovereignOrbitalLoader size={52} />
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
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
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

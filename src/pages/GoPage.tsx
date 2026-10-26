import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { useLiveMembers, getNextMember, getPrevMember, getRandomMember } from '../data/members';
import type { Member } from '../data/members';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';

interface GoPageProps {
  forcedAction?: 'next' | 'prev' | 'rand';
}

export const GoPage: React.FC<GoPageProps> = ({ forcedAction }) => {
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ handle?: string; action?: string }>();
  
  const from = routeParams.handle || searchParams.get('from') || '';
  const action = forcedAction || routeParams.action || searchParams.get('action') || 'next';
  
  const liveMembers = useLiveMembers();
  const [target, setTarget] = useState<Member | null>(null);

  useEffect(() => {
    let resolved: Member;
    if (action === 'next') resolved = getNextMember(from);
    else if (action === 'prev') resolved = getPrevMember(from);
    else resolved = getRandomMember(from);

    setTarget(resolved);

    // Auto forward after 1.2s
    const timer = setTimeout(() => {
      window.location.href = resolved.url;
    }, 1200);

    return () => clearTimeout(timer);
  }, [from, action, liveMembers]);

  if (!target) return null;

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4 animate-in fade-in">
      <div className="max-w-md w-full bg-[#181614] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-xl">
        {/* Subtle spinning amber ring */}
        <div className="flex items-center justify-center py-2">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-[spin_8s_linear_infinite]" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-mono tracking-widest text-[#8c8376] uppercase">
            The Uncommons &bull; Peer Hop
          </div>
          <h1 className="text-xl font-serif text-[#fbf9f5]">
            Routing to Next Domain...
          </h1>
          {from && (
            <p className="text-xs text-[#8c8376] font-mono">
              Leaving <code className="text-amber-400">{from}</code> &rarr;
            </p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[#121110] border border-white/[0.06] text-left space-y-1 font-mono text-xs">
          <div className="text-[10px] text-[#756e63]">DESTINATION DOMAIN</div>
          <div className="text-sm font-semibold text-[#f5f0e8]">{target.domain}</div>
          <div className="text-xs text-[#8c8376]">{target.name}</div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <a
            href={target.url}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-medium rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Jump Instantly</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <Link
            to="/"
            className="px-4 py-2 bg-[#25221e] hover:bg-[#302c27] text-[#c4bcaf] text-xs font-mono rounded-lg border border-white/[0.08] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Ring</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
import React, { useEffect } from 'react';
import type { Member } from '../data/members';
import { getNextMember, getPrevMember, ensureHttps } from '../data/members';
import { sound } from '../utils/audio';
import { ExternalLink, X, ArrowRight, ArrowLeft, ShieldCheck, Terminal, Cpu } from 'lucide-react';

interface MemberDossierModalProps {
  member: Member | null;
  onClose: () => void;
  onNavigate: (member: Member) => void;
}

export const MemberDossierModal: React.FC<MemberDossierModalProps> = ({
  member,
  onClose,
  onNavigate,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (!member) return;
      if (e.key === 'ArrowRight' || e.key === ']') {
        sound.playClick();
        onNavigate(getNextMember(member.domain));
      }
      if (e.key === 'ArrowLeft' || e.key === '[') {
        sound.playClick();
        onNavigate(getPrevMember(member.domain));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [member, onClose, onNavigate]);

  if (!member) return null;

  const prevNode = getPrevMember(member.domain);
  const nextNode = getNextMember(member.domain);
  const targetUrl = ensureHttps(member.url || member.domain);
  const proofUrl = ensureHttps(member.proofUrl || `https://github.com/${member.handle}`);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-[#09090b] border border-white/15 rounded-2xl p-6 sm:p-7 shadow-2xl my-auto space-y-6 text-zinc-100 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Navigation Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-white/10 text-white font-bold tracking-wide">
              {member.id}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>ONLINE &bull; VERIFIED</span>
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Close Dossier (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Builder Identity & Domain Hero */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-syne text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {member.name}
            </h2>
            {member.tags && member.tags.includes('Founder') && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-semibold shrink-0">
                FOUNDER
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
            <a
              href={targetUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm sm:text-base font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 hover:underline underline-offset-4"
            >
              <span>{member.domain}</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400/70" />
            </a>

            <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span>{member.field}</span>
            </div>
          </div>
        </div>

        {/* 3. Main Data Content (Clean Linear Sections) */}
        <div className="space-y-4 pt-1">
          {/* Bio Statement */}
          <div className="p-4 bg-zinc-950/80 border border-white/[0.08] rounded-xl space-y-1.5">
            <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>BIO STATEMENT</span>
            </div>
            <p className="text-zinc-200 font-sans leading-relaxed text-xs sm:text-sm">
              {member.bio}
            </p>
          </div>

          {/* Proof of Work */}
          <div className="p-4 bg-zinc-950/80 border border-white/[0.08] rounded-xl space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SHIPPED PROOF OF WORK</span>
              </div>
              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors hover:underline text-[11px] font-mono"
              >
                <span>Inspect Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="font-mono text-zinc-300 text-xs leading-relaxed">
              {member.proofOfWork}
            </p>
          </div>

          {/* Tech Stack Pills */}
          <div className="space-y-2 pt-1">
            <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              VERIFIED STACK &amp; SPECIALIZATIONS
            </div>
            <div className="flex flex-wrap gap-1.5">
              {member.tags.map(tag => (
                <span 
                  key={tag} 
                  className={`px-2.5 py-1 rounded-md font-mono text-xs font-medium border ${
                    tag === 'Founder' 
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
                      : 'bg-zinc-900 text-zinc-300 border-white/10'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Action Bar & Ring Surfer Navigation */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onNavigate(prevNode);
              }}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-mono rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              title="Previous Node in Ring (Left Arrow / [ )"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Prev Node</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onNavigate(nextNode);
              }}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-mono rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              title="Next Node in Ring (Right Arrow / ] )"
            >
              <span>Next Node</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2 text-xs font-mono rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-bold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <span>Visit {member.domain}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="text-center text-[10px] font-mono text-zinc-600 pt-1">
          Use <kbd className="px-1 bg-zinc-900 border border-white/10 rounded">[</kbd> and <kbd className="px-1 bg-zinc-900 border border-white/10 rounded">]</kbd> or arrow keys to surf ring &bull; Esc to close
        </div>
      </div>
    </div>
  );
};


import React, { useEffect } from 'react';
import type { Member } from '../data/members';
import { getNextMember, getPrevMember } from '../data/members';
import { sound } from '../utils/audio';
import { ExternalLink, X, ShieldCheck, ArrowRight, ArrowLeft, Cpu, Terminal } from 'lucide-react';

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-white/20 rounded-2xl p-5 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="px-2 py-0.5 text-xs font-mono bg-zinc-900 border border-white/10 text-zinc-300 rounded">
              {member.id}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>VETTED NODE</span>
            </div>
            <span className="text-zinc-700 text-xs hidden sm:inline">|</span>
            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
              RING POS: #{member.ringPosition} / 8
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Profile Main */}
        <div className="mt-5 space-y-5">
          <div>
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight break-words">
                {member.name}
              </h2>
              <a
                href={member.url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs sm:text-sm text-zinc-300 hover:text-white flex items-center gap-1 hover:underline underline-offset-4 break-all"
              >
                {member.domain}
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              </a>
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-1 flex items-center gap-1.5 break-words">
              <Cpu className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {member.field}
            </p>

            {/* Sovereign Stack & Telemetry Strip */}
            <div className="flex items-center gap-3 pt-2 text-[11px] font-mono text-zinc-500 border-t border-white/[0.04] flex-wrap">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PING: 24ms
              </span>
              <span>&bull;</span>
              <span>TLS 1.3 / HTTP3</span>
              <span>&bull;</span>
              <span>SOVEREIGN ARCHITECTURE</span>
            </div>
          </div>

          {/* Bio statement */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans break-words">
            {member.bio}
          </div>

          {/* Proof of Work Highlight */}
          <div className="p-4 rounded-xl bg-black border border-white/10 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-mono tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                VERIFIED PROOF OF WORK
              </span>
              <a
                href={member.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Inspect Evidence</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs font-mono text-zinc-200 bg-zinc-950 p-3 rounded border border-white/5 leading-relaxed break-words">
              {member.proofOfWork}
            </p>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {member.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-zinc-900 text-zinc-400 border border-white/[0.06]"
              >
                #{tag}
              </span>
            ))}
            <span className="text-[11px] font-mono text-zinc-600 ml-auto hidden sm:inline">
              Admitted: {member.joinDate}
            </span>
          </div>
        </div>

        {/* Ring Navigation Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={() => {
              sound.playClick();
              onNavigate(prevNode);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <a
            href={member.url}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 text-xs font-mono rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-semibold flex items-center gap-1.5 shadow"
          >
            <span>Visit Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate(nextNode);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Micro shortcut hint */}
        <div className="text-center mt-3 text-[10px] font-mono text-zinc-600 hidden sm:block">
          Tip: Use [ and ] or arrow keys to navigate the ring &bull; Esc to close
        </div>
      </div>
    </div>
  );
};

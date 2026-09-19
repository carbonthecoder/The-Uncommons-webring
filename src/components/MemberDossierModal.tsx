import React, { useEffect } from 'react';
import type { Member } from '../data/members';
import { getNextMember, getPrevMember } from '../data/members';
import { sound } from '../utils/audio';
import { ExternalLink, X, ArrowRight, ArrowLeft } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-black border border-white/15 rounded-xl p-6 sm:p-7 shadow-2xl my-auto space-y-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-white font-semibold">
              {member.id}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              VERIFIED NODE
            </span>
            <span className="text-zinc-600 hidden sm:inline">&bull;</span>
            <span className="text-zinc-400 hidden sm:inline">
              SLOT #{member.ringPosition} / 8
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Identity & Domain (No nested box cards) */}
        <div className="space-y-1.5">
          <a
            href={member.url}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-lg sm:text-xl font-bold text-white hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 hover:underline underline-offset-4"
          >
            <span>{member.domain}</span>
            <ExternalLink className="w-4 h-4 text-zinc-500 shrink-0" />
          </a>
          <div className="text-xs sm:text-sm font-sans text-zinc-400">
            {member.name} &bull; <span className="font-mono text-zinc-300">{member.field}</span>
          </div>
        </div>

        {/* Dossier Data Lines (Pure linear rows, zero cards) */}
        <div className="space-y-4 pt-1 text-xs">
          {/* Bio Statement */}
          <div className="space-y-1">
            <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              STATEMENT &bull; BIO
            </div>
            <p className="text-zinc-300 font-sans leading-relaxed text-sm">
              {member.bio}
            </p>
          </div>

          {/* Proof of Work */}
          <div className="space-y-1 border-t border-white/[0.06] pt-3">
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              <span>VERIFIED PROOF OF WORK</span>
              <a
                href={member.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors hover:underline"
              >
                <span>Inspect Evidence</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="font-mono text-zinc-200 text-xs leading-relaxed pt-0.5">
              {member.proofOfWork}
            </p>
          </div>

          {/* Tags & Metadata */}
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-[11px] text-zinc-400 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-600">TAGS:</span>
              {member.tags.map(tag => (
                <span key={tag} className="text-zinc-300">
                  #{tag}
                </span>
              ))}
            </div>
            <span className="text-zinc-500 text-[10px]">
              ADMITTED: {member.joinDate}
            </span>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onNavigate(prevNode);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Prev Node</span>
          </button>

          <a
            href={member.url}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 text-xs font-mono rounded bg-zinc-100 hover:bg-white text-zinc-950 font-bold flex items-center gap-1.5 shadow"
          >
            <span>Visit {member.domain}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate(nextNode);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>Next Node</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-center text-[10px] font-mono text-zinc-600">
          Use [ and ] or arrow keys to surf ring &bull; Esc to close
        </div>
      </div>
    </div>
  );
};

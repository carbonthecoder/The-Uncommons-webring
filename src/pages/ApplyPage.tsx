import React, { useState } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Disc, Copy, Check, Terminal, ExternalLink, Sparkles } from 'lucide-react';

export const ApplyPage: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [proof, setProof] = useState('');
  const [discord, setDiscord] = useState('');
  const [ticket, setTicket] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playHarmonic();

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

    const formatted = `\`\`\`yaml
=== THE UNCOMMONS // COUNCIL APPLICATION ===
DOMAIN: "https://${cleanDomain}"
PROOF_OF_WORK: "${proof}"
DISCORD: "${discord}"
DATE: "${new Date().toISOString().split('T')[0]}"
============================================
\`\`\``;

    setTicket(formatted);

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#ffffff', '#a1a1aa', '#10b981'],
    });
  };

  const handleCopy = () => {
    if (!ticket) return;
    sound.playClick();
    navigator.clipboard.writeText(ticket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header (Zero Blah Blah) */}
      <div className="border-b border-white/[0.08] pb-5 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 mb-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>COUNCIL ADMISSIONS // CONVERSATIONAL VETTING</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
          Apply to The Uncommons
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-sans max-w-md mx-auto leading-relaxed">
          No corporate resumes. Submit your sovereign domain and one link to your proudest build. We review candidates directly on Discord.
        </p>
      </div>

      {/* 3-Field Quick Form */}
      <div className="bg-zinc-950 border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-5 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
              1. YOUR PERSONAL WEBSITE OR DIGITAL GARDEN *
            </label>
            <input
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. nreed.xyz or garden.name"
              className="w-full px-3.5 py-2 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/40"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
              2. WHAT DO YOU BUILD / OBSESS OVER? (INCLUDE PROOF LINK) *
            </label>
            <textarea
              required
              rows={2}
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="e.g. Formally verified microkernel in Rust: https://github.com/..."
              className="w-full px-3.5 py-2 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/40 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
              3. YOUR DISCORD USERNAME *
            </label>
            <input
              type="text"
              required
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="e.g. @nreed or nreed#0001"
              className="w-full px-3.5 py-2 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/40"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Candidate Ticket</span>
          </button>
        </form>

        {/* Generated Ticket Step */}
        {ticket && (
          <div className="pt-4 border-t border-white/[0.08] space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>YOUR COMPILED TICKET</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-white hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Ticket'}</span>
              </button>
            </div>

            <div className="bg-black p-3.5 rounded-md border border-white/10 font-mono text-[11px] text-zinc-300 overflow-x-auto select-all leading-relaxed">
              <pre>{ticket}</pre>
            </div>

            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold rounded-md transition-all border border-white/15 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Disc className="w-4 h-4" />
              <span>Open Discord &amp; Paste in #council-review</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>

            <p className="text-[11px] font-mono text-center text-zinc-500">
              Founders Ibrahim (Carbon) and the council will chat with you directly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

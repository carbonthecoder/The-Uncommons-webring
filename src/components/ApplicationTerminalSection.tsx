import React, { useState } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Disc, Copy, Check, Terminal, ExternalLink, Sparkles, MessageSquare } from 'lucide-react';

export const ApplicationTerminalSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    domain: '',
    field: '',
    proofUrl: '',
    thesis: '',
    discordHandle: '',
  });

  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playHarmonic();

    const cleanDomain = formData.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

    const ticket = `\`\`\`yaml
=== THE UNCOMMONS // COUNCIL ADMISSION DOSSIER ===
CANDIDATE: "${formData.name} (@${formData.handle || formData.name.toLowerCase()})"
DOMAIN: "https://${cleanDomain}"
FIELD_OF_OBSESSION: "${formData.field}"
PROOF_OF_WORK_URL: "${formData.proofUrl}"
DISCORD: "${formData.discordHandle}"
SUBMISSION_DATE: "${new Date().toISOString().split('T')[0]}"

UNCOMMON_THESIS:
> "${formData.thesis}"
===================================================
\`\`\``;

    setGeneratedTicket(ticket);

    // Subtle celebration particles
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#ffffff', '#a1a1aa', '#52525b', '#10b981'],
    });
  };

  const handleCopy = () => {
    if (!generatedTicket) return;
    sound.playClick();
    navigator.clipboard.writeText(generatedTicket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="apply" className="space-y-6 pt-6">
      <div className="border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>ADMISSIONS GATEWAY // COMPILE YOUR DOSSIER</span>
        </div>
        <h2 className="text-2xl font-mono font-bold text-white tracking-tight">
          Apply for Council Vetting
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
          Compile your Proof-of-Work dossier below. Once compiled, copy your ticket and join the founders on Discord to begin your conversational vetting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-7 bg-zinc-950 border border-white/[0.08] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              1. CANDIDATE DOSSIER BUILDER
            </span>
            <span className="text-[10px] font-mono text-zinc-500">STAGE 1 / 2</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  NAME OR PSEUDONYM *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Nicholas Reed"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-md text-xs font-mono text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  PERSONAL SITE / DIGITAL GARDEN *
                </label>
                <input
                  type="text"
                  required
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="e.g. nreed.xyz or garden.name"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-md text-xs font-mono text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  FIELD OF OBSESSION *
                </label>
                <input
                  type="text"
                  required
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  placeholder="e.g. Formally Verified Microkernels"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-md text-xs font-mono text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  DISCORD HANDLE *
                </label>
                <input
                  type="text"
                  required
                  value={formData.discordHandle}
                  onChange={(e) => setFormData({ ...formData, discordHandle: e.target.value })}
                  placeholder="e.g. nreed or nreed#0001"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-md text-xs font-mono text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                PROOF OF WORK LINK (GITHUB, PAPER, OR ESSAY) *
              </label>
              <input
                type="url"
                required
                value={formData.proofUrl}
                onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                placeholder="https://github.com/... or link to your proudest research"
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-md text-xs font-mono text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                THE UNCOMMON THESIS (WHY IS YOUR WORK RARE?) *
              </label>
              <textarea
                required
                rows={3}
                value={formData.thesis}
                onChange={(e) => setFormData({ ...formData, thesis: e.target.value })}
                placeholder="Briefly state the one problem you are obsessed with that 99% of people misunderstand or ignore..."
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-md text-xs font-mono text-white focus:outline-none focus:border-white/30 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compile Candidate Dossier Ticket</span>
            </button>
          </form>
        </div>

        {/* Discord Action Box */}
        <div className="lg:col-span-5 bg-zinc-950 border border-white/[0.08] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-2">
              <Disc className="w-4 h-4 text-zinc-300" />
              2. DISCORD REVIEW DIALOGUE
            </span>
            <span className="text-[10px] font-mono text-zinc-500">STAGE 2 / 2</span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Admissions are conversational. We do not do automated rejections. Once your dossier is compiled, copy it and join our Discord queue.
          </p>

          {generatedTicket ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>COMPILED TICKET</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-white hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Ticket'}</span>
                </button>
              </div>

              <div className="bg-black p-3.5 rounded-lg border border-white/10 font-mono text-[11px] text-zinc-300 overflow-x-auto select-all max-h-52 leading-relaxed">
                <pre>{generatedTicket}</pre>
              </div>

              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold rounded-md transition-all border border-white/15 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Disc className="w-4 h-4" />
                <span>Join Discord &amp; Paste in #council-review</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>

              <p className="text-[10px] font-mono text-center text-zinc-500">
                You will speak directly with founders Carbon and council members.
              </p>
            </div>
          ) : (
            <div className="p-10 border border-dashed border-white/10 rounded-lg text-center space-y-2">
              <MessageSquare className="w-6 h-6 text-zinc-600 mx-auto" />
              <div className="text-xs font-mono text-zinc-400">
                Ticket Not Yet Compiled
              </div>
              <p className="text-[11px] text-zinc-500 font-sans">
                Fill the fields on the left to compile your Proof-of-Work submission.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

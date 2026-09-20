import React, { useState } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Disc, Copy, Check, Terminal, ShieldAlert, Sparkles, MessageSquare, ExternalLink, Cpu, Compass } from 'lucide-react';

export const CouncilAdmissions: React.FC = () => {
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

    const ticket = `\`\`\`yaml
=== THE UNCOMMONS // COUNCIL ADMISSION DOSSIER ===
CANDIDATE: "${formData.name} (@${formData.handle || formData.name.toLowerCase()})"
DOMAIN: "https://${formData.domain.replace(/^https?:\/\//, '')}"
FIELD_OF_OBSESSION: "${formData.field}"
PROOF_OF_WORK_URL: "${formData.proofUrl}"
DISCORD: "${formData.discordHandle}"
SUBMISSION_DATE: "${new Date().toISOString().split('T')[0]}"

UNCOMMON_THESIS:
> "${formData.thesis}"
===================================================
\`\`\``;

    setGeneratedTicket(ticket);

    // Trigger subtle confetti burst
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#ffffff', '#a1a1aa', '#52525b', '#10b981'],
    });
  };

  const handleCopyTicket = () => {
    if (!generatedTicket) return;
    sound.playClick();
    navigator.clipboard.writeText(generatedTicket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-10">
      {/* Hero Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>COUNCIL PROTOCOL // VETTING &amp; ADMISSIONS FLOW</span>
        </div>
        <h1 className="text-3xl font-mono font-bold text-white tracking-tight">
          Admissions &amp; Discord Council
        </h1>
        <p className="mt-2 text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
          The Uncommons is strictly curated. We do not use automated algorithms or resume scanners. Every candidate presents original proof of work and speaks directly with the founders and members on Discord.
        </p>
      </div>

      {/* 3 Core Pillars Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
            <Compass className="w-4 h-4 text-zinc-300" />
          </div>
          <h3 className="font-mono text-sm font-semibold text-white">
            1. Sovereign Domain
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            You must own your corner of the web: a personal website, digital garden, or self-hosted research repository. We do not admit social-only accounts.
          </p>
        </div>

        <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
            <Cpu className="w-4 h-4 text-zinc-300" />
          </div>
          <h3 className="font-mono text-sm font-semibold text-white">
            2. Uncommon Proof
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Show what you built or discovered when nobody was watching. We look for extreme depth: custom systems, formal theorems, novel compilers, or obsessive writing.
          </p>
        </div>

        <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
            <Disc className="w-4 h-4 text-zinc-300" />
          </div>
          <h3 className="font-mono text-sm font-semibold text-white">
            3. Discord Dialogue
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            No corporate interviews. You speak directly with the founders on Discord. If there is mutual intellectual resonance, you receive your permanent node key.
          </p>
        </div>
      </div>

      {/* The Vetting Terminal & Application Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 bg-zinc-950 border border-white/[0.08] rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              CANDIDATE DOSSIER GENERATOR
            </span>
            <span className="text-[10px] font-mono text-zinc-500">STAGE 1 OF 2</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  FULL NAME OR PSEUDONYM *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Nicholas Reed"
                  className="w-full px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  YOUR PERSONAL DOMAIN *
                </label>
                <input
                  type="text"
                  required
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="e.g. reed.dev or nreed.space"
                  className="w-full px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  DOMAIN OF OBSESSION / MASTERY *
                </label>
                <input
                  type="text"
                  required
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  placeholder="e.g. Zero-Knowledge Proofs & Compilers"
                  className="w-full px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  YOUR DISCORD HANDLE *
                </label>
                <input
                  type="text"
                  required
                  value={formData.discordHandle}
                  onChange={(e) => setFormData({ ...formData, discordHandle: e.target.value })}
                  placeholder="e.g. reed#0001 or @reed"
                  className="w-full px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                PROOF OF WORK URL *
              </label>
              <input
                type="url"
                required
                value={formData.proofUrl}
                onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                placeholder="https://github.com/yourname/project or link to paper / essay"
                className="w-full px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/30"
              />
              <p className="text-[10px] font-mono text-zinc-500 mt-1">
                Link to your best codebase, thesis, circuit design, or technical treatise.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                THE UNCOMMON THESIS (WHAT MAKES YOUR THINKING RARE?) *
              </label>
              <textarea
                required
                rows={3}
                value={formData.thesis}
                onChange={(e) => setFormData({ ...formData, thesis: e.target.value })}
                placeholder="Explain the one obsession or problem you know more about than 99% of people, or the core philosophy behind your work..."
                className="w-full px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/30 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Council Ticket &amp; Unlock Discord Step</span>
            </button>
          </form>
        </div>

        {/* Right: Council Discord Action & Next Steps */}
        <div className="lg:col-span-5 space-y-5">
          {/* Discord Dialogue Box */}
          <div className="bg-zinc-950 border border-white/[0.08] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-2">
                <Disc className="w-4 h-4 text-zinc-300" />
                DISCORD COUNCIL ADMISSIONS
              </span>
              <span className="text-[10px] font-mono text-zinc-500">STAGE 2 OF 2</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Once you generate your ticket, join the Discord server. We hold conversations with applicants directly in private tickets in the Kavyon Discord community.
            </p>

            {/* Generated ticket output */}
            {generatedTicket ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>YOUR GENERATED TICKET</span>
                  <button
                    onClick={handleCopyTicket}
                    className="flex items-center gap-1 text-white hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-black p-3 rounded-lg border border-white/10 font-mono text-[11px] text-zinc-300 overflow-x-auto select-all max-h-48 leading-relaxed">
                  <pre>{generatedTicket}</pre>
                </div>

                <a
                  href="https://discord.gg/8JmHjMSqJ5"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold rounded-lg transition-all border border-white/15 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Disc className="w-4 h-4" />
                  <span>Join Kavyon Discord Community</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
                <p className="text-[10px] font-mono text-center text-zinc-500">
                  Open a ticket in Kavyon Discord to initiate dialogue.
                </p>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-white/10 rounded-lg text-center space-y-2">
                <MessageSquare className="w-6 h-6 text-zinc-600 mx-auto" />
                <div className="text-xs font-mono text-zinc-400">
                  Dossier Not Yet Generated
                </div>
                <p className="text-[11px] text-zinc-500 font-sans">
                  Complete the form on the left to compile your Proof-of-Work submission.
                </p>
              </div>
            )}
          </div>

          {/* Vetting criteria note */}
          <div className="p-4 bg-black/60 border border-white/[0.06] rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
            <div className="text-xs text-zinc-400 space-y-1 font-sans">
              <span className="font-mono text-zinc-300 font-semibold block">
                Council Vetting Standard
              </span>
              <p className="leading-relaxed">
                We accept fewer than 3% of applications. We reject surface projects, generic templates, and buzzword resumes. We exist solely for rare, idiosyncratic genius.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { Copy, Check, Terminal, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export const OfficialSealSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'html'>('script');
  const [sampleDomain, setSampleDomain] = useState('yourdomain.xyz');

  const scriptSnippet = `<!-- The Uncommons Webring Badge -->
<script src="https://the-uncommons.network/widget.js" async></script>
<uncommons-ring site="${sampleDomain || 'yourdomain.xyz'}"></uncommons-ring>`;

  const htmlSnippet = `<!-- The Uncommons Webring (Pure Static HTML) -->
<div class="uncommons-ring" style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:#09090b;border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-family:ui-monospace,monospace;font-size:11px;color:#d4d4d8;">
  <a href="https://the-uncommons.network/go?from=${sampleDomain}&action=prev" style="color:#a1a1aa;text-decoration:none;">◄ Prev</a>
  <span style="color:#3f3f46;">|</span>
  <a href="https://the-uncommons.network" style="color:#ffffff;text-decoration:none;font-weight:600;letter-spacing:0.05em;">◉ The Uncommons</a>
  <span style="color:#3f3f46;">|</span>
  <a href="https://the-uncommons.network/go?from=${sampleDomain}&action=next" style="color:#a1a1aa;text-decoration:none;">Next ►</a>
</div>`;

  const currentCode = activeTab === 'script' ? scriptSnippet : htmlSnippet;

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="seal-section" className="space-y-6 pt-6">
      <div className="border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>MEMBER SPECIFICATION // THE OFFICIAL EMBED SEAL</span>
        </div>
        <h2 className="text-2xl font-mono font-bold text-white tracking-tight">
          The Uncommons Member Seal
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
          No complicated settings. Every admitted member hosts this quiet, sovereign seal in their site footer. It connects their domain to the distributed ring without ads, cookies, or tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Visual Mockup */}
        <div className="lg:col-span-5 bg-zinc-950 border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>HOW IT RENDERS IN FOOTERS</span>
              <span className="text-zinc-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                OFFICIAL SEAL
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Placed subtly at the bottom of personal blogs, research docs, or digital gardens.
            </p>
          </div>

          {/* Realistic Footer Container */}
          <div className="p-6 bg-black border border-white/10 rounded-lg flex flex-col items-center justify-center space-y-3 shadow-inner">
            <div className="text-[10px] font-mono text-zinc-600 mb-1">
              &mdash; example site footer &mdash;
            </div>

            {/* The Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-950 border border-white/15 rounded-md text-xs font-mono text-zinc-300 shadow-xl select-none hover:border-white/30 transition-colors">
              <span className="flex items-center gap-1 text-zinc-400 hover:text-white cursor-pointer" onClick={() => sound.playClick()}>
                <ArrowLeft className="w-3 h-3" />
                <span>Prev</span>
              </span>

              <span className="text-zinc-700">|</span>

              <a
                href="#hub"
                onClick={(e) => {
                  e.preventDefault();
                  sound.playClick();
                }}
                className="flex items-center gap-1.5 text-white font-semibold tracking-wider hover:underline underline-offset-4 cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full border border-zinc-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>THE UNCOMMONS</span>
              </a>

              <span className="text-zinc-700">|</span>

              <span className="flex items-center gap-1 text-zinc-400 hover:text-white cursor-pointer" onClick={() => sound.playClick()}>
                <span>Next</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div className="text-[10px] font-mono text-zinc-600 pt-1">
              Connects to the next peer node automatically
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between">
            <span>Size: 172 x 34px</span>
            <span>Zero JS Overhead (0kb for static)</span>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="lg:col-span-7 bg-zinc-950 border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Snippet format switch */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('script');
                }}
                className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'script'
                    ? 'bg-zinc-800 text-white font-medium border border-white/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Web Component (&lt;uncommons-ring&gt;)
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('html');
                }}
                className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'html'
                    ? 'bg-zinc-800 text-white font-medium border border-white/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Pure Static HTML (Zero JS)
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm w-fit"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Domain Input */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">Your domain:</span>
            <input
              type="text"
              value={sampleDomain}
              onChange={(e) => setSampleDomain(e.target.value)}
              placeholder="yourdomain.xyz"
              className="px-2.5 py-1 bg-black border border-white/10 rounded text-xs font-mono text-zinc-200 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Code display */}
          <div className="bg-black rounded-lg p-4 border border-white/10 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed select-all">
            <pre className="whitespace-pre-wrap">{currentCode}</pre>
          </div>

          <p className="text-[11px] font-mono text-zinc-500">
            Once approved by the council, place this code into your root layout or footer template.
          </p>
        </div>
      </div>
    </section>
  );
};

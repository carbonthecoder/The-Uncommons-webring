import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { Copy, Check, Terminal, Code2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export const WidgetStudio: React.FC = () => {
  const [siteDomain, setSiteDomain] = useState('your-domain.xyz');
  const [theme, setTheme] = useState<'obsidian' | 'frosted' | 'retro88'>('obsidian');
  const [copied, setCopied] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'webcomponent' | 'staticHtml'>('webcomponent');
  
  // Verification tester state
  const [testDomain, setTestDomain] = useState('cipher.sh');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ status: 'success' | 'failed' | null; message: string }>({
    status: null,
    message: '',
  });

  const webComponentSnippet = `<!-- The Uncommons Webring Badge -->
<script src="https://the-uncommons.network/widget.js" async></script>
<uncommons-ring site="${siteDomain || 'your-domain.xyz'}" theme="${theme}"></uncommons-ring>`;

  const staticHtmlSnippet = `<!-- The Uncommons Webring (Zero-JS Static HTML) -->
<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:#09090b;border:1px solid #27272a;border-radius:6px;font-family:monospace;font-size:12px;color:#d4d4d8;">
  <a href="https://the-uncommons.network/go?from=${siteDomain}&action=prev" style="color:#a1a1aa;text-decoration:none;">◄ Prev</a>
  <span style="color:#52525b;">|</span>
  <a href="https://the-uncommons.network" style="color:#f4f4f5;text-decoration:none;font-weight:600;">◉ The Uncommons</a>
  <span style="color:#52525b;">|</span>
  <a href="https://the-uncommons.network/go?from=${siteDomain}&action=next" style="color:#a1a1aa;text-decoration:none;">Next ►</a>
</div>`;

  const currentSnippet = activeSnippetTab === 'webcomponent' ? webComponentSnippet : staticHtmlSnippet;

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    sound.playClick();
    setVerifying(true);
    setVerifyResult({ status: null, message: '' });

    setTimeout(() => {
      setVerifying(false);
      const known = ['carbonthecoder.github.io', 'cipher.sh', 'hyperobject.space', 'zero-poly.io', 'latentcraft.net'];
      const isKnown = known.includes(testDomain.toLowerCase().trim());
      if (isKnown) {
        setVerifyResult({
          status: 'success',
          message: `Badge confirmed on ${testDomain}. Active in ring circulation.`,
        });
      } else {
        setVerifyResult({
          status: 'failed',
          message: `No active webring token found on ${testDomain}. Verify that you have placed the snippet in your site HTML and that your domain has been approved by the Discord Council.`,
        });
      }
    }, 1200);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-2">
          <Code2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>DEVELOPER ARTIFACTS // EMBED SPECIFICATION</span>
        </div>
        <h1 className="text-3xl font-mono font-bold text-white tracking-tight">
          Webring Widget Studio
        </h1>
        <p className="mt-2 text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
          Every member of The Uncommons places a quiet, sovereign seal on their website. It connects their domain to the circular ring without tracking, external cookies, or algorithmic middlemen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Config & Live Interactive Preview */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-4">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              1. Configure Your Node
            </h3>

            {/* Domain input */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                YOUR DOMAIN / PERSONAL SITE
              </label>
              <input
                type="text"
                value={siteDomain}
                onChange={(e) => setSiteDomain(e.target.value)}
                placeholder="e.g. yourname.xyz"
                className="w-full px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                STYLE FINISH (VERCEL GRADE MONOCHROME)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setTheme('obsidian');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    theme === 'obsidian'
                      ? 'bg-zinc-800 border-white/30 text-white font-medium shadow-sm'
                      : 'bg-black border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  Geist Obsidian
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setTheme('frosted');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    theme === 'frosted'
                      ? 'bg-zinc-800 border-white/30 text-white font-medium shadow-sm'
                      : 'bg-black border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  Frosted Glass
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setTheme('retro88');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    theme === 'retro88'
                      ? 'bg-zinc-800 border-white/30 text-white font-medium shadow-sm'
                      : 'bg-black border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  88x31 Micro
                </button>
              </div>
            </div>
          </div>

          {/* Live Widget Preview Box */}
          <div className="p-6 bg-black border border-white/[0.08] rounded-xl flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
            <div className="absolute top-3 left-3 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
              LIVE PREVIEW ON YOUR WEBSITE
            </div>

            {/* Rendered Widget Based on Theme */}
            <div className="mt-4">
              {theme === 'obsidian' && (
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-950 border border-white/15 rounded-lg text-xs font-mono text-zinc-300 shadow-xl select-none">
                  <a
                    href="#prev"
                    onClick={(e) => {
                      e.preventDefault();
                      sound.playClick();
                    }}
                    className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Prev</span>
                  </a>

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

                  <a
                    href="#next"
                    onClick={(e) => {
                      e.preventDefault();
                      sound.playClick();
                    }}
                    className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              )}

              {theme === 'frosted' && (
                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-full text-xs font-mono text-zinc-300 shadow-2xl select-none hover:border-white/25 transition-all">
                  <span className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => sound.playClick()}>
                    &larr; Prev
                  </span>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-zinc-100 font-medium tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                    The Uncommons
                  </span>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => sound.playClick()}>
                    Next &rarr;
                  </span>
                </div>
              )}

              {theme === 'retro88' && (
                <div className="inline-flex items-stretch border border-zinc-700 bg-zinc-950 font-mono text-[10px] select-none shadow-md overflow-hidden rounded-[2px]">
                  <div className="bg-zinc-800 text-zinc-300 px-2 py-1 flex items-center justify-center font-bold tracking-tighter border-r border-zinc-700">
                    UNCOMMONS
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 text-zinc-400 bg-black">
                    <span className="hover:text-white cursor-pointer" onClick={() => sound.playClick()}>
                      &lt;
                    </span>
                    <span className="text-zinc-600">RING</span>
                    <span className="hover:text-white cursor-pointer" onClick={() => sound.playClick()}>
                      &gt;
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-3 text-[10px] font-mono text-zinc-600">
              Zero telemetry • No external scripts required for static HTML
            </div>
          </div>
        </div>

        {/* Right Column: Code Snippets & Badge Validator */}
        <div className="lg:col-span-6 space-y-6">
          {/* Snippet Card */}
          <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveSnippetTab('webcomponent');
                  }}
                  className={`text-xs font-mono px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeSnippetTab === 'webcomponent'
                      ? 'bg-zinc-800 text-white font-medium border border-white/10'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Drop-In Web Component
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveSnippetTab('staticHtml');
                  }}
                  className={`text-xs font-mono px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeSnippetTab === 'staticHtml'
                      ? 'bg-zinc-800 text-white font-medium border border-white/10'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Static HTML (Zero JS)
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-medium transition-all cursor-pointer shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            {/* Code display */}
            <div className="relative bg-black rounded-lg p-4 border border-white/10 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
              <pre className="select-all whitespace-pre-wrap">{currentSnippet}</pre>
            </div>
            <p className="text-[11px] font-mono text-zinc-500">
              Paste into your footer, index template, or digital garden root layout.
            </p>
          </div>

          {/* Verification Ping Tool */}
          <div className="p-5 bg-zinc-950 border border-white/[0.08] rounded-xl space-y-4">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              2. Verify Live Member Badge
            </h3>
            <p className="text-xs text-zinc-400 font-sans">
              Test whether a member site has properly embedded the webring widget.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testDomain}
                onChange={(e) => setTestDomain(e.target.value)}
                placeholder="domain to verify..."
                className="flex-1 px-3.5 py-2 bg-black border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/30"
              />
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs font-mono text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {verifying ? 'Pinging Node...' : 'Verify Node'}
              </button>
            </div>

            {verifyResult.status && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono leading-relaxed ${
                  verifyResult.status === 'success'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-zinc-900/60 border-red-500/30 text-zinc-300'
                }`}
              >
                {verifyResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

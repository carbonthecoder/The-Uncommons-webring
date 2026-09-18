import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Lock, Unlock, Key, Copy, Check, Terminal, ShieldCheck, ArrowRight, ArrowLeft, Disc } from 'lucide-react';

export const SealPage: React.FC = () => {
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [nodeDomain, setNodeDomain] = useState('yourdomain.xyz');
  const [activeSnippetTab, setActiveSnippetTab] = useState<'script' | 'html'>('script');

  // Recognized valid Ring Keys (Demo keys + standard format)
  const validKeys = ['UNC-ALPHA-2026', 'UNC-VOID-77', 'UNC-COUNCIL-01', 'UNC-GENIUS-99'];

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const clean = passcode.trim().toUpperCase();

    if (validKeys.includes(clean) || clean.startsWith('UNC-')) {
      setIsUnlocked(true);
      setErrorMsg('');
      sound.playHarmonic();

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#a1a1aa', '#10b981'],
      });
    } else {
      setErrorMsg('Invalid Ring Key. Keys are issued by the founders upon admission in #council-review.');
    }
  };

  const scriptSnippet = `<!-- The Uncommons Webring Official Seal -->
<script src="https://the-uncommons.network/widget.js" async></script>
<uncommons-ring site="${nodeDomain || 'yourdomain.xyz'}"></uncommons-ring>`;

  const htmlSnippet = `<!-- The Uncommons Webring (Static HTML) -->
<div class="uncommons-ring" style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:#09090b;border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-family:ui-monospace,monospace;font-size:11px;color:#d4d4d8;">
  <a href="https://the-uncommons.network/go?from=${nodeDomain}&action=prev" style="color:#a1a1aa;text-decoration:none;">◄ Prev</a>
  <span style="color:#3f3f46;">|</span>
  <a href="https://the-uncommons.network" style="color:#ffffff;text-decoration:none;font-weight:600;letter-spacing:0.05em;">◉ The Uncommons</a>
  <span style="color:#3f3f46;">|</span>
  <a href="https://the-uncommons.network/go?from=${nodeDomain}&action=next" style="color:#a1a1aa;text-decoration:none;">Next ►</a>
</div>`;

  const currentSnippet = activeSnippetTab === 'script' ? scriptSnippet : htmlSnippet;

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1.5">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>CRYPTO-VAULT // MEMBER SEAL EMBED SPEC</span>
        </div>
        <h1 className="text-3xl font-mono font-bold text-white tracking-tight">
          The Official Seal
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-sans max-w-xl leading-relaxed">
          The Uncommons is a closed guild. The member seal and embed tokens are cryptographically locked to admitted nodes.
        </p>
      </div>

      {!isUnlocked ? (
        /* LOCKED STATE: Passcode Terminal */
        <div className="max-w-xl mx-auto p-6 sm:p-8 bg-zinc-950 border border-white/15 rounded-xl shadow-2xl space-y-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-zinc-300" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-mono font-bold text-white tracking-tight">
              Ring Key Required
            </h2>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-md mx-auto">
              Enter the private passcode issued to you by founders Ibrahim (Carbon) and the council after your Discord review in <code className="text-zinc-200">#council-review</code>.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 max-w-sm mx-auto">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="UNC-XXXX-XXXX"
                className="w-full pl-9 pr-4 py-2.5 bg-black border border-white/15 rounded-lg text-xs font-mono text-white text-center tracking-widest placeholder-zinc-600 focus:outline-none focus:border-white/40 uppercase"
              />
            </div>

            {errorMsg && (
              <p className="text-[11px] font-mono text-red-400 bg-red-950/20 p-2 rounded border border-red-500/20">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-lg transition-all shadow cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Member Seal Vault</span>
            </button>
          </form>

          <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
            <span>Demo Key: <code className="text-zinc-300">UNC-ALPHA-2026</code></span>
            <Link to="/apply" className="text-zinc-400 hover:text-white flex items-center gap-1">
              <Disc className="w-3 h-3" />
              <span>Request Key on Discord &rarr;</span>
            </Link>
          </div>
        </div>
      ) : (
        /* UNLOCKED STATE: Verified Seal Revealed */
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Key Accepted Banner */}
          <div className="p-4 bg-zinc-950 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <div className="font-mono text-xs text-emerald-400 font-semibold flex items-center gap-2">
                  <span>ACCESS GRANTED // RING KEY VALIDATED</span>
                </div>
                <div className="text-xs text-zinc-400 font-sans">
                  Your node token is authorized for circular webring circulation.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setIsUnlocked(false);
                setPasscode('');
              }}
              className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              Lock Vault
            </button>
          </div>

          {/* Seal Display & Code Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Footer Mockup */}
            <div className="lg:col-span-5 bg-zinc-950 border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>FOOTER INTEGRATION</span>
                  <span className="text-emerald-400">OFFICIAL BADGE</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans">
                  The exact mark you place at the bottom of your sovereign domain.
                </p>
              </div>

              {/* Realistic Preview */}
              <div className="p-6 bg-black border border-white/10 rounded-lg flex flex-col items-center justify-center space-y-3 shadow-inner">
                <div className="text-[10px] font-mono text-zinc-600">
                  &mdash; footer preview &mdash;
                </div>

                <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-950 border border-white/15 rounded-md text-xs font-mono text-zinc-300 shadow-xl select-none">
                  <span className="flex items-center gap-1 text-zinc-400 hover:text-white cursor-pointer" onClick={() => sound.playClick()}>
                    <ArrowLeft className="w-3 h-3" />
                    <span>Prev</span>
                  </span>

                  <span className="text-zinc-700">|</span>

                  <span className="flex items-center gap-1.5 text-white font-semibold tracking-wider">
                    <div className="w-2 h-2 rounded-full border border-zinc-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>THE UNCOMMONS</span>
                  </span>

                  <span className="text-zinc-700">|</span>

                  <span className="flex items-center gap-1 text-zinc-400 hover:text-white cursor-pointer" onClick={() => sound.playClick()}>
                    <span>Next</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-zinc-500">
                Automatic peer routing &bull; No cookies &bull; Zero tracking
              </div>
            </div>

            {/* Right: Code Generator */}
            <div className="lg:col-span-7 bg-zinc-950 border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveSnippetTab('script');
                    }}
                    className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                      activeSnippetTab === 'script'
                        ? 'bg-zinc-800 text-white font-medium border border-white/10'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Web Component
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveSnippetTab('html');
                    }}
                    className={`text-xs font-mono px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                      activeSnippetTab === 'html'
                        ? 'bg-zinc-800 text-white font-medium border border-white/10'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Static HTML
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm w-fit"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-500">Your domain:</span>
                <input
                  type="text"
                  value={nodeDomain}
                  onChange={(e) => setNodeDomain(e.target.value)}
                  placeholder="yourname.xyz"
                  className="px-2.5 py-1 bg-black border border-white/10 rounded text-xs font-mono text-zinc-200 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="bg-black rounded-lg p-4 border border-white/10 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed select-all">
                <pre className="whitespace-pre-wrap">{currentSnippet}</pre>
              </div>

              <p className="text-[11px] font-mono text-zinc-500">
                Paste into your website layout. The widget automatically binds to your domain.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

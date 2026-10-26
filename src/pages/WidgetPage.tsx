import React, { useState } from 'react';
import { Copy, Check, Code, Terminal, Eye } from 'lucide-react';
import { sound } from '../utils/audio';

export const WidgetPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'html' | 'markdown' | 'react' | 'css'>('html');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [demoHandle, setDemoHandle] = useState('carbon');

  const htmlSnippet = `<nav class="uncommons-badge" aria-label="The Uncommons Webring">
  <a href="https://uncommons.network/prev/${demoHandle}" title="Previous member">←</a>
  <a href="https://uncommons.network" title="The Uncommons Webring">the uncommons</a>
  <a href="https://uncommons.network/rand?from=${demoHandle}" title="Random member">✦</a>
  <a href="https://uncommons.network/next/${demoHandle}" title="Next member">→</a>
</nav>`;

  const markdownSnippet = `[←](https://uncommons.network/prev/${demoHandle}) [the uncommons](https://uncommons.network) [✦](https://uncommons.network/rand?from=${demoHandle}) [→](https://uncommons.network/next/${demoHandle})`;

  const reactSnippet = `import React from 'react';

export function UncommonsWidget({ handle }: { handle: string }) {
  return (
    <nav className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg border border-white/10 bg-[#181614] text-xs font-mono text-[#c4bcaf]">
      <a href={\`https://uncommons.network/prev/\${handle}\`} className="hover:text-amber-400 transition-colors" title="Previous member">←</a>
      <a href="https://uncommons.network" className="text-[#f5f0e8] hover:text-white font-medium" title="The Uncommons">the uncommons</a>
      <a href={\`https://uncommons.network/rand?from/\${handle}\`} className="text-amber-500 hover:text-amber-400 transition-colors" title="Random member">✦</a>
      <a href={\`https://uncommons.network/next/\${handle}\`} className="hover:text-amber-400 transition-colors" title="Next member">→</a>
    </nav>
  );
}`;

  const cssSnippet = `.uncommons-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  background-color: #181614;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.uncommons-badge a {
  color: #c4bcaf;
  text-decoration: none;
  transition: color 0.15s ease;
}

.uncommons-badge a:hover {
  color: #f59e0b;
}`;

  const currentSnippet = 
    activeTab === 'html' ? htmlSnippet :
    activeTab === 'markdown' ? markdownSnippet :
    activeTab === 'react' ? reactSnippet : cssSnippet;

  const handleCopy = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    sound.playClick();
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 sm:space-y-20 py-4 animate-in fade-in duration-300">
      {/* Masthead */}
      <header className="space-y-4 text-left border-b border-white/[0.08] pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1a17] border border-white/[0.08] text-xs font-mono text-amber-400">
          <Code className="w-3.5 h-3.5" />
          <span>MEMBER INTEGRATION MANUAL</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-[#fbf9f5] leading-[1.1]">
          Widget &amp; Embed Guide
        </h1>

        <p className="font-mono text-xs sm:text-sm text-[#9c9387] tracking-wide">
          Drop a minimal navigation badge into your website footer, colophon, or profile README.
        </p>
      </header>

      {/* Live Preview */}
      <section className="bg-[#181614] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8c8376]">
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span>LIVE INTERACTIVE PREVIEW</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#8c8376]">Your handle:</span>
            <input
              type="text"
              value={demoHandle}
              onChange={(e) => setDemoHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              className="px-2 py-1 rounded bg-[#121110] border border-white/10 text-amber-400 font-mono text-xs w-28 focus:outline-none focus:border-amber-500"
              placeholder="your-name"
            />
          </div>
        </div>

        {/* Live render preview container */}
        <div className="py-8 px-4 rounded-lg bg-[#121110] border border-white/[0.06] flex flex-col items-center justify-center gap-4 text-center">
          <div className="text-xs font-mono text-[#756e63]">How it appears in your footer:</div>
          
          <nav className="inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-white/10 bg-[#181614] text-xs font-mono text-[#c4bcaf] shadow-md">
            <a
              href={`/prev/${demoHandle}`}
              className="hover:text-amber-400 transition-colors p-1"
              title="Previous member"
            >
              ←
            </a>
            <a
              href="/"
              className="text-[#f5f0e8] hover:text-white font-medium px-1"
              title="The Uncommons"
            >
              the uncommons
            </a>
            <a
              href={`/rand?from=${demoHandle}`}
              className="text-amber-500 hover:text-amber-400 transition-colors p-1"
              title="Random member"
            >
              ✦
            </a>
            <a
              href={`/next/${demoHandle}`}
              className="hover:text-amber-400 transition-colors p-1"
              title="Next member"
            >
              →
            </a>
          </nav>
        </div>
      </section>

      {/* Snippet Code Tabs */}
      <section className="bg-[#181614] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#fbf9f5]">
            Embed Snippets
          </h2>

          {/* Tab selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#121110] border border-white/[0.08] text-xs font-mono">
            {(['html', 'markdown', 'react', 'css'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab);
                }}
                className={`px-3 py-1 rounded transition-colors uppercase cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#2a2622] text-amber-400 font-semibold shadow-sm'
                    : 'text-[#8c8376] hover:text-[#c4bcaf]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Code block with copy button */}
        <div className="relative group">
          <pre className="p-4 rounded-lg bg-[#121110] border border-white/[0.08] text-xs font-mono text-[#dcd5c9] overflow-x-auto leading-relaxed">
            <code>{currentSnippet}</code>
          </pre>
          <button
            onClick={() => handleCopy(currentSnippet, activeTab)}
            className="absolute top-3 right-3 px-3 py-1.5 rounded bg-[#25221e] hover:bg-[#302c27] text-xs font-mono text-[#c4bcaf] hover:text-white border border-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {copiedTab === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy {activeTab.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-[#8c8376] font-mono">
          Customization is fully welcomed. You can tweak classes, use inline SVG arrows, or style it to seamlessly blend into your personal site&apos;s existing typography.
        </p>
      </section>

      {/* Route Reference Table */}
      <section className="bg-[#181614] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-white/[0.08] pb-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500">
            <Terminal className="w-3.5 h-3.5" />
            <span>SPECIFICATION DIRECTORY</span>
          </div>
          <h2 className="font-serif text-2xl text-[#fbf9f5]">
            Routing Endpoints
          </h2>
          <p className="text-xs font-mono text-[#8c8376]">
            Every route supported by the ring engine.
          </p>
        </div>

        <div className="divide-y divide-white/[0.06] text-xs font-mono">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-amber-400 font-semibold">/next/:handle</span>
            <span className="text-[#a8a199]">Navigates to the next member relative to given handle.</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-amber-400 font-semibold">/prev/:handle</span>
            <span className="text-[#a8a199]">Navigates to the previous member relative to given handle.</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-amber-400 font-semibold">/rand</span>
            <span className="text-[#a8a199]">Jumps to a random member in the webring.</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-amber-400 font-semibold">/rand?from=:handle</span>
            <span className="text-[#a8a199]">Jumps to a random member excluding your own site.</span>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-amber-400 font-semibold">/members</span>
            <span className="text-[#a8a199]">Direct JSON array containing all member records, domains, and join dates.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
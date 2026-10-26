import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveMembers } from '../data/members';
import { Copy, Check, ArrowLeft, Terminal } from 'lucide-react';
import { sound } from '../utils/audio';

export const MembersJsonPage: React.FC = () => {
  const liveMembers = useLiveMembers();
  const [copied, setCopied] = useState(false);

  const verified = liveMembers
    .filter((m) => m.verified && m.domain && !m.domain.includes('unclaimed') && m.handle !== 'vacant')
    .map((m) => ({
      position: m.ringPosition,
      name: m.name,
      handle: m.handle,
      domain: m.domain,
      url: m.url,
      rss: m.rss || null,
      joinDate: m.joinDate,
    }));

  const jsonString = JSON.stringify(verified, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    sound.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-in fade-in duration-300">
      <header className="space-y-4 text-left border-b border-white/[0.08] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-500 mb-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>RAW DATA FEED &bull; JSON</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#fbf9f5]">
            Members Registry
          </h1>
          <p className="text-xs font-mono text-[#8c8376] mt-0.5">
            Machine-readable list of active personal domains.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-lg bg-[#25221e] hover:bg-[#302c27] text-xs font-mono text-amber-400 border border-amber-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-lg bg-[#181614] hover:bg-[#201d1a] text-xs font-mono text-[#c4bcaf] border border-white/[0.08] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <div className="relative">
        <pre className="p-4 sm:p-6 rounded-xl bg-[#181614] border border-white/[0.08] text-xs font-mono text-[#dcd5c9] overflow-x-auto leading-relaxed max-h-[70vh]">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
};
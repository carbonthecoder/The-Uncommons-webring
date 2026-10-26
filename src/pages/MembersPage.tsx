import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveMembers } from '../data/members';
import { sound } from '../utils/audio';
import { Search, ExternalLink, Rss, Copy, Check, Code, Users, ArrowUpRight, ArrowLeft } from 'lucide-react';

export const MembersPage: React.FC = () => {
  const liveMembers = useLiveMembers();
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const verified = useMemo(() => {
    return liveMembers.filter(
      (m) => m.verified && m.domain && !m.domain.includes('unclaimed') && m.handle !== 'vacant'
    );
  }, [liveMembers]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return verified;
    const q = searchQuery.toLowerCase();
    return verified.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.handle.toLowerCase().includes(q) ||
        m.domain.toLowerCase().includes(q) ||
        (m.bio && m.bio.toLowerCase().includes(q))
    );
  }, [verified, searchQuery]);

  const jsonPayload = useMemo(() => {
    const list = verified.map((m) => ({
      position: m.ringPosition,
      name: m.name,
      handle: m.handle,
      domain: m.domain,
      url: m.url,
      rss: m.rss || null,
      bio: m.bio || null,
      joinDate: m.joinDate,
    }));
    return JSON.stringify(list, null, 2);
  }, [verified]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonPayload);
    sound.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4 animate-in fade-in duration-300">
      {/* Header */}
      <header className="space-y-4 border-b border-white/[0.08] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1a17] border border-white/[0.08] text-xs font-mono text-amber-400 mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>{verified.length} VERIFIED PERSONAL DOMAINS</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl text-[#fbf9f5] font-normal tracking-tight">
              Members Directory
            </h1>
            <p className="text-xs font-mono text-[#8c8376] mt-1">
              Independent makers, researchers, and personal domains connected in the loop.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#181614] border border-white/[0.08] text-xs font-mono self-start sm:self-auto">
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('visual');
              }}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'visual'
                  ? 'bg-[#25221e] text-amber-400 font-semibold shadow-sm border border-white/10'
                  : 'text-[#8c8376] hover:text-[#c4bcaf]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Visual</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('json');
              }}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'json'
                  ? 'bg-[#25221e] text-amber-400 font-semibold shadow-sm border border-white/10'
                  : 'text-[#8c8376] hover:text-[#c4bcaf]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </header>

      {/* 1. Visual View */}
      {viewMode === 'visual' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#756e63] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by member name, handle, or domain..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181614] border border-white/[0.08] text-xs font-mono text-[#f5f0e8] placeholder-[#756e63] focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.map((member, index) => (
              <div
                key={member.id}
                className="p-5 rounded-xl bg-[#181614] border border-white/[0.08] hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#756e63]">#{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-amber-500/90 font-medium">@{member.handle}</span>
                  </div>

                  <div>
                    <h3 className="font-serif text-lg text-[#fbf9f5] group-hover:text-amber-300 transition-colors">
                      {member.name}
                    </h3>
                    <a
                      href={member.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-amber-400/90 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>{member.domain}</span>
                      <ArrowUpRight className="w-3 h-3 text-[#756e63]" />
                    </a>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-[#a8a199] leading-relaxed font-sans line-clamp-2">
                      {member.bio}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    {member.rss ? (
                      <a
                        href={member.rss}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-500/90 hover:text-amber-400 inline-flex items-center gap-1 transition-colors"
                        title="RSS Feed"
                      >
                        <Rss className="w-3 h-3" />
                        <span>Feed</span>
                      </a>
                    ) : (
                      <span className="text-[#555047] text-[11px]">No feed</span>
                    )}
                    <span className="text-[#555047]">&bull;</span>
                    <span className="text-[#756e63] text-[11px]">{member.joinDate}</span>
                  </div>

                  <a
                    href={member.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-[#221f1c] hover:bg-[#2b2723] text-[#dcd5c9] hover:text-white border border-white/[0.08] transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="py-12 text-center text-xs font-mono text-[#8c8376] bg-[#181614] rounded-xl border border-white/[0.08]">
              No members found matching &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>
      )}

      {/* 2. JSON View */}
      {viewMode === 'json' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#8c8376]">RAW JSON PAYLOAD</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 rounded-lg bg-[#25221e] hover:bg-[#302c27] text-amber-400 border border-amber-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <pre className="p-4 sm:p-6 rounded-xl bg-[#181614] border border-white/[0.08] text-xs font-mono text-[#dcd5c9] overflow-x-auto leading-relaxed max-h-[70vh]">
            <code>{jsonPayload}</code>
          </pre>
        </div>
      )}

      {/* Footer Back Link */}
      <div className="pt-4 border-t border-white/[0.08]">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8c8376] hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Ring Index</span>
        </Link>
      </div>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveMembers, getNextMember, getPrevMember, getRandomMember } from '../data/members';
import type { Member } from '../data/members';
import { sound } from '../utils/audio';
import { ArrowLeft, ArrowRight, Shuffle, Copy, Check, Terminal, Rss, ArrowUpRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const liveMembers = useLiveMembers();
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeSurfedDomain, setActiveSurfedDomain] = useState<string>('');
  const [activeMemberPreview, setActiveMemberPreview] = useState<Member | null>(null);

  const verifiedMembers = useMemo(() => {
    return liveMembers.filter(
      (m) => m.verified && m.domain && !m.domain.includes('unclaimed') && m.handle !== 'vacant'
    );
  }, [liveMembers]);

  const verifiedCount = verifiedMembers.length;

  const quickSnippet = `<a href="https://uncommons.network/prev/your-name">←</a>
<a href="https://uncommons.network">the uncommons</a>
<a href="https://uncommons.network/rand?from=your-name" title="Random member">⇄</a>
<a href="https://uncommons.network/next/your-name">→</a>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(quickSnippet);
    sound.playClick();
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handlePrevNode = () => {
    sound.playClick();
    const current = activeSurfedDomain || (verifiedMembers[0]?.domain || '');
    const target = getPrevMember(current);
    if (target) {
      setActiveSurfedDomain(target.domain);
      setActiveMemberPreview(target);
    }
  };

  const handleNextNode = () => {
    sound.playClick();
    const current = activeSurfedDomain || (verifiedMembers[0]?.domain || '');
    const target = getNextMember(current);
    if (target) {
      setActiveSurfedDomain(target.domain);
      setActiveMemberPreview(target);
    }
  };

  const handleRandomNode = () => {
    sound.playHarmonic();
    const target = getRandomMember(activeSurfedDomain);
    if (target) {
      setActiveSurfedDomain(target.domain);
      setActiveMemberPreview(target);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 sm:space-y-20 py-4 animate-in fade-in duration-300">
      {/* 1. Masthead & Tagline */}
      <header className="space-y-4 text-left border-b border-white/[0.08] pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1a17] border border-white/[0.08] text-xs font-mono text-[#c4bcaf]">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>{verifiedCount} {verifiedCount === 1 ? 'ACTIVE DOMAIN' : 'ACTIVE DOMAINS'} IN ORBIT</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-[#fbf9f5] leading-[1.1]">
          The Uncommons
        </h1>

        <p className="font-mono text-xs sm:text-sm text-[#9c9387] tracking-wide">
          Connecting the web&apos;s rarest minds &amp; personal domains &bull; Est. 2026
        </p>
      </header>

      {/* 2. Casual Letter / Manifesto */}
      <section className="bg-[#181614] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-600/70" />
        <div className="space-y-3 text-sm sm:text-base text-[#c4bcaf] leading-relaxed font-sans">
          <p>
            hey! the uncommons is a{' '}
            <a
              href="https://en.wikipedia.org/wiki/Webring"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline"
            >
              webring
            </a>{' '}
            for a circle of friends who build things on the internet.
          </p>
          <p>
            we link our websites together and share a private Forgejo Git forge on{' '}
            <a
              href="https://git.carbon.is-a.dev"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline font-mono text-xs sm:text-sm"
            >
              git.carbon.is-a.dev
            </a>
            . membership is invite-only between friends and people whose work we respect.
          </p>
          <p>
            the source code for the webring is{' '}
            <a
              href="https://git.carbon.is-a.dev/carbonthecoder/uncommonsring"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline"
            >
              open source
            </a>
            . it&apos;s just a simple python flask app by orangc; see the README for more details.
          </p>
          <p>
            to join, contact the ringmaster,{' '}
            <a
              href="https://carbon.is-a.dev/"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline"
            >
              carbon
            </a>
            , preferably via{' '}
            <a
              href="mailto:contact@carbon.is-a.dev"
              className="text-amber-400 hover:underline"
            >
              email
            </a>
            . to explore, scroll below to hop through our personal sites.
          </p>
        </div>

        {/* Ring Surfer Bar */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-[#8c8376]">Surf the active ring:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevNode}
              className="px-3 py-1.5 rounded-lg bg-[#221f1c] hover:bg-[#2b2723] text-[#dcd5c9] border border-white/[0.08] transition-colors flex items-center gap-1 cursor-pointer"
              title="Previous member"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={handleRandomNode}
              className="px-3 py-1.5 rounded-lg bg-[#221f1c] hover:bg-[#2b2723] text-amber-400 border border-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              title="Random member"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Random</span>
            </button>
            <button
              onClick={handleNextNode}
              className="px-3 py-1.5 rounded-lg bg-[#221f1c] hover:bg-[#2b2723] text-[#dcd5c9] border border-white/[0.08] transition-colors flex items-center gap-1 cursor-pointer"
              title="Next member"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic preview card if surfed */}
        {activeMemberPreview && (
          <div className="mt-3 p-3.5 rounded-lg bg-[#121110] border border-amber-500/30 text-xs font-mono flex items-center justify-between animate-in fade-in">
            <div className="space-y-0.5">
              <div className="text-amber-400 font-semibold">{activeMemberPreview.name}</div>
              <div className="text-[#8c8376]">{activeMemberPreview.domain}</div>
            </div>
            <a
              href={activeMemberPreview.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1 transition-colors"
            >
              <span>Open Domain</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </section>

      {/* 3. Members Directory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="font-serif text-2xl text-[#fbf9f5]">Directory</h2>
            <p className="text-xs font-mono text-[#8c8376] mt-0.5">
              Verified sovereign domains currently bound in the loop.
            </p>
          </div>
          <Link
            to="/members"
            className="text-xs font-mono text-amber-500/90 hover:text-amber-400 transition-colors"
          >
            Raw JSON &rarr;
          </Link>
        </div>

        {/* Directory Table */}
        <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#181614]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121110] border-b border-white/[0.08] text-[#8c8376]">
                <tr>
                  <th className="py-3 px-4 w-12 font-normal">#</th>
                  <th className="py-3 px-4 font-normal">Member</th>
                  <th className="py-3 px-4 font-normal">Personal Domain</th>
                  <th className="py-3 px-4 font-normal hidden sm:table-cell">RSS Feed</th>
                  <th className="py-3 px-4 font-normal hidden md:table-cell">Joined</th>
                  <th className="py-3 px-4 text-right font-normal">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-[#dcd5c9]">
                {verifiedMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className="hover:bg-[#201d1a] transition-colors group"
                  >
                    <td className="py-3.5 px-4 text-[#756e63]">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#f5f0e8]">
                      {member.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-amber-400/90 hover:text-amber-300">
                        {member.domain}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 hidden sm:table-cell text-[#8c8376]">
                      {member.rss ? (
                        <a
                          href={member.rss}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-[#c4bcaf] inline-flex items-center gap-1"
                          title="RSS Feed"
                        >
                          <Rss className="w-3 h-3 text-amber-500/70" />
                          <span>feed</span>
                        </a>
                      ) : (
                        <span className="text-[#555047]">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-[#756e63]">
                      {member.joinDate}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={member.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#8c8376] group-hover:text-amber-400 transition-colors"
                      >
                        <span>Visit</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Quick Embed Snippet */}
      <section className="bg-[#181614] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#fbf9f5]">
              Add to your website
            </h2>
            <p className="text-xs font-mono text-[#8c8376] mt-0.5">
              Paste these 4 links anywhere on your footer or colophon.
            </p>
          </div>
          <Link
            to="/widget"
            className="text-xs font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>See full snippet guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Code block with copy button */}
        <div className="relative group">
          <pre className="p-4 rounded-lg bg-[#121110] border border-white/[0.08] text-xs font-mono text-[#dcd5c9] overflow-x-auto leading-relaxed">
            <code>{quickSnippet}</code>
          </pre>
          <button
            onClick={handleCopySnippet}
            className="absolute top-3 right-3 px-2.5 py-1.5 rounded bg-[#25221e] hover:bg-[#302c27] text-xs font-mono text-[#c4bcaf] hover:text-white border border-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {copiedSnippet ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy HTML</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-[#8c8376] font-mono leading-relaxed">
          Replace <code className="text-amber-400/90">&apos;your-name&apos;</code> with your registered handle.
        </p>
      </section>

      {/* 5. Routes & Endpoints */}
      <section className="border border-white/[0.08] rounded-xl p-6 bg-[#181614] space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#8c8376]">
          <Terminal className="w-3.5 h-3.5 text-amber-500" />
          <span>RING ROUTING SYSTEM</span>
        </div>
        <h3 className="font-serif text-lg text-[#fbf9f5]">Available Routes</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#121110] border border-white/[0.06] space-y-1">
            <span className="text-amber-400">/next/:handle</span>
            <p className="text-[#8c8376]">Redirects to the next member in sequence.</p>
          </div>
          <div className="p-3 rounded-lg bg-[#121110] border border-white/[0.06] space-y-1">
            <span className="text-amber-400">/prev/:handle</span>
            <p className="text-[#8c8376]">Redirects to the previous member in sequence.</p>
          </div>
          <div className="p-3 rounded-lg bg-[#121110] border border-white/[0.06] space-y-1">
            <span className="text-amber-400">/rand</span>
            <p className="text-[#8c8376]">Jumps to a random member. Add <code className="text-[#c4bcaf]">?from=:handle</code> to skip self.</p>
          </div>
          <div className="p-3 rounded-lg bg-[#121110] border border-white/[0.06] space-y-1">
            <span className="text-amber-400">/members</span>
            <p className="text-[#8c8376]">Returns raw JSON payload of active ring members.</p>
          </div>
        </div>
      </section>

      {/* 6. How to Join */}
      <section className="border border-white/[0.08] rounded-xl p-6 sm:p-8 bg-[#181614] space-y-3">
        <h2 className="font-serif text-xl sm:text-2xl text-[#fbf9f5]">
          Want to join?
        </h2>
        <p className="text-sm text-[#c4bcaf] leading-relaxed font-sans">
          The Uncommons is invite-only to protect the webring from domain squatters and corporate content farms. We look for personal websites with distinct character&mdash;craft, research, essays, or tools.
        </p>
        <p className="text-xs font-mono text-[#8c8376]">
          Reach out directly to Carbon via <a href="https://carbon.is-a.dev" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">carbon.is-a.dev</a> with a link to your personal domain. Once vetted, you will receive your ring position and private Forgejo instance invite.
        </p>
      </section>
    </div>
  );
};
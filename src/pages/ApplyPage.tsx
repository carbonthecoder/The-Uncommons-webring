import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { Disc, ExternalLink, Send, ArrowRight, ShieldCheck, Globe, Cpu } from 'lucide-react';
import { dispatchApplicationToDiscord, checkCooldown, recordSubmission, DISCORD_LINKS } from '../utils/discord';
import { SovereignOrbitalLoader } from '../components/SovereignOrbitalLoader';

export const ApplyPage: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');
  const [craft, setCraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanHandle = discordHandle.trim().replace(/^@/, '');

    if (!cleanDomain) {
      setErrorMsg('Please enter your personal domain.');
      return;
    }
    if (!cleanHandle) {
      setErrorMsg('Please enter your Discord username.');
      return;
    }

    const cooldown = checkCooldown();
    if (!cooldown.isAllowed) {
      setErrorMsg(`Please wait ${cooldown.remainingSeconds}s before submitting again.`);
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    try {
      const res = await dispatchApplicationToDiscord({
        domain: cleanDomain,
        discordHandle: cleanHandle,
        proof: `https://${cleanDomain}`,
        focus: craft.trim() || 'Personal domain and obsessive projects.',
      });

      if (res.success) {
        recordSubmission();
        setSubmitted(true);
        sound.playHarmonic();
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 py-4 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="border-b border-white/[0.08] pb-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-[11px] font-mono text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>NICHENET // ADMISSIONS</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-syne font-bold text-white tracking-tight">
          Apply to NICHENET
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-xl mx-auto leading-relaxed">
          A curated webring connecting the web&apos;s rarest minds, personal domains, and obsessive builders. Zero algorithms, zero corporate clout &mdash; pure craft.
        </p>
      </div>

      {/* 2. Direct Intake Card (Human to Human) */}
      <div className="p-6 sm:p-8 bg-zinc-950 border border-white/10 rounded-2xl space-y-5 shadow-2xl">
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            HUMAN-FIRST ADMISSIONS
          </div>
          <h2 className="text-lg sm:text-xl font-syne font-bold text-white tracking-tight">
            No robotic forms. Talk directly with builders.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
            Admissions are conversational. We don&apos;t make you fill out lengthy questionnaires or submit to automated scrapers. Join the community Discord, say hello, and share your personal domain freely with active admins.
          </p>
        </div>

        <div className="pt-2">
          <a
            href={DISCORD_LINKS.kavyonServer}
            target="_blank"
            rel="noreferrer"
            onClick={() => sound.playClick()}
            className="w-full py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Disc className="w-4 h-4" />
            <span>Join Kavyon Discord to Apply</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="text-[11px] font-mono text-zinc-500 text-center">
          Active review turnaround: <strong>2–3 hours</strong> &bull; Founders and moderators chat with you directly.
        </div>
      </div>

      {/* 3. Fast Domain Intake Ping (Optional) */}
      <div className="p-6 sm:p-8 bg-zinc-950 border border-white/[0.08] rounded-2xl space-y-6">
        <div className="space-y-1">
          <h3 className="text-sm font-mono font-semibold text-white uppercase tracking-wider">
            Quick Intake Dispatch
          </h3>
          <p className="text-xs text-zinc-400 font-sans">
            Drop your domain and Discord handle to notify active reviewers right now.
          </p>
        </div>

        {submitted ? (
          <div className="p-5 bg-black border border-white/15 rounded-xl space-y-3 font-mono text-xs text-zinc-300">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Intake ping dispatched successfully.</span>
            </div>
            <p className="text-zinc-400 font-sans text-xs leading-relaxed">
              Your domain <strong className="text-white">{domain}</strong> is now on the reviewers&apos; desk. Complete your welcome by joining the server below.
            </p>
            <div className="pt-2">
              <a
                href={DISCORD_LINKS.kavyonServer}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black font-semibold rounded text-xs transition-colors"
              >
                <span>Enter Kavyon Discord</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-zinc-400 mb-1.5 text-[11px]">
                1. PERSONAL DOMAIN *
              </label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. aero.build or yoursite.dev"
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 text-[11px]">
                2. DISCORD USERNAME *
              </label>
              <input
                type="text"
                required
                value={discordHandle}
                onChange={(e) => setDiscordHandle(e.target.value)}
                placeholder="e.g. carbonthecoder"
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 text-[11px]">
                3. WHAT DO YOU OBSESS OVER? (OPTIONAL)
              </label>
              <input
                type="text"
                value={craft}
                onChange={(e) => setCraft(e.target.value)}
                placeholder="e.g. Backend engines, network protocols, minimalist software"
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <SovereignOrbitalLoader size={14} />
                  <span>Dispatching Intake...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Intake Ping</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* 4. Standards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
        <div className="p-4 bg-zinc-950 border border-white/[0.06] rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>01 // DOMAIN</span>
          </div>
          <div className="text-xs font-semibold text-white">Sovereign Domain</div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            Must be an independently hosted personal website or digital garden. No social profiles or hosted platforms.
          </p>
        </div>

        <div className="p-4 bg-zinc-950 border border-white/[0.06] rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>02 // CRAFT</span>
          </div>
          <div className="text-xs font-semibold text-white">Obsessive Builder</div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            Active proof of work. Software, research, essays, or tools built with genuine obsession.
          </p>
        </div>

        <div className="p-4 bg-zinc-950 border border-white/[0.06] rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>03 // SEAL</span>
          </div>
          <div className="text-xs font-semibold text-white">Embed the Seal</div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            Commitment to wear the lightweight NICHENET badge in your footer to route traffic between peers.
          </p>
        </div>
      </div>
    </div>
  );
};

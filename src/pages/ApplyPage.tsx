import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Disc, Copy, Check, Terminal, ExternalLink, Sparkles, Send, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { dispatchApplicationToDiscord, checkCooldown, DISCORD_LINKS } from '../utils/discord';

export const ApplyPage: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [proof, setProof] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');
  const [focus, setFocus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    ticketId: string;
    message: string;
    formattedEmbed?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Check cooldown on mount
  useEffect(() => {
    const { isAllowed, remainingSeconds } = checkCooldown();
    if (!isAllowed) {
      setCooldownRemaining(remainingSeconds);
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cooldownRemaining > 0) {
      setErrorMsg(`Anti-spam cooldown active. Please wait ${cooldownRemaining}s before submitting again.`);
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    try {
      const result = await dispatchApplicationToDiscord({
        domain,
        proof,
        discordHandle,
        focus,
      });

      if (!result.success) {
        setErrorMsg(result.message);
        sound.playTick();
      } else {
        sound.playHarmonic();
        setSubmissionResult({
          ticketId: result.ticketId,
          message: result.message,
          formattedEmbed: result.formattedEmbed,
        });

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#10b981', '#ffffff', '#a1a1aa'],
        });
      }
    } catch {
      setErrorMsg('Failed to dispatch application. Please verify your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicket = () => {
    if (!submissionResult?.formattedEmbed) return;
    sound.playClick();
    navigator.clipboard.writeText(submissionResult.formattedEmbed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-2">
      {/* Header with Kavyon Community Banner */}
      <div className="border-b border-white/[0.08] pb-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-[11px] font-mono text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>KAVYON ECOSYSTEM</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-zinc-400">#COUNCIL-REVIEW</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
          Apply to The Uncommons
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-lg mx-auto leading-relaxed">
          The Uncommons is a sovereign webring for rare minds and relentless builders, hosted in partnership with the <strong>Kavyon</strong> community. Zero corporate resumes &mdash; only sovereign domains and verified builds.
        </p>
      </div>

      {/* Kavyon Server Context Pill */}
      <div className="p-4 bg-zinc-950/80 border border-white/10 rounded-xl space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            VETTING SERVER: {DISCORD_LINKS.serverName.toUpperCase()}
          </span>
          <a
            href={DISCORD_LINKS.kavyonServer}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
          >
            <span>Join Server ↗</span>
          </a>
        </div>
        <p className="text-zinc-400 font-sans text-xs leading-relaxed">
          &ldquo;Kavyon is a futuristic teen-founded tech company reshaping the world through AI, full-stack innovation, and startup culture. We don&apos;t just dream &mdash; we design, develop, and dominate.&rdquo;
        </p>
        <div className="text-[11px] text-zinc-500 pt-1 border-t border-white/[0.06]">
          Applications are dispatched directly to <code className="text-emerald-400">{DISCORD_LINKS.channelName}</code> for manual founder review.
        </div>
      </div>

      {/* Main Submission Form */}
      {!submissionResult ? (
        <div className="bg-zinc-950 border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs font-mono text-red-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                1. YOUR SOVEREIGN DOMAIN / PERSONAL WEBSITE *
              </label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. yourname.xyz or garden.dev"
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                2. PROOF OF WORK LINK (GITHUB REPO, LIVE APP, OR RESEARCH) *
              </label>
              <input
                type="text"
                required
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="e.g. https://github.com/yourhandle/project or live build URL"
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                3. YOUR DISCORD USERNAME *
              </label>
              <input
                type="text"
                required
                value={discordHandle}
                onChange={(e) => setDiscordHandle(e.target.value)}
                placeholder="e.g. @yourdiscord or username"
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                4. WHAT ARE YOU OBSESSED WITH COOKING RIGHT NOW? (OPTIONAL)
              </label>
              <textarea
                rows={2}
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. Young builder obsessed with local AI models, autonomous agents, and compiler optimizations..."
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cooldownRemaining > 0}
              className={`w-full py-3 font-mono text-xs font-semibold rounded-md transition-all shadow flex items-center justify-center gap-2 cursor-pointer mt-3 ${
                cooldownRemaining > 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-emerald-500/10'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Dispatching to #council-review...</span>
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Cooldown Active ({cooldownRemaining}s)</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Council Review</span>
                </>
              )}
            </button>

            <p className="text-[11px] font-mono text-zinc-500 text-center pt-1">
              Submissions land directly in Kavyon&apos;s <code className="text-zinc-400">#council-review</code> for verification by Ibrahim (Carbon).
            </p>
          </form>
        </div>
      ) : (
        /* Submission Success State */
        <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-mono font-bold text-white">
                Application Received [{submissionResult.ticketId}]
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                {submissionResult.message}
              </p>
            </div>
          </div>

          <div className="p-4 bg-black border border-white/10 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>YOUR COMPILED CANDIDATE TICKET</span>
              <button
                onClick={handleCopyTicket}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Ticket'}</span>
              </button>
            </div>

            <div className="font-mono text-[11px] text-zinc-300 overflow-x-auto select-all leading-relaxed max-h-48">
              <pre>{submissionResult.formattedEmbed}</pre>
            </div>
          </div>

          {/* Direct Join Action */}
          <div className="space-y-2.5">
            <a
              href={DISCORD_LINKS.councilReview}
              target="_blank"
              rel="noreferrer"
              onClick={() => sound.playClick()}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold rounded-md transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Disc className="w-4 h-4" />
              <span>Jump to #council-review on Discord</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={DISCORD_LINKS.kavyonServer}
              target="_blank"
              rel="noreferrer"
              onClick={() => sound.playClick()}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono text-xs rounded-md transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Or Join Main Kavyon Server (Tech &amp; AI Community)</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>

          <p className="text-[11px] font-mono text-center text-zinc-500">
            Founders Ibrahim (Carbon) and the council will review your proof and issue your <strong>Ring Key</strong> to unlock <code className="text-zinc-300">/seal</code>.
          </p>
        </div>
      )}
    </div>
  );
};

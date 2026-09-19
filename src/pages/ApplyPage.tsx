import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Disc, Copy, Check, Terminal, ExternalLink, Sparkles, Send, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { dispatchApplicationToDiscord, checkCooldown, checkDiscordServerMembership, DISCORD_LINKS } from '../utils/discord';

interface StoredTicket {
  ticketId: string;
  domain: string;
  discordHandle: string;
  timestamp: string;
}

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
  const [existingTicket, setExistingTicket] = useState<StoredTicket | null>(null);

  // Check cooldown & existing ticket on mount
  useEffect(() => {
    const { isAllowed, remainingSeconds } = checkCooldown();
    if (!isAllowed) {
      setCooldownRemaining(remainingSeconds);
    }

    try {
      const stored = localStorage.getItem('unc_active_ticket');
      if (stored) {
        setExistingTicket(JSON.parse(stored));
      }
    } catch {
      // ignore
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

    if (existingTicket) {
      setErrorMsg(`You already have an active ticket (${existingTicket.ticketId}) under review. Strictly 1 submission allowed.`);
      return;
    }

    if (cooldownRemaining > 0) {
      setErrorMsg(`Anti-spam cooldown active. Please wait ${cooldownRemaining}s before submitting.`);
      return;
    }

    const cleanHandle = discordHandle.trim().replace(/^@/, '');
    if (!cleanHandle) {
      setErrorMsg('Please provide your valid Discord username.');
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    // Check server membership
    const memberCheck = await checkDiscordServerMembership(cleanHandle);
    if (memberCheck.checked && !memberCheck.exists) {
      setErrorMsg(`Discord user @${cleanHandle} was not found in the Kavyon server. You must join the server first before submitting!`);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await dispatchApplicationToDiscord({
        domain,
        proof,
        discordHandle: `@${cleanHandle}`,
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

        // Store active ticket to enforce strictly one submission
        const newTicket: StoredTicket = {
          ticketId: result.ticketId,
          domain: domain.trim(),
          discordHandle: `@${cleanHandle}`,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('unc_active_ticket', JSON.stringify(newTicket));
        setExistingTicket(newTicket);

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#10b981', '#ffffff', '#a1a1aa'],
        });
      }
    } catch {
      setErrorMsg('Failed to dispatch application. Please verify your network connection.');
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
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-[11px] font-mono text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>KAVYON ECOSYSTEM</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-zinc-400">#COUNCIL-REVIEW TICKET DESK</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-syne font-bold text-white tracking-tight">
          Apply to The Uncommons
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-lg mx-auto leading-relaxed">
          The sovereign webring for rare minds and relentless builders, vetted in partnership with the <strong>Kavyon</strong> community. Zero corporate clout &mdash; only sovereign domains and verified builds.
        </p>
      </div>

      {/* Mandatory Guidelines Callout (Server Membership + 1 Time Submission + 2-3h SLA) */}
      <div className="p-4 bg-zinc-950 border border-white/10 rounded-xl space-y-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-white/[0.06] pb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>MANDATORY ADMISSIONS PROTOCOL &amp; RULES</span>
        </div>

        <div className="space-y-2 font-sans text-xs text-zinc-300 leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-mono font-bold shrink-0">01.</span>
            <span>
              <strong>Must Be in Server:</strong> You must join the{' '}
              <a
                href={DISCORD_LINKS.kavyonServer}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                Kavyon Discord Server
              </a>{' '}
              before applying so moderators can review your ticket and ping you.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-amber-400 font-mono font-bold shrink-0">02.</span>
            <span>
              <strong>Strictly 1 Submission:</strong> Only one application allowed per builder / domain. Multiple submissions or spamming with the same Discord ID will be automatically rejected.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-zinc-400 font-mono font-bold shrink-0">03.</span>
            <span>
              <strong>Review SLA (2–3 Hours):</strong> Founders and moderators actively review tickets in <code className="text-emerald-300 font-mono text-[11px]">#council-review</code>. Expect a verdict within <strong>2–3 hours during active hours</strong>.
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Target Review Channel: <code className="text-zinc-200">#council-review</code></span>
          <a
            href={DISCORD_LINKS.kavyonServer}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Join Kavyon Server &rarr;</span>
          </a>
        </div>
      </div>

      {/* Existing Active Ticket Banner (If already submitted) */}
      {existingTicket && !submissionResult && (
        <div className="p-5 bg-zinc-950 border border-amber-500/30 rounded-xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Clock className="w-4 h-4" />
              <span>ACTIVE TICKET UNDER REVIEW // {existingTicket.ticketId}</span>
            </div>
            <span className="text-[10px] text-zinc-500">1 SUBMISSION LIMIT</span>
          </div>

          <p className="text-zinc-400 font-sans leading-relaxed">
            You already have an active admission ticket (<strong className="text-zinc-200">{existingTicket.ticketId}</strong>) submitted for domain <code className="text-emerald-300">{existingTicket.domain}</code> ({existingTicket.discordHandle}). Our moderators review tickets in <code className="text-zinc-200">#council-review</code> within 2–3 hours.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <a
              href={DISCORD_LINKS.councilReview}
              target="_blank"
              rel="noreferrer"
              onClick={() => sound.playClick()}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <Disc className="w-3.5 h-3.5" />
              <span>View Ticket in #council-review</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => {
                if (window.confirm('Reset local ticket tracker and submit a fresh application?')) {
                  localStorage.removeItem('unc_active_ticket');
                  setExistingTicket(null);
                }
              }}
              className="w-full sm:w-auto px-3 py-2 text-zinc-500 hover:text-zinc-300 text-[11px] cursor-pointer"
            >
              Reset / Re-apply
            </button>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      {!submissionResult && !existingTicket && (
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
                placeholder="e.g. yourname.xyz or devgarden.io"
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
                3. YOUR DISCORD USERNAME (MUST BE IN KAVYON SERVER) *
              </label>
              <input
                type="text"
                required
                value={discordHandle}
                onChange={(e) => setDiscordHandle(e.target.value)}
                placeholder="e.g. yourusername (without @)"
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
              <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                Our mods ping this username directly in <code className="text-zinc-400">#council-review</code>.
              </span>
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
                  <span>Dispatching Ticket to #council-review...</span>
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Cooldown Active ({cooldownRemaining}s)</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket (One Submission Only)</span>
                </>
              )}
            </button>

            <p className="text-[11px] font-mono text-zinc-500 text-center pt-1">
              Tickets land directly in Kavyon&apos;s <code className="text-zinc-400">#council-review</code>. Response time: 2–3 hours.
            </p>
          </form>
        </div>
      )}

      {/* Submission Success State */}
      {submissionResult && (
        <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                TICKET DISPATCHED LIVE TO #COUNCIL-REVIEW
              </div>
              <h3 className="text-lg font-mono font-bold text-white">
                Ticket [{submissionResult.ticketId}] Active
              </h3>
            </div>
          </div>

          <div className="p-4 bg-black border border-white/10 rounded-lg space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-zinc-400 text-[11px]">
              <span>TICKET STATUS // LIVE ON DISCORD</span>
              <button
                onClick={handleCopyTicket}
                className="text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Ticket'}</span>
              </button>
            </div>
            <p className="text-zinc-300 font-sans text-xs leading-relaxed">
              Your application is now registered as ticket <strong className="text-white font-mono">{submissionResult.ticketId}</strong> in Kavyon&apos;s <code className="text-zinc-200">#council-review</code>. Our moderators and Ibrahim (Carbon) will review your domain and proof.
            </p>
            <div className="text-[11px] text-zinc-500 pt-1 border-t border-white/[0.04]">
              Expected turnaround: <strong>2–3 hours during active hours</strong>. Make sure you are in the server!
            </div>
          </div>

          {/* Action Links */}
          <div className="space-y-2.5">
            <a
              href={DISCORD_LINKS.councilReview}
              target="_blank"
              rel="noreferrer"
              onClick={() => sound.playClick()}
              className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-mono text-xs font-bold rounded-md transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Disc className="w-4 h-4" />
              <span>Jump to #council-review to See Your Ticket</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={DISCORD_LINKS.kavyonServer}
              target="_blank"
              rel="noreferrer"
              onClick={() => sound.playClick()}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono text-xs rounded-md transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Join Kavyon Server (If Not Joined Yet)</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

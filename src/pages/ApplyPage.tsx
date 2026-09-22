import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Disc, Copy, Check, Terminal, ExternalLink, Sparkles, Send, ShieldAlert, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { dispatchApplicationToDiscord, checkCooldown, checkDiscordServerMembership, DISCORD_LINKS, type DiscordMemberCheck } from '../utils/discord';
import { SovereignOrbitalLoader } from '../components/SovereignOrbitalLoader';

interface StoredTicket {
  ticketId: string;
  domain: string;
  discordHandle: string;
  timestamp: string;
}

export const ApplyPage: React.FC = () => {
  const [proof, setProof] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');
  const [age, setAge] = useState('');
  const [uncommonBelief, setUncommonBelief] = useState('');
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
  const [ticketStatus, setTicketStatus] = useState<'checking' | 'under_review' | 'rejected' | 'approved'>('under_review');
  const [ticketStatusMsg, setTicketStatusMsg] = useState('');

  // Live Server Membership Sync State
  const [liveCheckStatus, setLiveCheckStatus] = useState<'idle' | 'checking' | 'verified' | 'not_found'>('idle');
  const [liveCheckUser, setLiveCheckUser] = useState<DiscordMemberCheck['user'] | null>(null);


  // Discord membership is checked onBlur or via manual recheck button

  const triggerManualRecheck = async () => {
    const clean = discordHandle.trim().replace(/^@/, '');
    if (!clean) return;
    setLiveCheckStatus('checking');
    sound.playClick();
    try {
      const check = await checkDiscordServerMembership(clean);
      if (check.checked) {
        if (check.exists && check.user) {
          setLiveCheckStatus('verified');
          setLiveCheckUser(check.user);
          sound.playHarmonic();
        } else {
          setLiveCheckStatus('not_found');
          setLiveCheckUser(null);
          sound.playTick();
        }
      }
    } catch {
      setLiveCheckStatus('idle');
    }
  };

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

  // Fast live ticket status polling (sub-3s sync without manual page refresh)
  useEffect(() => {
    if (!existingTicket) return;

    let isMounted = true;
    const checkLiveStatus = async () => {
      try {
        const res = await fetch(`/api/check-ticket?ticketId=${encodeURIComponent(existingTicket.ticketId)}&handle=${encodeURIComponent(existingTicket.discordHandle)}&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.status) {
            setTicketStatus((prev) => {
              if (prev !== data.status && (data.status === 'approved' || data.status === 'rejected')) {
                sound.playHarmonic();
              }
              return data.status;
            });
            if (data.message) setTicketStatusMsg(data.message);
          }
        }
      } catch (err) {
        console.warn('Live ticket check error:', err);
      }
    };

    checkLiveStatus();
    // Fast 3-second heartbeat polling
    const interval = setInterval(checkLiveStatus, 3000);

    // Immediate poll when user switches tabs or focuses window
    const handleFocus = () => checkLiveStatus();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // BroadcastChannel for cross-tab instant synchronization
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('unc_ticket_sync');
      bc.onmessage = () => checkLiveStatus();
    } catch {
      // not supported in older envs
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      if (bc) bc.close();
    };
  }, [existingTicket]);

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

    const numAge = parseInt(age, 10);
    if (!age || isNaN(numAge) || numAge < 1 || numAge > 26) {
      setErrorMsg('The Uncommons is open to young builders up to 26 years old. Please enter your age (1–26).');
      return;
    }

    if (!proof.trim()) {
      setErrorMsg('Please provide a link to your work, GitHub, or write "self-taught builder".');
      return;
    }

    if (!uncommonBelief.trim() || uncommonBelief.trim().length < 10) {
      setErrorMsg('Please share a genuine response to the independent belief question (at least 10 characters).');
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
        domain: proof.trim(),
        proof: proof.trim(),
        discordHandle: `@${cleanHandle}`,
        age: numAge,
        uncommonBelief: uncommonBelief.trim(),
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
          domain: proof.trim(),
          discordHandle: `@${cleanHandle}`,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('unc_active_ticket', JSON.stringify(newTicket));
        setExistingTicket(newTicket);

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#ffffff', '#e4e4e7', '#a1a1aa'],
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
          <Terminal className="w-3.5 h-3.5 text-white" />
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
            <span className="text-white font-mono font-bold shrink-0">01.</span>
            <span>
              <strong>Must Be in Server:</strong> You must join the{' '}
              <a
                href={DISCORD_LINKS.kavyonServer}
                target="_blank"
                rel="noreferrer"
                className="text-white underline hover:text-emerald-300"
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
              <strong>Review SLA (2–3 Hours):</strong> Founders and moderators actively review tickets in the Kavyon Discord server. Expect a verdict within <strong>2–3 hours during active hours</strong>.
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Community Server: <code className="text-zinc-200">Kavyon Discord</code></span>
          <a
            href={DISCORD_LINKS.kavyonServer}
            target="_blank"
            rel="noreferrer"
            className="text-white hover:underline flex items-center gap-1"
          >
            <span>Join Kavyon Server &rarr;</span>
          </a>
        </div>
      </div>

      {/* Existing Ticket Banner with Live Status (Active, Rejected, Approved) */}
      {existingTicket && !submissionResult && (
        <>
          {ticketStatus === 'rejected' ? (
            <div className="p-6 bg-zinc-950 border border-red-500/40 rounded-xl space-y-4 font-mono text-xs shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>ADMISSION STATUS // NOT ADMITTED IN THIS COHORT</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">DOCKET {existingTicket.ticketId}</span>
              </div>

              <div className="space-y-3 font-sans text-xs leading-relaxed text-zinc-300">
                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                  <span>Candidate:</span>
                  <span className="text-white font-bold px-2 py-0.5 rounded bg-zinc-900 border border-white/10">{existingTicket.discordHandle}</span>
                  <span className="text-zinc-600">&bull;</span>
                  <span className="text-zinc-400">Target Domain:</span>
                  <span className="text-zinc-200">{existingTicket.domain}</span>
                </div>

                <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-lg text-zinc-200 leading-relaxed text-xs">
                  <p className="font-semibold text-red-300 mb-1.5 font-mono">
                    Cohort Admission Notice // Inspector Bartholomew:
                  </p>
                  <p className="text-zinc-300 font-sans">
                    {ticketStatusMsg || 'You were not admitted in this cohort. Stay active in the server, level up, build and learn new things! We actively monitor everyone in the server—even small contributions, discussions, and side projects—and may add you to the webring.'}
                  </p>
                </div>

              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={DISCORD_LINKS.kavyonServer}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => sound.playClick()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs rounded border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer shadow transition-colors"
                >
                  <Disc className="w-3.5 h-3.5 text-white" />
                  <span>Stay Active in Kavyon Server</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>

                <button
                  onClick={() => {
                    if (window.confirm('Reset local ticket tracker and submit a fresh application?')) {
                      localStorage.removeItem('unc_active_ticket');
                      setExistingTicket(null);
                      setTicketStatus('under_review');
                      sound.playClick();
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-zinc-400" />
                  <span>Reset / Re-apply When Ready</span>
                </button>
              </div>
            </div>
          ) : ticketStatus === 'approved' ? (
            <div className="p-6 bg-zinc-950 border border-emerald-500/40 rounded-xl space-y-4 font-mono text-xs shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>ADMISSION RATIFIED // DOCKET {existingTicket.ticketId}</span>
                </div>
                <span className="text-[10px] text-white/80 font-mono">VERIFIED BUILDER</span>
              </div>

              <div className="space-y-3 font-sans text-xs leading-relaxed text-zinc-300">
                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                  <span>Candidate:</span>
                  <span className="text-white font-bold px-2 py-0.5 rounded bg-zinc-900 border border-emerald-500/20">{existingTicket.discordHandle}</span>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-zinc-200 leading-relaxed text-xs">
                  <p className="font-semibold text-emerald-300 mb-1 font-mono">
                    Admission Granted:
                  </p>
                  <p className="text-zinc-300 font-sans">
                    Congratulations! Your application has been approved by the Council. Your unique Sovereign Ring Key and secret 6-digit PIN have been dispatched directly to your Discord DM from Inspector Bartholomew.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href="/seal"
                  onClick={() => sound.playHarmonic()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold font-mono text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Open Sovereign Node Studio (/seal) &rarr;</span>
                </a>

                <button
                  onClick={() => {
                    localStorage.removeItem('unc_active_ticket');
                    setExistingTicket(null);
                  }}
                  className="w-full sm:w-auto px-3 py-2 text-zinc-500 hover:text-zinc-300 text-[11px] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-zinc-950 border border-amber-500/30 rounded-xl space-y-3 font-mono text-xs shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>ACTIVE TICKET UNDER REVIEW // {existingTicket.ticketId}</span>
                </div>
                <span className="text-[10px] text-zinc-500">1 SUBMISSION LIMIT</span>
              </div>

              <p className="text-zinc-400 font-sans leading-relaxed">
                You already have an active admission ticket (<strong className="text-zinc-200">{existingTicket.ticketId}</strong>) submitted for domain <code className="text-emerald-300">{existingTicket.domain}</code> ({existingTicket.discordHandle}). Our moderators review tickets in the Kavyon Discord server within 2–3 hours.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <a
                  href={DISCORD_LINKS.kavyonServer}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => sound.playClick()}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Disc className="w-3.5 h-3.5" />
                  <span>Open Kavyon Discord Server</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => {
                    if (window.confirm('Reset local ticket tracker and submit a fresh application?')) {
                      localStorage.removeItem('unc_active_ticket');
                      setExistingTicket(null);
                      sound.playClick();
                    }
                  }}
                  className="w-full sm:w-auto px-3 py-2 text-zinc-500 hover:text-zinc-300 text-[11px] cursor-pointer"
                >
                  Reset / Re-apply
                </button>
              </div>
            </div>
          )}
        </>
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

            {/* 1. DISCORD USERNAME */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-zinc-400">
                  1. YOUR DISCORD USERNAME (MUST BE IN KAVYON SERVER) *
                </label>
                {liveCheckStatus === 'checking' && (
                  <span className="text-[10px] font-mono text-white flex items-center gap-1.5">
                    <SovereignOrbitalLoader size={12} />
                    <span>Checking server membership...</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={discordHandle}
                  onChange={(e) => {
                    setDiscordHandle(e.target.value);
                    if (liveCheckStatus === 'not_found' || liveCheckStatus === 'verified') {
                      setLiveCheckStatus('idle');
                      setLiveCheckUser(null);
                    }
                  }}
                  onBlur={triggerManualRecheck}
                  placeholder="e.g. carbonthecoder (without @)"
                  className={`w-full px-3.5 py-2.5 bg-black border rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none transition-colors ${
                    liveCheckStatus === 'verified'
                      ? 'border-emerald-500/70 focus:border-emerald-400'
                      : liveCheckStatus === 'not_found'
                      ? 'border-rose-500/70 focus:border-rose-400'
                      : 'border-white/15 focus:border-emerald-500/50'
                  }`}
                />
                {liveCheckStatus === 'verified' && (
                  <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-white text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {liveCheckStatus === 'not_found' && (
                  <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-rose-400 text-xs font-mono">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* LIVE SYNC STATUS BADGES */}
              {liveCheckStatus === 'verified' && liveCheckUser && (
                <div className="mt-2 p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-md text-xs font-mono text-emerald-300 flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    {liveCheckUser.avatar ? (
                      <img 
                        src={liveCheckUser.avatar} 
                        alt={liveCheckUser.displayName} 
                        className="w-5 h-5 rounded-full border border-emerald-400/50 object-cover"
                      />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    )}
                    <span>
                      Verified in Kavyon as <strong className="text-white">@{liveCheckUser.username}</strong>
                      {liveCheckUser.displayName && liveCheckUser.displayName !== liveCheckUser.username ? (
                        <span className="text-white/80 ml-1">({liveCheckUser.displayName})</span>
                      ) : null}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider font-bold">
                    VERIFIED
                  </span>
                </div>
              )}

              {liveCheckStatus === 'not_found' && (
                <div className="mt-2 p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-md text-xs font-mono text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      User <strong className="text-white">@{discordHandle.trim().replace(/^@/, '')}</strong> is not in the Kavyon server.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={triggerManualRecheck}
                      title="Re-check server membership"
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Re-check</span>
                    </button>
                    <a
                      href={DISCORD_LINKS.kavyonServer}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 px-2.5 py-1 rounded transition-colors shadow"
                    >
                      <span>Join Kavyon Server &rarr;</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 2. AGE */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                2. YOUR AGE (1–26 YEARS OLD) *
              </label>
              <input
                type="number"
                min={1}
                max={26}
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 19"
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* 3. PROOF / LINK */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                3. GITHUB, PORTFOLIO, OR PROJECT LINK *
              </label>
              <input
                type="text"
                required
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="e.g. https://github.com/yourhandle or write 'self-taught builder'"
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* 4. THE INDEPENDENT THINKER QUESTION */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                4. WHAT IS AN OPINION OR BELIEF YOU HAVE THAT MOST PEOPLE YOUR AGE DISAGREE WITH? *
              </label>
              <textarea
                rows={3}
                required
                value={uncommonBelief}
                onChange={(e) => setUncommonBelief(e.target.value)}
                placeholder="Share an original perspective, idea, or truth you strongly believe that goes against common opinion..."
                className="w-full px-3.5 py-2.5 bg-black border border-white/15 rounded-md text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cooldownRemaining > 0 || liveCheckStatus === 'not_found' || liveCheckStatus === 'checking'}
              className={`w-full py-3 font-mono text-xs font-semibold rounded-md transition-all shadow flex items-center justify-center gap-2 cursor-pointer mt-3 ${
                cooldownRemaining > 0 || liveCheckStatus === 'not_found' || liveCheckStatus === 'checking'
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-emerald-500/10'
              }`}
            >
              {isSubmitting ? (
                <>
                  <SovereignOrbitalLoader size={16} />
                  <span>Creating Private Ticket in Discord...</span>
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Cooldown Active ({cooldownRemaining}s)</span>
                </>
              ) : liveCheckStatus === 'checking' ? (
                <>
                  <SovereignOrbitalLoader size={16} />
                  <span>Verifying Server Membership...</span>
                </>
              ) : liveCheckStatus === 'not_found' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Join Server First to Submit</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket (One Submission Only)</span>
                </>
              )}
            </button>

            <p className="text-[11px] font-mono text-zinc-500 text-center pt-1">
              Join the Kavyon Discord server to track your ticket and chat with the community. Response time: 2–3 hours.
            </p>
          </form>
        </div>
      )}

      {/* Submission Success State */}
      {submissionResult && (
        <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-white font-semibold">
                TICKET CREATED LIVE IN KAVYON DISCORD
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
                {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Ticket'}</span>
              </button>
            </div>
            <p className="text-zinc-300 font-sans text-xs leading-relaxed">
              Your application is now active as ticket <strong className="text-white font-mono">{submissionResult.ticketId}</strong> in Discord. Reviewers will inspect your answers and chat with you directly in your private ticket channel.
            </p>
            <div className="text-[11px] text-zinc-500 pt-1 border-t border-white/[0.04]">
              Expected turnaround: <strong>2–3 hours (rarely 4–5h)</strong>. Click below to open your ticket and complete your intake!
            </div>
          </div>

          {/* Action Links */}
          <div className="space-y-2.5">
            <a
              href={DISCORD_LINKS.kavyonServer}
              target="_blank"
              rel="noreferrer"
              onClick={() => sound.playClick()}
              className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold rounded-md transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Disc className="w-4 h-4" />
              <span>Open Kavyon Discord to Access Your Ticket</span>
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

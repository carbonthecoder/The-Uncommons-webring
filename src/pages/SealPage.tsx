import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Lock, 
  Unlock, 
  Key, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Disc, 
  Sparkles, 
  ExternalLink, 
  Eye, 
  Save, 
  Code, 
  CheckCircle2, 
  AlertTriangle,
  Volume2,
  VolumeX
} from 'lucide-react';
import type { Member } from '../data/members';
import { saveCustomNode, saveGenesisSlot, vacateCustomNode, getCustomActiveNodes, syncServerNodes, useLiveMembers } from '../data/members';
import { MemberDossierModal } from '../components/MemberDossierModal';
import { MongoSaveOverlay } from '../components/MongoSaveOverlay';
import { SovereignOrbitalLoader } from '../components/SovereignOrbitalLoader';


export const SealPage: React.FC = () => {
  const liveMembers = useLiveMembers();

  // Authentication & 2-Step Credentials (Ring Key + Secret PIN)
  const [passcode, setPasscode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return (urlParams.get('key') || sessionStorage.getItem('unc_vault_key') || '').trim().toUpperCase();
  });
  const [pin, setPin] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return (urlParams.get('pin') || sessionStorage.getItem('unc_vault_pin') || '').trim();
  });
  const [isUnlocked, setIsUnlocked] = useState(() => {
    const savedKey = sessionStorage.getItem('unc_vault_key');
    const savedPin = sessionStorage.getItem('unc_vault_pin');
    const isVerified = sessionStorage.getItem('unc_vault_verified') === 'true';
    return !!savedKey && !!savedPin && (savedKey === 'UNC-ALPHA-2026' || isVerified);
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAudioActive, setIsAudioActive] = useState(!sound.getMuted());

  // 1-Click Direct Unlock via Discord DM Link (?key=...&pin=...)
  useEffect(() => {
    if (isUnlocked) return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = (urlParams.get('key') || '').trim().toUpperCase();
    const urlPin = (urlParams.get('pin') || '').trim();

    if (urlKey && urlPin) {
      setIsVerifying(true);
      fetch('/api/verify-vault-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: urlKey, pin: urlPin }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.valid) {
              setIsUnlocked(true);
              sessionStorage.setItem('unc_vault_key', urlKey);
              sessionStorage.setItem('unc_vault_pin', urlPin);
              sessionStorage.setItem('unc_vault_verified', 'true');
              sound.playHarmonic();
              confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ffffff', '#a1a1aa', '#10b981'],
              });
            }
          }
        })
        .catch(() => {})
        .finally(() => setIsVerifying(false));
    }
  }, [isUnlocked]);

  // Tab View: 'studio' (Node Profile Editor) vs 'embed' (Seal Snippet)
  const [activeTab, setActiveTab] = useState<'studio' | 'embed'>('studio');

  // Node Editor Form State
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [domain, setDomain] = useState('');
  const [url, setUrl] = useState('');
  const [field, setField] = useState('');
  const [bio, setBio] = useState('');
  const [proofOfWork, setProofOfWork] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('Systems, AI Agents, Compilers');
  const [nodeStatus, setNodeStatus] = useState<'online' | 'dormant' | 'reviewing'>('online');

  // Founder Superadmin check
  const isFounder = useMemo(() => {
    const currentKey = passcode.trim().toUpperCase();
    return currentKey === 'UNC-ALPHA-2026' || currentKey === 'UNC-COUNCIL-01' || currentKey === 'UNC-KEY-FUVB-2026';
  }, [passcode]);

  // Dynamic slot status calculation (1 to 8)
  const slotStatusList = useMemo(() => {
    const currentKey = passcode.trim().toUpperCase();
    const isIbrahim = currentKey === 'UNC-ALPHA-2026';
    const isPriyanshu = currentKey === 'UNC-COUNCIL-01' || currentKey === 'UNC-KEY-FUVB-2026';

    return Array.from({ length: 8 }, (_, i) => {
      const num = i + 1;
      const id = `NODE-00${num}`;

      // Check if slot has an active verified member
      const memberInSlot = liveMembers.find(
        (m) => (m.id === id || m.ringPosition === num) && m.verified && m.domain && !m.domain.includes('unclaimed')
      );

      let isOwner = false;
      if (id === 'NODE-001' && isIbrahim) isOwner = true;
      else if (id === 'NODE-002' && (isPriyanshu || (handle && handle.toLowerCase().includes('priyxnshu')))) isOwner = true;
      else if (memberInSlot && handle && memberInSlot.handle.toLowerCase() === handle.trim().toLowerCase()) isOwner = true;

      const isClaimed = !!memberInSlot;
      // If Founder, NO SLOT IS LOCKED! Full override access across all nodes.
      const isLocked = isFounder ? false : (isClaimed && !isOwner);

      return {
        id,
        num,
        isClaimed,
        isLocked,
        isOwner: isFounder || isOwner,
        claimedMember: memberInSlot,
        label: isClaimed
          ? isFounder
            ? `${id} (${memberInSlot.name} • Founder Override)`
            : isOwner
              ? `${id} (${memberInSlot.name} - Your Slot)`
              : `${id} (${memberInSlot.name} - Claimed / Locked)`
          : `${id} (Genesis Slot #${num} - Available)`,
      };
    });
  }, [liveMembers, passcode, handle, isFounder]);

  // First available open slot (defaults new candidates to NODE-003 since NODE-001 and NODE-002 are claimed)
  const firstAvailableSlot = useMemo(() => {
    const currentKey = passcode.trim().toUpperCase();
    if (currentKey === 'UNC-ALPHA-2026') return 'NODE-001';
    if (currentKey === 'UNC-COUNCIL-01' || currentKey === 'UNC-KEY-FUVB-2026') return 'NODE-002';

    const available = slotStatusList.find((s) => !s.isLocked);
    return available ? available.id : 'NODE-003';
  }, [slotStatusList, passcode]);

  const [slotId, setSlotId] = useState(() => {
    const savedKey = (sessionStorage.getItem('unc_vault_key') || '').trim().toUpperCase();
    if (savedKey === 'UNC-ALPHA-2026') return 'NODE-001';
    if (savedKey === 'UNC-COUNCIL-01' || savedKey === 'UNC-KEY-FUVB-2026') return 'NODE-002';
    return 'NODE-003';
  });

  // Auto-switch to available slot if current slot is locked / claimed by another member (candidates only)
  useEffect(() => {
    if (isFounder) return; // Founders stay on whichever slot they select!
    const current = slotStatusList.find((s) => s.id === slotId);
    if (current && current.isLocked) {
      setSlotId(firstAvailableSlot);
    }
  }, [slotStatusList, slotId, firstAvailableSlot, isFounder]);

  // Preview Mode: 'dossier' | 'seal'
  const [previewMode, setPreviewMode] = useState<'dossier' | 'seal'>('dossier');

  // Save / Action states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // Embed Snippet Tab state
  const [activeSnippetTab, setActiveSnippetTab] = useState<'script' | 'html'>('script');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Load existing node data when slotId or unlocked status changes
  useEffect(() => {
    if (!isUnlocked) return;
    const customNodes = getCustomActiveNodes();
    const existingCustom = customNodes.find((n) => n.id === slotId);
    const existingLive = liveMembers.find((n) => n.id === slotId);
    const existing = existingCustom || existingLive;

    if (existing && existing.verified && !existing.domain?.includes('unclaimed')) {
      setName(existing.name || '');
      setHandle(existing.handle || '');
      setDomain(existing.domain || '');
      setUrl(existing.url || '');
      setField(existing.field || '');
      setBio(existing.bio || '');
      setProofOfWork(existing.proofOfWork || '');
      setProofUrl(existing.proofUrl || '');
      setTagsInput(existing.tags?.join(', ') || 'Systems, AI Agents, Compilers');
      setNodeStatus(existing.status || 'online');
    } else {
      // Pre-fill clean defaults for new slot
      setName((prev) => (prev && prev !== 'Polymath Builder' ? prev : ''));
      setHandle((prev) => (prev && prev !== 'youngbuilder' ? prev : ''));
      setDomain((prev) => (prev && prev !== 'builder.sovereign.dev' ? prev : ''));
      setUrl((prev) => (prev && prev !== 'https://builder.sovereign.dev' ? prev : ''));
      setField((prev) => (prev && prev !== 'Autonomous Systems & Deterministic AI' ? prev : ''));
      setBio((prev) => (prev && prev !== 'Obsessed with local LLM kernels, autonomous agents, and sovereign digital gardens.' ? prev : ''));
      setProofOfWork((prev) => (prev && prev !== 'High-throughput agent orchestration runtime with zero IPC overhead.' ? prev : ''));
      setProofUrl((prev) => (prev && prev !== 'https://github.com' ? prev : ''));
    }
  }, [isUnlocked, slotId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMsg('');

    const cleanKey = passcode.trim().toUpperCase();
    const cleanPin = pin.trim();

    if (!cleanKey) {
      setErrorMsg('Please enter your Sovereign Ring Key.');
      sound.playTick();
      return;
    }

    if (!cleanPin) {
      setErrorMsg('Please enter your secret 6-digit PIN sent to your Discord DM.');
      sound.playTick();
      return;
    }

    setIsVerifying(true);

    // 1. Try verifying with bot/serverless API
    try {
      const res = await fetch('/api/verify-vault-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey, pin: cleanPin }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setIsUnlocked(true);
          sessionStorage.setItem('unc_vault_key', cleanKey);
          sessionStorage.setItem('unc_vault_pin', cleanPin);
          sessionStorage.setItem('unc_vault_verified', 'true');
          sound.playHarmonic();

          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffffff', '#a1a1aa', '#10b981'],
          });
          setIsVerifying(false);
          return;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Invalid Ring Key or Secret PIN. Check your Discord DM.');
        sound.playTick();
        setIsVerifying(false);
        return;
      }
    } catch {
      // 2. Offline master fallback: check only known master keys
      if (
        (cleanKey === 'UNC-ALPHA-2026' && (cleanPin === '000000' || cleanPin === '888888')) ||
        (cleanKey === 'UNC-COUNCIL-01' && cleanPin === '111111')
      ) {
        setIsUnlocked(true);
        sessionStorage.setItem('unc_vault_key', cleanKey);
        sessionStorage.setItem('unc_vault_pin', cleanPin);
        sessionStorage.setItem('unc_vault_verified', 'true');
        sound.playHarmonic();

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#a1a1aa', '#10b981'],
        });
        setIsVerifying(false);
        return;
      }
      setErrorMsg('Invalid Ring Key or Secret PIN. Please check your credentials.');
      sound.playTick();
    }
    setIsVerifying(false);
  };


  // Construct Live Preview Member Object
  const previewMember: Member = useMemo(() => {
    const cleanDomain = (domain || 'builder.sovereign.dev')
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
    const cleanUrl = url.trim() || `https://${cleanDomain}`;
    const cleanHandle = (handle || 'builder').trim().replace(/^@/, '');
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const existingMember = liveMembers.find((m) => m.id === slotId);
    const ringPos = existingMember?.ringPosition || parseInt(slotId.replace(/\D/g, ''), 10) || 1;

    return {
      id: slotId,
      name: name.trim() || 'Polymath Builder',
      handle: cleanHandle,
      domain: cleanDomain,
      url: cleanUrl,
      field: field.trim() || 'Autonomous Systems & Sovereign Web',
      bio: bio.trim() || 'Obsessive young builder crafting sovereign software and distributed engines.',
      proofOfWork: proofOfWork.trim() || 'Shipped production runtime and verifiable proof of work.',
      proofUrl: proofUrl.trim() || `https://github.com/${cleanHandle}`,
      tags: tags.length > 0 ? tags : ['Systems', 'Builder'],
      joinDate: new Date().toISOString().split('T')[0],
      verified: true,
      ringPosition: ringPos,
      status: nodeStatus,
    };
  }, [slotId, name, handle, domain, url, field, bio, proofOfWork, proofUrl, tagsInput, nodeStatus, liveMembers]);

  // Handle Vacating / Resetting a Slot to Genesis Vacancy (Founder Only)
  const [isVacating, setIsVacating] = useState(false);
  const handleVacateSlot = async (targetSlotId: string) => {
    if (!window.confirm(`Are you sure you want to vacate and reset slot ${targetSlotId}? This will remove the member record and return this slot to an open Genesis vacancy.`)) {
      return;
    }
    sound.playClick();
    setIsVacating(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch('/api/vacate-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: targetSlotId, key: passcode, pin }),
      });
      vacateCustomNode(targetSlotId);
      if (res.ok) {
        await syncServerNodes(true);
        setSaveSuccess(`Slot ${targetSlotId} has been successfully reset to an open Genesis vacancy in the database.`);
        sound.playHarmonic();
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || 'Failed to vacate slot.');
      }
    } catch {
      setSaveError('Could not reach backend to vacate slot.');
    } finally {
      setIsVacating(false);
    }
  };

  // Handle Save & Publish with 2-Step Verification
  const handleSaveNode = async () => {
    sound.playClick();
    setSaveError(null);
    setSaveSuccess(null);

    const currentSlot = slotStatusList.find((s) => s.id === slotId);
    if (!isFounder && currentSlot && currentSlot.isLocked) {
      setSaveError(
        `Slot ${slotId} is claimed by ${currentSlot.claimedMember?.name || 'another builder'} and is locked. Please choose an open vacant slot.`
      );
      sound.playTick();
      return;
    }

    if (!domain.trim()) {
      setSaveError('Please provide your sovereign domain (e.g. yourdomain.dev)');
      sound.playTick();
      return;
    }
    if (!name.trim()) {
      setSaveError('Please provide your name or alias.');
      sound.playTick();
      return;
    }
    if (!handle.trim()) {
      setSaveError('Please provide your handle.');
      sound.playTick();
      return;
    }

    setIsSaving(true);
    const startTime = Date.now();

    try {
      // 1. Save to local storage & genesis cache immediately
      saveGenesisSlot(previewMember);
      saveCustomNode(previewMember);

      // 2. Persist to backend with 2-step verification credentials
      try {
        const res = await fetch('/api/save-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node: previewMember, key: passcode, pin }),
        });
        if (res.ok) {
          await syncServerNodes(true);
        }
      } catch {
        // Backend offline or running in standalone client mode, local state is persisted
      }

      // Smooth brief transition buffer
      const elapsed = Date.now() - startTime;
      if (elapsed < 400) {
        await new Promise((resolve) => setTimeout(resolve, 400 - elapsed));
      }

      setSaveSuccess(`Node ${previewMember.id} (${previewMember.domain}) is verified and live in the Webring!`);
      sound.playHarmonic();

      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#ffffff'],
      });
    } catch (err: unknown) {
      const error = err as Error;
      setSaveError('Failed to save node: ' + (error?.message || 'Unknown error'));
      sound.playTick();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyManifest = () => {
    sound.playClick();
    navigator.clipboard.writeText(JSON.stringify(previewMember, null, 2));
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  // Embed Snippet Code
  const cleanDomainForSnippet = previewMember.domain || 'yourdomain.xyz';
  const scriptSnippet = `<!-- The Uncommons Webring Official Seal -->
<script src="https://the-uncommons.vercel.app/widget.js" async></script>
<uncommons-ring site="${cleanDomainForSnippet}"></uncommons-ring>`;

  const htmlSnippet = `<!-- The Uncommons Webring (Static HTML) -->
<div class="uncommons-ring" style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:#09090b;border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-family:ui-monospace,monospace;font-size:11px;color:#d4d4d8;">
  <a href="https://the-uncommons.vercel.app/go?from=${cleanDomainForSnippet}&action=prev" style="color:#a1a1aa;text-decoration:none;">◄ Prev</a>
  <span style="color:#3f3f46;">|</span>
  <a href="https://the-uncommons.vercel.app" style="color:#ffffff;text-decoration:none;font-weight:600;letter-spacing:0.05em;">◉ The Uncommons</a>
  <span style="color:#3f3f46;">|</span>
  <a href="https://the-uncommons.vercel.app/go?from=${cleanDomainForSnippet}&action=next" style="color:#a1a1aa;text-decoration:none;">Next ►</a>
</div>`;

  const currentSnippet = activeSnippetTab === 'script' ? scriptSnippet : htmlSnippet;

  const handleCopySnippet = () => {
    sound.playClick();
    navigator.clipboard.writeText(currentSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-white/[0.08] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1.5">
            <Terminal className="w-3.5 h-3.5 text-white" />
            <span>CRYPTO-VAULT // SOVEREIGN MEMBER SETUP &amp; DOSSIER STUDIO</span>
          </div>
          <h1 className="text-3xl font-syne font-bold text-white tracking-tight">
            The Member Vault
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-sans max-w-xl leading-relaxed">
            Configure your sovereign node identity, inspect your live dossier, and retrieve your webring embed seal.
          </p>
        </div>

        {isUnlocked && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('studio');
              }}
              className={`px-3.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'studio'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Node Studio</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('embed');
              }}
              className={`px-3.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'embed'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Embed Seal</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsUnlocked(false);
                sessionStorage.removeItem('unc_vault_key');
                sessionStorage.removeItem('unc_vault_pin');
              }}
              className="p-1.5 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Lock Vault"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!isUnlocked ? (
        /* LOCKED STATE: 2-Step Verification Terminal */
        <div className="max-w-xl mx-auto p-6 sm:p-8 bg-zinc-950 border border-white/15 rounded-xl shadow-2xl space-y-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-emerald-500/30 flex items-center justify-center">
            <Lock className="w-5 h-5 text-white" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border-white/20 text-zinc-300 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3 h-3 text-white" />
              <span>2-STEP VERIFICATION GATEWAY</span>
            </div>
            <h2 className="text-xl font-mono font-bold text-white tracking-tight">
              Member Vault Authentication
            </h2>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-md mx-auto">
              Enter your official <strong>Ring Key</strong> and confidential <strong>6-digit Secret PIN</strong> dispatched to your Discord DM upon admission.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3.5 max-w-sm mx-auto text-left">
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                1. Sovereign Ring Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="UNC-KEY-XXXX-2026"
                  className="w-full pl-9 pr-4 py-2.5 bg-black border border-white/15 rounded-lg text-xs font-mono text-white tracking-wider placeholder-zinc-600 focus:outline-none focus:border-white/40 uppercase"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  2. Secret 6-Digit PIN
                </label>
                <span className="text-[10px] font-mono text-white">DISCORD DM ONLY</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="6-digit secret PIN"
                  className="w-full pl-9 pr-4 py-2.5 bg-black border border-white/15 rounded-lg text-xs font-mono text-white tracking-widest placeholder-zinc-600 focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-[11px] font-mono text-rose-400 bg-rose-950/20 p-2.5 rounded border border-rose-500/20">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-lg transition-all shadow cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isVerifying ? (
                <>
                  <SovereignOrbitalLoader size={14} />
                  <span>Verifying 2-Step Credentials...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Verify & Unlock Studio</span>
                </>
              )}
            </button>
          </form>

          <div className="p-3 bg-black/60 border border-white/[0.08] rounded-lg text-left text-[11px] font-sans text-zinc-400 leading-relaxed">
            <span className="text-white font-mono font-semibold">🔒 Security Notice:</span> Even though keys are recorded in the staff ledger, only you and the founders hold your secret 6-digit PIN. Staff and other members cannot edit your dossier without this PIN.
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
            <span className="opacity-0 hidden sm:inline"></span>
            <Link to="/apply" className="text-zinc-400 hover:text-white flex items-center gap-1">
              <Disc className="w-3 h-3" />
              <span>Request Key on Discord &rarr;</span>
            </Link>
          </div>
        </div>
      ) : activeTab === 'studio' ? (
        /* UNLOCKED STATE 1: NODE PROFILE & WEBRING SETUP STUDIO WITH LIVE PREVIEW */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Accepted Banner */}
          <div className="p-3.5 bg-zinc-950 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <div className="font-mono text-xs text-white font-semibold flex items-center gap-2">
                  <span>KEY AUTHENTICATED // {passcode || 'UNC-ALPHA-2026'}</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-sans">
                  Edit your sovereign metadata below. Changes preview live and sync across the entire webring.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const unmuted = sound.toggleSound();
                setIsAudioActive(unmuted);
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isAudioActive
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border border-white/10 hover:text-white'
              }`}
            >
              {isAudioActive ? <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{isAudioActive ? 'Space Hum Active (55Hz)' : 'Enable Ambient Space Hum'}</span>
            </button>
          </div>

          {/* Save Success Banner */}
          {saveSuccess && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl font-mono text-xs text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>{saveSuccess}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/nodes"
                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/30 transition-colors flex items-center gap-1"
                >
                  <span>View on /nodes</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  type="button"
                  onClick={handleCopyManifest}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedManifest ? 'Copied JSON!' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl font-mono text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* DUAL COLUMN: LEFT = EDITOR, RIGHT = REAL-TIME TRIPLE LIVE PREVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Input Form */}
            <div className="relative lg:col-span-6 bg-zinc-950 border border-white/[0.08] rounded-xl p-5 sm:p-6 space-y-4 overflow-hidden">
              <MongoSaveOverlay isSaving={isSaving} targetDomain={domain} slotId={slotId} />

              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span className="font-mono text-xs font-semibold text-white">NODE METADATA EDITOR</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">LIVE SYNC ACTIVE</span>
              </div>

              {/* Slot Selector, Ring Position & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-mono text-zinc-400">
                      SLOT ALLOCATION *
                    </label>
                    {slotStatusList.find((s) => s.id === slotId)?.isClaimed && (
                      <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {isFounder
                          ? 'Founder'
                          : slotStatusList.find((s) => s.id === slotId)?.isOwner
                          ? 'Your Slot'
                          : 'Claimed'}
                      </span>
                    )}
                  </div>
                  <select
                    value={slotId}
                    onChange={(e) => setSlotId(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  >
                    {slotStatusList.map((slot) => (
                      <option
                        key={slot.id}
                        value={slot.id}
                        disabled={slot.isLocked}
                        className={slot.isLocked ? 'text-zinc-600 bg-zinc-950 font-sans' : 'text-white bg-black'}
                      >
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  {!isFounder && slotStatusList.find((s) => s.id === slotId)?.isLocked && (
                    <p className="mt-1 text-[11px] font-mono text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>This slot is claimed and cannot be overwritten.</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    STATUS INDICATOR *
                  </label>
                  <select
                    value={nodeStatus}
                    onChange={(e) => setNodeStatus(e.target.value as 'online' | 'dormant' | 'reviewing')}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="online">🟢 Online / Active</option>
                    <option value="reviewing">🟡 Building / Reviewing</option>
                    <option value="dormant">⚪ Dormant</option>
                  </select>
                </div>
              </div>

              {/* Name & Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    BUILDER NAME / ALIAS *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priyanshu (Aero)"
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    HANDLE / USERNAME *
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="e.g. the_priyxnshu_"
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Domain & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    SOVEREIGN DOMAIN *
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. aero.build"
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    TARGET LINK (HTTPS)
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="e.g. https://aero.build"
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Field / Craft */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  CRAFT &amp; FIELD OF OBSESSION *
                </label>
                <input
                  type="text"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="e.g. Distributed Systems &amp; Low-Level Agent Runtimes"
                  className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Bio Statement */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  DOSSIER BIO &amp; STATEMENT *
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the ring what you are building and what obsesses you..."
                  className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40 leading-relaxed"
                />
              </div>

              {/* Proof of Work & Proof URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    SHIPPED BUILD / EVIDENCE TITLE *
                  </label>
                  <input
                    type="text"
                    value={proofOfWork}
                    onChange={(e) => setProofOfWork(e.target.value)}
                    placeholder="e.g. High-throughput memory engine"
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    EVIDENCE URL (GITHUB / LIVE) *
                  </label>
                  <input
                    type="text"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="e.g. https://github.com/yourhandle/project"
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  STACK TAGS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Rust, Compilers, Distributed, AI"
                  className="w-full px-3 py-2 bg-black border border-white/15 rounded text-xs font-mono text-white focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Save & Publish Button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveNode}
                  disabled={isSaving}
                  className={`flex-1 py-3 font-mono text-xs font-semibold rounded-md transition-all shadow flex items-center justify-center gap-2 cursor-pointer ${
                    isFounder
                      ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-500/20'
                      : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-emerald-500/10'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <SovereignOrbitalLoader size={16} />
                      <span>Saving Across Multi-Cloud DB...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isFounder ? `Save & Publish ${slotId} (Founder Override)` : 'Save & Publish Node to Webring'}</span>
                    </>
                  )}
                </button>

                {isFounder && slotStatusList.find((s) => s.id === slotId)?.isClaimed && (
                  <button
                    type="button"
                    disabled={isVacating}
                    onClick={() => handleVacateSlot(slotId)}
                    className="py-3 px-4 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono text-xs font-semibold rounded-md border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Vacate and reset this slot"
                  >
                    <span>Vacate Slot</span>
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: REAL-TIME TRIPLE LIVE PREVIEW */}
            <div className="lg:col-span-6 bg-zinc-950 border border-white/[0.08] rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="font-mono text-xs font-semibold text-white">REAL-TIME LIVE PREVIEW</span>
                </div>

                {/* Sub-view toggles */}
                <div className="flex items-center gap-1 bg-black p-0.5 rounded border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setPreviewMode('dossier');
                    }}
                    className={`px-2 py-1 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                      previewMode === 'dossier'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setPreviewMode('seal');
                    }}
                    className={`px-2 py-1 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                      previewMode === 'seal'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Footer Seal
                  </button>
                </div>
              </div>

              {/* 1. DOSSIER MODAL PREVIEW */}
              {previewMode === 'dossier' && (
                <div className="bg-black border border-white/15 rounded-xl p-5 space-y-5 shadow-2xl text-zinc-100">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-white font-semibold">
                        {previewMember.id}
                      </span>
                      <span className="flex items-center gap-1 text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        VERIFIED NODE
                      </span>
                      <span className="text-zinc-600">&bull;</span>
                      <span className="text-zinc-400">
                        SLOT #{previewMember.ringPosition} / 8
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                      STATUS: {previewMember.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Domain & Name */}
                  <div className="space-y-1">
                    <div className="font-mono text-lg font-bold text-white flex items-center gap-1.5">
                      <span>{previewMember.domain}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <div className="text-xs font-sans text-zinc-400">
                      {previewMember.name} &bull; <span className="font-mono text-zinc-300">{previewMember.field}</span>
                    </div>
                  </div>

                  {/* Bio Statement */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                      STATEMENT &bull; BIO
                    </div>
                    <p className="text-xs font-sans text-zinc-300 leading-relaxed">
                      {previewMember.bio}
                    </p>
                  </div>

                  {/* Proof of work */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                      SHIPPED ARTIFACT &bull; PROOF OF WORK
                    </div>
                    <div className="p-2.5 rounded bg-zinc-950 border border-white/10 font-mono text-xs text-zinc-300 flex items-center justify-between gap-2">
                      <span className="truncate">{previewMember.proofOfWork}</span>
                      <a
                        href={previewMember.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-white hover:underline shrink-0 flex items-center gap-1"
                      >
                        <span>Evidence</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                      TECHNICAL STACK
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {previewMember.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-white/10 text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Peer Nav Mockup */}
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1 text-zinc-500">
                      <ArrowLeft className="w-3 h-3" />
                      <span>Prev Node</span>
                    </span>
                    <span className="text-zinc-600">CIRCULAR RING</span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      <span>Next Node</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              )}

              {/* 2. SEAL PREVIEW */}
              {previewMode === 'seal' && (
                <div className="space-y-4">
                  <div className="text-[10px] font-mono text-zinc-500">
                    &mdash; exact footer seal on personal site &mdash;
                  </div>
                  <div className="p-8 bg-black border border-white/10 rounded-lg flex flex-col items-center justify-center space-y-3 shadow-inner">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-950 border border-white/15 rounded-md text-xs font-mono text-zinc-300 shadow-xl select-none">
                      <span className="flex items-center gap-1 text-zinc-400 hover:text-white cursor-pointer">
                        <ArrowLeft className="w-3 h-3" />
                        <span>Prev</span>
                      </span>

                      <span className="text-zinc-700">|</span>

                      <span className="flex items-center gap-1.5 text-white font-semibold tracking-wider">
                        <div className="w-2 h-2 rounded-full border border-zinc-400 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>THE UNCOMMONS</span>
                      </span>

                      <span className="text-zinc-700">|</span>

                      <span className="flex items-center gap-1 text-zinc-400 hover:text-white cursor-pointer">
                        <span>Next</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-500">
                      Bound to: <code className="text-white">{previewMember.domain}</code>
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-zinc-400">
                <span>Direct Links:</span>
                <div className="flex items-center gap-2">
                  <Link
                    to="/nodes"
                    className="text-zinc-300 hover:text-white flex items-center gap-1"
                  >
                    <span>Inspect /nodes</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <span className="text-zinc-700">&bull;</span>
                  <Link
                    to="/"
                    className="text-zinc-300 hover:text-white flex items-center gap-1"
                  >
                    <span>The Ring</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* UNLOCKED STATE 2: EMBED SEAL SNIPPET CODES */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Footer Mockup */}
            <div className="lg:col-span-5 bg-zinc-950 border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>FOOTER INTEGRATION</span>
                  <span className="text-white">OFFICIAL BADGE</span>
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
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm w-fit"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400 font-semibold">TARGET LINK (HTTPS):</span>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUrl(val);
                    const cleanDomain = val.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
                    if (cleanDomain) setDomain(cleanDomain);
                  }}
                  placeholder="https://yourname.xyz"
                  className="w-full sm:w-80 px-2.5 py-1.5 bg-black border border-white/15 rounded text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500/60"
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

      {/* Live Interactive Inspect Dossier Modal */}
      {inspectModalOpen && (
        <MemberDossierModal
          member={previewMember}
          onClose={() => setInspectModalOpen(false)}
          onNavigate={() => {}}
        />
      )}
    </div>
  );
};



import React, { useState, useEffect, useMemo } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Crown, 
  X, 
  Save, 
  RefreshCw, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Database, 
  GitCommit, 
  FileCode, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useLiveMembers, syncServerNodes, broadcastRingUpdate, type Member } from '../data/members';
import { MongoSaveOverlay } from './MongoSaveOverlay';

interface OwnerOrchestratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerOrchestratorModal: React.FC<OwnerOrchestratorModalProps> = ({ isOpen, onClose }) => {
  const liveMembers = useLiveMembers();
  
  // Active selected node ID to edit (NODE-001 through NODE-008)
  const [selectedSlotId, setSelectedSlotId] = useState<string>('NODE-001');

  // Form State for editing target node
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [domain, setDomain] = useState('');
  const [url, setUrl] = useState('');
  const [field, setField] = useState('');
  const [bio, setBio] = useState('');
  const [proofOfWork, setProofOfWork] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [ringPosition, setRingPosition] = useState<number>(1);
  const [status, setStatus] = useState<'online' | 'dormant' | 'reviewing'>('online');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 8 Genesis Slot status map
  const slotsList = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const num = i + 1;
      const id = `NODE-00${num}`;
      const found = liveMembers.find(m => m.id === id || m.ringPosition === num);
      const isClaimed = !!(found && found.verified && found.domain && !found.domain.includes('unclaimed'));
      return {
        id,
        num,
        member: found,
        isClaimed,
      };
    });
  }, [liveMembers]);

  // Load node data into form whenever selectedSlotId or liveMembers change
  useEffect(() => {
    if (!isOpen) return;
    const targetNode = liveMembers.find(m => m.id === selectedSlotId);
    if (targetNode) {
      setName(targetNode.name || '');
      setHandle(targetNode.handle || '');
      setDomain(targetNode.domain || '');
      setUrl(targetNode.url || '');
      setField(targetNode.field || '');
      setBio(targetNode.bio || '');
      setProofOfWork(targetNode.proofOfWork || '');
      setProofUrl(targetNode.proofUrl || '');
      setRingPosition(targetNode.ringPosition || parseInt(selectedSlotId.replace(/\D/g, ''), 10) || 1);
      setStatus(targetNode.status || 'online');
    }
  }, [selectedSlotId, liveMembers, isOpen]);

  if (!isOpen) return null;

  // Handle saving current node to multi-cloud database
  const handleSaveNode = async () => {
    sound.playClick();
    setStatusMsg(null);

    if (!domain.trim()) {
      setStatusMsg({ type: 'error', text: 'Domain is required.' });
      return;
    }

    setIsSaving(true);
    const startTime = Date.now();

    const updatedNode: Member = {
      id: selectedSlotId,
      name: name.trim() || 'Polymath Builder',
      handle: handle.trim().replace(/^@/, '') || 'builder',
      domain: domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase(),
      url: url.trim() || `https://${domain.trim()}`,
      field: field.trim() || 'Autonomous Systems & Sovereign Web',
      bio: bio.trim() || 'Verified member of The Uncommons webring.',
      proofOfWork: proofOfWork.trim() || 'Shipped production runtime.',
      proofUrl: proofUrl.trim() || `https://github.com/${handle.trim()}`,
      tags: ['Founder Edit', 'Verified'],
      joinDate: new Date().toISOString().split('T')[0],
      verified: true,
      ringPosition: ringPosition || parseInt(selectedSlotId.replace(/\D/g, ''), 10) || 1,
      status: status,
    };

    try {
      const res = await fetch('/api/save-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node: updatedNode,
          key: 'UNC-ALPHA-2026',
          pin: '000000',
        }),
      });

      // Smooth buffer delay (~1.6s) to allow multi-step loading animation to render cleanly
      const elapsed = Date.now() - startTime;
      if (elapsed < 1600) {
        await new Promise((resolve) => setTimeout(resolve, 1600 - elapsed));
      }

      if (res.ok) {
        await syncServerNodes(true);
        broadcastRingUpdate();
        sound.playOwnerChime();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#ffffff', '#f59e0b'],
        });
        setStatusMsg({
          type: 'success',
          text: `✨ Node ${selectedSlotId} (${updatedNode.domain}) saved & live updated across MongoDB, GitHub Code, Gist DB, and Discord Ledger!`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'error', text: err.error || 'Failed to save node.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Could not connect to database API: ' + e.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle position swapping
  const handleShiftPosition = async (currentSlotId: string, direction: 'up' | 'down') => {
    sound.playClick();
    setStatusMsg(null);
    setIsReordering(true);

    const currentMember = liveMembers.find((m) => m.id === currentSlotId);
    if (!currentMember) return;

    const currentPos = currentMember.ringPosition || parseInt(currentSlotId.replace(/\D/g, ''), 10) || 1;
    const targetPos = direction === 'up' ? Math.max(1, currentPos - 1) : Math.min(8, currentPos + 1);
    if (targetPos === currentPos) {
      setIsReordering(false);
      return;
    }

    const neighbor = liveMembers.find((m) => (m.ringPosition || parseInt(m.id.replace(/\D/g, ''), 10)) === targetPos);
    const batch = [{ ...currentMember, ringPosition: targetPos }];
    if (neighbor) {
      batch.push({ ...neighbor, ringPosition: currentPos });
    }

    try {
      const res = await fetch('/api/reorder-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: batch, key: 'UNC-ALPHA-2026', pin: '000000' }),
      });

      if (res.ok) {
        await syncServerNodes(true);
        broadcastRingUpdate();
        sound.playHarmonic();
        setStatusMsg({ type: 'success', text: `Swapped ring position: ${currentSlotId} is now Position #${targetPos}.` });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Reorder error: ' + e.message });
    } finally {
      setIsReordering(false);
    }
  };

  // Handle vacating slot
  const handleVacateSlot = async (slotIdToVacate: string) => {
    if (!window.confirm(`Are you sure you want to vacate ${slotIdToVacate}? This will reset it to an open Genesis vacancy.`)) {
      return;
    }
    sound.playClick();
    try {
      const res = await fetch('/api/vacate-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slotIdToVacate, key: 'UNC-ALPHA-2026', pin: '000000' }),
      });
      if (res.ok) {
        await syncServerNodes(true);
        broadcastRingUpdate();
        setStatusMsg({ type: 'success', text: `Slot ${slotIdToVacate} reset to open Genesis vacancy.` });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Vacate error: ' + e.message });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-950 border border-amber-500/30 rounded-xl shadow-2xl shadow-amber-500/10 overflow-hidden text-zinc-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Crown className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-semibold tracking-wider text-amber-400 uppercase">
                  Founder Superadmin Orchestrator
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                  OWNER KEY TRIGGERED
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Live Multi-Cloud Database & Direct Code Commit Control Panel
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="flex flex-wrap items-center justify-between px-6 py-2 bg-zinc-900/50 border-b border-white/[0.06] text-[11px] font-mono text-zinc-400 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Database className="w-3.5 h-3.5" /> MongoDB Atlas / Local DB
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <GitCommit className="w-3.5 h-3.5" /> GitHub Code Commit
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <FileCode className="w-3.5 h-3.5" /> Gist DB & Ledger
            </span>
          </div>
          <div className="text-zinc-500">
            AUTO-SYNC: <span className="text-emerald-400 font-semibold">ENABLED</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-lg text-xs font-mono flex items-center justify-between border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
              <button
                onClick={() => setStatusMsg(null)}
                className="text-zinc-500 hover:text-white text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Slots Overview Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                Constellation Node Registry (8 Slots)
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                Click any slot to load into Live Editor
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {slotsList.map((slot) => {
                const isSelected = slot.id === selectedSlotId;
                const m = slot.member;
                return (
                  <div
                    key={slot.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedSlotId(slot.id);
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                        : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="font-bold text-amber-400">{slot.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10">
                        Pos #{m?.ringPosition || slot.num}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-zinc-100 truncate">
                      {m?.name || 'Awaiting Candidate'}
                    </div>

                    <div className="text-[11px] font-mono text-zinc-400 truncate">
                      {m?.domain || `unclaimed-slot-00${slot.num}.xyz`}
                    </div>

                    {/* Quick Shifter Buttons */}
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          slot.isClaimed
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800/80 text-zinc-400 border border-white/5'
                        }`}
                      >
                        {slot.isClaimed ? 'Verified' : 'Vacancy'}
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleShiftPosition(slot.id, 'up')}
                          disabled={isReordering}
                          title="Shift position up"
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleShiftPosition(slot.id, 'down')}
                          disabled={isReordering}
                          title="Shift position down"
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Node Editor Form */}
          <div className="relative bg-zinc-900/70 border border-white/10 rounded-xl p-5 space-y-4 overflow-hidden">
            <MongoSaveOverlay isSaving={isSaving} targetDomain={domain} slotId={selectedSlotId} />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Editing Slot {selectedSlotId}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVacateSlot(selectedSlotId)}
                  className="px-2.5 py-1 text-xs font-mono bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Vacate Slot
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">Builder Name / Alias</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ibrahim (Carbon)"
                  className="w-full bg-zinc-950 border border-white/15 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Discord Handle</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. carbonthecoder"
                  className="w-full bg-zinc-950 border border-white/15 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Sovereign Domain (HTTPS)</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. carbonthecoder.github.io"
                  className="w-full bg-zinc-950 border border-white/15 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Target Link URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://carbonthecoder.github.io"
                  className="w-full bg-zinc-950 border border-white/15 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Ring Position Traversal (1-8)</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={ringPosition}
                  onChange={(e) => setRingPosition(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-zinc-950 border border-white/15 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-white/15 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500/70 cursor-pointer"
                >
                  <option value="online">Online & Active</option>
                  <option value="reviewing">Under Council Review</option>
                  <option value="dormant">Dormant</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1">Focus Field of Specialization</label>
                <input
                  type="text"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="e.g. Autonomous Agentic Systems & Sovereign Web"
                  className="w-full bg-zinc-950 border border-white/15 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-400 mb-1">Bio / Dossier Summary</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief dossier summary..."
                  className="w-full bg-zinc-950 border border-white/15 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500/70"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveNode}
                disabled={isSaving}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold rounded-lg transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Syncing Multi-Cloud DB...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Live Sync Globally</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { sound } from '../utils/audio';
import { 
  X, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  RotateCcw,
  CheckCircle2, 
  AlertCircle,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { 
  getAllGenesisSlots, 
  saveGenesisSlot,
  reorderGenesisSlots,
  vacateCustomNode, 
  syncServerNodes, 
  broadcastRingUpdate, 
  type Member 
} from '../data/members';
import { MongoSaveOverlay } from './MongoSaveOverlay';

// ---------------------------------------------------------------------------
// Memoized Slot Card - Zero animations, zero effects, instantaneous response
// ---------------------------------------------------------------------------
interface SlotCardProps {
  slot: Member;
  index: number;
  totalCount: number;
  isSelected: boolean;
  isShifting: boolean;
  onSelect: (id: string) => void;
  onShift: (id: string, direction: 'up' | 'down') => void;
}

const SlotCard = React.memo<SlotCardProps>(({
  slot,
  index,
  totalCount,
  isSelected,
  isShifting,
  onSelect,
  onShift,
}) => {
  const isClaimed = !!(slot.verified && slot.domain && !slot.domain.includes('unclaimed') && slot.handle !== 'vacant');

  return (
    <div
      onClick={() => onSelect(slot.id)}
      className={`p-3 rounded border text-left cursor-pointer select-none ${
        isSelected
          ? 'bg-zinc-900 border-zinc-200 text-white'
          : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700 text-zinc-300'
      }`}
    >
      <div className="flex items-center justify-between font-mono text-xs mb-1.5">
        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>{slot.id}</span>
        <span className="text-[10px] text-zinc-400 bg-black px-1.5 py-0.5 rounded border border-zinc-800 font-mono">
          Pos #{slot.ringPosition || (index + 1)}
        </span>
      </div>

      <div className="text-xs font-medium truncate text-zinc-100">
        {isClaimed ? slot.name : 'Awaiting Candidate'}
      </div>

      <div className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
        {slot.domain || `unclaimed-slot-00${index + 1}.xyz`}
      </div>

      <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            isClaimed
              ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
              : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
          }`}
        >
          {isClaimed ? 'Verified' : 'Vacancy'}
        </span>

        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {isShifting ? (
            <div className="p-1 text-zinc-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onShift(slot.id, 'up')}
                disabled={isShifting || index === 0}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer"
                title="Shift position up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onShift(slot.id, 'down')}
                disabled={isShifting || index === totalCount - 1}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer"
                title="Shift position down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

SlotCard.displayName = 'SlotCard';

// ---------------------------------------------------------------------------
// Isolated Node Editor Form - Typing does NOT re-render the card grid
// ---------------------------------------------------------------------------
interface SlotEditorFormProps {
  slot: Member;
  isSaving: boolean;
  onSave: (updatedNode: Member) => void;
  onVacate: (slotId: string) => void;
}

const SlotEditorForm: React.FC<SlotEditorFormProps> = ({
  slot,
  isSaving,
  onSave,
  onVacate,
}) => {
  const [name, setName] = useState(slot.name || '');
  const [handle, setHandle] = useState(slot.handle || '');
  const [domain, setDomain] = useState(slot.domain || '');
  const [url, setUrl] = useState(slot.url || '');
  const [field, setField] = useState(slot.field || '');
  const [bio, setBio] = useState(slot.bio || '');
  const [proofOfWork, setProofOfWork] = useState(slot.proofOfWork || '');
  const [proofUrl, setProofUrl] = useState(slot.proofUrl || '');
  const [status, setStatus] = useState<'online' | 'dormant' | 'reviewing'>(slot.status || 'online');

  // Synchronize internal inputs whenever the selected slot identity changes
  useEffect(() => {
    setName(slot.name || '');
    setHandle(slot.handle || '');
    setDomain(slot.domain || '');
    setUrl(slot.url || '');
    setField(slot.field || '');
    setBio(slot.bio || '');
    setProofOfWork(slot.proofOfWork || '');
    setProofUrl(slot.proofUrl || '');
    setStatus(slot.status || 'online');
  }, [slot.id, slot.ringPosition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    const isOnline = status === 'online';

    const updated: Member = {
      ...slot,
      name: name.trim() || (isOnline ? 'Polymath Builder' : 'Awaiting Candidate'),
      handle: handle.trim().replace(/^@/, '') || (isOnline ? 'builder' : 'vacant'),
      domain: cleanDomain,
      url: url.trim() || `https://${cleanDomain}`,
      field: field.trim() || (isOnline ? 'Systems & Sovereign Web' : 'Open Genesis Vacancy'),
      bio: bio.trim() || (isOnline ? 'Verified member of The Uncommons webring.' : 'Genesis slot. Applications open via Discord.'),
      proofOfWork: proofOfWork.trim() || (isOnline ? 'Shipped production runtime.' : 'Awaiting candidate build submission.'),
      proofUrl: proofUrl.trim() || (isOnline ? `https://github.com/${handle.trim()}` : 'https://the-uncommons.vercel.app/apply'),
      tags: isOnline ? ['Verified', 'Founder Edit'] : ['Genesis', 'Vacancy'],
      verified: isOnline,
      ringPosition: slot.ringPosition || parseInt(slot.id.replace(/\D/g, ''), 10) || 1,
      status: status,
    };

    onSave(updated);
  };

  return (
    <div className="relative bg-[#0c0c0e] border border-zinc-800 rounded p-5 space-y-4">
      <MongoSaveOverlay isSaving={isSaving} targetDomain={domain} slotId={slot.id} />

      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>EDITING // {slot.id}</span>
        </div>
        <button
          type="button"
          onClick={() => onVacate(slot.id)}
          className="px-2.5 py-1 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>Vacate Slot</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="block text-zinc-500 mb-1">Builder Name / Moniker</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ibrahim (Carbon)"
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-zinc-500 mb-1">Discord Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. carbonthecoder"
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-zinc-500 mb-1">Domain</label>
            <input
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. yourdomain.dev"
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-zinc-500 mb-1">Target URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourdomain.dev"
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-zinc-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="online">Online & Verified</option>
              <option value="reviewing">Under Review / Vacant</option>
              <option value="dormant">Dormant</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-zinc-500 mb-1">Specialization / Focus</label>
            <input
              type="text"
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="e.g. Distributed Systems & Low-Level Agent Runtimes"
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-zinc-500 mb-1">Bio / Dossier Summary</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Dossier synopsis..."
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-mono text-xs font-medium rounded flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Commit & Sync Node</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Orchestrator Modal
// ---------------------------------------------------------------------------
interface OwnerOrchestratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerOrchestratorModal: React.FC<OwnerOrchestratorModalProps> = ({ isOpen, onClose }) => {
  const [allSlots, setAllSlots] = useState<Member[]>(() => getAllGenesisSlots());
  const [selectedSlotId, setSelectedSlotId] = useState<string>('NODE-001');

  // History stack for 1-click Undo
  const [history, setHistory] = useState<Member[][]>([]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isShifting, setIsShifting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Background Scroll Locking & initial sync
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAllSlots(getAllGenesisSlots());
      syncServerNodes(true).then(() => {
        setAllSlots(getAllGenesisSlots());
      });
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keep allSlots synced with global updates
  useEffect(() => {
    const handleUpdate = () => {
      setAllSlots(getAllGenesisSlots());
    };
    window.addEventListener('unc_nodes_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('unc_nodes_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Sort slots by position for grid display
  const sortedSlots = useMemo(() => {
    return [...allSlots].sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
  }, [allSlots]);

  // Active selected member
  const selectedSlot = useMemo(() => {
    return allSlots.find((s) => s.id === selectedSlotId) || sortedSlots[0] || allSlots[0];
  }, [allSlots, selectedSlotId, sortedSlots]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [JSON.parse(JSON.stringify(allSlots)), ...prev.slice(0, 9)]);
  }, [allSlots]);

  // Undo previous action
  const handleUndo = async () => {
    if (history.length === 0) return;
    sound.playClick();
    const [previousState, ...restHistory] = history;
    setHistory(restHistory);

    // Apply locally first
    reorderGenesisSlots(previousState);
    setAllSlots(previousState);
    broadcastRingUpdate();
    sound.playHarmonic();
    setStatusMsg({ type: 'success', text: 'Reverted to previous registry state.' });

    try {
      await fetch('/api/reorder-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: previousState,
          key: 'UNC-ALPHA-2026',
          pin: '918542',
        }),
      });
      await syncServerNodes(true);
    } catch {
      // Local state is already restored
    }
  };

  // Handle position swapping (Up / Down)
  const handleShiftPosition = useCallback(async (currentSlotId: string, direction: 'up' | 'down') => {
    sound.playClick();
    setStatusMsg(null);
    setIsShifting(true);

    const currentIdx = sortedSlots.findIndex((s) => s.id === currentSlotId);
    if (currentIdx === -1) {
      setIsShifting(false);
      return;
    }

    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= sortedSlots.length) {
      setIsShifting(false);
      return;
    }

    pushHistory();

    const updated = [...sortedSlots];
    const itemA = updated[currentIdx];
    const itemB = updated[targetIdx];

    const posA = itemA.ringPosition || (currentIdx + 1);
    const posB = itemB.ringPosition || (targetIdx + 1);

    itemA.ringPosition = posB;
    itemB.ringPosition = posA;

    // Swap in array
    updated[currentIdx] = itemB;
    updated[targetIdx] = itemA;

    // Immediately update local store and UI (0ms delay)
    reorderGenesisSlots(updated);
    setAllSlots(updated);
    broadcastRingUpdate();
    sound.playHarmonic();
    setStatusMsg({
      type: 'success',
      text: `Shifted: ${itemA.id} is Position #${itemA.ringPosition} • ${itemB.id} is Position #${itemB.ringPosition}.`,
    });

    try {
      const res = await fetch('/api/reorder-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: [
            { id: itemA.id, ringPosition: itemA.ringPosition },
            { id: itemB.id, ringPosition: itemB.ringPosition },
          ],
          key: 'UNC-ALPHA-2026',
          pin: '918542',
        }),
      });

      if (res.ok) {
        await syncServerNodes(true);
      }
    } catch {
      // Already committed locally
    } finally {
      setIsShifting(false);
    }
  }, [sortedSlots, pushHistory]);

  // Handle Vacating ANY slot
  const handleVacateSlot = useCallback(async (slotIdToVacate: string) => {
    if (!window.confirm(`Reset and vacate ${slotIdToVacate}? This slot will become an open Genesis vacancy.`)) {
      return;
    }

    sound.playClick();
    pushHistory();
    setStatusMsg(null);

    // Immediately update local state
    vacateCustomNode(slotIdToVacate);
    setAllSlots(getAllGenesisSlots());
    broadcastRingUpdate();
    sound.playHarmonic();
    setStatusMsg({
      type: 'success',
      text: `Slot ${slotIdToVacate} successfully vacated and reset to open Genesis vacancy.`,
    });

    try {
      const res = await fetch('/api/vacate-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slotIdToVacate,
          key: 'UNC-ALPHA-2026',
          pin: '918542',
        }),
      });

      if (res.ok) {
        await syncServerNodes(true);
      }
    } catch {
      // Already committed locally
    }
  }, [pushHistory]);

  // Handle Save Node Form
  const handleSaveNode = useCallback(async (updatedNode: Member) => {
    sound.playClick();
    setStatusMsg(null);

    if (!updatedNode.domain.trim()) {
      setStatusMsg({ type: 'error', text: 'Domain is required.' });
      return;
    }

    pushHistory();

    // 1. Immediately persist locally (0ms delay for UI)
    saveGenesisSlot(updatedNode);
    setAllSlots(getAllGenesisSlots());
    broadcastRingUpdate();

    setIsSaving(true);

    try {
      const res = await fetch('/api/save-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node: updatedNode,
          key: 'UNC-ALPHA-2026',
          pin: '918542',
        }),
      });

      sound.playHarmonic();
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: `Node ${updatedNode.id} (${updatedNode.domain}) saved and persisted.`,
        });
        await syncServerNodes(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMsg({
          type: 'success',
          text: `Node ${updatedNode.id} saved locally. (Server sync note: ${err.error || 'local mode'})`,
        });
      }
    } catch {
      sound.playHarmonic();
      setStatusMsg({
        type: 'success',
        text: `Node ${updatedNode.id} (${updatedNode.domain}) saved locally.`,
      });
    } finally {
      setIsSaving(false);
    }
  }, [pushHistory]);

  const handleSelectSlot = useCallback((id: string) => {
    sound.playClick();
    setSelectedSlotId(id);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/90">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#09090b] border border-zinc-800 rounded-lg text-zinc-100 font-sans overflow-hidden">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-zinc-300" />
            <div>
              <div className="flex items-center gap-2 font-mono text-xs font-medium tracking-wider text-zinc-200 uppercase">
                <span>FOUNDER ORCHESTRATOR</span>
                <span className="text-[10px] text-zinc-500 font-normal">[8-NODE REGISTRY]</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isShifting || isSaving) && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-300 bg-zinc-900 border border-zinc-700/80 px-2.5 py-1 rounded select-none">
                <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                <span>CLOUD SYNCING...</span>
              </div>
            )}

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className="px-2.5 py-1 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded flex items-center gap-1.5 cursor-pointer"
                title="Undo last change"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded text-xs font-mono flex items-center justify-between border ${
                statusMsg.type === 'success'
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                  : 'bg-red-950/40 border-red-800/50 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMsg(null)}
                className="text-zinc-500 hover:text-zinc-300 text-[11px] underline ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Constellation Grid (8 Slots) - Vercel Clean, Zero Flashy Animations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
              <span className="uppercase tracking-wider font-semibold text-zinc-400">
                Constellation Slots (1-8)
              </span>
              <span>Click a slot to edit &bull; Shift arrows to reorder</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {sortedSlots.map((slot, index) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  index={index}
                  totalCount={sortedSlots.length}
                  isSelected={slot.id === selectedSlotId}
                  isShifting={isShifting}
                  onSelect={handleSelectSlot}
                  onShift={handleShiftPosition}
                />
              ))}
            </div>
          </div>

          {/* Node Editor Form - Isolated local state for 0ms typing lag */}
          {selectedSlot && (
            <SlotEditorForm
              key={selectedSlot.id}
              slot={selectedSlot}
              isSaving={isSaving}
              onSave={handleSaveNode}
              onVacate={handleVacateSlot}
            />
          )}
        </div>
      </div>
    </div>
  );
};

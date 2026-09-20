import React, { useState, useEffect, useMemo } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  X, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  RotateCcw,
  CheckCircle2, 
  AlertCircle,
  Terminal
} from 'lucide-react';
import { 
  getAllGenesisSlots, 
  syncServerNodes, 
  broadcastRingUpdate, 
  vacateCustomNode, 
  type Member 
} from '../data/members';
import { MongoSaveOverlay } from './MongoSaveOverlay';

interface OwnerOrchestratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerOrchestratorModal: React.FC<OwnerOrchestratorModalProps> = ({ isOpen, onClose }) => {
  const [allSlots, setAllSlots] = useState<Member[]>(() => getAllGenesisSlots());
  const [selectedSlotId, setSelectedSlotId] = useState<string>('NODE-001');

  // History stack for 1-click Undo
  const [history, setHistory] = useState<Member[][]>([]);

  // Form State
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
  const [isShifting, setIsShifting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Background Scroll Locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Sync fresh data
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
    return () => window.removeEventListener('unc_nodes_updated', handleUpdate);
  }, []);

  // Populate form fields when selected slot changes
  useEffect(() => {
    if (!isOpen) return;
    const target = allSlots.find((s) => s.id === selectedSlotId);
    if (target) {
      setName(target.name || '');
      setHandle(target.handle || '');
      setDomain(target.domain || '');
      setUrl(target.url || '');
      setField(target.field || '');
      setBio(target.bio || '');
      setProofOfWork(target.proofOfWork || '');
      setProofUrl(target.proofUrl || '');
      setRingPosition(target.ringPosition || parseInt(selectedSlotId.replace(/\D/g, ''), 10) || 1);
      setStatus(target.status || 'online');
    }
  }, [selectedSlotId, allSlots, isOpen]);

  // Sort slots by position for grid display
  const sortedSlots = useMemo(() => {
    return [...allSlots].sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
  }, [allSlots]);

  if (!isOpen) return null;

  const pushHistory = () => {
    setHistory((prev) => [JSON.parse(JSON.stringify(allSlots)), ...prev.slice(0, 9)]);
  };

  // Undo previous action
  const handleUndo = async () => {
    if (history.length === 0) return;
    sound.playClick();
    const [previousState, ...restHistory] = history;
    setHistory(restHistory);

    try {
      const res = await fetch('/api/reorder-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: previousState,
          key: 'UNC-ALPHA-2026',
          pin: '918542',
        }),
      });
      if (res.ok) {
        setAllSlots(previousState);
        await syncServerNodes(true);
        broadcastRingUpdate();
        sound.playHarmonic();
        setStatusMsg({ type: 'success', text: 'Reverted to previous registry state.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to apply undo.' });
    }
  };

  // Handle position swapping (Up / Down)
  const handleShiftPosition = async (currentSlotId: string, direction: 'up' | 'down') => {
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

    setAllSlots(updated);

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
        broadcastRingUpdate();
        sound.playHarmonic();
        setStatusMsg({
          type: 'success',
          text: `Swapped: ${itemA.id} is now Position #${itemA.ringPosition} • ${itemB.id} is Position #${itemB.ringPosition}.`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'error', text: err.error || 'Failed to update positions.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Connection failed: ' + e.message });
    } finally {
      setIsShifting(false);
    }
  };

  // Handle Vacating ANY slot (including verified ones)
  const handleVacateSlot = async (slotIdToVacate: string) => {
    if (!window.confirm(`Are you sure you want to reset and vacate ${slotIdToVacate}? This slot will become an open Genesis vacancy.`)) {
      return;
    }

    sound.playClick();
    pushHistory();
    setStatusMsg(null);

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

      vacateCustomNode(slotIdToVacate);

      if (res.ok) {
        await syncServerNodes(true);
        setAllSlots(getAllGenesisSlots());
        broadcastRingUpdate();
        sound.playHarmonic();
        setStatusMsg({
          type: 'success',
          text: `Slot ${slotIdToVacate} successfully vacated and reset to open Genesis vacancy.`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'error', text: err.error || 'Could not vacate slot.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Error: ' + e.message });
    }
  };

  // Handle Save Node Form
  const handleSaveNode = async () => {
    sound.playClick();
    setStatusMsg(null);

    if (!domain.trim()) {
      setStatusMsg({ type: 'error', text: 'Domain is required.' });
      return;
    }

    pushHistory();
    setIsSaving(true);
    const startTime = Date.now();

    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    const updatedNode: Member = {
      id: selectedSlotId,
      name: name.trim() || 'Polymath Builder',
      handle: handle.trim().replace(/^@/, '') || 'builder',
      domain: cleanDomain,
      url: url.trim() || `https://${cleanDomain}`,
      field: field.trim() || 'Systems & Sovereign Web',
      bio: bio.trim() || 'Verified member of The Uncommons webring.',
      proofOfWork: proofOfWork.trim() || 'Shipped production runtime.',
      proofUrl: proofUrl.trim() || `https://github.com/${handle.trim()}`,
      tags: ['Verified', 'Founder Edit'],
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
          pin: '918542',
        }),
      });

      // 6.2s delay for clean terminal save sequence
      const elapsed = Date.now() - startTime;
      if (elapsed < 6200) {
        await new Promise((resolve) => setTimeout(resolve, 6200 - elapsed));
      }

      if (res.ok) {
        await syncServerNodes(true);
        setAllSlots(getAllGenesisSlots());
        broadcastRingUpdate();
        sound.playHarmonic();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#a1a1aa', '#52525b'],
        });
        setStatusMsg({
          type: 'success',
          text: `Node ${selectedSlotId} (${updatedNode.domain}) saved and synced across database & origin/main.`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'error', text: err.error || 'Failed to persist node.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Error: ' + e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl text-zinc-100 font-sans overflow-hidden">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-zinc-200 animate-pulse" />
            <div>
              <div className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-zinc-200 uppercase">
                <span>FOUNDER ORCHESTRATOR</span>
                <span className="text-[10px] text-zinc-500 font-normal">[8-NODE REGISTRY]</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleUndo}
                className="px-2.5 py-1 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Undo last change"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1 text-zinc-500 hover:text-zinc-200 border border-zinc-800 rounded transition-colors cursor-pointer"
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
              className={`p-3 rounded-lg text-xs font-mono flex items-center justify-between border ${
                statusMsg.type === 'success'
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                  : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
              <button
                onClick={() => setStatusMsg(null)}
                className="text-zinc-500 hover:text-zinc-300 text-[11px] underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Constellation Grid (8 Slots) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
              <span className="uppercase tracking-wider font-semibold text-zinc-400">
                Constellation Slots (1-8)
              </span>
              <span>Click a slot to edit • Use arrows to shift order</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {sortedSlots.map((slot, index) => {
                const isSelected = slot.id === selectedSlotId;
                const isClaimed = !!(slot.verified && slot.domain && !slot.domain.includes('unclaimed') && slot.handle !== 'vacant');

                return (
                  <div
                    key={slot.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedSlotId(slot.id);
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-900 border-zinc-500 ring-1 ring-zinc-500'
                        : 'bg-[#0e0e11] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                      <span className="font-semibold text-zinc-200">{slot.id}</span>
                      <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        Pos #{slot.ringPosition || (index + 1)}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-zinc-200 truncate">
                      {isClaimed ? slot.name : 'Awaiting Candidate'}
                    </div>

                    <div className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
                      {slot.domain || `unclaimed-slot-00${index + 1}.xyz`}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-zinc-850 flex items-center justify-between text-xs font-mono">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isClaimed
                            ? 'bg-zinc-850 text-zinc-300 border border-zinc-750'
                            : 'bg-zinc-900 text-zinc-600 border border-zinc-850'
                        }`}
                      >
                        {isClaimed ? 'Verified' : 'Vacancy'}
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleShiftPosition(slot.id, 'up')}
                          disabled={isShifting || index === 0}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          title="Shift position up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleShiftPosition(slot.id, 'down')}
                          disabled={isShifting || index === sortedSlots.length - 1}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          title="Shift position down"
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

          {/* Node Editor Form */}
          <div className="relative bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 space-y-4 overflow-hidden">
            <MongoSaveOverlay isSaving={isSaving} targetDomain={domain} slotId={selectedSlotId} />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>EDITING // {selectedSlotId}</span>
              </div>
              <button
                type="button"
                onClick={() => handleVacateSlot(selectedSlotId)}
                className="px-2.5 py-1 text-xs font-mono bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800/40 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Vacate Slot</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-500 mb-1">Builder Name / Moniker</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ibrahim (Carbon)"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Discord Handle</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. carbonthecoder"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. yourdomain.dev"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Target URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourdomain.dev"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Ring Position Traversal (1-8)</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={ringPosition}
                  onChange={(e) => setRingPosition(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
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
                  className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-500 mb-1">Bio / Dossier Summary</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Dossier synopsis..."
                  className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveNode}
                disabled={isSaving}
                className="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded transition-all shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Commit & Sync Node</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

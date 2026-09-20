import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, ArrowRight, AlertCircle } from 'lucide-react';
import { sound } from '../utils/audio';

interface OwnerPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerPasscodeModal: React.FC<OwnerPasscodeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(false);
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (passcode.trim() === '918542') {
      sound.playHarmonic();
      sessionStorage.setItem('unc_vault_key', 'UNC-ALPHA-2026');
      sessionStorage.setItem('unc_vault_pin', '918542');
      sessionStorage.setItem('unc_vault_verified', 'true');
      sessionStorage.setItem('unc_owner_mode', 'true');
      window.dispatchEvent(new Event('unc_owner_activated'));
      onSuccess();
    } else {
      sound.playTick();
      setError(true);
      setPasscode('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm p-6 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl text-zinc-200 font-mono space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>FOUNDER ACCESS GATE</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 text-xs">
          <div className="text-zinc-100 font-semibold">Enter Master Passcode</div>
          <p className="text-zinc-500 text-[11px] leading-relaxed">
            Provide the 6-digit founder authorization passcode to unlock webring orchestration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={passcode}
              onChange={(e) => {
                setError(false);
                setPasscode(e.target.value);
              }}
              placeholder="••••••"
              className={`w-full px-3.5 py-2.5 bg-black border rounded-lg text-center tracking-[0.4em] text-sm font-mono text-white placeholder-zinc-700 focus:outline-none transition-colors ${
                error ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 focus:border-zinc-600'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-sans">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Invalid master passcode. Access denied.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>Authenticate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

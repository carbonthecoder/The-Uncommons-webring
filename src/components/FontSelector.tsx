import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';
import { Type, Check, ChevronDown } from 'lucide-react';

export interface FontOption {
  id: string;
  name: string;
  label: string;
  sampleFamily: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    label: 'Option 3 (Bespoke Tech)',
    sampleFamily: "'Space Grotesk', sans-serif",
  },
  {
    id: 'geist',
    name: 'Geist Sans',
    label: 'Vercel / Linear Aesthetic',
    sampleFamily: "'Geist', sans-serif",
  },
  {
    id: 'inter',
    name: 'Inter',
    label: 'Clean Modern Standard',
    sampleFamily: "'Inter', sans-serif",
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    label: 'Crisp Geometric',
    sampleFamily: "'Plus Jakarta Sans', sans-serif",
  },
  {
    id: 'syne',
    name: 'Syne',
    label: 'Avant-Garde Bold',
    sampleFamily: "'Syne', sans-serif",
  },
];

export const FontSelector: React.FC = () => {
  const [activeFont, setActiveFont] = useState<string>(() => {
    return localStorage.getItem('uncommons_font') || 'space-grotesk';
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-font', activeFont);
    localStorage.setItem('uncommons_font', activeFont);
  }, [activeFont]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectFont = (fontId: string) => {
    sound.playClick();
    setActiveFont(fontId);
    setIsOpen(false);
  };

  const currentFontObj = FONT_OPTIONS.find((f) => f.id === activeFont) || FONT_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          sound.playTick();
          setIsOpen((prev) => !prev);
        }}
        title="Change typography font"
        className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-md border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white bg-zinc-950/90 transition-all cursor-pointer shadow-sm"
      >
        <Type className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline text-zinc-400 font-mono">FONT:</span>
        <span className="font-semibold" style={{ fontFamily: currentFontObj.sampleFamily }}>
          {currentFontObj.name}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 p-1.5 bg-zinc-950/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-b border-white/[0.08] mb-1 flex items-center justify-between">
            <span>Select Font</span>
            <span className="text-zinc-600">LIVE PREVIEW</span>
          </div>

          <div className="space-y-0.5">
            {FONT_OPTIONS.map((font) => {
              const isSelected = font.id === activeFont;
              return (
                <button
                  key={font.id}
                  onClick={() => selectFont(font.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 text-white font-medium border border-white/10'
                      : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex flex-col">
                    <span
                      className="text-xs sm:text-sm tracking-tight"
                      style={{ fontFamily: font.sampleFamily }}
                    >
                      {font.name}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 group-hover:text-zinc-400">
                      {font.label}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

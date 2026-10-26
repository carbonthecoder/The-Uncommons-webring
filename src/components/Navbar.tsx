import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Menu, X, ArrowUpRight, Palette, Check } from 'lucide-react';

interface NavbarProps {
  nodeCount: number;
}

const THEMES = [
  { id: 'espresso', label: 'Espresso', dot: '#d97706' },
  { id: 'midnight', label: 'Midnight', dot: '#38bdf8' },
  { id: 'obsidian', label: 'Obsidian', dot: '#e4e4e7' },
  { id: 'parchment', label: 'Parchment', dot: '#b45309' },
] as const;

type ThemeId = typeof THEMES[number]['id'];

const ForgejoIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M16.7773 0c1.6018 0 2.9004 1.2986 2.9004 2.9005s-1.2986 2.9004-2.9004 2.9004c-1.0854 0-2.0315-.596-2.5288-1.4787H12.91c-2.3322 0-4.2272 1.8718-4.2649 4.195l-.0007 2.1175a7.0759 7.0759 0 0 1 4.148-1.4205l.1176-.001 1.3385.0002c.4973-.8827 1.4434-1.4788 2.5288-1.4788 1.6018 0 2.9004 1.2986 2.9004 2.9005s-1.2986 2.9004-2.9004 2.9004c-1.0854 0-2.0315-.596-2.5288-1.4787H12.91c-2.3322 0-4.2272 1.8718-4.2649 4.195l-.0007 2.319c.8827.4973 1.4788 1.4434 1.4788 2.5287 0 1.602-1.2986 2.9005-2.9005 2.9005-1.6018 0-2.9004-1.2986-2.9004-2.9005 0-1.0853.596-2.0314 1.4788-2.5287l-.0002-9.9831c0-3.887 3.1195-7.0453 6.9915-7.108l.1176-.001h1.3385C14.7458.5962 15.692 0 16.7773 0ZM7.2227 19.9052c-.6596 0-1.1943.5347-1.1943 1.1943s.5347 1.1943 1.1943 1.1943 1.1944-.5347 1.1944-1.1943-.5348-1.1943-1.1944-1.1943Zm9.5546-10.4644c-.6596 0-1.1944.5347-1.1944 1.1943s.5348 1.1943 1.1944 1.1943c.6596 0 1.1943-.5347 1.1943-1.1943s-.5347-1.1943-1.1943-1.1943Zm0-7.7346c-.6596 0-1.1944.5347-1.1944 1.1943s.5348 1.1943 1.1944 1.1943c.6596 0 1.1943-.5347 1.1943-1.1943s-.5347-1.1943-1.1943-1.1943Z" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ nodeCount }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unc_theme') as ThemeId;
      if (saved && THEMES.some(t => t.id === saved)) return saved;
    }
    return 'espresso';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('unc_theme', theme);
    }
  }, [theme]);

  // Close theme menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsThemeMenuOpen(false);
  }, [location.pathname]);

  const toggleSound = () => {
    const unmuted = sound.toggleSound();
    setIsMuted(!unmuted);
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-full transition-colors text-xs font-mono cursor-pointer flex items-center gap-1.5 ${
      isActive
        ? 'bg-[#25221e] text-amber-400 font-medium shadow-sm border border-white/10'
        : 'text-[#8c8376] hover:text-[#f5f0e8]'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-mono transition-colors ${
      isActive
        ? 'bg-[#25221e] text-amber-400 font-semibold border border-white/10'
        : 'text-[#8c8376] hover:text-[#f5f0e8] hover:bg-[#1c1a17]'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#121110]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Brand */}
        <Link 
          to="/" 
          onClick={() => {
            sound.playClick();
            setIsMobileMenuOpen(false);
          }} 
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="relative w-6 h-6 flex items-center justify-center border border-white/15 rounded-full group-hover:border-amber-500/50 transition-colors bg-[#181614]">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-base tracking-wide text-[#fbf9f5] font-normal group-hover:text-amber-400 transition-colors">
              The Uncommons
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center p-1 bg-[#181614] border border-white/[0.08] rounded-full">
          <NavLink to="/" end className={navClass} onClick={() => sound.playClick()}>
            The Ring
          </NavLink>
          <NavLink to="/forge" className={navClass} onClick={() => sound.playClick()}>
            Sovereign Git
          </NavLink>
          <NavLink to="/widget" className={navClass} onClick={() => sound.playClick()}>
            Widget Guide
          </NavLink>
          <NavLink to="/members" className={navClass} onClick={() => sound.playClick()}>
            Members ({nodeCount})
          </NavLink>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* External Git Forge Shortcut */}
          <a
            href="https://git.carbon.is-a.dev"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-lg border border-amber-500/20 text-amber-400/90 hover:text-amber-300 bg-[#181614] hover:bg-[#201d1a] transition-colors"
            title="Open Sovereign Forgejo Instance"
          >
            <ForgejoIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>Git Instance</span>
            <ArrowUpRight className="w-3 h-3 text-[#756e63]" />
          </a>

          {/* Cute Theme Selector Popover (Zero emojis) */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => {
                sound.playClick();
                setIsThemeMenuOpen(!isThemeMenuOpen);
              }}
              title="Select color palette"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono rounded-lg border border-white/10 hover:border-white/20 text-[#8c8376] hover:text-[#f5f0e8] bg-[#181614] transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline uppercase text-[10px] tracking-wider text-[#c4bcaf]">
                {THEMES.find(t => t.id === theme)?.label}
              </span>
            </button>

            {/* Cute Popover Box */}
            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#181614] p-1.5 shadow-2xl backdrop-blur-md z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#756e63]">
                  Color Palette
                </div>
                {THEMES.map((t) => {
                  const isSelected = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        sound.playClick();
                        setTheme(t.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#25221e] text-amber-400 font-semibold border border-white/10'
                          : 'text-[#c4bcaf] hover:text-white hover:bg-[#201d1a]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.dot }}
                        />
                        <span>{t.label}</span>
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? "Enable ambient audio" : "Mute audio"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono rounded-lg border border-white/10 hover:border-white/20 text-[#8c8376] hover:text-[#f5f0e8] bg-[#181614] transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
          </button>

          {/* Mobile menu hamburger button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-[#c4bcaf] hover:text-white bg-[#181614] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#121110] px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <NavLink to="/" end className={mobileLinkClass} onClick={() => sound.playClick()}>
            <span>The Ring</span>
            <span className="text-xs text-[#756e63]">Main Directory</span>
          </NavLink>
          <NavLink to="/forge" className={mobileLinkClass} onClick={() => sound.playClick()}>
            <span>Sovereign Git</span>
            <span className="text-xs text-[#756e63]">Forgejo Stack</span>
          </NavLink>
          <NavLink to="/widget" className={mobileLinkClass} onClick={() => sound.playClick()}>
            <span>Widget Guide</span>
            <span className="text-xs text-[#756e63]">Embed Code</span>
          </NavLink>
          <NavLink to="/members" className={mobileLinkClass} onClick={() => sound.playClick()}>
            <span>Members Registry</span>
            <span className="text-xs text-amber-500 font-mono">({nodeCount})</span>
          </NavLink>
          <a
            href="https://git.carbon.is-a.dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-mono text-amber-400 bg-[#181614] border border-amber-500/20"
          >
            <span className="flex items-center gap-2">
              <ForgejoIcon className="w-4 h-4 text-amber-500" />
              <span>Git Instance</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#756e63] px-1">
              Select Palette
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {THEMES.map((t) => {
                const isSelected = t.id === theme;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      sound.playClick();
                      setTheme(t.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#25221e] text-amber-400 font-semibold border-white/20'
                        : 'text-[#c4bcaf] bg-[#181614] border-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: t.dot }}
                      />
                      <span>{t.label}</span>
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-amber-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
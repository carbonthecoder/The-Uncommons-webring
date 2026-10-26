import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Menu, X, ArrowUpRight, GitBranch } from 'lucide-react';

interface NavbarProps {
  nodeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ nodeCount }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
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
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border border-amber-500/20 text-amber-400/90 hover:text-amber-300 bg-[#181614] hover:bg-[#201d1a] transition-colors"
            title="Open Sovereign Forge"
          >
            <GitBranch className="w-3.5 h-3.5 text-amber-500" />
            <span>git.carbon.is-a.dev</span>
            <ArrowUpRight className="w-3 h-3 text-[#756e63]" />
          </a>

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
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-amber-500" />
              <span>git.carbon.is-a.dev</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </header>
  );
};
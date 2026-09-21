import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Disc, Menu, X, ArrowRight, ShieldCheck, BookOpen, Globe } from 'lucide-react';

interface NavbarProps {
  nodeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ nodeCount }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile menu when changing pages
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSound = () => {
    const unmuted = sound.toggleSound();
    setIsMuted(!unmuted);
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-full transition-all text-xs font-mono cursor-pointer flex items-center gap-1.5 ${
      isActive
        ? 'bg-zinc-800 text-white font-medium shadow-sm border border-white/10'
        : 'text-zinc-400 hover:text-white'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-mono transition-all ${
      isActive
        ? 'bg-zinc-900 text-white font-semibold border border-white/15'
        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/90 backdrop-blur-md">
      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Brand */}
        <Link 
          to="/" 
          onClick={() => {
            sound.playClick();
            setIsMobileMenuOpen(false);
          }} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-7 h-7 flex items-center justify-center border border-white/20 rounded-full group-hover:border-white/50 transition-colors bg-zinc-950">
            <div className="w-3.5 h-3.5 border border-dashed border-zinc-400 rounded-full animate-[spin_12s_linear_infinite]" />
            <div className="absolute w-1 h-1 bg-white rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-sm tracking-widest text-zinc-100 font-semibold uppercase group-hover:text-white transition-colors">
              The Uncommons
            </span>
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
              SOVEREIGN WEBRING
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Tabs (Vercel Pill style) */}
        <nav className="hidden md:flex items-center p-1 bg-zinc-950/80 border border-white/[0.08] rounded-full">
          <NavLink to="/" end className={navClass} onClick={() => sound.playClick()}>
            The Ring
          </NavLink>
          <NavLink to="/nodes" className={navClass} onClick={() => sound.playClick()}>
            Nodes ({nodeCount})
          </NavLink>
          <NavLink to="/manifesto" className={navClass} onClick={() => sound.playClick()}>
            Manifesto
          </NavLink>
          <NavLink to="/apply" className={navClass} onClick={() => sound.playClick()}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
            Apply
          </NavLink>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">


          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? "Enable audio ambience" : "Mute audio"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono rounded-md border border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-200 bg-zinc-950 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">AUDIO: OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-zinc-200 animate-pulse" />
                <span className="hidden sm:inline text-zinc-200">55Hz</span>
              </>
            )}
          </button>

          {/* Join Council CTA (Desktop) */}
          <Link
            to="/apply"
            onClick={() => sound.playClick()}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-md transition-all shadow-md cursor-pointer"
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Apply</span>
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsMobileMenuOpen((prev) => !prev);
            }}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-md border border-white/15 bg-zinc-950 text-zinc-300 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Sleek full drawer with backdrop blur) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-zinc-950/98 backdrop-blur-2xl px-4 py-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 shadow-2xl">
          <nav className="space-y-1">
            <NavLink
              to="/"
              end
              className={mobileLinkClass}
              onClick={() => sound.playClick()}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-zinc-400" />
                <span>The Ring</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
            </NavLink>

            <NavLink
              to="/nodes"
              className={mobileLinkClass}
              onClick={() => sound.playClick()}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                <span>Nodes</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/10">
                {nodeCount}
              </span>
            </NavLink>

            <NavLink
              to="/manifesto"
              className={mobileLinkClass}
              onClick={() => sound.playClick()}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-zinc-400" />
                <span>Manifesto</span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase">ESSAY</span>
            </NavLink>

            <NavLink
              to="/apply"
              className={mobileLinkClass}
              onClick={() => sound.playClick()}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300">Apply to Council</span>
              </div>
              <span className="text-[10px] text-emerald-400 uppercase font-mono">OPEN</span>
            </NavLink>
          </nav>

          {/* Quick Actions in Mobile Drawer */}
          <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-2.5">


            <Link
              to="/apply"
              onClick={() => {
                sound.playClick();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <Disc className="w-4 h-4" />
              <span>Submit Proof of Work via Discord</span>
            </Link>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1 px-1">
              <span>ACCEPTANCE &lt; 3%</span>
              <span>EST. MMXXVI</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

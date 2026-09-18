import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Disc } from 'lucide-react';

interface NavbarProps {
  nodeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ nodeCount }) => {
  const [isMuted, setIsMuted] = useState(true);

  const toggleSound = () => {
    const unmuted = sound.toggleSound();
    setIsMuted(!unmuted);
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3.5 py-1.5 rounded-full transition-all text-xs font-mono cursor-pointer ${
      isActive
        ? 'bg-zinc-800 text-white font-medium shadow-sm border border-white/10'
        : 'text-zinc-400 hover:text-white'
    }`;

  const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
    `px-2.5 py-1 transition-colors text-[11px] font-mono cursor-pointer ${
      isActive ? 'text-white font-bold' : 'text-zinc-400'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/85 backdrop-blur-md">
      {/* Top micro announcement bar */}
      <div className="flex items-center justify-between px-4 py-1 text-[11px] font-mono tracking-wider text-zinc-500 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
          <span className="text-zinc-400">STATUS:</span> ONLINE
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400">NODES:</span> {nodeCount} VETTED
          <span className="hidden sm:inline text-zinc-700">|</span>
          <span className="hidden sm:inline text-zinc-400">ACCEPTANCE:</span> <span className="hidden sm:inline text-zinc-300">&lt; 3%</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/apply"
            onClick={() => sound.playClick()}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <span>DISCORD COUNCIL QUEUE OPEN</span>
          </Link>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Brand */}
        <Link 
          to="/" 
          onClick={() => sound.playClick()} 
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

        {/* Navigation Tabs (Vercel Pill style) */}
        <nav className="hidden md:flex items-center p-1 bg-zinc-950/80 border border-white/[0.08] rounded-full">
          <NavLink to="/" end className={navClass} onClick={() => sound.playClick()}>
            The Ring
          </NavLink>
          <NavLink to="/members" className={navClass} onClick={() => sound.playClick()}>
            Directory ({nodeCount})
          </NavLink>
          <NavLink to="/seal" className={navClass} onClick={() => sound.playClick()}>
            The Seal
          </NavLink>
          <NavLink to="/apply" className={navClass} onClick={() => sound.playClick()}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
            Apply via Discord
          </NavLink>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? "Enable subtle audio ambience" : "Mute audio"}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-md border border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-200 bg-zinc-950 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden sm:inline">AUDIO: OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-zinc-200 animate-pulse" />
                <span className="hidden sm:inline text-zinc-200">55Hz HUM</span>
              </>
            )}
          </button>

          {/* Join Council CTA */}
          <Link
            to="/apply"
            onClick={() => sound.playClick()}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-md transition-all shadow-md cursor-pointer"
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Apply</span>
          </Link>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-white/[0.04] bg-zinc-950/90">
        <NavLink to="/" end className={mobileNavClass} onClick={() => sound.playClick()}>
          The Ring
        </NavLink>
        <NavLink to="/members" className={mobileNavClass} onClick={() => sound.playClick()}>
          Directory
        </NavLink>
        <NavLink to="/seal" className={mobileNavClass} onClick={() => sound.playClick()}>
          The Seal
        </NavLink>
        <NavLink to="/apply" className={mobileNavClass} onClick={() => sound.playClick()}>
          Apply
        </NavLink>
      </div>
    </header>
  );
};

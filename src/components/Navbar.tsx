import React, { useState } from 'react';
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

  const scrollToSection = (id: string) => {
    sound.playClick();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/85 backdrop-blur-md">
      {/* Micro announcement bar */}
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
          <button
            onClick={() => scrollToSection('apply')}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <span>ADMISSIONS ROUND IV OPEN</span>
          </button>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Brand */}
        <div 
          onClick={() => {
            sound.playClick();
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        </div>

        {/* Section Navigation Links */}
        <nav className="hidden md:flex items-center p-1 bg-zinc-950/80 border border-white/[0.08] rounded-full text-xs font-mono">
          <button
            onClick={() => scrollToSection('orbit')}
            className="px-3.5 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Constellation
          </button>
          <button
            onClick={() => scrollToSection('manifesto')}
            className="px-3.5 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            What Is It
          </button>
          <button
            onClick={() => scrollToSection('dossiers')}
            className="px-3.5 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Dossiers ({nodeCount})
          </button>
          <button
            onClick={() => scrollToSection('seal-section')}
            className="px-3.5 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Member Seal
          </button>
          <button
            onClick={() => scrollToSection('apply')}
            className="px-3.5 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
            Discord Vetting
          </button>
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
          <button
            onClick={() => scrollToSection('apply')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-md transition-all shadow-md cursor-pointer"
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Join Council</span>
          </button>
        </div>
      </div>
    </header>
  );
};

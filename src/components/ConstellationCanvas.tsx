import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Member } from '../data/members';
import { sound } from '../utils/audio';
import { ExternalLink, Sparkles, Compass, ShieldCheck, ArrowLeft, ArrowRight, CornerDownLeft } from 'lucide-react';

interface ConstellationCanvasProps {
  members: Member[];
  onSelectMember: (member: Member) => void;
}

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({
  members,
  onSelectMember,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);
  const [hoveredMember, setHoveredMember] = useState<Member | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const angleRef = useRef<number>(0);
  const targetAngleRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);

  // Background starfield dust
  const starsRef = useRef<Array<{ x: number; y: number; size: number; alpha: number; speed: number }>>([]);

  // Render ONLY active verified members in 3D constellation
  const displayNodes = useMemo(() => {
    return [...members].sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
  }, [members]);

  const activeMember = displayNodes[activeNodeIndex] || displayNodes[0];

  // Rotate smoothly towards a specific node (Shortest Path)
  const focusNode = useCallback((index: number) => {
    sound.playClick();
    setActiveNodeIndex(index);
    const total = displayNodes.length;
    
    // The angle we want the node to be at (front center)
    const desiredTheta = Math.PI / 2 - (index / total) * Math.PI * 2;
    
    // Get current target or actual angle
    const currentTheta = targetAngleRef.current !== null ? targetAngleRef.current : angleRef.current;
    
    // Find the shortest angular distance
    let diff = (desiredTheta - currentTheta) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    
    targetAngleRef.current = currentTheta + diff;
  }, [displayNodes.length]);

  const nextNode = useCallback(() => {
    const nextIdx = (activeNodeIndex + 1) % displayNodes.length;
    focusNode(nextIdx);
  }, [activeNodeIndex, displayNodes.length, focusNode]);

  const prevNode = useCallback(() => {
    const prevIdx = (activeNodeIndex - 1 + displayNodes.length) % displayNodes.length;
    focusNode(prevIdx);
  }, [activeNodeIndex, displayNodes.length, focusNode]);

  // Keyboard navigation listeners: [ for prev, ] for next, Space for pause, Enter for dossier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === '[' || e.key === 'ArrowLeft') {
        e.preventDefault();
        prevNode();
      } else if (e.key === ']' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextNode();
      } else if (e.key === ' ') {
        e.preventDefault();
        sound.playClick();
        setIsRotating((prev) => !prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        sound.playClick();
        const target = displayNodes[activeNodeIndex];
        if (target) onSelectMember(target);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevNode, nextNode, activeNodeIndex, displayNodes, onSelectMember]);

  // Scroll Parallax Tracking
  const scrollYRef = useRef<number>(0);
  useEffect(() => {
    const handleScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Generate starfield dust
      if (starsRef.current.length === 0) {
        starsRef.current = Array.from({ length: 120 }, () => ({ // More stars
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
          speed: Math.random() * 0.01 + 0.002, // faster twinkle
        }));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let pulseProgress = 0; // Wave packet progress 0 -> 1

    const render = () => {
      // Pause 3D canvas rendering while any modal is open (body overflow locked) to prevent GPU choke
      if (typeof document !== 'undefined' && document.body.style.overflow === 'hidden') {
        animationId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Parallax Calculations based on Scroll
      const scrollY = scrollYRef.current;
      const parallaxY = scrollY * 0.1; // Shift the whole canvas center slightly up as we scroll down
      const tiltOffset = Math.min(scrollY * 0.15, 60); // Tilt the 3D ring as we scroll
      
      const centerX = width / 2;
      const centerY = (height / 2) - parallaxY;
      const radiusX = Math.min(width, height) * 0.40;
      const radiusY = (radiusX * 0.50) + tiltOffset; // Perspective ellipse widens based on scroll

      // 0. Deep Space Background (Pure Black Aesthetic)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Starfield Dust (Shiny & Dynamic)
      starsRef.current.forEach((star) => {
        star.alpha += star.speed;
        const currentAlpha = 0.2 + Math.abs(Math.sin(star.alpha)) * 0.8;
        ctx.beginPath();
        
        // Star Parallax
        const sx = star.x;
        const sy = (star.y - scrollY * 0.05 + height) % height; // Stars move slower than ring
        
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = star.size * 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Smooth interpolation if user clicked next/prev
      if (targetAngleRef.current !== null) {
        const diff = targetAngleRef.current - angleRef.current;
        if (Math.abs(diff) > 0.002) {
          angleRef.current += diff * 0.08;
        } else {
          angleRef.current = targetAngleRef.current;
          targetAngleRef.current = null;
        }
      } else if (isRotating && !hoveredMember && !isDraggingRef.current) {
        angleRef.current += 0.0018;
      }

      // Circulation wave progression
      pulseProgress = (pulseProgress + 0.006) % 1;

      // 2. Pulsing Cosmic Sovereign Core (Monochrome / Aesthetic)
      const corePulse = 0.85 + Math.sin(Date.now() * 0.0025) * 0.15;
      const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 70 * corePulse);
      coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      coreGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
      coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 70 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Soft Central Star
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Calculate node positions
      const total = displayNodes.length;
      const nodes = displayNodes.map((m: Member, i: number) => {
        const theta = angleRef.current + (i / total) * Math.PI * 2;
        const x = centerX + Math.cos(theta) * radiusX;
        const y = centerY + Math.sin(theta) * radiusY;
        const depth = (Math.sin(theta) + 1) / 2;
        return { member: m, x, y, depth, theta, originalIndex: i };
      });

      // 3. Draw Connecting Ring Threads & Luminous Energy Comets
      for (let i = 0; i < total; i++) {
        const current = nodes[i];
        const next = nodes[(i + 1) % total];
        const across = nodes[(i + Math.floor(total / 2)) % total]; // Cross-ring connection

        // Outer Ring Threads
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner Web Threads (creates a cool space web effect)
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(across.x, across.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Light Trails / Comets flying between nodes for a dynamic aesthetic
        for (let c = 0; c < 2; c++) {
          const streamOffset = c * 0.5;
          const prog = (pulseProgress + streamOffset) % 1;
          const cometX = current.x + (next.x - current.x) * prog;
          const cometY = current.y + (next.y - current.y) * prog;
          const tailProg = Math.max(0, prog - 0.1);
          const tailX = current.x + (next.x - current.x) * tailProg;
          const tailY = current.y + (next.y - current.y) * tailProg;

          const grad = ctx.createLinearGradient(tailX, tailY, cometX, cometY);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(cometX, cometY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cometX, cometY, 1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Sort by depth for correct 3D back-to-front rendering
      const sortedNodes = [...nodes].sort((a, b) => a.depth - b.depth);

      // 4. Draw Celestial Nodes (No HUD Brackets, Aesthetic minimalist style)
      sortedNodes.forEach((node) => {
        const isHovered = hoveredMember?.id === node.member.id;
        const isActive = activeNodeIndex === node.originalIndex;
        const isVerified = node.member.verified;

        const baseSize = 3 + node.depth * 3;
        const size = isHovered || isActive ? baseSize + 2 : baseSize;

        // Radiant Soft Halo Glow for active or deep nodes
        if (isHovered || isActive || (isVerified && node.depth > 0.65)) {
          const glowSize = (isHovered || isActive) ? size * 5 : size * 3;
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
          glow.addColorStop(0, isHovered || isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)');
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Verified Outer Soft Ring (replacing the sci-fi HUD)
        if (isVerified && (isHovered || isActive)) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Main Node Orb
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isHovered || isActive
          ? '#ffffff'
          : isVerified
          ? `rgba(255, 255, 255, ${0.5 + node.depth * 0.5})`
          : `rgba(100, 100, 100, ${0.2 + node.depth * 0.3})`;
        
        if (isHovered || isActive) {
          ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
          ctx.shadowBlur = 12;
        }
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Minimalist Node Label
        if (isHovered || isActive || node.depth > 0.86) {
          ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillStyle = isHovered || isActive ? '#ffffff' : (isVerified ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)');
          ctx.textAlign = 'center';
          
          ctx.fillText(node.member.domain, node.x, node.y - size - 8);

          if (isHovered || isActive) {
            ctx.font = '8px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(`${node.member.id} // ${isVerified ? 'VERIFIED' : 'OPEN SLOT'}`, node.x, node.y - size - 18);
          }
        }
      });

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [displayNodes, hoveredMember, isRotating, activeNodeIndex]);

  // Mouse hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x: e.clientX, y: e.clientY });

    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMouseXRef.current;
      angleRef.current += deltaX * 0.007;
      lastMouseXRef.current = e.clientX;
      return;
    }

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radiusX = Math.min(rect.width, rect.height) * 0.40;
    const radiusY = radiusX * 0.50;

    const total = displayNodes.length;
    let found: Member | null = null;
    let foundIdx = -1;

    for (let i = 0; i < total; i++) {
      const theta = angleRef.current + (i / total) * Math.PI * 2;
      const nodeX = centerX + Math.cos(theta) * radiusX;
      const nodeY = centerY + Math.sin(theta) * radiusY;
      const dist = Math.hypot(x - nodeX, y - nodeY);

      if (dist < 20) {
        found = displayNodes[i];
        foundIdx = i;
        break;
      }
    }

    if (found !== hoveredMember) {
      if (found) {
        sound.playHarmonic();
        setActiveNodeIndex(foundIdx);
      }
      setHoveredMember(found);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = () => {
    if (hoveredMember) {
      sound.playClick();
      onSelectMember(hoveredMember);
    }
  };

  return (
    <div className="space-y-3">
      {/* The 3D Orbital Canvas Container */}
      <div className="relative w-full h-[460px] sm:h-[540px] bg-black border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl flex items-center justify-center select-none group">
        {/* Subtle radial fade background */}
        <div className="absolute inset-0 bg-radial-fade pointer-events-none" />

        {/* Top left overlay badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-zinc-950/90 border border-white/[0.08] rounded-md text-[11px] font-mono text-zinc-400 backdrop-blur-sm">
          <Compass className="w-3.5 h-3.5 text-zinc-300 animate-spin" style={{ animationDuration: '24s' }} />
          <span>CONSTELLATION ORBIT</span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400">FOUNDER BEACON: NODE-001</span>
        </div>

        {/* Top right keyboard shortcuts tip */}
        <div className="hidden sm:flex absolute top-4 right-4 z-10 items-center gap-2 text-[10px] font-mono text-zinc-500 bg-zinc-950/80 px-2.5 py-1 rounded border border-white/5 backdrop-blur-sm">
          <span>SURF:</span>
          <kbd className="px-1 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-white/10">[</kbd>
          <kbd className="px-1 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-white/10">]</kbd>
          <span className="text-zinc-700">|</span>
          <span>PAUSE:</span>
          <kbd className="px-1 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-white/10">Space</kbd>
          <span className="text-zinc-700">|</span>
          <span>DOSSIER:</span>
          <kbd className="px-1 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-white/10">Enter</kbd>
        </div>

        {/* The Canvas */}
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            isDraggingRef.current = false;
            setHoveredMember(null);
          }}
          onClick={handleClick}
          className={`w-full h-full cursor-${hoveredMember ? 'pointer' : 'grab'}`}
        />

        {/* Hovered Node Floating Tooltip */}
        {hoveredMember && (
          <div
            className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full mb-4 px-4 py-3 bg-zinc-950/95 border border-white/20 rounded-lg shadow-2xl backdrop-blur-md max-w-xs transition-opacity duration-150"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y - 12}px`,
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="font-mono text-[10px] text-zinc-500 tracking-wider">
                {hoveredMember.id}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-300">
                <ShieldCheck className="w-3 h-3" />
                VETTED NODE
              </span>
            </div>

            <div className="font-mono text-sm font-semibold text-white truncate">
              {hoveredMember.domain}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
              {hoveredMember.name} &bull; {hoveredMember.field}
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-300">
              <span className="flex items-center gap-1 text-zinc-400">
                <Sparkles className="w-3 h-3 text-zinc-400" />
                Click to view dossier
              </span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </div>
          </div>
        )}

        {/* Bottom Orbit Status */}
        <div className="absolute bottom-3 inset-x-4 z-10 flex items-center justify-between text-[11px] font-mono text-zinc-500 pointer-events-none">
          <div>PULSE: CIRCULAR WAVE PACKETS ACTIVE</div>
          <div className="hidden sm:block">
            {displayNodes.filter((m) => m.verified && m.domain && !m.domain.includes('unclaimed') && m.handle !== 'vacant').length} VERIFIED NODES &bull; {displayNodes.filter((m) => !m.verified || !m.domain || m.domain.includes('unclaimed') || m.handle === 'vacant').length} OPEN CANDIDATE SLOTS
          </div>
        </div>
      </div>

      {/* Floating Ring Navigator Bar directly beneath Canvas */}
      <div className="p-3 bg-zinc-950 border border-white/[0.08] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        {/* Navigation Buttons + Active Node Details */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevNode}
              title="Previous Node (Shortcut: [)"
              className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextNode}
              title="Next Node (Shortcut: ])"
              className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeMember.verified ? 'bg-zinc-900 text-zinc-400 border border-white/5' : 'bg-zinc-800 text-zinc-300 border border-white/10'}`}>
                {activeMember.id}
              </span>
              <span className="font-semibold text-white">
                {activeMember.domain}
              </span>
              <span className="text-zinc-500 hidden sm:inline">&bull; {activeMember.name}</span>
            </div>
            <div className="text-[11px] text-zinc-400 line-clamp-1 font-sans">
              {activeMember.field}
            </div>
          </div>
        </div>

        {/* Right Actions: Inspect & External Link */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {activeMember.verified ? (
            <>
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectMember(activeMember);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-md text-xs font-mono text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                <span>Dossier</span>
                <CornerDownLeft className="w-3 h-3 text-zinc-500" />
              </button>

              <a
                href={activeMember.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-md text-xs font-mono transition-transform hover:scale-[1.02]"
              >
                <span>Visit Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          ) : (
            <Link
              to="/apply"
              onClick={() => sound.playClick()}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-200 hover:bg-white text-black font-semibold rounded-md text-xs font-mono transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <span>Claim {activeMember.id}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

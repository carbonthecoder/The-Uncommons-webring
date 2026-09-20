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

  // Virtualize ring to at least 8 celestial nodes so the 3D orbit remains intact with open candidate slots
  const displayNodes = useMemo(() => {
    if (members.length >= 8) {
      return [...members].sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
    }
    const existingIds = new Set(members.map(m => m.id));
    const slots: Member[] = [...members];
    for (let i = 1; i <= 8; i++) {
      const id = `NODE-00${i}`;
      if (!existingIds.has(id) && slots.length < 8) {
        slots.push({
          id,
          name: 'Awaiting Candidate',
          handle: 'vacant',
          domain: `unclaimed-slot-00${i}.xyz`,
          url: '/apply',
          field: 'Open Genesis Vacancy',
          bio: `Genesis vacancy slot #${i}. Applications open via #council-review in Kavyon Discord.`,
          proofOfWork: 'Awaiting candidate build submission.',
          proofUrl: '/apply',
          tags: ['Genesis', 'Vacancy'],
          joinDate: '2026',
          verified: false,
          ringPosition: i,
          status: 'reviewing',
        });
      }
    }
    return slots.sort((a, b) => (a.ringPosition || 1) - (b.ringPosition || 1));
  }, [members]);

  const activeMember = displayNodes[activeNodeIndex] || displayNodes[0];

  // Rotate smoothly towards a specific node
  const focusNode = useCallback((index: number) => {
    sound.playClick();
    setActiveNodeIndex(index);
    const total = displayNodes.length;
    // We want the node to align with the front center (theta = Math.PI / 2)
    const targetTheta = Math.PI / 2 - (index / total) * Math.PI * 2;
    // Normalize target angle
    let current = angleRef.current % (Math.PI * 2);
    if (current < 0) current += Math.PI * 2;
    let target = targetTheta % (Math.PI * 2);
    if (target < 0) target += Math.PI * 2;
    targetAngleRef.current = targetTheta;
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
        starsRef.current = Array.from({ length: 65 }, () => ({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          size: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.4 + 0.1,
          speed: Math.random() * 0.005 + 0.002,
        }));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let pulseProgress = 0; // Wave packet progress 0 -> 1

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Starfield Dust
      starsRef.current.forEach((star) => {
        star.alpha += star.speed;
        const currentAlpha = 0.15 + Math.abs(Math.sin(star.alpha)) * 0.35;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fill();
      });

      const centerX = width / 2;
      const centerY = height / 2;
      const radiusX = Math.min(width, height) * 0.40;
      const radiusY = radiusX * 0.50; // Perspective ellipse

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

      // 2. Pulsing Cosmic Sovereign Core & Central Reticle
      const corePulse = 0.85 + Math.sin(Date.now() * 0.0025) * 0.15;
      const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60 * corePulse);
      coreGlow.addColorStop(0, 'rgba(16, 185, 129, 0.20)');
      coreGlow.addColorStop(0.4, 'rgba(6, 182, 212, 0.06)');
      coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Central Reticle Crosshairs
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY);
      ctx.lineTo(centerX + 10, centerY);
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX, centerY + 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      // 3. Layered Concentric Orbital Rings
      // Outer Telemetry Boundary
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX * 1.16, radiusY * 1.16, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 10]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner Counter-Resonance Ring
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX * 0.80, radiusY * 0.80, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 15]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Primary Sovereign Orbital Track (Dual Glow)
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Calculate node positions
      const total = displayNodes.length;
      const nodes = displayNodes.map((m: Member, i: number) => {
        const theta = angleRef.current + (i / total) * Math.PI * 2;
        const x = centerX + Math.cos(theta) * radiusX;
        const y = centerY + Math.sin(theta) * radiusY;
        const depth = (Math.sin(theta) + 1) / 2;
        return { member: m, x, y, depth, theta, originalIndex: i };
      });

      // 4. Draw Connecting Ring Threads & Luminous Energy Comets
      for (let i = 0; i < total; i++) {
        const current = nodes[i];
        const next = nodes[(i + 1) % total];

        const isCurrentActive = activeNodeIndex === current.originalIndex || activeNodeIndex === next.originalIndex;
        const isHoveredEdge = hoveredMember && (hoveredMember.id === current.member.id || hoveredMember.id === next.member.id);

        // Thread Line
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = isHoveredEdge
          ? 'rgba(52, 211, 153, 0.65)'
          : isCurrentActive
          ? 'rgba(16, 185, 129, 0.35)'
          : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = isHoveredEdge || isCurrentActive ? 1.5 : 1;
        ctx.stroke();

        // Dual Streaming Comets with Light Trails
        for (let c = 0; c < 2; c++) {
          const streamOffset = c * 0.5;
          const prog = (pulseProgress + streamOffset) % 1;
          const cometX = current.x + (next.x - current.x) * prog;
          const cometY = current.y + (next.y - current.y) * prog;
          const tailProg = Math.max(0, prog - 0.08);
          const tailX = current.x + (next.x - current.x) * tailProg;
          const tailY = current.y + (next.y - current.y) * tailProg;

          const grad = ctx.createLinearGradient(tailX, tailY, cometX, cometY);
          grad.addColorStop(0, 'rgba(16, 185, 129, 0)');
          grad.addColorStop(1, 'rgba(52, 211, 153, 0.7)');

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(cometX, cometY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cometX, cometY, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }

      // Sort by depth for correct 3D back-to-front rendering
      const sortedNodes = [...nodes].sort((a, b) => a.depth - b.depth);

      // 5. Draw Celestial Nodes
      sortedNodes.forEach((node) => {
        const isHovered = hoveredMember?.id === node.member.id;
        const isActive = activeNodeIndex === node.originalIndex;
        const isFounder = node.member.id === 'NODE-001';
        const isVerified = node.member.verified;

        const baseSize = 3.5 + node.depth * 3.5;
        const size = isHovered || isActive ? baseSize + 3.5 : baseSize;

        // Verified Outer Resonant Rings
        if (isVerified) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 4, 0, Math.PI * 2);
          ctx.strokeStyle = isFounder ? 'rgba(16, 185, 129, 0.5)' : 'rgba(6, 182, 212, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Active / Hovered Sci-Fi HUD Targeting Brackets
        if (isHovered || isActive) {
          const bSize = size + 7;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          // Top-left
          ctx.moveTo(node.x - bSize, node.y - bSize + 5);
          ctx.lineTo(node.x - bSize, node.y - bSize);
          ctx.lineTo(node.x - bSize + 5, node.y - bSize);
          // Top-right
          ctx.moveTo(node.x + bSize - 5, node.y - bSize);
          ctx.lineTo(node.x + bSize, node.y - bSize);
          ctx.lineTo(node.x + bSize, node.y - bSize + 5);
          // Bottom-left
          ctx.moveTo(node.x - bSize, node.y + bSize - 5);
          ctx.lineTo(node.x - bSize, node.y + bSize);
          ctx.lineTo(node.x - bSize + 5, node.y + bSize);
          // Bottom-right
          ctx.moveTo(node.x + bSize - 5, node.y + bSize);
          ctx.lineTo(node.x + bSize, node.y + bSize);
          ctx.lineTo(node.x + bSize, node.y + bSize - 5);
          ctx.stroke();
        }

        // Radiant Halo Glow
        if (isHovered || isActive || (isVerified && node.depth > 0.65)) {
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 4);
          glow.addColorStop(0, isHovered || isActive ? 'rgba(52, 211, 153, 0.5)' : 'rgba(16, 185, 129, 0.15)');
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.beginPath();
          ctx.arc(node.x, node.y, size * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Main Node Orb
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isHovered || isActive
          ? '#ffffff'
          : isFounder
          ? '#10b981'
          : isVerified
          ? '#34d399'
          : node.depth > 0.5
          ? `rgba(220, 220, 220, ${0.35 + node.depth * 0.45})`
          : `rgba(120, 120, 120, ${0.15 + node.depth * 0.25})`;
        ctx.fill();

        // Node Monospace Telemetry Label (Front, active, or hovered)
        if (isHovered || isActive || node.depth > 0.86) {
          ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillStyle = isHovered || isActive ? '#ffffff' : (isVerified ? '#34d399' : 'rgba(255, 255, 255, 0.5)');
          ctx.textAlign = 'center';
          
          const labelPrefix = isVerified ? '◉ ' : '○ ';
          ctx.fillText(`${labelPrefix}${node.member.domain}`, node.x, node.y - size - 8);

          if (isHovered || isActive) {
            ctx.font = '8px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
            ctx.fillStyle = isVerified ? '#10b981' : '#a1a1aa';
            ctx.fillText(`[${node.member.id} // ${isVerified ? 'VERIFIED' : 'OPEN SLOT'}]`, node.x, node.y - size - 20);
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
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
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
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeMember.verified ? 'bg-zinc-900 text-zinc-400 border border-white/5' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'}`}>
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
              className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md text-xs font-mono transition-transform hover:scale-[1.02] cursor-pointer"
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

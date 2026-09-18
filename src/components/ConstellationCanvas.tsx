import React, { useEffect, useRef, useState } from 'react';
import type { Member } from '../data/members';
import { sound } from '../utils/audio';
import { ExternalLink, Sparkles, Compass, ShieldCheck } from 'lucide-react';

interface ConstellationCanvasProps {
  members: Member[];
  onSelectMember: (member: Member) => void;
}

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({
  members,
  onSelectMember,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredMember, setHoveredMember] = useState<Member | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const angleRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);

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
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radiusX = Math.min(width, height) * 0.40;
      const radiusY = radiusX * 0.50; // Elegant perspective ellipse

      // Update rotation
      if (isRotating && !hoveredMember && !isDraggingRef.current) {
        angleRef.current += 0.002;
      }

      // 1. Draw subtle background orbital rings
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Outer faint aura ring
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX * 1.18, radiusY * 1.18, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.setLineDash([4, 12]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner hub core
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fill();

      // Calculate node positions
      const total = members.length;
      const nodes = members.map((m, i) => {
        const theta = angleRef.current + (i / total) * Math.PI * 2;
        const x = centerX + Math.cos(theta) * radiusX;
        const y = centerY + Math.sin(theta) * radiusY;
        const depth = (Math.sin(theta) + 1) / 2; // 0 = back, 1 = front
        return { member: m, x, y, depth, theta, index: i };
      });

      // Sort by depth for correct back-to-front rendering
      nodes.sort((a, b) => a.depth - b.depth);

      // 2. Draw ring connection threads (Sequential webring cycle)
      for (let i = 0; i < total; i++) {
        const current = nodes[i];
        const next = nodes[(i + 1) % total];

        const isHoveredEdge =
          hoveredMember &&
          (hoveredMember.id === current.member.id || hoveredMember.id === next.member.id);

        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = isHoveredEdge ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = isHoveredEdge ? 1.5 : 1;
        ctx.stroke();
      }

      // 3. Draw nodes
      nodes.forEach((node) => {
        const isHovered = hoveredMember?.id === node.member.id;
        const baseSize = 3 + node.depth * 3;
        const size = isHovered ? baseSize + 3.5 : baseSize;

        // Glow halo for hovered or front nodes
        if (isHovered || node.depth > 0.7) {
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 3.5);
          glow.addColorStop(0, isHovered ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)');
          glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.beginPath();
          ctx.arc(node.x, node.y, size * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isHovered
          ? '#ffffff'
          : node.depth > 0.5
          ? `rgba(240, 240, 240, ${0.4 + node.depth * 0.5})`
          : `rgba(160, 160, 160, ${0.2 + node.depth * 0.3})`;
        ctx.fill();

        // Node label if front or hovered
        if (isHovered || node.depth > 0.85) {
          ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
          ctx.textAlign = 'center';
          ctx.fillText(node.member.domain, node.x, node.y - size - 6);
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
  }, [members, hoveredMember, isRotating]);

  // Handle canvas mouse move for hover detection
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

    const total = members.length;
    let found: Member | null = null;

    for (let i = 0; i < total; i++) {
      const theta = angleRef.current + (i / total) * Math.PI * 2;
      const nodeX = centerX + Math.cos(theta) * radiusX;
      const nodeY = centerY + Math.sin(theta) * radiusY;
      const dist = Math.hypot(x - nodeX, y - nodeY);

      if (dist < 20) {
        found = members[i];
        break;
      }
    }

    if (found !== hoveredMember) {
      if (found) {
        sound.playHarmonic();
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
    <div className="relative w-full h-[460px] sm:h-[540px] bg-black border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl flex items-center justify-center select-none group">
      {/* Background radial grid */}
      <div className="absolute inset-0 bg-grid-subtle pointer-events-none opacity-40" />
      <div className="absolute inset-0 bg-radial-fade pointer-events-none" />

      {/* Top overlay badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-zinc-950/90 border border-white/[0.08] rounded-md text-[11px] font-mono text-zinc-400 backdrop-blur-sm">
        <Compass className="w-3.5 h-3.5 text-zinc-300 animate-spin" style={{ animationDuration: '24s' }} />
        <span>ORBITAL CONSTELLATION</span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-400">DRAG TO ROTATE &bull; HOVER NODE</span>
      </div>

      {/* Rotation toggle button */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsRotating(!isRotating)}
          className="px-2.5 py-1 bg-zinc-950/90 hover:bg-zinc-900 border border-white/[0.08] rounded-md text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer backdrop-blur-sm"
        >
          {isRotating ? 'PAUSE ORBIT' : 'RESUME ORBIT'}
        </button>
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

      {/* Hovered Node Floating Tooltip / Dossier Preview */}
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

      {/* Bottom status strip */}
      <div className="absolute bottom-3 inset-x-4 z-10 flex items-center justify-between text-[11px] font-mono text-zinc-500 pointer-events-none">
        <div>COORDINATES: DUAL-AXIS PERSPECTIVE</div>
        <div className="hidden sm:block">CLOSED 12-NODE CIRCULATION</div>
      </div>
    </div>
  );
};

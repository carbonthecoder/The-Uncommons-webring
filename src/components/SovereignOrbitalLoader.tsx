import React from 'react';

interface SovereignOrbitalLoaderProps {
  size?: number;
  className?: string;
}

export const SovereignOrbitalLoader: React.FC<SovereignOrbitalLoaderProps> = ({
  size = 48,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer orbital track */}
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 6"
          className="text-zinc-700/60"
        />

        {/* Outer orbital rotating satellite */}
        <g>
          <circle cx="32" cy="4" r="1.75" className="fill-zinc-300" />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 32 32"
            to="360 32 32"
            dur="6s"
            repeatCount="indefinite"
          />
        </g>

        {/* Inner counter-rotating orbital ring with satellite */}
        <g>
          <circle
            cx="32"
            cy="32"
            r="18"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="20 14"
            className="text-zinc-500"
          />
          <circle cx="32" cy="14" r="1.5" className="fill-white" />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 32 32"
            to="0 32 32"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </g>

        {/* Central sovereign node core */}
        <circle cx="32" cy="32" r="3" className="fill-white shadow-sm" />
      </svg>
    </div>
  );
};

import React from 'react';

export interface LumenStayLogoProps {
  /** Size variant of the icon */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to render the brand wordmark next to the mark */
  showWordmark?: boolean;
  /** Subtitle text below the wordmark (e.g., 'Sanctuaries & Operations') */
  subtitle?: string;
  /** Color theme for text: 'light' (white text for dark headers), 'dark' (slate text for light backgrounds) */
  theme?: 'light' | 'dark';
  /** Additional container styling */
  className?: string;
  /** Additional mark styling */
  markClassName?: string;
  /** Whether the mark has a framed background tile or is transparent */
  framed?: boolean;
}

const sizeMap = {
  xs: { icon: 24, mark: 'w-6 h-6', rounded: 'rounded-md', title: 'text-xs tracking-[0.18em]', sub: 'text-[7.5px]' },
  sm: { icon: 30, mark: 'w-7.5 h-7.5', rounded: 'rounded-lg', title: 'text-xs tracking-[0.2em]', sub: 'text-[8px]' },
  md: { icon: 36, mark: 'w-9 h-9', rounded: 'rounded-xl', title: 'text-sm tracking-[0.22em]', sub: 'text-[9px]' },
  lg: { icon: 44, mark: 'w-11 h-11', rounded: 'rounded-xl', title: 'text-base tracking-[0.24em]', sub: 'text-[10px]' },
  xl: { icon: 54, mark: 'w-14 h-14', rounded: 'rounded-2xl', title: 'text-lg tracking-[0.26em]', sub: 'text-[11px]' },
};

/**
 * LumenStay Brand Icon Mark
 * Symbolism:
 * - Modernist Romanesque Portal Arch: Represents the architectural sanctuary, refuge, and physical lodging ('Stay').
 * - Radiant 4-Point Celestial Star: Represents the beacon of radiant light, dawn, and luxury illumination ('Lumen').
 */
export const LumenStayMark: React.FC<{
  size?: number | string;
  className?: string;
  framed?: boolean;
}> = ({ size = 32, className = '', framed = true }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="lsBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A1D6D" />
            <stop offset="100%" stopColor="#240D36" />
          </linearGradient>
          <linearGradient id="lsAmethystGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAF5FF" />
            <stop offset="45%" stopColor="#E9D8FD" />
            <stop offset="100%" stopColor="#D6BCFA" />
          </linearGradient>
          <radialGradient id="lsHaloGrad" cx="50%" cy="45%" r="42%">
            <stop offset="0%" stopColor="#E9D8FD" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4A1D6D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {framed && (
          <>
            {/* Sanctuary Frame Tile */}
            <rect width="32" height="32" rx="8" fill="url(#lsBgGrad)" />
            <rect
              width="32"
              height="32"
              rx="8"
              fill="none"
              stroke="#9F67D0"
              strokeWidth="0.8"
              strokeOpacity="0.45"
            />
          </>
        )}

        {/* Ambient Luminous Halo */}
        <circle cx="16" cy="14.5" r="7.2" fill="url(#lsHaloGrad)" />

        {/* Architectural Plinth / Horizon Line */}
        <path
          d="M7 24.5H25"
          stroke="url(#lsAmethystGlow)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Portal Sanctuary Arch (Stay) */}
        <path
          d="M9.5 24.5V13.5C9.5 9.91 12.41 7 16 7C19.59 7 22.5 9.91 22.5 13.5V24.5"
          fill="none"
          stroke="url(#lsAmethystGlow)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Radiant Astroid Star of Light (Lumen) */}
        <path
          d="M16 8.5Q16 14.5 21.5 14.5Q16 14.5 16 20.5Q16 14.5 10.5 14.5Q16 14.5 16 8.5Z"
          fill="url(#lsAmethystGlow)"
          className="transition-transform origin-[16px_14.5px] group-hover:scale-110 duration-300"
        />

        {/* Pure White Central Core Spark */}
        <circle cx="16" cy="14.5" r="1.15" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

export const LumenStayLogo: React.FC<LumenStayLogoProps> = ({
  size = 'md',
  showWordmark = true,
  subtitle,
  theme = 'dark',
  className = '',
  markClassName = '',
  framed = true,
}) => {
  const config = sizeMap[size];

  const titleColor = theme === 'light' ? 'text-white' : 'text-[#1E1627]';
  const subtitleColor = theme === 'light' ? 'text-slate-400' : 'text-[#6E6678]';

  return (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <LumenStayMark
        size={config.icon}
        framed={framed}
        className={markClassName}
      />

      {showWordmark && (
        <div className="flex flex-col">
          <span
            className={`font-heading font-extrabold uppercase leading-none transition-colors duration-200 ${titleColor} ${config.title}`}
          >
            LUMENSTAY
          </span>
          {subtitle && (
            <span
              className={`font-medium uppercase tracking-[0.25em] mt-1 transition-colors duration-200 ${subtitleColor} ${config.sub}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LumenStayLogo;

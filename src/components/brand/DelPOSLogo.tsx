import React from 'react';
import { APP_CONFIG } from '../../utils/appConfig';

interface DelPOSLogoProps {
  variant?: 'full' | 'icon-only' | 'splash' | 'compact' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  theme?: 'light' | 'dark';
  showPoweredBy?: boolean;
}

export const DelPOSLogo: React.FC<DelPOSLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  theme = 'light',
  showPoweredBy = false,
}) => {
  // Dimension scales
  const sizeConfig = {
    sm: { iconSize: 32, textScale: 'text-sm', subScale: 'text-[9px]', height: 'h-8' },
    md: { iconSize: 42, textScale: 'text-lg', subScale: 'text-[10px]', height: 'h-10' },
    lg: { iconSize: 56, textScale: 'text-2xl', subScale: 'text-xs', height: 'h-14' },
    xl: { iconSize: 80, textScale: 'text-4xl', subScale: 'text-sm', height: 'h-20' },
    '2xl': { iconSize: 110, textScale: 'text-5xl', subScale: 'text-base', height: 'h-28' },
  }[size];

  const iconDimension = sizeConfig.iconSize;

  // Render the high-precision 3D D-POS Graphic
  const render3DIcon = (dimension: number) => (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-md select-none"
    >
      <defs>
        {/* Gradients for 3D Blue D Shape */}
        <linearGradient id="delpos_blue_main" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00A2FF" />
          <stop offset="35%" stopColor="#0066FF" />
          <stop offset="75%" stopColor="#0047D4" />
          <stop offset="100%" stopColor="#002D9C" />
        </linearGradient>

        <linearGradient id="delpos_blue_highlight" x1="40" y1="10" x2="120" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#80D0FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="delpos_blue_shadow" x1="160" y1="140" x2="60" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#001866" />
          <stop offset="100%" stopColor="#0038B8" />
        </linearGradient>

        {/* Orange Growth Arrow Gradient */}
        <linearGradient id="delpos_orange_arrow" x1="40" y1="170" x2="180" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="50%" stopColor="#FFAA00" />
          <stop offset="100%" stopColor="#FFD000" />
        </linearGradient>

        {/* Green Bars Gradient */}
        <linearGradient id="delpos_green_bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Terminal Body Gradients */}
        <linearGradient id="delpos_terminal_top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="delpos_terminal_base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Filters for 3D depth */}
        <filter id="delpos_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Outer 3D "D" Letter Silhouette */}
      <g filter="url(#delpos_shadow)">
        <path
          d="M 32 20 H 115 C 162 20 188 56 188 100 C 188 144 162 180 115 180 H 32 Z"
          fill="url(#delpos_blue_shadow)"
        />
        <path
          d="M 28 15 H 112 C 158 15 182 50 182 95 C 182 140 158 175 112 175 H 28 Z"
          fill="url(#delpos_blue_main)"
        />
        <path
          d="M 64 52 H 105 C 132 52 148 70 148 95 C 148 120 132 138 105 138 H 64 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 28 15 H 112 C 142 15 168 35 178 68 C 160 38 130 25 105 25 H 35 Z"
          fill="url(#delpos_blue_highlight)"
        />
      </g>

      {/* INNER POS TERMINAL */}
      <g filter="url(#delpos_shadow)" transform="translate(10, 25)">
        <rect x="25" y="65" width="62" height="42" rx="10" fill="url(#delpos_terminal_base)" />
        <rect x="28" y="45" width="56" height="58" rx="8" fill="url(#delpos_terminal_top)" />

        {/* Thermal Receipt */}
        <path
          d="M 36 10 C 36 8 38 5 42 5 H 70 C 74 5 76 8 76 10 V 48 H 36 Z"
          fill="#FFFFFF"
          filter="url(#delpos_shadow)"
        />
        <line x1="42" y1="15" x2="70" y2="15" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1="22" x2="65" y2="22" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1="29" x2="68" y2="29" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1="36" x2="58" y2="36" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />

        <rect x="34" y="52" width="44" height="15" rx="3" fill="#0284C7" />
        <rect x="34" y="73" width="10" height="7" rx="2" fill="#3B82F6" />
        <rect x="51" y="73" width="10" height="7" rx="2" fill="#3B82F6" />
        <rect x="68" y="73" width="10" height="7" rx="2" fill="#10B981" />
        <rect x="34" y="83" width="10" height="7" rx="2" fill="#3B82F6" />
        <rect x="51" y="83" width="10" height="7" rx="2" fill="#3B82F6" />
        <rect x="68" y="83" width="10" height="7" rx="2" fill="#3B82F6" />
        <rect x="34" y="93" width="10" height="6" rx="2" fill="#EF4444" />
        <rect x="51" y="93" width="10" height="6" rx="2" fill="#F59E0B" />
        <rect x="68" y="93" width="10" height="6" rx="2" fill="#10B981" />
      </g>

      {/* GREEN GROWTH BARS */}
      <g filter="url(#delpos_shadow)" transform="translate(102, 68)">
        <rect x="0" y="24" width="10" height="26" rx="3" fill="url(#delpos_green_bar)" />
        <rect x="14" y="12" width="10" height="38" rx="3" fill="url(#delpos_green_bar)" />
        <rect x="28" y="0" width="10" height="50" rx="3" fill="url(#delpos_green_bar)" />
      </g>

      {/* GROWTH ARROW */}
      <g filter="url(#delpos_shadow)">
        <path
          d="M 50 162 C 90 168 140 155 168 85"
          fill="none"
          stroke="url(#delpos_orange_arrow)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <polygon points="160,70 186,80 172,106" fill="#FFAA00" />
        <polygon points="163,73 183,82 172,102" fill="#FFD000" />
      </g>
    </svg>
  );

  // 1. ICON ONLY VARIANT
  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{render3DIcon(iconDimension)}</div>;
  }

  // 2. BADGE / APP ICON SQUIRCLE
  if (variant === 'badge') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-[#0091FF] via-[#0055FF] to-[#0033AA] p-4 shadow-xl border border-white/20 select-none overflow-hidden ${className}`}
        style={{
          boxShadow: '0 12px 30px rgba(0, 85, 255, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/15 rounded-full blur-xl pointer-events-none" />
        {render3DIcon(iconDimension * 1.3)}
        <div className="mt-1 text-center">
          <span className="font-black text-white tracking-wider text-xl sm:text-2xl drop-shadow-md">
            Del<span className="text-cyan-300">Pos</span>
          </span>
        </div>
      </div>
    );
  }

  // 3. SPLASH SCREEN VARIANT
  if (variant === 'splash') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-[#0066ff]/25 blur-3xl rounded-full scale-150 pointer-events-none" />
          {render3DIcon(iconDimension * 1.5)}
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-center gap-1 font-black text-4xl sm:text-5xl tracking-tight text-white">
            <span className="text-white">Del</span>
            <span className="bg-gradient-to-r from-[#00A2FF] to-[#0066FF] bg-clip-text text-transparent">
              Pos
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
            <span>{APP_CONFIG.tagline}</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. COMPACT HORIZONTAL / FULL HEADER VARIANT
  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {render3DIcon(iconDimension)}

      <div className="flex flex-col justify-center leading-none">
        <div className={`font-black ${sizeConfig.textScale} tracking-tight flex items-center`}>
          <span className={isDark ? 'text-white' : 'text-[#0F172A]'}>Del</span>
          <span className="bg-gradient-to-r from-[#0088FF] to-[#0055EE] bg-clip-text text-transparent">
            Pos
          </span>
        </div>

        <div
          className={`flex items-center gap-1 text-[10px] font-medium tracking-tight mt-0.5 ${
            isDark ? 'text-slate-400' : 'text-[#64748B]'
          }`}
        >
          <span>Smart POS & Finance</span>
        </div>
      </div>
    </div>
  );
};

export default DelPOSLogo;

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// SVG for standard icon (512x512)
const delPosIconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Squircle Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0091FF" />
      <stop offset="40%" stop-color="#0062FF" />
      <stop offset="80%" stop-color="#0044D6" />
      <stop offset="100%" stop-color="#002699" />
    </linearGradient>

    <!-- Gloss Highlight -->
    <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- 3D Blue D Gradients -->
    <linearGradient id="d_shadow" x1="160" y1="140" x2="60" y2="190" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#001452" />
      <stop offset="100%" stop-color="#002D9C" />
    </linearGradient>

    <linearGradient id="d_main" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38B6FF" />
      <stop offset="35%" stop-color="#0072FF" />
      <stop offset="75%" stop-color="#0047D4" />
      <stop offset="100%" stop-color="#002D9C" />
    </linearGradient>

    <linearGradient id="d_highlight" x1="40" y1="10" x2="120" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#BAE6FD" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0072FF" stop-opacity="0" />
    </linearGradient>

    <!-- Growth Arrow Gradient -->
    <linearGradient id="orange_arrow" x1="40" y1="170" x2="180" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF5500" />
      <stop offset="50%" stop-color="#FF9900" />
      <stop offset="100%" stop-color="#FFCC00" />
    </linearGradient>

    <!-- Green Bar Gradient -->
    <linearGradient id="green_bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- Terminal Gradients -->
    <linearGradient id="terminal_top" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>

    <linearGradient id="terminal_base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E3A8A" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>

    <!-- Depth Shadow Filter -->
    <filter id="icon_depth_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#00184A" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- App Icon Base Squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  
  <!-- Subtle Top-Left Inner Glow / Shine -->
  <rect width="512" height="512" rx="112" fill="url(#glossGrad)" />
  <rect x="2" y="2" width="508" height="508" rx="110" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="4" fill="none" />

  <!-- Centered DelPos 3D Icon Graphic (Scaled 2.0x from 200x200 viewport, centered at 256, 256) -->
  <g transform="translate(56, 56) scale(2.0)" filter="url(#icon_depth_shadow)">
    <!-- Outer 3D "D" Silhouette -->
    <g>
      <path
        d="M 32 20 H 115 C 162 20 188 56 188 100 C 188 144 162 180 115 180 H 32 Z"
        fill="url(#d_shadow)"
      />
      <path
        d="M 28 15 H 112 C 158 15 182 50 182 95 C 182 140 158 175 112 175 H 28 Z"
        fill="url(#d_main)"
      />
      <path
        d="M 64 52 H 105 C 132 52 148 70 148 95 C 148 120 132 138 105 138 H 64 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 28 15 H 112 C 142 15 168 35 178 68 C 160 38 130 25 105 25 H 35 Z"
        fill="url(#d_highlight)"
      />
    </g>

    <!-- INNER POS TERMINAL -->
    <g transform="translate(10, 25)">
      <rect x="25" y="65" width="62" height="42" rx="10" fill="url(#terminal_base)" />
      <rect x="28" y="45" width="56" height="58" rx="8" fill="url(#terminal_top)" />

      <!-- Thermal Receipt -->
      <path
        d="M 36 10 C 36 8 38 5 42 5 H 70 C 74 5 76 8 76 10 V 48 H 36 Z"
        fill="#FFFFFF"
      />
      <line x1="42" y1="15" x2="70" y2="15" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />
      <line x1="42" y1="22" x2="65" y2="22" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />
      <line x1="42" y1="29" x2="68" y2="29" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />
      <line x1="42" y1="36" x2="58" y2="36" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />

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

    <!-- GREEN GROWTH BARS -->
    <g transform="translate(102, 68)">
      <rect x="0" y="24" width="10" height="26" rx="3" fill="url(#green_bar)" />
      <rect x="14" y="12" width="10" height="38" rx="3" fill="url(#green_bar)" />
      <rect x="28" y="0" width="10" height="50" rx="3" fill="url(#green_bar)" />
    </g>

    <!-- GROWTH ARROW -->
    <g>
      <path
        d="M 50 162 C 90 168 140 155 168 85"
        fill="none"
        stroke="url(#orange_arrow)"
        stroke-width="11"
        stroke-linecap="round"
      />
      <polygon points="160,70 186,80 172,106" fill="#FFAA00" />
      <polygon points="163,73 183,82 172,102" fill="#FFD000" />
    </g>
  </g>
</svg>`;

// SVG for Maskable Icon (safe zone padded)
const delPosMaskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Full Bleed Gradient -->
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0091FF" />
      <stop offset="40%" stop-color="#0062FF" />
      <stop offset="80%" stop-color="#0044D6" />
      <stop offset="100%" stop-color="#002699" />
    </linearGradient>

    <!-- 3D Blue D Gradients -->
    <linearGradient id="d_shadow_m" x1="160" y1="140" x2="60" y2="190" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#001452" />
      <stop offset="100%" stop-color="#002D9C" />
    </linearGradient>

    <linearGradient id="d_main_m" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38B6FF" />
      <stop offset="35%" stop-color="#0072FF" />
      <stop offset="75%" stop-color="#0047D4" />
      <stop offset="100%" stop-color="#002D9C" />
    </linearGradient>

    <linearGradient id="d_highlight_m" x1="40" y1="10" x2="120" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#BAE6FD" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0072FF" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="orange_arrow_m" x1="40" y1="170" x2="180" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF5500" />
      <stop offset="50%" stop-color="#FF9900" />
      <stop offset="100%" stop-color="#FFCC00" />
    </linearGradient>

    <linearGradient id="green_bar_m" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <linearGradient id="terminal_top_m" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>

    <linearGradient id="terminal_base_m" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E3A8A" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>

    <filter id="icon_depth_shadow_m" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#00184A" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Full Bleed Background for Maskable Icon -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />

  <!-- Scaled inside 80% Safe Zone (scale 1.6x, centered at 256, 256) -->
  <g transform="translate(96, 96) scale(1.6)" filter="url(#icon_depth_shadow_m)">
    <!-- Outer 3D "D" Silhouette -->
    <g>
      <path
        d="M 32 20 H 115 C 162 20 188 56 188 100 C 188 144 162 180 115 180 H 32 Z"
        fill="url(#d_shadow_m)"
      />
      <path
        d="M 28 15 H 112 C 158 15 182 50 182 95 C 182 140 158 175 112 175 H 28 Z"
        fill="url(#d_main_m)"
      />
      <path
        d="M 64 52 H 105 C 132 52 148 70 148 95 C 148 120 132 138 105 138 H 64 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 28 15 H 112 C 142 15 168 35 178 68 C 160 38 130 25 105 25 H 35 Z"
        fill="url(#d_highlight_m)"
      />
    </g>

    <!-- INNER POS TERMINAL -->
    <g transform="translate(10, 25)">
      <rect x="25" y="65" width="62" height="42" rx="10" fill="url(#terminal_base_m)" />
      <rect x="28" y="45" width="56" height="58" rx="8" fill="url(#terminal_top_m)" />

      <!-- Thermal Receipt -->
      <path
        d="M 36 10 C 36 8 38 5 42 5 H 70 C 74 5 76 8 76 10 V 48 H 36 Z"
        fill="#FFFFFF"
      />
      <line x1="42" y1="15" x2="70" y2="15" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />
      <line x1="42" y1="22" x2="65" y2="22" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />
      <line x1="42" y1="29" x2="68" y2="29" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />
      <line x1="42" y1="36" x2="58" y2="36" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />

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

    <!-- GREEN GROWTH BARS -->
    <g transform="translate(102, 68)">
      <rect x="0" y="24" width="10" height="26" rx="3" fill="url(#green_bar_m)" />
      <rect x="14" y="12" width="10" height="38" rx="3" fill="url(#green_bar_m)" />
      <rect x="28" y="0" width="10" height="50" rx="3" fill="url(#green_bar_m)" />
    </g>

    <!-- GROWTH ARROW -->
    <g>
      <path
        d="M 50 162 C 90 168 140 155 168 85"
        fill="none"
        stroke="url(#orange_arrow_m)"
        stroke-width="11"
        stroke-linecap="round"
      />
      <polygon points="160,70 186,80 172,106" fill="#FFAA00" />
      <polygon points="163,73 183,82 172,102" fill="#FFD000" />
    </g>
  </g>
</svg>`;

async function generate() {
  const publicDir = path.resolve(process.cwd(), 'public');

  // 1. Write SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), delPosIconSvg, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), delPosIconSvg, 'utf-8');

  // 2. Generate PNGs with sharp
  const iconBuffer = Buffer.from(delPosIconSvg);
  const maskableBuffer = Buffer.from(delPosMaskableSvg);

  console.log('Generating pwa-512x512.png...');
  await sharp(iconBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  console.log('Generating pwa-192x192.png...');
  await sharp(iconBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  console.log('Generating apple-touch-icon.png...');
  await sharp(iconBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating pwa-maskable-512x512.png...');
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('All APK/PWA DelPos icons successfully generated!');
}

generate().catch(console.error);

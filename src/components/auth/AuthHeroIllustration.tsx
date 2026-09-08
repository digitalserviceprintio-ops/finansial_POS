import React from 'react';
import {
  CreditCard,
  TrendingUp,
  PieChart,
  ShieldCheck,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export const AuthHeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg lg:max-w-none mx-auto flex items-center justify-center select-none py-4">
      {/* Soft ambient background glows matching template */}
      <div className="absolute -inset-6 bg-gradient-to-tr from-blue-200/40 via-sky-100/30 to-indigo-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-blue-400/10 blur-2xl rounded-full -z-10 pointer-events-none" />

      {/* Main Illustration Area - Clean, borderless and seamlessly merged with canvas */}
      <div className="relative w-full aspect-square sm:aspect-4/3 lg:aspect-square max-h-[520px] flex items-center justify-center">
        {/* Organic Background Waves & Vector Orbs */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-b from-blue-50/60 to-transparent blur-md -z-10" />
        
        {/* Seamless Vector Art Container with smooth feathered edge blending */}
        <div 
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse 94% 92% at 50% 50%, black 72%, transparent 99%)',
            maskImage: 'radial-gradient(ellipse 94% 92% at 50% 50%, black 72%, transparent 99%)',
          }}
        >
          <img
            src="/delpos_vector_clean.jpg"
            alt="DelPOS Smart POS & Finance Cashier"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // fallback to delpos_login_hero.jpg if needed
              const target = e.currentTarget;
              if (target.src.indexOf('delpos_login_hero.jpg') === -1) {
                target.src = '/delpos_login_hero.jpg';
              }
            }}
            className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-700 ease-out"
          />

          {/* Smooth bottom desk grounding blend */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f0f5ff]/60 via-[#f0f5ff]/20 to-transparent pointer-events-none" />
        </div>

        {/* ============================================================ */}
        {/* Floating Decorative Badges (Crisp 3D Vector Accents) */}
        {/* ============================================================ */}

        {/* 1. Floating Pill Card: "Transaksi Lebih Mudah" */}
        <div className="absolute top-6 left-2 sm:top-8 sm:left-4 z-20 flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl border border-white/80 hover:-translate-y-0.5 transition-transform">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0055EE] shadow-2xs">
            <BarChart3 className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <span className="block text-xs sm:text-sm font-extrabold text-[#0055EE] leading-tight">
              Transaksi
            </span>
            <span className="block text-[11px] sm:text-xs font-bold text-[#0055EE]/90 leading-tight">
              Lebih Mudah
            </span>
          </div>
        </div>

        {/* 2. Floating Circular Bubble: Credit Card (Blue) */}
        <div
          className="absolute -top-2 left-[32%] sm:left-[36%] z-20 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#0052cc] to-[#0077ff] text-white shadow-lg border-2 border-white/90 hover:scale-110 transition-transform animate-bounce duration-1000"
          style={{ animationDuration: '3.5s' }}
          title="Pembayaran Digital & Kartu"
        >
          <CreditCard className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />
        </div>

        {/* 3. Floating Circular Bubble: Growth Trending Arrow (Green) */}
        <div
          className="absolute top-4 right-[26%] sm:right-[28%] z-20 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-lg border-2 border-white/90 hover:scale-110 transition-transform animate-pulse"
          title="Pertumbuhan Penjualan & Keuangan"
        >
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
        </div>

        {/* 4. Floating Circular Bubble: Pie Chart (Orange / Amber) */}
        <div
          className="absolute top-20 right-3 sm:top-24 sm:right-4 z-20 flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg border-2 border-white/90 hover:scale-110 transition-transform"
          title="Laporan Penjualan Akurat"
        >
          <PieChart className="h-6 w-6" strokeWidth={2.3} />
        </div>

        {/* 5. Floating Circular Bubble: Security Shield (Cyan / Light Blue) */}
        <div
          className="absolute top-40 right-1 sm:top-44 sm:right-2 z-20 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-blue-500 text-white shadow-lg border-2 border-white/90 hover:scale-110 transition-transform"
          title="Cloud Backup & Terenkripsi"
        >
          <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.4} />
        </div>

        {/* 6. Thumbs-Up Blue Sparkles Accent */}
        <div className="absolute top-[48%] left-[62%] sm:left-[60%] z-20 pointer-events-none">
          <div className="flex items-center gap-1 text-sky-400 animate-pulse">
            <Sparkles className="h-5 w-5 drop-shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

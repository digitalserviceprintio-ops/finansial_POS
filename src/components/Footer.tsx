import React from 'react';
import { APP_CONFIG } from '../utils/appConfig';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Wifi, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { storeProfile, currentLicense } = useApp();
  const currentYear = new Date().getFullYear();

  return (
    <footer id="app-footer" className="w-full mt-10 pt-5 pb-6 border-t border-slate-200/70 text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Brand & Tagline */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-center sm:text-left">
          <span className="font-bold text-slate-800">{APP_CONFIG.brand}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">{storeProfile?.name || APP_CONFIG.tagline}</span>
          <span className="text-slate-300 hidden md:inline">•</span>
          <span className="text-slate-400 hidden md:inline">© {currentYear} Hak Cipta Dilindungi</span>
        </div>

        {/* Dynamic Version & System Status */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <span>Versi</span>
            <span className="font-bold text-indigo-600">v{APP_CONFIG.version}</span>
          </div>

          <span className="text-slate-300">•</span>

          <div className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem Siap</span>
          </div>

          {currentLicense && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">{currentLicense.tier} Edition</span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

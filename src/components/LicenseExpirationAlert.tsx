import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Key,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LicenseExpirationAlert: React.FC = () => {
  const { currentLicense, setCurrentTab } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!currentLicense) return null;

  const now = Date.now();
  const isLifetime = currentLicense.expiresAt === null;

  // Don't show alert for lifetime licenses if active
  if (isLifetime && currentLicense.status === 'ACTIVE') {
    return null;
  }

  const isExpired =
    currentLicense.status === 'EXPIRED' ||
    (currentLicense.expiresAt !== null && now > currentLicense.expiresAt);

  const daysLeft = currentLicense.expiresAt
    ? Math.max(0, Math.ceil((currentLicense.expiresAt - now) / (1000 * 60 * 60 * 24)))
    : null;

  // Only show warning if expired OR if remaining days <= 14
  const isExpiringSoon = !isExpired && daysLeft !== null && daysLeft <= 14;

  if (!isExpired && !isExpiringSoon) {
    return null;
  }

  // If user dismissed a non-critical (expiring soon) alert for this session
  if (isDismissed && !isExpired) {
    return null;
  }

  const formattedExpiry = currentLicense.expiresAt
    ? new Date(currentLicense.expiresAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // 1. CRITICAL EXPIRED ALERT (RED)
  if (isExpired) {
    return (
      <div className="mb-4 w-full rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-4 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Masa Berlaku Lisensi Telah Kadaluarsa!
                </h4>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white border border-white/30">
                  {currentLicense.tier} EXPIRED
                </span>
              </div>
              <p className="mt-1 text-xs text-rose-100 leading-relaxed">
                Masa aktif lisensi toko Anda telah berakhir pada <strong>{formattedExpiry || 'Hari ini'}</strong>.
                Segera masukkan nomor serial baru untuk memperpanjang langganan dan membuka akses penuh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => setCurrentTab('settings')}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-red-700 hover:bg-rose-50 shadow-md transition-all active:scale-95"
            >
              <Key className="h-4 w-4" />
              <span>Aktivasi Serial Sekarang</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Halo Tim DelPOS, saya ingin memperpanjang lisensi toko: ${currentLicense.businessName} (Serial: ${currentLicense.licenseKey})`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-2.5 text-xs font-bold text-white border border-white/30 transition-all"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Hubungi CS</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. WARNING ALERT (AMBER - EXPIRING SOON)
  return (
    <div className="mb-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-3.5 sm:p-4 text-slate-950 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/15 text-slate-950">
            <Clock className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-black tracking-tight text-slate-950">
                Peringatan Masa Aktif Lisensi: Tersisa {daysLeft} Hari Lagi!
              </h4>
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">
                {currentLicense.tier} EDITION
              </span>
            </div>
            <p className="mt-0.5 text-xs text-amber-950 font-medium leading-tight">
              Lisensi Anda akan jatuh tempo pada <strong>{formattedExpiry}</strong>. Perpanjang sekarang agar pencatatan transaksi kasir tetap berjalan lancar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setCurrentTab('settings')}
            className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-slate-900 shadow-xs transition-all active:scale-95"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Perpanjang Lisensi</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="rounded-xl p-2 text-slate-950/70 hover:bg-black/10 transition-colors"
            title="Tutup Peringatan Sesi Ini"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

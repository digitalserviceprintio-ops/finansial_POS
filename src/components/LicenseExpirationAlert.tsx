import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  Phone,
  ShieldAlert,
  Key,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LicenseManager } from '../utils/licenseManager';
import { LicenseTier } from '../types';

export const LicenseExpirationAlert: React.FC = () => {
  const { currentLicense, setCurrentTab, formatCurrency } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);
  const [tierPricing, setTierPricing] = useState(() => LicenseManager.getTierPricing());

  // Automatically listen to and synchronize pricing configured in Super Admin dashboard
  useEffect(() => {
    const syncPricing = () => {
      setTierPricing(LicenseManager.getTierPricing());
    };
    syncPricing();
    window.addEventListener('storage', syncPricing);
    return () => window.removeEventListener('storage', syncPricing);
  }, []);

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

  const isTrial = currentLicense.tier === 'TRIAL';

  /**
   * REVISI SESUAI INSTRUKSI PENGGUNA:
   * "revisi peringatan notifikasi lisensi tampilkan H-1 masa trial expired
   * ( notif menampilkan harga lisensi yang sudah terintegrasi dengan produk lisensi yang di atur di akun dashboard super admin"
   *
   * Untuk lisensi TRIAL:
   * - Hanya tampil pada H-1 (daysLeft <= 1 atau 1 hari lagi jatuh tempo) dan saat EXPIRED (isExpired).
   * - Selama masa trial normal (> 1 hari tersisa), peringatan tidak ditampilkan agar pengguna leluasa mencoba.
   *
   * Untuk lisensi Berbayar (STARTER / PRO):
   * - Tampil saat expired atau H-7 sebelum jatuh tempo.
   */
  const isExpiringSoon = isTrial
    ? !isExpired && daysLeft !== null && daysLeft <= 1
    : !isExpired && daysLeft !== null && daysLeft <= 7;

  if (!isExpired && !isExpiringSoon) {
    return null;
  }

  // If user dismissed a non-critical alert for this browser session
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

  // Produk Lisensi resmi yang terintegrasi langsung dari Katalog Super Admin
  const licenseProducts: Array<{
    tier: LicenseTier;
    name: string;
    period: string;
    price: number;
    cashiers: string;
    products: string;
    highlight?: boolean;
    badge: string;
  }> = [
    {
      tier: 'STARTER',
      name: 'Starter',
      period: '6 Bulan',
      price: tierPricing.STARTER,
      cashiers: 'Maks. 2 Kasir',
      products: '1.000 Produk',
      badge: 'Ekonomis',
    },
    {
      tier: 'PRO',
      name: 'Pro',
      period: '1 Tahun',
      price: tierPricing.PRO,
      cashiers: 'Maks. 10 Kasir',
      products: '10.000 Produk',
      highlight: true,
      badge: 'Rekomendasi',
    },
    {
      tier: 'ENTERPRISE',
      name: 'Enterprise',
      period: 'Seumur Hidup',
      price: tierPricing.ENTERPRISE,
      cashiers: 'Unlimited Kasir',
      products: 'Unlimited Produk',
      badge: 'Lifetime',
    },
  ];

  // Helper untuk membuat link WhatsApp pemesanan paket lisensi
  const getOrderWaLink = (pkgName: string, pkgPrice: number) => {
    const text =
      `Halo Tim Super Admin DelPOS,\n\n` +
      `Saya ingin memperpanjang/mengaktifkan lisensi toko ke *Paket ${pkgName}* seharga *${formatCurrency(pkgPrice)}*.\n\n` +
      `Informasi Toko:\n` +
      `- Nama Usaha: ${currentLicense.businessName || 'Toko UMKM'}\n` +
      `- Serial Saat Ini: ${currentLicense.licenseKey}\n` +
      `- Status: ${isExpired ? 'Masa Trial Telah Habis' : 'Masa Trial H-1 (Berakhir Besok)'}\n\n` +
      `Mohon dibantu nomor rekening pembayaran dan penerbitan kunci serial resmi. Terima kasih.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // 1. TAMPILAN KRITIS: JIKA TRIAL / LISENSI SUDAH EXPIRED
  if (isExpired) {
    return (
      <div className="mb-4 w-full rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-4 sm:p-5 text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 border border-red-500/50">
        <div className="flex flex-col gap-4">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/15">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
                <ShieldAlert className="h-6 w-6 animate-pulse text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm sm:text-base font-black tracking-tight text-white">
                    {isTrial ? 'Masa Uji Coba (Trial) Telah Berakhir!' : 'Masa Berlaku Lisensi Telah Kadaluarsa!'}
                  </h4>
                  <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200 border border-white/30">
                    {isTrial ? 'TRIAL EXPIRED' : `${currentLicense.tier} EXPIRED`}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-rose-100 leading-relaxed">
                  Masa aktif telah berakhir pada <strong>{formattedExpiry || 'Hari ini'}</strong>. Segera pilih produk lisensi resmi dari Super Admin di bawah ini untuk mengaktifkan kembali kasir & pencatatan keuangan:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={() => setCurrentTab('settings')}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-red-700 hover:bg-rose-50 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Masukkan Serial</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Integrated License Products Pricing Grid (Katalog Super Admin) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {licenseProducts.map((pkg) => (
              <div
                key={pkg.tier}
                className={`relative rounded-xl p-3.5 transition-all text-slate-900 bg-white/95 backdrop-blur-xs shadow-md border ${
                  pkg.highlight ? 'border-amber-400 ring-2 ring-amber-300' : 'border-white/40 hover:bg-white'
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs">
                    {pkg.badge}
                  </span>
                )}
                {!pkg.highlight && (
                  <span className="absolute -top-2.5 right-3 bg-slate-800 text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs">
                    {pkg.badge}
                  </span>
                )}

                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Paket {pkg.name}
                  </h5>
                  <span className="text-[10px] text-slate-500 font-semibold">{pkg.period}</span>
                </div>

                <div className="my-1.5">
                  <span className="text-base sm:text-lg font-black text-rose-600 tracking-tight">
                    {formatCurrency(pkg.price)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-snug mb-3">
                  {pkg.cashiers} • {pkg.products} • Cetak Bluetooth & Cloud
                </p>

                <a
                  href={getOrderWaLink(pkg.name, pkg.price)}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    pkg.highlight
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Phone className="h-3 w-3" />
                  <span>Pesan {pkg.name}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. TAMPILAN PERINGATAN H-1 MASA TRIAL EXPIRED (AMBER / ORANGE)
  return (
    <div className="mb-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-4 sm:p-5 text-slate-950 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 border border-amber-400">
      <div className="flex flex-col gap-3.5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/15 text-slate-950 shadow-inner">
              <Clock className="h-6 w-6 animate-bounce text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-black tracking-tight text-slate-950 flex items-center gap-1.5">
                  <span>{isTrial ? 'Peringatan H-1: Masa Trial Berakhir Besok!' : `Peringatan Lisensi: Tersisa ${daysLeft} Hari Lagi!`}</span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-700"></span>
                  </span>
                </h4>
                <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-950 border border-black/20">
                  {isTrial ? 'H-1 TRIAL EXPIRED' : `${currentLicense.tier} EXPIRING`}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-amber-950 font-medium leading-relaxed">
                Masa uji coba gratis toko Anda akan jatuh tempo pada <strong>{formattedExpiry}</strong>. Pilih paket lisensi terdaftar di bawah ini (harga terintegrasi dari Super Admin) agar operasional kasir tetap aktif:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setCurrentTab('settings')}
              className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-slate-900 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Key className="h-3.5 w-3.5 text-amber-400" />
              <span>Aktivasi Serial</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="rounded-xl p-2 text-slate-950/70 hover:bg-black/10 transition-colors cursor-pointer"
              title="Tutup Peringatan Sesi Ini"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Integrated License Products Pricing Grid (Katalog Super Admin) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {licenseProducts.map((pkg) => (
            <div
              key={pkg.tier}
              className={`relative rounded-xl p-3.5 transition-all text-slate-900 bg-white/95 backdrop-blur-xs shadow-sm border ${
                pkg.highlight ? 'border-amber-500 ring-2 ring-amber-400 shadow-md' : 'border-amber-200/80 hover:bg-white'
              }`}
            >
              {pkg.highlight && (
                <span className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs">
                  {pkg.badge}
                </span>
              )}
              {!pkg.highlight && (
                <span className="absolute -top-2.5 right-3 bg-slate-800 text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs">
                  {pkg.badge}
                </span>
              )}

              <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Paket {pkg.name}
                </h5>
                <span className="text-[10px] text-slate-500 font-semibold">{pkg.period}</span>
              </div>

              <div className="my-1.5">
                <span className="text-base sm:text-lg font-black text-indigo-700 tracking-tight">
                  {formatCurrency(pkg.price)}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug mb-3">
                {pkg.cashiers} • {pkg.products} • Laporan Lengkap
              </p>

              <a
                href={getOrderWaLink(pkg.name, pkg.price)}
                target="_blank"
                rel="noreferrer"
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  pkg.highlight
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <Phone className="h-3 w-3" />
                <span>Pesan {pkg.name}</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

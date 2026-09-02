import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  PlusSquare,
  ShieldCheck,
  Zap,
  WifiOff,
  Bell,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../../utils/usePWAInstall';
import { requestNativeNotificationPermission, soundManager } from '../../utils/soundAlert';
import { APP_CONFIG } from '../../utils/appConfig';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    soundManager.playPopSound();
    if (isInstallable) {
      const res = await install();
      if (res) {
        onClose();
      }
    } else {
      // Fallback instruction
      if (isAndroid) {
        setActiveTab('android');
      } else if (isIOS) {
        setActiveTab('ios');
      } else {
        setActiveTab('desktop');
      }
    }
  };

  const handleEnableNotification = async () => {
    const granted = await requestNativeNotificationPermission();
    if (granted) {
      setNotificationEnabled(true);
      soundManager.playSuccessChime();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-lg">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-400/20 border border-emerald-300/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200 uppercase tracking-wide">
                  PWA & Android APK Ready
                </span>
                <span className="rounded-full bg-blue-400/20 px-2 py-0.5 text-[10px] font-bold text-blue-200">
                  v2.5.0 Standalone
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-1">
                Pasang {APP_CONFIG.brand} ke Ponsel / Tablet
              </h2>
              <p className="text-xs text-blue-100">
                Aplikasi kasir & pembukuan mandiri (full-screen) tanpa bilah browser
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Quick Install Action Hero */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-blue-50/70 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Instalasi Sekali Klik (WebAPK Engine)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Pasang langsung ke menu aplikasi ponsel Anda. Lebih cepat, hemat kuota, dan dapat berjalan offline.
                </p>
              </div>

              {isInstalled ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Aplikasi Terpasang!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-extrabold text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Download className="h-4 w-4" />
                  <span>Pasang Sekarang (Install)</span>
                </button>
              )}
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-indigo-100/80 text-[11px]">
              <div className="flex items-center gap-2 text-slate-700">
                <WifiOff className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Mendukung Offline Cache</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Bell className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Notifikasi Pop-up Real-time</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Aman & Standar Sandboxing</span>
              </div>
            </div>
          </div>

          {/* Platform Step-by-Step Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Panduan Pemasangan Manual Berdasarkan Perangkat:
              </h4>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'android'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Android / Chrome (APK)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'ios'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                iPhone / iPad (iOS)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'desktop'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Komputer / PC / Mac
              </button>
            </div>

            {/* Android Tab Content */}
            {activeTab === 'android' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    1
                  </div>
                  <p className="text-xs text-slate-700">
                    Buka link aplikasi ini di browser <strong>Google Chrome</strong> pada ponsel Android Anda.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    2
                  </div>
                  <p className="text-xs text-slate-700">
                    Tekan ikon <strong>Titik Tiga (⋮)</strong> di sudut kanan atas browser Chrome.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    3
                  </div>
                  <p className="text-xs text-slate-700">
                    Pilih menu <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    4
                  </div>
                  <p className="text-xs text-slate-700">
                    Selesai! Ikon <strong>{APP_CONFIG.brand}</strong> akan langsung muncul di daftar aplikasi HP Anda seperti aplikasi APK bawaan.
                  </p>
                </div>
              </div>
            )}

            {/* iOS Tab Content */}
            {activeTab === 'ios' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    1
                  </div>
                  <p className="text-xs text-slate-700">
                    Buka link aplikasi di browser <strong>Safari</strong> pada iPhone / iPad Anda.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    2
                  </div>
                  <p className="text-xs text-slate-700 flex items-center gap-1">
                    Ketuk tombol <strong>Bagikan / Share</strong> (<Share2 className="inline h-3.5 w-3.5 text-blue-600" />) di bilah bawah Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    3
                  </div>
                  <p className="text-xs text-slate-700 flex items-center gap-1">
                    Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong> (<PlusSquare className="inline h-3.5 w-3.5 text-blue-600" />).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    4
                  </div>
                  <p className="text-xs text-slate-700">
                    Tekan <strong>"Tambah" (Add)</strong> di pojok kanan atas. {APP_CONFIG.brand} akan siap digunakan dalam mode full-screen.
                  </p>
                </div>
              </div>
            )}

            {/* Desktop Tab Content */}
            {activeTab === 'desktop' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    1
                  </div>
                  <p className="text-xs text-slate-700">
                    Di browser Chrome / Edge di komputer Anda, klik ikon <strong>Install App (⊕)</strong> di ujung kanan bilah alamat (URL bar).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    2
                  </div>
                  <p className="text-xs text-slate-700">
                    Klik <strong>"Install"</strong> pada pop-up konfirmasi.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    3
                  </div>
                  <p className="text-xs text-slate-700">
                    DelPOS akan terbuka dalam jendela aplikasi tersendiri di desktop Anda dengan performa maksimal.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Browser Notification Permission Option */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Aktifkan Notifikasi Pop-up Browser</p>
                <p className="text-[11px] text-slate-500">
                  Dapatkan pop-up alert saat ada transaksi kasir baru atau pesanan masuk
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEnableNotification}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                notificationEnabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs cursor-pointer'
              }`}
            >
              {notificationEnabled ? 'Notifikasi Aktif ✓' : 'Izinkan Notifikasi Pop-up'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

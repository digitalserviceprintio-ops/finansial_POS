import React, { useState, useEffect } from 'react';
import {
  Store,
  User,
  Percent,
  MapPin,
  Phone,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  HardDrive,
  Download,
  Upload,
  ChevronRight,
  ShieldCheck,
  Bluetooth,
  Printer,
  Zap,
  Sliders,
  Power,
  RefreshCw,
  BluetoothSearching,
  Key,
  Sparkles,
  Lock,
  Unlock,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Bell,
  Volume2,
  WifiOff,
  Cloud,
  LogOut,
  Camera,
  FolderOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  bluetoothPrinter,
  BluetoothPrinterState,
} from '../utils/bluetoothPrinter';
import { BluetoothPrinterModal } from '../components/modals/BluetoothPrinterModal';
import { soundManager, requestNativeNotificationPermission, sendBrowserNotification } from '../utils/soundAlert';
import { DEFAULT_AVATAR_PRESETS, processAvatarImageFile } from '../utils/avatarUtils';

export const SettingsView: React.FC = () => {
  const {
    storeProfile,
    updateStoreProfile,
    cashierName,
    setCashierName,
    setCurrentTab,
    exportBackupJson,
    showToast,
    currentLicense,
    activateLicenseKey,
    setIsPwaInstallModalOpen,
    setIsEditProfilePhotoModalOpen,
    lockDurationMinutes,
    setLockDurationMinutes,
    lockAppNow,
    currentUser,
    logoutUser,
  } = useApp();

  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [avatarUploadInfo, setAvatarUploadInfo] = useState<{ name: string; sizeFormatted: string } | null>(null);

  const [formData, setFormData] = useState({
    name: storeProfile.name,
    branch: storeProfile.branch,
    owner: storeProfile.owner,
    phone: storeProfile.phone,
    address: storeProfile.address,
    taxRate: storeProfile.taxRate * 100,
    avatarUrl: storeProfile.avatarUrl,
  });

  // Keep avatar in sync with storeProfile
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      avatarUrl: storeProfile.avatarUrl,
    }));
  }, [storeProfile.avatarUrl]);

  const handleAvatarFileUpload = (file: File) => {
    processAvatarImageFile(
      file,
      (dataUrl, info) => {
        setFormData((prev) => ({ ...prev, avatarUrl: dataUrl }));
        setAvatarUploadInfo(info);
        showToast(`Foto "${info.name}" (${info.sizeFormatted}) berhasil dipilih dari galeri!`, 'success');
      },
      (errorMsg) => {
        showToast(errorMsg, 'warning');
      }
    );
  };

  const [currentCashier, setCurrentCashier] = useState(cashierName);
  const [isBtModalOpen, setIsBtModalOpen] = useState(false);
  const [btState, setBtState] = useState<BluetoothPrinterState>(
    bluetoothPrinter.getState()
  );

  // License Activation State
  const [activationKeyInput, setActivationKeyInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationKeyInput.trim()) {
      showToast('Harap masukkan nomor serial lisensi!', 'warning');
      return;
    }
    setIsActivating(true);
    setTimeout(() => {
      const res = activateLicenseKey(activationKeyInput.trim());
      setIsActivating(false);
      if (res.success) {
        setActivationKeyInput('');
      }
    }, 600);
  };

  useEffect(() => {
    const unsubscribe = bluetoothPrinter.subscribe((state) => {
      setBtState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleQuickBackup = () => {
    const backupObj = exportBackupJson();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const now = new Date();
    const filename = `DelPOS_Backup_${storeProfile.name.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.json`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`✅ File cadangan "${filename}" berhasil diunduh!`, 'success');
  };

  const handleConnectBt = async () => {
    const res = await bluetoothPrinter.connect();
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleDisconnectBt = () => {
    bluetoothPrinter.disconnect();
    showToast('Koneksi printer Bluetooth diputus.', 'info');
  };

  const handleTestPrintBt = async () => {
    const res = await bluetoothPrinter.printTest(storeProfile);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile({
      name: formData.name,
      branch: formData.branch,
      owner: formData.owner,
      phone: formData.phone,
      address: formData.address,
      taxRate: formData.taxRate / 100,
      avatarUrl: formData.avatarUrl,
    });
    setCashierName(currentCashier);
    showToast('Pengaturan toko & kasir berhasil disimpan!', 'success');
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl mx-auto pb-20 lg:pb-0 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1b1b23] tracking-tight">
            Pengaturan Toko & Perangkat Kasir
          </h1>
          <p className="text-xs text-[#767680] mt-0.5">
            Konfigurasi identitas usaha, printer Bluetooth thermal, tarif pajak, dan cadangan data
          </p>
        </div>

        <button
          type="button"
          onClick={handleQuickBackup}
          className="flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-all shadow-2xs self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Cadangkan Data (JSON)</span>
        </button>
      </div>

      {/* Printer Bluetooth Thermal (ESC/POS) Card */}
      <div className="bg-gradient-to-br from-blue-50/90 via-[#fcf8ff] to-indigo-50/60 p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <Bluetooth className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#1b1b23]">
                  Printer Struk Bluetooth Thermal (ESC/POS)
                </h3>
                {btState.isConnected ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Terhubung</span>
                  </span>
                ) : btState.error ? (
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                    Perlu Bantuan Pairing
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#767680] bg-gray-200 px-2 py-0.5 rounded-md">
                    Tidak Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs text-[#767680] mt-0.5">
                {btState.isConnected
                  ? `Perangkat aktif: ${btState.deviceName || 'Thermal Printer'} (Kertas ${btState.paperWidth})`
                  : 'Hubungkan printer nirkabel 58mm / 80mm untuk mencetak struk langsung dari browser'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {btState.isConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleTestPrintBt}
                  disabled={btState.isPrinting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-xs disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Test Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectBt}
                  className="flex items-center gap-1 rounded-xl bg-white border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>Putus</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectBt}
                disabled={btState.isConnecting}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {btState.isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Mencari Printer...</span>
                  </>
                ) : (
                  <>
                    <BluetoothSearching className="h-4 w-4" />
                    <span>Hubungkan Printer Bluetooth</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsBtModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white border border-[#d2d1dc] px-3 py-2 text-xs font-bold text-[#1b1b23] hover:bg-[#f3f2fa] transition-all shadow-2xs"
            >
              <Sliders className="h-3.5 w-3.5 text-blue-600" />
              <span>Diagnostik & Panduan</span>
            </button>
          </div>
        </div>

        {/* Error Notification if any */}
        {btState.error && !btState.isConnected && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-2">
            <p className="leading-snug">{btState.error}</p>
            <button
              type="button"
              onClick={() => setIsBtModalOpen(true)}
              className="text-[11px] font-bold text-red-700 underline shrink-0 hover:text-red-900"
            >
              Buka Solusi Error
            </button>
          </div>
        )}

        {/* Quick Format & Auto-Print Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-200/50">
          <div className="flex items-center justify-between bg-white/80 p-3 rounded-2xl border border-blue-100">
            <span className="text-xs font-bold text-[#1b1b23]">Lebar Kertas Thermal:</span>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => bluetoothPrinter.setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  btState.paperWidth === '58mm'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-[#f3f2fa] text-[#767680] hover:text-[#1b1b23]'
                }`}
              >
                58 mm
              </button>
              <button
                type="button"
                onClick={() => bluetoothPrinter.setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  btState.paperWidth === '80mm'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-[#f3f2fa] text-[#767680] hover:text-[#1b1b23]'
                }`}
              >
                80 mm
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/80 p-3 rounded-2xl border border-blue-100">
            <div>
              <p className="text-xs font-bold text-[#1b1b23]">Cetak Otomatis Struk:</p>
              <p className="text-[10px] text-[#767680]">Saat kasir menyelesaikan pesanan</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={btState.autoPrintOnCheckout}
                onChange={(e) =>
                  bluetoothPrinter.setAutoPrintOnCheckout(e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Integrasi Google Spreadsheet & Apps Script Live Banner Card */}
      <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-slate-50 p-6 rounded-3xl border border-emerald-300 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Integrasi Google Spreadsheet & Apps Script (Live Sync)
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Auto-Record
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Setiap transaksi kasir, perubahan produk, dan pengeluaran kas langsung tercatat otomatis ke tabel Google Sheets.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('google_apps_script')}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-all shrink-0"
          >
            <span>Buka Integrasi Google Spreadsheet</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cadangan & Pemulihan Data Banner Card */}
      <div className="bg-gradient-to-br from-[#ebeaff] via-[#fcf8ff] to-[#f3f2fa] p-6 rounded-3xl border border-[#d8d6fc] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4648d4] text-white shadow-sm">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#1b1b23]">
                  Cadangan & Jadwal Otomatis (Google Drive & Cloud)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ebeaff] text-[#4648d4]">
                  Otomatis
                </span>
              </div>
              <p className="text-xs text-[#767680]">
                Jadwalkan pencadangan transaksi dan keuangan otomatis setiap hari/minggu ke Google Drive & Cloud
              </p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Google Drive & Cloud Ready</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentTab('backup')}
            className="flex items-center gap-2 rounded-xl bg-[#4648d4] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#3435ad] transition-all active:scale-98"
          >
            <Cloud className="h-4 w-4" />
            <span>Kelola Jadwal Cadangan Google Drive</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleQuickBackup}
            className="flex items-center gap-2 rounded-xl bg-white border border-[#d2d1dc] px-4 py-2.5 text-xs font-bold text-[#1b1b23] hover:bg-[#f3f2fa] transition-all shadow-2xs"
          >
            <Download className="h-4 w-4 text-[#4648d4]" />
            <span>Unduh Cadangan JSON Offline</span>
          </button>
        </div>
      </div>

      {/* Lisensi Software & Status Keamanan Multi-Tenant */}
      <div className="bg-gradient-to-br from-[#1b1b23] via-[#2a2a36] to-[#1b1b23] p-6 rounded-3xl text-white shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-900 shadow-md">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Lisensi Software POS & Keamanan Akun
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                    currentLicense.tier === 'ENTERPRISE'
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
                      : currentLicense.tier === 'PRO'
                      ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {currentLicense.tier} EDITION
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Data toko Anda terenkripsi dan terisolasi secara mandiri dalam partisi aman (Zero-Data Leakage).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-4 w-4" />
              <span>Status: {currentLicense.status}</span>
            </span>
          </div>
        </div>

        {/* License Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Nomor Serial Aktif:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-amber-300 break-all select-all">
                {currentLicense.licenseKey}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(currentLicense.licenseKey);
                  setCopiedKey(true);
                  showToast('Serial lisensi disalin!', 'info');
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-300"
                title="Salin Serial"
              >
                {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Masa Berlaku:</span>
            <p className="font-bold text-white flex items-center gap-1.5">
              {currentLicense.expiresAt === null ? (
                <>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>SEUMUR HIDUP (Permanen)</span>
                </>
              ) : (
                <span>
                  Hingga{' '}
                  {new Date(currentLicense.expiresAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400">Kapasitas & Fitur:</span>
            <p className="font-bold text-white">
              {currentLicense.maxCashiers > 100 ? 'Unlimited Kasir' : `Maks. ${currentLicense.maxCashiers} Kasir`} •{' '}
              {currentLicense.maxProducts > 10000 ? 'Unlimited Produk' : `${currentLicense.maxProducts} Produk`}
            </p>
          </div>
        </div>

        {/* License Activation Form */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Unlock className="h-3.5 w-3.5 text-amber-400" />
              <span>Aktivasi / Perpanjang Nomor Serial Lisensi Baru:</span>
            </span>
          </div>

          <form onSubmit={handleActivateLicense} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Contoh: FPRO-PRO-XXXX-XXXX-XXXX"
              value={activationKeyInput}
              onChange={(e) => setActivationKeyInput(e.target.value.toUpperCase())}
              className="flex-1 rounded-xl border border-white/20 bg-black/40 px-3.5 py-2.5 text-xs font-mono font-bold text-amber-300 placeholder-gray-500 focus:border-amber-400 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isActivating}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              {isActivating ? 'Memverifikasi...' : 'Aktivasi Lisensi'}
            </button>
          </form>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identitas Toko */}
        <div className="bg-white p-6 rounded-2xl border border-[#e2e1ec] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f3f2fa]">
            <Store className="h-5 w-5 text-[#4648d4]" />
            <h3 className="text-sm font-bold text-[#1b1b23]">Identitas Usaha UMKM</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1b1b23] mb-1">Nama Brand / Usaha</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b1b23] mb-1">Nama Cabang / Outlet</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b1b23] mb-1">Pemilik Usaha (Owner)</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b1b23] mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1b1b23] mb-1">Alamat Lengkap Toko</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Profil Avatar Owner - Upload dari Galeri & Presets */}
        <div className="bg-white p-6 rounded-2xl border border-[#e2e1ec] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f3f2fa]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ebeaff] text-[#4648d4] shadow-2xs">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1b1b23]">Foto Profil Pemilik Usaha</h3>
                <p className="text-xs text-[#767680]">
                  Bisa upload foto langsung dari galeri HP / file komputer atau pilih koleksi avatar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditProfilePhotoModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#4648d4]/30 bg-[#ebeaff]/60 hover:bg-[#ebeaff] px-3.5 py-1.5 text-xs font-bold text-[#4648d4] transition-all cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Buka Galeri Avatar Lengkap</span>
            </button>
          </div>

          {/* Hidden File Input for Gallery / Local Device Selection */}
          <input
            ref={avatarFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleAvatarFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
            id="settings-avatar-file-input"
          />

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar Preview with Camera Overlay Badge */}
            <div className="relative group shrink-0">
              <img
                src={formData.avatarUrl}
                alt="Foto Profil Pemilik"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-[#ebeaff] shadow-md transition-all group-hover:ring-[#4648d4]/40"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#4648d4] text-white shadow-md hover:bg-[#3435ad] transition-transform hover:scale-110 cursor-pointer"
                title="Pilih foto dari galeri perangkat"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Actions & Upload Box */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-[#4648d4] text-white px-4 py-2.5 text-xs font-bold shadow-xs hover:bg-[#3435ad] active:scale-98 transition-all cursor-pointer"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Upload / Ambil dari Galeri</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditProfilePhotoModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#d2d1dc] bg-white px-3.5 py-2.5 text-xs font-bold text-[#1b1b23] hover:bg-[#f3f2fa] transition-all cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4 text-[#767680]" />
                  <span>Pilihan Preset Lainnya</span>
                </button>

                {formData.avatarUrl.startsWith('data:image') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, avatarUrl: DEFAULT_AVATAR_PRESETS[0].url });
                      setAvatarUploadInfo(null);
                      showToast('Foto dikembalikan ke avatar bawaan', 'info');
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 px-2 py-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset ke Bawaan</span>
                  </button>
                )}
              </div>

              {/* Upload Status / Drag Area Helper */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingAvatar(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingAvatar(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingAvatar(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleAvatarFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => avatarFileInputRef.current?.click()}
                className={`flex items-center justify-between p-3 rounded-xl border border-dashed transition-all cursor-pointer ${
                  isDraggingAvatar
                    ? 'border-[#4648d4] bg-[#ebeaff]/40'
                    : 'border-[#d2d1dc] bg-[#fcf8ff] hover:border-[#4648d4] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Upload className="h-4 w-4 text-[#4648d4] shrink-0" />
                  <span className="text-xs text-[#46464f] truncate">
                    {avatarUploadInfo
                      ? `Foto terpilih: ${avatarUploadInfo.name} (${avatarUploadInfo.sizeFormatted})`
                      : 'Bisa juga seret & lepas file gambar ke sini (JPG, PNG, WebP)'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#4648d4] underline shrink-0 ml-2">
                  Telusuri
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 text-xs">
                {formData.avatarUrl.startsWith('data:image') ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md font-semibold text-[11px]">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Foto Galeri Mandiri Aktif</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md font-semibold text-[11px]">
                    <Sparkles className="h-3 w-3" />
                    <span>Preset Avatar Aktif</span>
                  </span>
                )}
                <span className="text-[11px] text-[#767680]">
                  Disinkronkan ke header kasir & profil toko
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preset Avatars Picker */}
          <div className="pt-3 border-t border-[#f3f2fa] space-y-2">
            <p className="text-xs font-bold text-[#1b1b23]">Koleksi Avatar Cepat (Klik untuk memilih):</p>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {DEFAULT_AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, avatarUrl: preset.url });
                    setAvatarUploadInfo(null);
                  }}
                  className={`group relative shrink-0 rounded-full transition-all cursor-pointer ${
                    formData.avatarUrl === preset.url
                      ? 'ring-3 ring-[#4648d4] ring-offset-2 scale-105'
                      : 'opacity-70 hover:opacity-100 hover:scale-102 ring-1 ring-slate-200'
                  }`}
                  title={preset.name}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="h-11 w-11 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {formData.avatarUrl === preset.url && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#4648d4] text-white flex items-center justify-center ring-1 ring-white shadow-xs">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kasir Shift & Pajak */}
        <div className="bg-white p-6 rounded-2xl border border-[#e2e1ec] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f3f2fa]">
            <User className="h-5 w-5 text-[#4648d4]" />
            <h3 className="text-sm font-bold text-[#1b1b23]">Kasir Aktif & Pajak (POS)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1b1b23] mb-1">Nama Kasir yang Bertugas</label>
              <input
                type="text"
                value={currentCashier}
                onChange={(e) => setCurrentCashier(e.target.value)}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                required
              />
              <p className="text-[10px] text-[#767680] mt-1">Nama ini akan tercetak di struk belanja pelanggan</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1b1b23] mb-1">Tarif Pajak / PPN Resto (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 pr-8 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#767680]">%</span>
              </div>
              <p className="text-[10px] text-[#767680] mt-1">Standar PPN Resto / PB1 adalah 10%</p>
            </div>
          </div>
        </div>

        {/* Mode Aplikasi Android APK / PWA & Standalone */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/70 p-6 rounded-3xl border border-indigo-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#1b1b23]">
                    Aplikasi Android (APK / PWA) & Akses Mandiri
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Standalone
                  </span>
                </div>
                <p className="text-xs text-[#767680] mt-0.5">
                  Jalankan aplikasi seperti APK bawaan Android tanpa bilah browser, mendukung caching offline dan respon instan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPwaInstallModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Download className="h-4 w-4" />
              <span>Buka Panduan & Pasang APK</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>WebAPK Auto-Package</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Ikon aplikasi otomatis tersemat di beranda layar HP layaknya APK resmi dari Play Store.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <WifiOff className="h-4 w-4 text-blue-600" />
                <span>Offline Support</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Service Worker mencadangkan aset statis sehingga kasir tetap dapat diakses tanpa koneksi internet lambat.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Terisolasi & Aman</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Data transaksi terlindungi dengan enkripsi lokal sandboxing di perangkat masing-masing kasir.
              </p>
            </div>
          </div>
        </div>

        {/* Notifikasi Pop-up Interaktif & Audio Chime */}
        <div className="bg-white p-6 rounded-3xl border border-[#e2e1ec] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f3f2fa]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1b1b23]">
                  Notifikasi Pop-up Interaktif & Audio Chime
                </h3>
                <p className="text-xs text-[#767680] mt-0.5">
                  Uji coba nada dering lonceng Web Audio dan pop-up otomatis saat transaksi selesai atau pesanan baru masuk.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playSuccessChime();
                  showToast('🎵 Suara Chime Transaksi Kasir berhasil diputar!', 'success');
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
                <span>Uji Suara Chime</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const granted = await requestNativeNotificationPermission();
                  if (granted) {
                    sendBrowserNotification('Notifikasi DelPOS Aktif', {
                      body: 'Notifikasi pop-up sistem dan kasir telah siap digunakan.',
                    });
                    soundManager.playSuccessChime();
                    showToast('Izin notifikasi browser berhasil diaktifkan!', 'success');
                  } else {
                    showToast('Izin notifikasi ditolak oleh browser.', 'warning');
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5 text-amber-600" />
                <span>Aktifkan Notifikasi Browser</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-800">Peristiwa yang Memicu Pop-up & Audio:</p>
            <ul className="list-disc pl-5 space-y-1 text-[11px]">
              <li><strong>Transaksi Berhasil:</strong> Memunculkan pop-up dialog ringkasan dengan opsi Cetak Struk instan.</li>
              <li><strong>Pesanan Baru dari QR Katalog:</strong> Memunculkan lonceng alarm dan pop-up antrian pesanan baru.</li>
              <li><strong>Peringatan Stok Habis / Minim:</strong> Notifikasi badge pada menu produk dan header sistem.</li>
            </ul>
          </div>
        </div>

        {/* Keamanan & Penguncian Otomatis Kasir (Auto-Lock 10 Menit) */}
        <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#1b1b23]">
                    Keamanan Kasir & Kunci Otomatis (Auto-Lock)
                  </h3>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                    {lockDurationMinutes > 0 ? `${lockDurationMinutes} Menit Aktif` : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-xs text-[#767680] mt-0.5">
                  Aplikasi otomatis mengunci layar pop-up jika tidak ada aktivitas selama 10 menit untuk melindungi data kasir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                lockAppNow();
                showToast('🔒 Layar kasir berhasil dikunci untuk pengujian!', 'info');
              }}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Lock className="h-4 w-4" />
              <span>Uji Kunci Layar Sekarang</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-[#1b1b23] mb-2">
                Durasi Waktu Tidak Digunakan Sebelum Mengunci
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '5 Menit', value: 5 },
                  { label: '10 Menit (Bawaan)', value: 10 },
                  { label: '15 Menit', value: 15 },
                  { label: '30 Menit', value: 30 },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setLockDurationMinutes(item.value);
                      showToast(`Durasi kunci otomatis diatur ke ${item.value} menit.`, 'success');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                      lockDurationMinutes === item.value
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                <span>Otentikasi Pembukaan Kunci</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900">
                Saat layar terkunci, kasir atau admin harus memasukkan <strong>Password Akun</strong> atau <strong>PIN Kasir (Bawaan: 123456)</strong> untuk melanjutkan transaksi POS.
              </p>
            </div>
          </div>
        </div>

        {/* Sesi Pengguna & Keluar Akun (Logout) */}
        <div className="bg-white p-6 rounded-3xl border border-red-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-[#ba1a1a] border border-red-100 shrink-0">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#1b1b23]">
                    Sesi Akun Kasir & Keluar Sistem
                  </h3>
                  <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                    {currentUser?.role === 'owner' ? 'Pemilik Toko' : 'Petugas Kasir'}
                  </span>
                </div>
                <p className="text-xs text-[#767680] mt-0.5">
                  Saat ini masuk sebagai <strong>{currentUser?.fullName || storeProfile.owner}</strong> ({currentUser?.email || storeProfile.branch}).
                  Klik keluar untuk menutup sesi di perangkat ini.
                </p>
              </div>
            </div>

            <button
              id="settings-logout-btn"
              type="button"
              onClick={() => logoutUser()}
              className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
              title="Keluar dari akun aplikasi kasir"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Keluar Akun (Logout)</span>
            </button>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[#4648d4] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#3435ad] transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Bluetooth Printer Modal */}
      <BluetoothPrinterModal
        isOpen={isBtModalOpen}
        onClose={() => setIsBtModalOpen(false)}
      />
    </div>
  );
};

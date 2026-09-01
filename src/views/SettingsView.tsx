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
  QrCode,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  bluetoothPrinter,
  BluetoothPrinterState,
} from '../utils/bluetoothPrinter';
import { BluetoothPrinterModal } from '../components/modals/BluetoothPrinterModal';
import { generateQRISString, generateQRCodeDataURL } from '../utils/qrisGenerator';

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
  } = useApp();

  const [formData, setFormData] = useState({
    name: storeProfile.name,
    branch: storeProfile.branch,
    owner: storeProfile.owner,
    phone: storeProfile.phone,
    address: storeProfile.address,
    taxRate: storeProfile.taxRate * 100,
    avatarUrl: storeProfile.avatarUrl,
    qrisDanaNumber: storeProfile.qrisDanaNumber || '082186371356',
    qrisMerchantName: storeProfile.qrisMerchantName || storeProfile.name || 'SOLUSI UMKM / FINANSIALPRO',
    qrisNmid: storeProfile.qrisNmid || 'ID1020021863713',
  });

  const [currentCashier, setCurrentCashier] = useState(cashierName);
  const [isBtModalOpen, setIsBtModalOpen] = useState(false);
  const [btState, setBtState] = useState<BluetoothPrinterState>(
    bluetoothPrinter.getState()
  );
  const [qrisPreviewUrl, setQrisPreviewUrl] = useState<string>('');

  // Live generate test QRIS preview
  useEffect(() => {
    const qrisString = generateQRISString({
      danaNumber: formData.qrisDanaNumber,
      merchantName: formData.qrisMerchantName,
      nmid: formData.qrisNmid,
    });
    generateQRCodeDataURL(qrisString, { width: 200, margin: 1 }).then((url) => {
      if (url) setQrisPreviewUrl(url);
    });
  }, [formData.qrisDanaNumber, formData.qrisMerchantName, formData.qrisNmid]);

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

  const avatarOptions = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCoLtV3Bv2OBXPlq_WrGjzOKb2hx7Pr3DOTjypa8dkEKduOjjWvN91FeXpeuVJDGRacnpFhqLouF2glsjyg154-ONwKg9-AXq2ylnHCQIAwb0pQ9662t3tt1reJkfrz46PuKvm9rTpygmqRrJUs0iC2FvO13DZ8nlMx-0eSm-8yba6zLFIndlcCVnmVfynCOWQHJRodfFxaOXcZ1AmWZ9mFAugAFABkMmuQ6rlyglKy280HkFHaQKc',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ_UeVtMqix0sJCZHs2TtKM5-d72Pea84EAktZj50a8963OhMvLReqs1NHQ5_GHU31yQIOvnrJgSfVJ_GeiKlPatJEFijCOybVvFFiMGK5NOxgk9QrAVW_iXOt0iW_JoPaZYQPCnyP7yXiRGmSsKfKm7wGSICkKlm5wlq8E4GuzgUAsgAUa1swPQ-m8CDYgnJ9jjXFUt_9CTSEQH_yEVGaOFNO6eA39ylX7lz2CTC7oAh5YPsc0Mc',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC7B9KMRoYvNAmqNyV5w06IdeHLX2otFiqPJA8kZ3Goi212mrGTweb6BNH2e6e8Yb9MlgT8nzNzC-HWRvuUa2TOoyX4hVm44IyZcPbAocXR8y4C-lEK9s3rKLhxMg4b4pPpy_wMjMwxgNzG7yEfQlAU3aD4JIYfRfZRo6O6gWdkAwwkUTsSVqMbOO55lJ8DXxxWawcQlVMywxpMFfKkjQbZxcsAoEGnPnZvyDbWgRciVO1BOs7MuyU',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAdVT5Ge0_B56pivGW9S29joD83BqOZlq4mFS37QNwdClBoNOPykFiDhmJpz01rrRcVALt-qt3gTDCCdoCU4cpiP4Qv4WmM_xuZ7Gw1Iw5mEOwy9zdjmlqsoFtETWLmXkpkvO079B6bE1FVO-U6i1VgAGE7Ehm12LDBunosqG61dwe-5ilOt1wDkGLCKtwtF-ASBRc0AcdkE-Sz_sn8HV9fEyOBwdX-LUme7BlTWrs1-T0X_FfcRRw',
  ];

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
      qrisDanaNumber: formData.qrisDanaNumber,
      qrisMerchantName: formData.qrisMerchantName,
      qrisNmid: formData.qrisNmid,
    });
    setCashierName(currentCashier);
    showToast('Pengaturan toko, QRIS DANA, & kasir berhasil disimpan!', 'success');
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

      {/* Cadangan & Pemulihan Data Banner Card */}
      <div className="bg-gradient-to-br from-[#ebeaff] via-[#fcf8ff] to-[#f3f2fa] p-6 rounded-3xl border border-[#d8d6fc] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4648d4] text-white shadow-sm">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1b1b23]">
                Cadangan & Pemulihan Data Keuangan (Backup JSON)
              </h3>
              <p className="text-xs text-[#767680]">
                Simpan salinan data transaksi, katalog produk, dan laporan keuangan secara mandiri
              </p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Format JSON Offline</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleQuickBackup}
            className="flex items-center gap-2 rounded-xl bg-[#4648d4] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#3435ad] transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Unduh Cadangan Lengkap (.JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('backup')}
            className="flex items-center gap-2 rounded-xl bg-white border border-[#d2d1dc] px-4 py-2.5 text-xs font-bold text-[#1b1b23] hover:bg-[#f3f2fa] transition-all shadow-2xs"
          >
            <Upload className="h-4 w-4 text-[#4648d4]" />
            <span>Buka Panel Pemulihan & Restore</span>
            <ChevronRight className="h-3.5 w-3.5 text-[#767680]" />
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

        {/* Profil Avatar Owner */}
        <div className="bg-white p-6 rounded-2xl border border-[#e2e1ec] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f3f2fa]">
            <ImageIcon className="h-5 w-5 text-[#4648d4]" />
            <h3 className="text-sm font-bold text-[#1b1b23]">Foto Profil Pemilik</h3>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <img
              src={formData.avatarUrl}
              alt="Selected avatar"
              className="h-16 w-16 rounded-full object-cover ring-4 ring-[#ebeaff]"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#1b1b23]">Pilih Avatar Presets:</p>
              <div className="flex items-center gap-2">
                {avatarOptions.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Avatar ${i + 1}`}
                    onClick={() => setFormData({ ...formData, avatarUrl: url })}
                    className={`h-10 w-10 rounded-full object-cover cursor-pointer border-2 transition-all ${
                      formData.avatarUrl === url ? 'border-[#4648d4] scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
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

        {/* Integrasi QRIS & E-Wallet DANA */}
        <div className="bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/50 p-6 rounded-3xl border border-sky-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-100">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#118eea] text-white shadow-md font-black text-sm">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#1b1b23]">
                    Integrasi Barcode QRIS & Nomor Akun DANA
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                    <CheckCircle2 className="h-3 w-3 text-sky-600" />
                    <span>Support QRIS ASPI</span>
                  </span>
                </div>
                <p className="text-xs text-[#767680] mt-0.5">
                  Nomor DANA terhubung otomatis dengan format QRIS dinamis untuk menerima pembayaran dari seluruh e-wallet & mobile banking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Zero-Data Stored (Aman)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Input Form Column */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#1b1b23] mb-1">
                  Nomor DANA Penerima Pembayaran QRIS
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#118eea]">
                    DANA:
                  </span>
                  <input
                    type="text"
                    value={formData.qrisDanaNumber}
                    onChange={(e) => setFormData({ ...formData, qrisDanaNumber: e.target.value })}
                    placeholder="Contoh: 082186371356"
                    className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 pl-16 text-xs font-mono font-bold text-[#1b1b23] focus:border-[#118eea] focus:bg-white focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-[#767680] mt-1">
                  Nomor aktif DANA saat ini: <strong className="text-[#118eea] font-mono">{formData.qrisDanaNumber}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#1b1b23] mb-1">
                    Nama Merchant QRIS (Max 25 Huruf)
                  </label>
                  <input
                    type="text"
                    maxLength={25}
                    value={formData.qrisMerchantName}
                    onChange={(e) => setFormData({ ...formData, qrisMerchantName: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs font-bold text-[#1b1b23] focus:border-[#118eea] focus:bg-white focus:outline-none uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#1b1b23] mb-1">
                    NMID QRIS (National Merchant ID)
                  </label>
                  <input
                    type="text"
                    value={formData.qrisNmid}
                    onChange={(e) => setFormData({ ...formData, qrisNmid: e.target.value })}
                    className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs font-mono font-bold text-[#1b1b23] focus:border-[#118eea] focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Security & Privacy Notice */}
              <div className="p-3 rounded-2xl bg-white border border-sky-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Keamanan Data & Privasi Terjamin</span>
                </div>
                <p className="leading-relaxed">
                  Aplikasi ini <strong>tidak pernah meminta atau menyimpan PIN, password, OTP, atau data sensitif bank/kartu</strong>. Barcode QRIS dienkripsi secara lokal di perangkat kasir sesuai regulasi Bank Indonesia.
                </p>
              </div>
            </div>

            {/* Live QRIS Preview Column */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-sky-200 text-center shadow-xs">
              <span className="text-[11px] font-extrabold text-sky-900 mb-2">
                Preview Barcode QRIS DANA
              </span>
              <div className="h-36 w-36 bg-white p-1 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center relative">
                {qrisPreviewUrl ? (
                  <img
                    src={qrisPreviewUrl}
                    alt="Preview Barcode QRIS"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <RefreshCw className="h-5 w-5 animate-spin text-sky-600" />
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-6 w-6 rounded bg-[#118eea] text-white flex items-center justify-center font-black text-[8px] shadow-sm">
                    DANA
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-mono font-extrabold text-slate-700 mt-2">
                {formData.qrisDanaNumber}
              </p>
              <p className="text-[9px] text-slate-400">Siap di-scan di Kasir POS</p>
            </div>
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

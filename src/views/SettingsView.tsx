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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  bluetoothPrinter,
  BluetoothPrinterState,
} from '../utils/bluetoothPrinter';
import { BluetoothPrinterModal } from '../components/modals/BluetoothPrinterModal';

export const SettingsView: React.FC = () => {
  const {
    storeProfile,
    updateStoreProfile,
    cashierName,
    setCashierName,
    setCurrentTab,
    exportBackupJson,
    showToast,
  } = useApp();

  const [formData, setFormData] = useState({
    name: storeProfile.name,
    branch: storeProfile.branch,
    owner: storeProfile.owner,
    phone: storeProfile.phone,
    address: storeProfile.address,
    taxRate: storeProfile.taxRate * 100,
    avatarUrl: storeProfile.avatarUrl,
  });

  const [currentCashier, setCurrentCashier] = useState(cashierName);
  const [isBtModalOpen, setIsBtModalOpen] = useState(false);
  const [btState, setBtState] = useState<BluetoothPrinterState>(
    bluetoothPrinter.getState()
  );

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
    const filename = `FinansialPro_Backup_${storeProfile.name.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.json`;

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

          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1 rounded-xl bg-white border border-[#d2d1dc] px-3 py-2 text-xs font-bold text-[#1b1b23] hover:bg-[#f3f2fa] transition-all shadow-2xs"
            >
              <Sliders className="h-3.5 w-3.5 text-blue-600" />
              <span>Panduan</span>
            </button>
          </div>
        </div>

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

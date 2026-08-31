import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Bluetooth,
  BluetoothSearching,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  Smartphone,
  Info,
  RefreshCw,
  Power,
  Zap,
  ExternalLink,
  HelpCircle,
  ShieldAlert,
  FileText,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  bluetoothPrinter,
  BluetoothPrinterState,
  BluetoothDiagnostic,
} from '../../utils/bluetoothPrinter';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { storeProfile, showToast } = useApp();
  const [btState, setBtState] = useState<BluetoothPrinterState>(
    bluetoothPrinter.getState()
  );
  const [diagnostics, setDiagnostics] = useState<BluetoothDiagnostic>(
    bluetoothPrinter.getDiagnostics()
  );
  const [activeTab, setActiveTab] = useState<'connect' | 'troubleshoot' | 'guide'>('connect');
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  useEffect(() => {
    setDiagnostics(bluetoothPrinter.getDiagnostics());
    const unsubscribe = bluetoothPrinter.subscribe((state) => {
      setBtState(state);
      setDiagnostics(bluetoothPrinter.getDiagnostics());
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleConnect = async () => {
    const res = await bluetoothPrinter.connect();
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'warning');
      // If error occurs, point to troubleshooting tab if needed
      if (res.errorCode === 'IFRAME_BLOCKED' || res.errorCode === 'NOT_SUPPORTED') {
        setActiveTab('troubleshoot');
      }
    }
  };

  const handleDisconnect = () => {
    bluetoothPrinter.disconnect();
    showToast('Koneksi printer Bluetooth telah diputus.', 'info');
  };

  const handleTestPrint = async () => {
    const res = await bluetoothPrinter.printTest(storeProfile);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleOpenNewTab = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
      showToast('Membuka aplikasi di tab baru untuk mengaktifkan Bluetooth!', 'info');
    } catch {
      window.location.reload();
    }
  };

  const handleTestRawBT = () => {
    const success = bluetoothPrinter.printTestViaRawBT(storeProfile);
    if (success) {
      showToast('Membuka aplikasi RawBT thermal printer...', 'info');
    } else {
      showToast('Gagal memformat data untuk aplikasi RawBT.', 'error');
    }
  };

  const handleTestBrowserPrint = () => {
    window.print();
    showToast('Membuka jendela cetak sistem (Driver thermal)...', 'info');
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    showToast(`PIN "${pin}" disalin ke clipboard!`, 'info');
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const supportedBrands = [
    'Panda POS (PRJ-58D / 80)',
    'Iware (C-58 / MP-58 / C-80)',
    'Goojprt (PT-210 / MTP-3 / JP-58)',
    'VSC (MP-58A / MP-80)',
    'RPP02N / MPT-II',
    'Xprinter (XP-58 / XP-80 / XP-N160I)',
    'Eppos (EP-58 / POS-58)',
    'Kassen (BT-P290 / MT-200)',
    'Zijiang (ZJ-5802 / ZJ-5805)',
    'Mini POS 5802 / 5805',
    'Bellav Printer POS',
    'Epson TM-T88 / TM-m30 (Bluetooth)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <Bluetooth className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1b1b23] tracking-tight">
                Koneksi Printer Struk Bluetooth (ESC/POS)
              </h2>
              <p className="text-xs text-[#767680]">
                Cetak struk thermal nirkabel via Web Bluetooth BLE & RawBT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-[#f3f2fa] p-1 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('connect')}
            className={`flex-1 py-2 rounded-lg text-center transition-all ${
              activeTab === 'connect'
                ? 'bg-white text-blue-600 shadow-xs font-extrabold'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            Koneksi & Pengaturan
          </button>
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`flex-1 py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'troubleshoot'
                ? 'bg-white text-amber-600 shadow-xs font-extrabold'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Solusi & Diagnostik Error</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 rounded-lg text-center transition-all ${
              activeTab === 'guide'
                ? 'bg-white text-blue-600 shadow-xs font-extrabold'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            Panduan Pairing & PIN
          </button>
        </div>

        {/* Iframe Notice Banner (Only if inside iframe) */}
        {diagnostics.isInIframe && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  Mode Pratinjau Terdeteksi (Iframe)
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Browser melarang Web Bluetooth di dalam pratinjau iframe. Klik tombol untuk membuka di Tab Baru agar Bluetooth berfungsi normal.
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenNewTab}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-all shrink-0 shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Buka di Tab Baru</span>
            </button>
          </div>
        )}

        {/* TAB 1: CONNECT & SETTINGS */}
        {activeTab === 'connect' && (
          <div className="space-y-4">
            {/* Status Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                btState.isConnected
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : btState.error
                  ? 'bg-red-50/70 border-red-200 text-red-950'
                  : 'bg-[#fcf8ff] border-[#e2e1ec] text-[#1b1b23]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3.5 w-3.5 rounded-full ${
                      btState.isConnected
                        ? 'bg-emerald-500 animate-pulse'
                        : btState.error
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold">
                      {btState.isConnected
                        ? `Terhubung: ${btState.deviceName || 'Thermal Printer'}`
                        : btState.error
                        ? 'Status: Error Saat Menghubungkan'
                        : 'Belum Terhubung ke Printer'}
                    </p>
                    <p className="text-[11px] text-[#767680]">
                      {btState.isConnected
                        ? 'Siap mencetak struk transaksi kasir secara nirkabel'
                        : btState.error
                        ? btState.error
                        : 'Nyalakan Bluetooth & pasangkan printer thermal Anda'}
                    </p>
                  </div>
                </div>

                {btState.isConnected ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Aktif</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-[#767680] bg-gray-100 px-2 py-0.5 rounded-md">
                    Offline
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-[#e2e1ec]/60 flex flex-wrap gap-2">
                {btState.isConnected ? (
                  <>
                    <button
                      onClick={handleTestPrint}
                      disabled={btState.isPrinting}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-xs disabled:opacity-50"
                    >
                      <Zap className="h-4 w-4" />
                      <span>{btState.isPrinting ? 'Mencetak...' : 'Cetak Struk Test (ESC/POS)'}</span>
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-all"
                    >
                      <Power className="h-4 w-4" />
                      <span>Putus</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleConnect}
                      disabled={btState.isConnecting}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-md active:scale-98 disabled:opacity-50"
                    >
                      {btState.isConnecting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Mencari Perangkat Bluetooth...</span>
                        </>
                      ) : (
                        <>
                          <BluetoothSearching className="h-4 w-4" />
                          <span>Pindai & Sambungkan Printer Bluetooth</span>
                        </>
                      )}
                    </button>
                    {diagnostics.isInIframe && (
                      <button
                        onClick={handleOpenNewTab}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-600 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all shadow-2xs"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Buka Tab Baru</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Paper Size Configuration */}
            <div className="bg-white p-4 rounded-2xl border border-[#e2e1ec] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-[#1b1b23]">
                    Ukuran Kertas Thermal Struk
                  </h4>
                </div>
                <span className="text-[10px] text-[#767680]">Standar ESC/POS</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => bluetoothPrinter.setPaperWidth('58mm')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    btState.paperWidth === '58mm'
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                      : 'border-[#e2e1ec] bg-[#fcf8ff] hover:bg-[#f3f2fa]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-[#1b1b23]">58 mm</span>
                    {btState.paperWidth === '58mm' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#767680] leading-tight">
                    Ukuran portabel paling populer (32 karakter/baris)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => bluetoothPrinter.setPaperWidth('80mm')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    btState.paperWidth === '80mm'
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                      : 'border-[#e2e1ec] bg-[#fcf8ff] hover:bg-[#f3f2fa]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-[#1b1b23]">80 mm</span>
                    {btState.paperWidth === '80mm' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#767680] leading-tight">
                    Ukuran kasir desktop lebar (48 karakter/baris)
                  </p>
                </button>
              </div>

              {/* Auto Print Toggle */}
              <div className="pt-2 border-t border-[#f3f2fa] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1b1b23]">
                    Cetak Otomatis Struk saat Selesai Transaksi
                  </p>
                  <p className="text-[10px] text-[#767680]">
                    Langsung kirim data cetak ke printer Bluetooth begitu tombol Selesai diklik di kasir
                  </p>
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

            {/* Quick 1-Click Fallback Options */}
            <div className="bg-[#fcf8ff] p-4 rounded-2xl border border-[#e2e1ec] space-y-3">
              <h4 className="text-xs font-bold text-[#1b1b23] flex items-center gap-1.5">
                <Printer className="h-4 w-4 text-blue-600" />
                <span>Opsi Cetak Alternatif Instan:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleTestRawBT}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 text-left hover:bg-amber-100/70 transition-all text-xs"
                >
                  <Smartphone className="h-4 w-4 text-amber-700 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-950">Aplikasi RawBT Android</p>
                    <p className="text-[10px] text-amber-800">Untuk printer Bluetooth 2.0 / SPP</p>
                  </div>
                </button>

                <button
                  onClick={handleTestBrowserPrint}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-left hover:bg-blue-100/70 transition-all text-xs"
                >
                  <FileText className="h-4 w-4 text-blue-700 shrink-0" />
                  <div>
                    <p className="font-bold text-blue-950">Dialog Cetak Sistem (Ctrl+P)</p>
                    <p className="text-[10px] text-blue-800">Driver Thermal USB / Bluetooth OS</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TROUBLESHOOTING & DIAGNOSTICS */}
        {activeTab === 'troubleshoot' && (
          <div className="space-y-4">
            {/* Live Environment Diagnostic Checklist */}
            <div className="p-4 rounded-2xl bg-white border border-[#e2e1ec] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#f3f2fa]">
                <h4 className="text-xs font-extrabold text-[#1b1b23] flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-blue-600" />
                  <span>Hasil Diagnostik Sistem & Browser</span>
                </h4>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                  {diagnostics.browserName}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Check 1: Web Bluetooth Support */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#fcf8ff] border border-[#f3f2fa]">
                  <div className="flex items-center gap-2">
                    {diagnostics.isSupported ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-bold text-[#1b1b23]">Dukungan Web Bluetooth Browser</p>
                      <p className="text-[10px] text-[#767680]">
                        {diagnostics.isSupported
                          ? 'Browser Anda mendukung Web Bluetooth API'
                          : 'Browser ini tidak mendukung Web Bluetooth (gunakan Chrome/Edge di Android/PC)'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      diagnostics.isSupported
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {diagnostics.isSupported ? 'DIDUKUNG' : 'TIDAK'}
                  </span>
                </div>

                {/* Check 2: Iframe Context */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#fcf8ff] border border-[#f3f2fa]">
                  <div className="flex items-center gap-2">
                    {!diagnostics.isInIframe ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <div>
                      <p className="font-bold text-[#1b1b23]">Konteks Jendela Browser (Iframe Check)</p>
                      <p className="text-[10px] text-[#767680]">
                        {!diagnostics.isInIframe
                          ? 'Aplikasi berjalan langsung di jendela penuh (Akses Bluetooth diizinkan)'
                          : 'Aplikasi berjalan di pratinjau Iframe (Harus dibuka di Tab Baru)'}
                      </p>
                    </div>
                  </div>
                  {diagnostics.isInIframe ? (
                    <button
                      onClick={handleOpenNewTab}
                      className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 transition-all flex items-center gap-1"
                    >
                      <span>Buka Tab</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      AMAN
                    </span>
                  )}
                </div>

                {/* Check 3: HTTPS Secure Context */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#fcf8ff] border border-[#f3f2fa]">
                  <div className="flex items-center gap-2">
                    {diagnostics.isSecureContext ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-bold text-[#1b1b23]">Keamanan Koneksi (HTTPS / Localhost)</p>
                      <p className="text-[10px] text-[#767680]">
                        {diagnostics.isSecureContext
                          ? 'Protokol aman HTTPS aktif'
                          : 'Web Bluetooth memerlukan koneksi HTTPS'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      diagnostics.isSecureContext
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {diagnostics.isSecureContext ? 'HTTPS AKTIF' : 'TIDAK AMAN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Troubleshooting Solutions Accordion */}
            <div className="p-4 rounded-2xl bg-[#fcf8ff] border border-[#e2e1ec] space-y-3 text-xs">
              <h4 className="font-extrabold text-[#1b1b23] flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <span>Penyebab Error Pairing & Solusinya:</span>
              </h4>

              <div className="space-y-2.5">
                {/* Case 1 */}
                <div className="p-3 bg-white rounded-xl border border-[#e2e1ec] space-y-1">
                  <p className="font-bold text-[#1b1b23] flex items-center gap-1.5 text-blue-700">
                    <span>1. Perangkat Printer Tidak Muncul di Daftar Pindai</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[#46464f] text-[11px] pl-1">
                    <li>Pastikan printer thermal dalam keadaan <strong>HIDUP (ON)</strong> dan lampu indikator Bluetooth menyala.</li>
                    <li>Pastikan printer <strong>TIDAK sedang terhubung</strong> ke HP / tablet kasir lain. Matikan Bluetooth HP lain yang sebelumnya pernah tersambung.</li>
                    <li>Khusus smartphone Android: Aktifkan <strong>Lokasi (GPS)</strong> dan berikan Izin Lokasi/Nearby Devices ke Google Chrome (persyaratan sistem Android).</li>
                  </ul>
                </div>

                {/* Case 2 */}
                <div className="p-3 bg-white rounded-xl border border-[#e2e1ec] space-y-1">
                  <p className="font-bold text-[#1b1b23] flex items-center gap-1.5 text-amber-700">
                    <span>2. Gagal Pairing / Diminta PIN Saat Pairing</span>
                  </p>
                  <p className="text-[11px] text-[#46464f]">
                    Printer thermal biasanya menggunakan PIN standar pabrik:
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    {['0000', '1234'].map((pin) => (
                      <button
                        key={pin}
                        onClick={() => handleCopyPin(pin)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-bold hover:bg-blue-100"
                      >
                        {copiedPin === pin ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>PIN: {pin}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#767680] pt-1">
                    Jika masih gagal, masuk ke Pengaturan Bluetooth di HP/Laptop &gt; Pilih Printer &gt; <em>Unpair / Lupakan Perangkat</em>, lalu sambungkan ulang.
                  </p>
                </div>

                {/* Case 3 */}
                <div className="p-3 bg-white rounded-xl border border-[#e2e1ec] space-y-1">
                  <p className="font-bold text-[#1b1b23] flex items-center gap-1.5 text-emerald-700">
                    <span>3. Printer Menggunakan Bluetooth Classic (Bukan BLE)</span>
                  </p>
                  <p className="text-[11px] text-[#46464f]">
                    Sebagian printer thermal model lama hanya mendukung Bluetooth 2.0 / 3.0 SPP. Gunakan aplikasi <strong>RawBT Print Service</strong> (gratis di Play Store) untuk mencetak langsung tanpa batasan Web Bluetooth.
                  </p>
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={handleTestRawBT}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700"
                    >
                      Buka Aplikasi RawBT
                    </button>
                    <button
                      onClick={handleTestBrowserPrint}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-[#1b1b23] font-bold text-[11px] hover:bg-gray-200"
                    >
                      Cetak via Driver Sistem
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GUIDE & BRANDS */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            <div className="bg-[#fcf8ff] p-4 rounded-2xl border border-[#e2e1ec] space-y-2 text-xs">
              <h4 className="font-extrabold text-[#1b1b23] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Panduan Lengkap Pairing Printer Thermal:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-[#46464f] text-[11px] leading-relaxed">
                <li>Nyalakan printer thermal Bluetooth Anda hingga lampu power / status menyala hijau/biru.</li>
                <li>Pastikan Bluetooth di smartphone / komputer / tablet kasir dalam keadaan <strong>AKTIF</strong>.</li>
                <li>Jika diminta PIN pairing saat pertama kali, masukkan <strong>0000</strong> atau <strong>1234</strong>.</li>
                <li>Klik tombol <strong>"Pindai & Sambungkan Printer Bluetooth"</strong> di tab Koneksi.</li>
                <li>Pilih nama printer Anda di popup browser (misalnya <em>RPP02N</em>, <em>POS-58</em>, <em>MPT-II</em>, atau <em>Iware</em>).</li>
                <li>Tekan tombol <strong>"Cetak Struk Test (ESC/POS)"</strong> untuk memastikan teks keluar dengan rapi dan presisi.</li>
              </ol>
            </div>

            {/* Compatible Models Badge Grid */}
            <div className="bg-white p-4 rounded-2xl border border-[#e2e1ec] space-y-2">
              <h4 className="text-xs font-bold text-[#1b1b23]">
                Merek & Model Printer Thermal yang Didukung:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {supportedBrands.map((brand, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-xs font-bold text-blue-900"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>{brand}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f3f2fa]">
          <span className="text-[11px] text-[#767680]">
            Protokol: Standard ESC/POS Thermal Command
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#f3f2fa] px-5 py-2.5 text-xs font-bold text-[#1b1b23] hover:bg-[#e2e1ec] transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};


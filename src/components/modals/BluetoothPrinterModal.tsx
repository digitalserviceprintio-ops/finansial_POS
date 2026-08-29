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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  bluetoothPrinter,
  BluetoothPrinterState,
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
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'connect' | 'guide'>('connect');

  useEffect(() => {
    setIsSupported(bluetoothPrinter.isBluetoothSupported());
    const unsubscribe = bluetoothPrinter.subscribe((state) => {
      setBtState(state);
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

  const supportedBrands = [
    'Panda POS',
    'Iware C-58 / MP-58',
    'VSC MP-58A',
    'Goojprt PT-210 / MTP-3',
    'RPP02N / MPT-II',
    'Xprinter XP-58 / XP-80',
    'Mini POS 5802',
    'EP-58 / POS-58',
    'Zijiang ZJ-5802',
    'Kassen BT-P290',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-[#e2e1ec] bg-white p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <Bluetooth className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1b1b23] tracking-tight">
                Printer Struk Bluetooth (ESC/POS)
              </h2>
              <p className="text-xs text-[#767680]">
                Koneksikan printer thermal nirkabel untuk cetak struk instan
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
        <div className="flex rounded-xl bg-[#f3f2fa] p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('connect')}
            className={`flex-1 py-2 rounded-lg text-center transition-all ${
              activeTab === 'connect'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            Koneksi & Pengaturan
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 rounded-lg text-center transition-all ${
              activeTab === 'guide'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            Panduan & Merek Printer
          </button>
        </div>

        {activeTab === 'connect' ? (
          <div className="space-y-4">
            {/* Status Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                btState.isConnected
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-[#fcf8ff] border-[#e2e1ec] text-[#1b1b23]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      btState.isConnected
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold">
                      {btState.isConnected
                        ? `Terhubung: ${btState.deviceName || 'Thermal Printer'}`
                        : 'Belum Terhubung ke Printer'}
                    </p>
                    <p className="text-[11px] text-[#767680]">
                      {btState.isConnected
                        ? 'Siap mencetak struk transaksi kasir secara nirkabel'
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

              {/* Action Button */}
              <div className="mt-3 pt-3 border-t border-[#e2e1ec]/60 flex flex-wrap gap-2">
                {btState.isConnected ? (
                  <>
                    <button
                      onClick={handleTestPrint}
                      disabled={btState.isPrinting}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-xs disabled:opacity-50"
                    >
                      <Zap className="h-4 w-4" />
                      <span>{btState.isPrinting ? 'Mencetak...' : 'Cetak Struk Test'}</span>
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
                  <button
                    onClick={handleConnect}
                    disabled={btState.isConnecting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-md active:scale-98 disabled:opacity-50"
                  >
                    {btState.isConnecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Mencari Perangkat Bluetooth...</span>
                      </>
                    ) : (
                      <>
                        <BluetoothSearching className="h-4 w-4" />
                        <span>Pindai & Hubungkan Printer Bluetooth</span>
                      </>
                    )}
                  </button>
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
                    Cetak Otomatis Struk
                  </p>
                  <p className="text-[10px] text-[#767680]">
                    Langsung kirim ke printer saat kasir menyelesaikan checkout
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

            {/* Android RawBT Fallback info */}
            <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 text-amber-950 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Smartphone className="h-4 w-4 shrink-0 text-amber-700" />
                <span>Opsi Cetak Alternatif: RawBT Print Service</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                Jika Anda menggunakan tablet Android tanpa Web Bluetooth, aplikasi juga mendukung pencetakan via aplikasi <strong>RawBT</strong> secara otomatis.
              </p>
            </div>
          </div>
        ) : (
          /* Guide Tab */
          <div className="space-y-4">
            <div className="bg-[#fcf8ff] p-4 rounded-2xl border border-[#e2e1ec] space-y-2 text-xs">
              <h4 className="font-extrabold text-[#1b1b23] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Cara Menghubungkan Printer Bluetooth:
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-[#46464f] text-[11px]">
                <li>Nyalakan printer thermal Bluetooth Anda hingga lampu indikator menyala.</li>
                <li>Pastikan Bluetooth di smartphone / komputer / tablet kasir dalam keadaan <strong>AKTIF</strong>.</li>
                <li>Jika diminta PIN pairing saat pertama kali, masukkan <strong>0000</strong> atau <strong>1234</strong>.</li>
                <li>Klik tombol <strong>"Pindai & Hubungkan Printer Bluetooth"</strong> di aplikasi ini.</li>
                <li>Pilih nama printer Anda (misalnya <em>RPP02N</em>, <em>POS-58</em>, <em>MPT-II</em>, atau <em>Iware</em>).</li>
                <li>Tekan tombol <strong>"Cetak Struk Test"</strong> untuk memastikan kertas dan tinta keluar dengan rapi.</li>
              </ol>
            </div>

            {/* Compatible Models Badge Grid */}
            <div className="bg-white p-4 rounded-2xl border border-[#e2e1ec] space-y-2">
              <h4 className="text-xs font-bold text-[#1b1b23]">
                Merek & Model Printer Thermal yang Didukung:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {supportedBrands.map((brand, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-1 text-[10px] font-bold text-blue-800"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#f3f2fa]">
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

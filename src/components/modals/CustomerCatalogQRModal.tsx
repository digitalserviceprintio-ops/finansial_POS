import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Download,
  Printer,
  ExternalLink,
  Store,
  Sparkles,
  Check,
  Copy,
  UtensilsCrossed,
  Share2,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateQRCodeDataURL } from '../../utils/qrisGenerator';

interface CustomerCatalogQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerCatalogQRModal: React.FC<CustomerCatalogQRModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { storeProfile, showToast, setCurrentTab } = useApp();
  const [tableNumber, setTableNumber] = useState<string>('01');
  const [includeTableParam, setIncludeTableParam] = useState<boolean>(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Compute live catalog URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const catalogUrl = includeTableParam && tableNumber.trim()
    ? `${baseUrl}?mode=katalog&meja=${encodeURIComponent(tableNumber.trim())}#katalog`
    : `${baseUrl}?mode=katalog#katalog`;

  useEffect(() => {
    if (isOpen) {
      generateQRCodeDataURL(catalogUrl, {
        width: 400,
        margin: 1,
        color: { dark: '#1b1b23', light: '#ffffff' },
      }).then((url) => {
        if (url) setQrCodeDataUrl(url);
      });
    }
  }, [isOpen, catalogUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopiedLink(true);
    showToast('Tautan Katalog Digital berhasil disalin!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `QR-Katalog-${storeProfile.name.replace(/\s+/g, '_')}-Meja-${tableNumber || 'All'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('QR Code Katalog berhasil diunduh (PNG)', 'success');
  };

  const handlePrintStandee = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Gagal membuka jendela cetak, izinkan popup browser.', 'warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Standee QR Menu - ${storeProfile.name}</title>
          <style>
            @page { size: A5 portrait; margin: 15mm; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center;
              color: #1b1b23;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              border: 3px dashed #4648d4;
              border-radius: 24px;
            }
            .store-name { font-size: 26px; font-weight: 900; color: #4648d4; margin-bottom: 4px; text-transform: uppercase; }
            .store-branch { font-size: 14px; font-weight: 700; color: #64748b; margin-bottom: 24px; }
            .badge { background: #ebeaff; color: #4648d4; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 800; display: inline-block; margin-bottom: 16px; }
            .qr-frame { background: #ffffff; padding: 16px; border: 2px solid #e2e8f0; border-radius: 20px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
            .qr-img { width: 260px; height: 260px; display: block; }
            .table-box { margin-top: 18px; font-size: 20px; font-weight: 900; background: #0f172a; color: #ffffff; padding: 8px 24px; border-radius: 12px; display: inline-block; }
            .instructions { margin-top: 24px; max-width: 320px; font-size: 13px; color: #475569; line-height: 1.5; font-weight: 500; }
            .steps { text-align: left; margin: 16px auto 0; padding-left: 20px; font-size: 12px; color: #334155; font-weight: 600; }
            .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="store-name">${storeProfile.name}</div>
          <div class="store-branch">${storeProfile.branch || 'Katalog Digital Pelanggan'}</div>
          
          <div class="badge">📲 SCAN UNTUK LIHAT MENU & PESAN</div>
          
          <div class="qr-frame">
            <img class="qr-img" src="${qrCodeDataUrl}" alt="QR Katalog" />
          </div>

          ${
            includeTableParam && tableNumber.trim()
              ? `<div class="table-box">MEJA: ${tableNumber.toUpperCase()}</div>`
              : `<div class="table-box">MENU & SELF-ORDER</div>`
          }

          <div class="instructions">
            <strong>Cara Pemesanan:</strong>
            <ol class="steps">
              <li>Buka Kamera HP atau Scanner QR</li>
              <li>Pilih menu favorit & tambahkan catatan</li>
              <li>Klik Check Out untuk mendapatkan Nomor Antrian</li>
              <li>Pesanan otomatis masuk ke dapur & kasir!</li>
            </ol>
          </div>

          <div class="footer">
            DelPOS • powered by AkuPos system • Sistem Antrian & Katalog Otomatis
          </div>

          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenSimulatedCatalog = () => {
    onClose();
    setCurrentTab('customer_catalog');
    showToast('Membuka simulasi tampilan katalog untuk pelanggan.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4] shadow-xs">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#1b1b23]">QR Code Katalog Pelanggan</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Self-Order Ready
                </span>
              </div>
              <p className="text-xs text-[#767680] font-medium">
                Pelanggan scan barcode untuk melihat katalog dan memesan langsung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23] cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Setting Nomor Meja / Standee */}
        <div className="bg-[#fcf8ff] p-3.5 rounded-2xl border border-[#e2e1ec] space-y-2.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-[#1b1b23] flex items-center gap-1.5">
              <UtensilsCrossed className="h-3.5 w-3.5 text-[#4648d4]" />
              <span>Nomor Meja / Lokasi Standee (Opsional):</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#767680] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTableParam}
                  onChange={(e) => setIncludeTableParam(e.target.checked)}
                  className="rounded border-[#cac4d0] text-[#4648d4] focus:ring-[#4648d4] h-3.5 w-3.5"
                />
                <span>Sematkan Meja di QR</span>
              </label>
            </div>
          </div>

          {includeTableParam && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Contoh: 01, 02, VIP-1, Takeaway"
                className="flex-1 rounded-xl border border-[#cac4d0] bg-white px-3 py-1.5 text-xs font-bold text-[#1b1b23] focus:border-[#4648d4] focus:outline-none focus:ring-1 focus:ring-[#4648d4]"
              />
              <div className="flex gap-1">
                {['01', '02', '03', '04', 'VIP'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTableNumber(preset)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                      tableNumber === preset
                        ? 'bg-[#4648d4] text-white'
                        : 'bg-white border border-[#e2e1ec] text-[#767680] hover:bg-[#f3f2fa]'
                    }`}
                  >
                    Meja {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* QR Display Card */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-3xl bg-gradient-to-br from-[#fcf8ff] to-[#f4f3ff] border border-[#d8d6fc]">
          {/* QR Box */}
          <div className="bg-white p-3 rounded-2xl border border-[#d8d6fc] shadow-md flex flex-col items-center shrink-0">
            <div className="h-44 w-44 bg-white flex items-center justify-center relative">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code Katalog"
                  className="h-full w-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                  Membuat QR Code...
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <span className="inline-block bg-[#ebeaff] text-[#4648d4] text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {includeTableParam && tableNumber ? `MEJA ${tableNumber.toUpperCase()}` : 'SEMUA MENU'}
              </span>
            </div>
          </div>

          {/* Explanation & Live Features */}
          <div className="flex-1 space-y-2.5 text-left">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-[#1b1b23] flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-[#4648d4]" />
                <span>Alur Pemesanan Mandiri Konsumen:</span>
              </h4>
              <ul className="text-xs text-[#52525c] space-y-1.5 font-medium">
                <li className="flex items-start gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-[#4648d4] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Pelanggan scan barcode dengan kamera ponsel pintar (tanpa instal aplikasi).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-[#4648d4] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Melihat menu makanan/minuman, foto, harga, & stok real-time.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-[#4648d4] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Check out pesanan & menerima <strong>Nomor Antrian Unik (e.g. ANT-001)</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">4</span>
                  <span>Pesanan otomatis masuk ke <strong>Antrian Dashboard Kasir</strong> tanpa tumpang tindih!</span>
                </li>
              </ul>
            </div>

            {/* Quick URL Copy */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                readOnly
                value={catalogUrl}
                className="flex-1 text-[10px] font-mono text-[#52525c] bg-white px-2.5 py-1.5 rounded-lg border border-[#cac4d0] truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#ebeaff] text-[#4648d4] hover:bg-[#d8d6fc] transition-all cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white border border-[#cac4d0] hover:bg-[#f3f2fa] text-[#1b1b23] text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#4648d4]" />
            <span>Unduh QR (PNG)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintStandee}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#4648d4] hover:bg-[#383ab2] text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Standee Meja</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSimulatedCatalog}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Uji Buka Katalog</span>
          </button>
        </div>
      </div>
    </div>
  );
};

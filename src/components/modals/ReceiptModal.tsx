import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Sliders,
  Bluetooth,
  BluetoothSearching,
  Zap,
  Smartphone,
  Settings2,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  bluetoothPrinter,
  BluetoothPrinterState,
} from '../../utils/bluetoothPrinter';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';

export const ReceiptModal: React.FC = () => {
  const {
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    completedTransaction,
    storeProfile,
    formatCurrency,
    showToast,
  } = useApp();

  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copied, setCopied] = useState(false);
  const [isBtModalOpen, setIsBtModalOpen] = useState(false);
  const [btState, setBtState] = useState<BluetoothPrinterState>(
    bluetoothPrinter.getState()
  );

  useEffect(() => {
    const unsubscribe = bluetoothPrinter.subscribe((state) => {
      setBtState(state);
      setPaperWidth(state.paperWidth);
    });
    return () => unsubscribe();
  }, []);

  // Check auto-print on mount if transaction completed and modal opens
  useEffect(() => {
    if (
      isReceiptModalOpen &&
      completedTransaction &&
      btState.isConnected &&
      btState.autoPrintOnCheckout
    ) {
      bluetoothPrinter.printTransaction(completedTransaction, storeProfile).then((res) => {
        if (res.success) {
          showToast('Struk otomatis dicetak ke printer Bluetooth!', 'success');
        }
      });
    }
  }, [isReceiptModalOpen, completedTransaction]);

  if (!isReceiptModalOpen || !completedTransaction) return null;

  const trx = completedTransaction;

  // Build raw text format for copy, download, and WhatsApp
  const generateReceiptPlainText = (): string => {
    const divider = '================================';
    const subDivider = '--------------------------------';
    const itemsText = trx.items
      .map(
        (it) =>
          `${it.productName}\n  ${it.quantity} x ${formatCurrency(it.price)} = ${formatCurrency(
            it.price * it.quantity
          )}`
      )
      .join('\n');

    let cashDetails = '';
    if (trx.paymentMethod === 'Tunai' && trx.cashGiven) {
      cashDetails = `\nTunai Diterima: ${formatCurrency(trx.cashGiven)}\nKembalian: ${formatCurrency(
        trx.change || 0
      )}`;
    }

    return `${storeProfile.branch ? storeProfile.branch.toUpperCase() : storeProfile.name.toUpperCase()}
${storeProfile.address}
Telp: ${storeProfile.phone}
${divider}
No. Order : ${trx.orderNumber}
Waktu     : ${trx.date}, ${trx.time}
Kasir     : ${trx.cashierName}
Pelanggan : ${trx.customer ? trx.customer.name : 'Pelanggan Umum'}
${subDivider}
ITEMS:
${itemsText}
${subDivider}
Subtotal  : ${formatCurrency(trx.subtotal)}
Pajak(${Math.round((storeProfile.taxRate || 0.1) * 100)}%): ${formatCurrency(trx.tax)}
TOTAL     : ${formatCurrency(trx.total)}
Metode    : ${trx.paymentMethod}${cashDetails}
${divider}
Terima Kasih Atas Kunjungan Anda!
FinansialPro UMKM POS System`;
  };

  // Bluetooth Thermal ESC/POS Direct Print Handler
  const handlePrintBluetooth = async () => {
    if (!btState.isConnected) {
      // Prompt user to connect Bluetooth printer first
      setIsBtModalOpen(true);
      return;
    }

    const res = await bluetoothPrinter.printTransaction(trx, storeProfile);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Android RawBT App URL scheme fallback print
  const handlePrintRawBT = () => {
    const success = bluetoothPrinter.printViaRawBT(trx, storeProfile);
    if (success) {
      showToast('Membuka aplikasi RawBT thermal print...', 'info');
    } else {
      showToast('Gagal memformat struk untuk RawBT.', 'error');
    }
  };

  // Standard Browser / System printer fallback
  const handlePrintBrowser = () => {
    try {
      const oldFrame = document.getElementById('finansialpro-print-iframe');
      if (oldFrame) {
        oldFrame.remove();
      }

      const printIframe = document.createElement('iframe');
      printIframe.id = 'finansialpro-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentWindow?.document;
      if (!iframeDoc) {
        window.print();
        return;
      }

      const targetWidth = paperWidth === '58mm' ? '58mm' : '80mm';

      const itemsHtml = trx.items
        .map(
          (item) => `
        <div style="margin-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span style="max-width: 70%; word-break: break-word;">${item.productName}</span>
            <span>${formatCurrency(item.price * item.quantity)}</span>
          </div>
          <div style="font-size: 10px; color: #333;">
            ${item.quantity} x ${formatCurrency(item.price)}
          </div>
        </div>
      `
        )
        .join('');

      let cashHtml = '';
      if (trx.paymentMethod === 'Tunai' && trx.cashGiven) {
        cashHtml = `
          <div style="display: flex; justify-content: space-between; margin-top: 3px;">
            <span>Tunai</span>
            <span>${formatCurrency(trx.cashGiven)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 3px;">
            <span>Kembalian</span>
            <span>${formatCurrency(trx.change || 0)}</span>
          </div>
        `;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Struk_${trx.orderNumber}</title>
          <style>
            @page {
              size: ${targetWidth} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.3;
              color: #000;
              margin: 0;
              padding: 10px 8px;
              width: ${targetWidth};
              box-sizing: border-box;
              background: #fff;
            }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="bold uppercase" style="font-size: 13px;">${storeProfile.branch || storeProfile.name}</div>
            <div style="font-size: 10px;">${storeProfile.address}</div>
            <div style="font-size: 10px;">Telp: ${storeProfile.phone}</div>
          </div>
          <div class="divider"></div>
          <div class="row">
            <span>No. Order:</span>
            <span class="bold">${trx.orderNumber}</span>
          </div>
          <div class="row">
            <span>Waktu:</span>
            <span>${trx.date}, ${trx.time}</span>
          </div>
          <div class="row">
            <span>Kasir:</span>
            <span>${trx.cashierName}</span>
          </div>
          <div class="row">
            <span>Pelanggan:</span>
            <span>${trx.customer ? trx.customer.name : 'Pelanggan Umum'}</span>
          </div>
          <div class="divider"></div>
          <div>${itemsHtml}</div>
          <div class="divider"></div>
          <div class="row">
            <span>Subtotal</span>
            <span>${formatCurrency(trx.subtotal)}</span>
          </div>
          <div class="row">
            <span>Pajak (${Math.round((storeProfile.taxRate || 0.1) * 100)}%)</span>
            <span>${formatCurrency(trx.tax)}</span>
          </div>
          <div class="total-row">
            <span>TOTAL</span>
            <span>${formatCurrency(trx.total)}</span>
          </div>
          <div class="row" style="margin-top: 4px;">
            <span>Metode Bayar</span>
            <span class="bold uppercase">${trx.paymentMethod}</span>
          </div>
          ${cashHtml}
          <div class="divider"></div>
          <div class="text-center" style="font-size: 10px;">
            <div class="bold">TERIMA KASIH</div>
            <div>Struk resmi pembayaran POS</div>
            <div style="font-size: 9px; margin-top: 4px; color: #555;">FinansialPro UMKM</div>
          </div>
        </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
        showToast('Membuka dialog cetak sistem...', 'info');
      }, 250);
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  const handleCopyText = () => {
    const text = generateReceiptPlainText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Teks struk berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = generateReceiptPlainText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Struk_${trx.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File struk .txt berhasil diunduh', 'success');
  };

  const handleShareWhatsApp = () => {
    const rawText = generateReceiptPlainText();
    const encoded = encodeURIComponent(rawText);
    const targetPhone = trx.customer?.phone ? trx.customer.phone.replace(/[^0-9]/g, '') : '';
    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone.startsWith('0') ? '62' + targetPhone.slice(1) : targetPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
    showToast('Membuka WhatsApp untuk mengirim struk...', 'info');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-md rounded-3xl border border-[#e2e1ec] bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          {/* Header Actions */}
          <div className="flex items-center justify-between pb-2 border-b border-[#f3f2fa]">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-xs font-bold">Transaksi Sukses Berhasil</span>
            </div>
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="rounded-xl p-1 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Bluetooth Status Banner & Quick Switch */}
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/70 p-3 border border-blue-200/80">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  btState.isConnected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                <Bluetooth className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#1b1b23] flex items-center gap-1.5">
                  <span>
                    {btState.isConnected
                      ? `Printer: ${btState.deviceName}`
                      : 'Bluetooth Thermal'}
                  </span>
                  {btState.isConnected && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </p>
                <p className="text-[10px] text-[#767680]">
                  {btState.isConnected
                    ? `Kertas ${paperWidth} • Siap Cetak ESC/POS`
                    : 'Printer nirkabel belum terhubung'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBtModalOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-white border border-blue-200 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-50 transition-all shadow-2xs"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>{btState.isConnected ? 'Kelola' : 'Hubungkan'}</span>
            </button>
          </div>

          {/* Paper Size Selector */}
          <div className="flex items-center justify-between rounded-xl bg-[#f3f2fa] p-1 border border-[#e2e1ec] text-xs font-semibold">
            <span className="px-2 text-[#767680] flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5" />
              Format Kertas:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setPaperWidth('58mm');
                  bluetoothPrinter.setPaperWidth('58mm');
                }}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  paperWidth === '58mm'
                    ? 'bg-white text-[#4648d4] shadow-xs font-bold'
                    : 'text-[#767680] hover:text-[#1b1b23]'
                }`}
              >
                Thermal 58mm
              </button>
              <button
                onClick={() => {
                  setPaperWidth('80mm');
                  bluetoothPrinter.setPaperWidth('80mm');
                }}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  paperWidth === '80mm'
                    ? 'bg-white text-[#4648d4] shadow-xs font-bold'
                    : 'text-[#767680] hover:text-[#1b1b23]'
                }`}
              >
                Thermal 80mm
              </button>
            </div>
          </div>

          {/* Printable Thermal Receipt Card Preview */}
          <div
            id="printable-receipt"
            className={`mx-auto rounded-2xl border-2 border-dashed border-[#d2d1dc] bg-[#fcf8ff] p-5 font-mono text-xs text-[#1b1b23] shadow-inner space-y-3 transition-all ${
              paperWidth === '58mm' ? 'max-w-[290px]' : 'max-w-[340px]'
            }`}
          >
            {/* Store Branding */}
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm tracking-tight uppercase">
                {storeProfile.branch || storeProfile.name}
              </h3>
              <p className="text-[11px] text-[#46464f] leading-tight">{storeProfile.address}</p>
              <p className="text-[10px] text-[#767680]">Telp: {storeProfile.phone}</p>
            </div>

            <div className="border-t border-dashed border-[#767680]/40 my-2"></div>

            {/* Transaction Metadata */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#767680]">No. Order:</span>
                <span className="font-bold flex items-center gap-1">
                  {trx.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#767680]">Waktu:</span>
                <span>{trx.date}, {trx.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#767680]">Kasir:</span>
                <span className="font-semibold">{trx.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#767680]">Pelanggan:</span>
                <span>{trx.customer ? trx.customer.name : 'Pelanggan Umum'}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-[#767680]/40 my-2"></div>

            {/* Itemized Table */}
            <div className="space-y-2 text-[11px]">
              {trx.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span className="truncate max-w-[170px]">{item.productName}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  <div className="text-[10px] text-[#767680]">
                    {item.quantity} x {formatCurrency(item.price)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-[#767680]/40 my-2"></div>

            {/* Totals Calculation */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-[#46464f]">
                <span>Subtotal</span>
                <span>{formatCurrency(trx.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#46464f]">
                <span>Pajak Resto ({Math.round((storeProfile.taxRate || 0.1) * 100)}%)</span>
                <span>{formatCurrency(trx.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#1b1b23] pt-1">
                <span>TOTAL</span>
                <span>{formatCurrency(trx.total)}</span>
              </div>
              <div className="flex justify-between text-[#46464f] pt-1">
                <span>Metode Bayar</span>
                <span className="font-bold uppercase">{trx.paymentMethod}</span>
              </div>
              {trx.paymentMethod === 'Tunai' && trx.cashGiven && (
                <>
                  <div className="flex justify-between text-[#46464f]">
                    <span>Uang Tunai</span>
                    <span>{formatCurrency(trx.cashGiven)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Kembalian</span>
                    <span>{formatCurrency(trx.change || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-[#767680]/40 my-2"></div>

            {/* Receipt Footer */}
            <div className="text-center text-[10px] text-[#767680] space-y-1">
              <p className="font-bold uppercase">Terima Kasih Atas Kunjungan Anda!</p>
              <p>Struk ini sah sebagai bukti pembayaran resmi.</p>
              <p className="font-mono text-[9px] pt-1">Powered by FinansialPro UMKM</p>
            </div>
          </div>

          {/* Primary Action Buttons: Bluetooth Thermal & Regular Print */}
          <div className="space-y-2 pt-1">
            {/* Primary Bluetooth Print Button */}
            <button
              id="btn-print-bluetooth"
              onClick={handlePrintBluetooth}
              disabled={btState.isPrinting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 px-4 text-xs font-extrabold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              <Bluetooth className="h-4 w-4" />
              <span>
                {btState.isPrinting
                  ? 'Sedang Mengirim ke Printer Bluetooth...'
                  : btState.isConnected
                  ? `Cetak via Bluetooth (${btState.deviceName || 'Thermal'})`
                  : 'Cetak via Bluetooth (Hubungkan Perangkat)'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-print-thermal-receipt"
                onClick={handlePrintBrowser}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] py-2.5 text-xs font-bold text-[#46464f] hover:bg-[#f3f2fa] transition-all"
                title="Cetak via dialog printer sistem / PDF"
              >
                <Printer className="h-3.5 w-3.5 text-[#4648d4]" />
                <span>Cetak Sistem / PDF</span>
              </button>

              <button
                onClick={handlePrintRawBT}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all"
                title="Cetak lewat aplikasi RawBT Android"
              >
                <Smartphone className="h-3.5 w-3.5 text-amber-700" />
                <span>Cetak RawBT App</span>
              </button>
            </div>
          </div>

          {/* Multi-channel Share & Actions */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#f3f2fa]">
            <button
              onClick={handleCopyText}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] p-2 text-xs font-semibold text-[#46464f] hover:bg-[#f3f2fa] transition-all"
              title="Salin teks struk"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span className="text-[10px]">{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-all"
              title="Kirim ke WhatsApp"
            >
              <Send className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px]">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] p-2 text-xs font-semibold text-[#46464f] hover:bg-[#f3f2fa] transition-all"
              title="Download file .txt"
            >
              <Download className="h-4 w-4" />
              <span className="text-[10px]">Unduh File</span>
            </button>
          </div>

          {/* Finish & New Order */}
          <div className="pt-2">
            <button
              onClick={() => {
                setIsReceiptModalOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#e2e1ec] bg-white py-2.5 text-xs font-bold text-[#1b1b23] hover:bg-[#f3f2fa] transition-all"
            >
              <span>Tutup & Transaksi Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Bluetooth Printer Pairing Modal */}
      <BluetoothPrinterModal
        isOpen={isBtModalOpen}
        onClose={() => setIsBtModalOpen(false)}
      />
    </>
  );
};

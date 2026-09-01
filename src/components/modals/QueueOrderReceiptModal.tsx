import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Send,
  Bluetooth,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  Tag,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { CustomerOrder, StoreProfile } from '../../types';
import {
  bluetoothPrinter,
  BluetoothPrinterState,
} from '../../utils/bluetoothPrinter';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';

interface QueueOrderReceiptModalProps {
  order: CustomerOrder | null;
  storeProfile: StoreProfile;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const QueueOrderReceiptModal: React.FC<QueueOrderReceiptModalProps> = ({
  order,
  storeProfile,
  isOpen,
  onClose,
  onShowToast,
}) => {
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

  if (!isOpen || !order) return null;

  const formatRupiah = (num: number) => {
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
  };

  const dateFormatted = new Date(order.orderTimestamp).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Plain text generator for copy / WhatsApp / download
  const generatePlainText = (): string => {
    const maxCols = paperWidth === '58mm' ? 32 : 44;
    const divider = '='.repeat(maxCols);
    const subDivider = '-'.repeat(maxCols);

    const itemsText = order.items
      .map((it) => {
        let text = `${it.quantity}x ${it.productName}\n   @ ${formatRupiah(it.price)} = ${formatRupiah(
          it.price * it.quantity
        )}`;
        if (it.notes && it.notes.trim()) {
          text += `\n   * Note: ${it.notes.trim()}`;
        }
        return text;
      })
      .join('\n');

    return `${storeProfile.name.toUpperCase()}
${storeProfile.branch ? `(${storeProfile.branch})` : 'STRUK ANTRIAN PESANAN'}
${storeProfile.address}
Telp: ${storeProfile.phone}
${divider}
*** NOMOR ANTRIAN ***
[ #${order.queueNumber} ]
${order.tableOrRoom ? order.tableOrRoom.toUpperCase() : 'DINE IN'}
${divider}
No. Pesanan: ${order.id}
Tanggal    : ${dateFormatted}
Waktu      : ${order.orderTime}
Pelanggan  : ${order.customerName}${order.customerPhone ? `\nNo. HP     : ${order.customerPhone}` : ''}
Layanan    : ${order.source === 'QR_CATALOG' ? 'Self-Order QR' : 'Kasir POS'}
${subDivider}
DAFTAR PESANAN:
${itemsText}
${subDivider}
Subtotal   : ${formatRupiah(order.subtotal)}
Pajak (${Math.round((storeProfile.taxRate || 0.1) * 100)}%): ${formatRupiah(order.tax)}
${divider}
TOTAL TAGIHAN: ${formatRupiah(order.total)}
${divider}
Metode Bayar : ${order.paymentMethod}
Status Bayar : ${order.isPaid ? 'LUNAS' : 'BELUM LUNAS (KASIR)'}
${divider}
*** SIMPAN STRUK INI ***
Nomor Anda akan dipanggil saat pesanan siap.
Terima kasih atas kunjungan Anda!
DelPOS • powered by AkuPos system`;
  };

  // Direct Bluetooth Thermal ESC/POS Print
  const handlePrintBluetooth = async () => {
    if (!btState.isConnected) {
      setIsBtModalOpen(true);
      return;
    }
    const res = await bluetoothPrinter.printCustomerOrder(order, storeProfile);
    if (onShowToast) {
      onShowToast(res.message, res.success ? 'success' : 'error');
    }
  };

  // Android RawBT Fallback
  const handlePrintRawBT = () => {
    const success = bluetoothPrinter.printCustomerOrderViaRawBT(order, storeProfile);
    if (onShowToast) {
      if (success) {
        onShowToast('Membuka aplikasi RawBT thermal print...', 'info');
      } else {
        onShowToast('Gagal memformat struk untuk RawBT.', 'error');
      }
    }
  };

  // Standard Browser / Driver Thermal Print with Clean CSS
  const handlePrintBrowser = () => {
    try {
      const oldFrame = document.getElementById('thermal-queue-print-iframe');
      if (oldFrame) {
        oldFrame.remove();
      }

      const printIframe = document.createElement('iframe');
      printIframe.id = 'thermal-queue-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const is58 = paperWidth === '58mm';
      const widthMm = is58 ? '58mm' : '80mm';
      const fontSize = is58 ? '11px' : '13px';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Struk Antrian - #${order.queueNumber}</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: ${widthMm} auto;
                margin: 0;
              }
              @media print {
                html, body {
                  width: ${widthMm};
                  margin: 0;
                  padding: 0;
                  background: #fff;
                }
              }
              body {
                font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
                font-size: ${fontSize};
                line-height: 1.35;
                color: #000;
                padding: 8px 6px;
                width: ${widthMm};
                box-sizing: border-box;
                margin: 0 auto;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .center { text-align: center; }
              .left { text-align: left; }
              .right { text-align: right; }
              .bold { font-weight: 900; }
              .store-name { font-size: ${is58 ? '14px' : '17px'}; font-weight: 900; margin-bottom: 2px; }
              .queue-box {
                border: 2px dashed #000;
                padding: 6px 4px;
                margin: 8px 0;
                text-align: center;
              }
              .queue-num {
                font-size: ${is58 ? '22px' : '28px'};
                font-weight: 900;
                letter-spacing: 1px;
                margin: 2px 0;
              }
              .divider-double {
                border-top: 2px dashed #000;
                margin: 6px 0;
              }
              .divider-single {
                border-top: 1px dashed #000;
                margin: 5px 0;
              }
              .row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
              }
              .items-table {
                width: 100%;
                margin: 6px 0;
              }
              .item-row {
                margin-bottom: 4px;
              }
              .item-notes {
                font-size: 10px;
                padding-left: 8px;
                font-style: italic;
              }
              .total-row {
                font-size: ${is58 ? '13px' : '15px'};
                font-weight: 900;
                margin: 4px 0;
              }
              .barcode-box {
                margin: 8px auto 4px auto;
                text-align: center;
              }
              .barcode-bars {
                display: inline-flex;
                gap: 1.5px;
                height: 24px;
                align-items: flex-end;
              }
              .barcode-bar {
                background: #000;
                width: 2px;
                height: 100%;
              }
              .footer {
                margin-top: 8px;
                font-size: 9px;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <!-- Store Header -->
            <div class="center store-name">${storeProfile.name.toUpperCase()}</div>
            <div class="center" style="font-size: 10px; font-weight: bold;">${storeProfile.branch ? storeProfile.branch.toUpperCase() : 'STRUK ANTRIAN PESANAN'}</div>
            <div class="center" style="font-size: 9px;">${storeProfile.address || 'Indonesia'}</div>
            <div class="center" style="font-size: 9px;">Telp: ${storeProfile.phone || '-'}</div>

            <div class="divider-double"></div>

            <!-- Big Queue Callout -->
            <div class="queue-box">
              <div style="font-size: 10px; font-weight: bold; letter-spacing: 1px;">*** NOMOR ANTRIAN ***</div>
              <div class="queue-num">#${order.queueNumber}</div>
              <div style="font-size: 11px; font-weight: bold;">${order.tableOrRoom ? order.tableOrRoom.toUpperCase() : 'DINE IN'}</div>
            </div>

            <div class="divider-single"></div>

            <!-- Order Metadata -->
            <div class="row"><span>No. Order:</span> <span class="bold">${order.id}</span></div>
            <div class="row"><span>Tanggal  :</span> <span>${dateFormatted} ${order.orderTime}</span></div>
            <div class="row"><span>Pelanggan:</span> <span class="bold">${order.customerName}</span></div>
            ${order.customerPhone ? `<div class="row"><span>No. HP   :</span> <span>${order.customerPhone}</span></div>` : ''}
            <div class="row"><span>Layanan  :</span> <span>${order.source === 'QR_CATALOG' ? 'Self-Order QR' : 'Kasir POS'}</span></div>

            <div class="divider-single"></div>

            <!-- Items Table -->
            <div class="bold left" style="font-size: 10px; margin-bottom: 3px;">DAFTAR PESANAN:</div>
            <div class="items-table">
              ${order.items
                .map(
                  (it) => `
                <div class="item-row">
                  <div class="row">
                    <span class="bold">${it.quantity}x ${it.productName}</span>
                    <span class="bold">Rp ${(it.price * it.quantity).toLocaleString('id-ID')}</span>
                  </div>
                  <div style="font-size: 9px; color: #333; padding-left: 6px;">@ Rp ${it.price.toLocaleString('id-ID')}</div>
                  ${it.notes ? `<div class="item-notes">* Note: ${it.notes}</div>` : ''}
                </div>
              `
                )
                .join('')}
            </div>

            <div class="divider-single"></div>

            <!-- Totals -->
            <div class="row"><span>Subtotal:</span> <span>Rp ${order.subtotal.toLocaleString('id-ID')}</span></div>
            <div class="row"><span>Pajak (${Math.round((storeProfile.taxRate || 0.1) * 100)}%):</span> <span>Rp ${order.tax.toLocaleString('id-ID')}</span></div>
            
            <div class="divider-double"></div>
            
            <div class="row total-row">
              <span>TOTAL TAGIHAN:</span>
              <span>Rp ${order.total.toLocaleString('id-ID')}</span>
            </div>

            <div class="divider-double"></div>

            <!-- Payment status -->
            <div class="row"><span>Metode Bayar:</span> <span class="bold">${order.paymentMethod}</span></div>
            <div class="row"><span>Status Bayar:</span> <span class="bold">${order.isPaid ? 'LUNAS' : 'BELUM LUNAS (KASIR)'}</span></div>

            <div class="divider-single"></div>

            <!-- Barcode Simulation -->
            <div class="barcode-box">
              <div class="barcode-bars">
                ${[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 2]
                  .map(
                    (w, i) =>
                      `<div class="barcode-bar" style="width: ${w}px; height: ${i % 3 === 0 ? '22px' : '26px'};"></div>`
                  )
                  .join('')}
              </div>
              <div style="font-size: 8px; letter-spacing: 2px; margin-top: 2px;">* ${order.queueNumber} - ${order.id} *</div>
            </div>

            <!-- Footer Message -->
            <div class="footer">
              <div class="bold">*** SIMPAN STRUK INI ***</div>
              <div>Nomor Anda akan dipanggil saat pesanan siap.</div>
              <div>Terima kasih atas kunjungan Anda!</div>
              <div style="margin-top: 4px; font-size: 8px; color: #555;">DelPOS Retail Thermal • powered by AkuPos</div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 250);
              };
            </script>
          </body>
        </html>
      `;

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    } catch (e) {
      console.error('Browser print error:', e);
      window.print();
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatePlainText());
    setCopied(true);
    if (onShowToast) {
      onShowToast('Teks struk antrian disalin ke clipboard!', 'info');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = generatePlainText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk_Antrian_${order.queueNumber}_${order.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast(`Struk antrian #${order.queueNumber} berhasil diunduh.`, 'success');
    }
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generatePlainText());
    const phone = order.customerPhone ? order.customerPhone.replace(/\D/g, '') : '';
    let waUrl = `https://wa.me/?text=${text}`;
    if (phone) {
      let formattedPhone = phone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1);
      }
      waUrl = `https://wa.me/${formattedPhone}?text=${text}`;
    }
    window.open(waUrl, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#e2e1ec] overflow-hidden my-auto flex flex-col md:flex-row max-h-[92vh]">
          
          {/* LEFT COLUMN: Thermal Paper Preview (Ritel Print Thermal Look) */}
          <div className="flex-1 bg-[#1e1e24] p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-center">
            
            {/* Paper Width Selector Pill */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold text-gray-300">Format Kertas:</span>
              <div className="flex bg-black/40 p-0.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    paperWidth === '58mm'
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  58mm (Kasir Standar)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    paperWidth === '80mm'
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  80mm (Lebar)
                </button>
              </div>
            </div>

            {/* REALISTIC THERMAL PAPER CONTAINER */}
            <div
              className={`relative bg-[#fcfcfb] text-[#111111] shadow-2xl transition-all duration-300 ${
                paperWidth === '58mm' ? 'w-[280px] sm:w-[310px]' : 'w-[320px] sm:w-[380px]'
              }`}
              style={{
                fontFamily: `'Courier New', Courier, 'Lucida Console', Monaco, monospace`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {/* Serrated / Jagged Top Paper Edge */}
              <div
                className="h-3 w-full bg-[#fcfcfb] -mt-2.5 overflow-hidden"
                style={{
                  clipPath:
                    'polygon(0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%)',
                }}
              />

              {/* Thermal Paper Body */}
              <div className="p-4 sm:p-5 text-xs space-y-2.5">
                
                {/* Store Header */}
                <div className="text-center space-y-0.5">
                  <h3 className="font-black text-sm sm:text-base tracking-wider uppercase">
                    {storeProfile.name}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-700">
                    {storeProfile.branch ? storeProfile.branch.toUpperCase() : 'STRUK ANTRIAN PESANAN'}
                  </p>
                  <p className="text-[9px] text-gray-600 leading-tight">
                    {storeProfile.address || 'Indonesia'}
                  </p>
                  <p className="text-[9px] text-gray-600">
                    Telp: {storeProfile.phone || '-'}
                  </p>
                </div>

                {/* Double Divider */}
                <div className="border-t-2 border-dashed border-black my-2" />

                {/* PROMINENT QUEUE CALLOUT */}
                <div className="border-2 border-dashed border-black p-2.5 rounded-sm text-center bg-black/3 space-y-1">
                  <span className="text-[10px] font-black tracking-widest uppercase block text-gray-800">
                    *** NOMOR ANTRIAN ***
                  </span>
                  <div className="text-2xl sm:text-3xl font-black tracking-wider text-black py-0.5">
                    #{order.queueNumber}
                  </div>
                  <div className="text-[11px] font-black text-black uppercase">
                    {order.tableOrRoom ? order.tableOrRoom : 'DINE IN'}
                  </div>
                </div>

                {/* Single Divider */}
                <div className="border-t border-dashed border-black my-1.5" />

                {/* Metadata */}
                <div className="text-[11px] space-y-1 text-gray-800">
                  <div className="flex justify-between">
                    <span>No. Order</span>
                    <span className="font-bold text-black">{order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu</span>
                    <span>{dateFormatted} {order.orderTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan</span>
                    <span className="font-black text-black">{order.customerName}</span>
                  </div>
                  {order.customerPhone && (
                    <div className="flex justify-between">
                      <span>No. HP</span>
                      <span>{order.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Layanan</span>
                    <span>{order.source === 'QR_CATALOG' ? 'Self-Order QR' : 'Kasir POS'}</span>
                  </div>
                </div>

                {/* Single Divider */}
                <div className="border-t border-dashed border-black my-1.5" />

                {/* Items List */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-black text-[10px] uppercase text-gray-700 pb-0.5">
                    <span>ITEM PESANAN</span>
                    <span>TOTAL</span>
                  </div>
                  {order.items.map((it, idx) => (
                    <div key={idx} className="text-[11px] leading-tight space-y-0.5">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-black pr-2">
                          {it.quantity}x {it.productName}
                        </span>
                        <span className="font-black text-black shrink-0">
                          {formatRupiah(it.price * it.quantity)}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-600 pl-2">
                        @ {formatRupiah(it.price)}
                      </div>
                      {it.notes && (
                        <div className="text-[9px] text-rose-700 italic pl-2">
                          * Note: {it.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Single Divider */}
                <div className="border-t border-dashed border-black my-1.5" />

                {/* Totals */}
                <div className="text-[11px] space-y-1">
                  <div className="flex justify-between text-gray-800">
                    <span>Subtotal</span>
                    <span>{formatRupiah(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-800">
                    <span>Pajak ({Math.round((storeProfile.taxRate || 0.1) * 100)}%)</span>
                    <span>{formatRupiah(order.tax)}</span>
                  </div>

                  <div className="border-t-2 border-dashed border-black my-1.5" />

                  <div className="flex justify-between font-black text-xs sm:text-sm text-black pt-0.5">
                    <span>TOTAL TAGIHAN</span>
                    <span>{formatRupiah(order.total)}</span>
                  </div>

                  <div className="border-t-2 border-dashed border-black my-1.5" />

                  <div className="flex justify-between text-[11px]">
                    <span>Metode Bayar</span>
                    <span className="font-black text-black">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Status Bayar</span>
                    <span className={`font-black ${order.isPaid ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {order.isPaid ? 'LUNAS (TERVERIFIKASI)' : 'BELUM LUNAS (BAYAR DI KASIR)'}
                    </span>
                  </div>
                </div>

                {/* Single Divider */}
                <div className="border-t border-dashed border-black my-2" />

                {/* Barcode Graphic Simulation */}
                <div className="text-center py-1 space-y-1">
                  <div className="inline-flex items-center justify-center gap-0.5 h-6 opacity-85">
                    {[
                      3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4,
                    ].map((w, i) => (
                      <div
                        key={i}
                        className="bg-black"
                        style={{
                          width: `${w * 1.2}px`,
                          height: i % 4 === 0 ? '24px' : '20px',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[8px] font-bold text-gray-600 tracking-widest">
                    * {order.queueNumber} - {order.id.slice(-6)} *
                  </p>
                </div>

                {/* Footer Message */}
                <div className="text-center space-y-0.5 pt-1 text-[9px] text-gray-700">
                  <p className="font-black text-black">*** SIMPAN STRUK INI ***</p>
                  <p>Nomor antrian akan dipanggil saat pesanan siap.</p>
                  <p>Terima kasih atas kunjungan Anda!</p>
                  <p className="text-[8px] text-gray-500 pt-1">
                    DelPOS Retail Thermal • powered by AkuPos • {new Date().toLocaleTimeString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Serrated / Jagged Bottom Paper Edge */}
              <div
                className="h-3 w-full bg-[#fcfcfb] -mb-2.5 overflow-hidden"
                style={{
                  clipPath:
                    'polygon(0% 0%, 2% 100%, 4% 0%, 6% 100%, 8% 0%, 10% 100%, 12% 0%, 14% 100%, 16% 0%, 18% 100%, 20% 0%, 22% 100%, 24% 0%, 26% 100%, 28% 0%, 30% 100%, 32% 0%, 34% 100%, 36% 0%, 38% 100%, 40% 0%, 42% 100%, 44% 0%, 46% 100%, 48% 0%, 50% 100%, 52% 0%, 54% 100%, 56% 0%, 58% 100%, 60% 0%, 62% 100%, 64% 0%, 66% 100%, 68% 0%, 70% 100%, 72% 0%, 74% 100%, 76% 0%, 78% 100%, 80% 0%, 82% 100%, 84% 0%, 86% 100%, 88% 0%, 90% 100%, 92% 0%, 94% 100%, 96% 0%, 98% 100%, 100% 0%)',
                }}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Controls, Printer Connection, & Sharing */}
          <div className="w-full md:w-88 p-5 sm:p-6 bg-white flex flex-col justify-between overflow-y-auto space-y-4">
            
            {/* Top Modal Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-[#ebeaff] text-[#4648d4] flex items-center justify-center">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#1b1b23]">Struk Antrian Ritel</h2>
                    <p className="text-xs text-[#767680] font-medium">Format Thermal ESC/POS</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-[#767680] hover:bg-[#f3f2fa] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Bluetooth Printer Status Card */}
              <div className="mt-4 p-3.5 rounded-2xl border border-[#e2e1ec] bg-[#fcf8ff] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bluetooth
                      className={`h-4 w-4 ${
                        btState.isConnected ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs font-black text-[#1b1b23]">
                      Printer Bluetooth Thermal
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      btState.isConnected
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {btState.isConnected ? 'Terhubung' : 'Belum Konek'}
                  </span>
                </div>

                {btState.isConnected ? (
                  <p className="text-xs font-bold text-emerald-700 truncate">
                    ✓ {btState.deviceName || 'Thermal POS Printer'} ({paperWidth})
                  </p>
                ) : (
                  <p className="text-[11px] text-[#767680] font-medium">
                    Hubungkan printer thermal mini (Panda, Goojprt, RPP02, MPT-II) via Bluetooth Web.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setIsBtModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white border border-[#cac4d0] hover:bg-[#ebeaff] hover:border-[#4648d4] text-xs font-black text-[#4648d4] transition-all cursor-pointer"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>{btState.isConnected ? 'Ganti Printer / Pengaturan' : 'Hubungkan Printer Bluetooth'}</span>
                </button>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-2.5">
              {/* 1. Direct Bluetooth ESC/POS Print */}
              <button
                type="button"
                onClick={handlePrintBluetooth}
                disabled={btState.isPrinting}
                className="w-full flex items-center justify-center gap-2 bg-[#4648d4] hover:bg-[#383ab2] active:scale-98 text-white py-3 px-4 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                <span>
                  {btState.isConnected
                    ? `Cetak ke Bluetooth (${paperWidth})`
                    : 'Cetak via Bluetooth Thermal'}
                </span>
              </button>

              {/* 2. System / Browser Thermal Print */}
              <button
                type="button"
                onClick={handlePrintBrowser}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-2.5 px-4 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Driver POS / Browser (58/80mm)</span>
              </button>

              {/* 3. Android RawBT App Fallback */}
              <button
                type="button"
                onClick={handlePrintRawBT}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white py-2.5 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                <span>Cetak via RawBT Android App</span>
              </button>

              {/* Secondary Actions: WhatsApp, Salin, Unduh */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-200 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Kirim WA</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#f3f2fa] hover:bg-[#ebeaff] text-[#4648d4] text-xs font-extrabold border border-[#cac4d0] transition-all cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh File Struk (.txt)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bluetooth Printer Setup Modal Sub-dialog */}
      <BluetoothPrinterModal
        isOpen={isBtModalOpen}
        onClose={() => setIsBtModalOpen(false)}
      />
    </>
  );
};

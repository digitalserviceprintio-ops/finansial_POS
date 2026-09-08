import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Building,
  CheckCircle2,
  Calendar,
  CreditCard,
  Banknote,
  DollarSign,
  TrendingUp,
  Package,
  User,
  Clock,
  Download,
} from 'lucide-react';
import { Transaction, Product, StoreProfile } from '../../types';

interface PrintSalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  products: Product[];
  storeProfile: StoreProfile;
  formatCurrency: (val: number) => string;
  periodLabel: string;
}

export const PrintSalesReportModal: React.FC<PrintSalesReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  products,
  storeProfile,
  formatCurrency,
  periodLabel,
}) => {
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');

  if (!isOpen) return null;

  // Filter completed transactions
  const completedTrx = transactions.filter((t) => t.status === 'Selesai');
  const grossSales = completedTrx.reduce((sum, t) => sum + t.subtotal, 0);
  const totalDiscount = completedTrx.reduce((sum, t) => sum + (t.discount || 0), 0);
  const totalTax = completedTrx.reduce((sum, t) => sum + (t.tax || 0), 0);
  const netSales = completedTrx.reduce((sum, t) => sum + t.total, 0);
  const totalQtySold = completedTrx.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const aov = completedTrx.length > 0 ? netSales / completedTrx.length : 0;

  // Product aggregated sales
  const itemMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
      purchasePrice: number;
    }
  >();

  completedTrx.forEach((trx) => {
    trx.items.forEach((item) => {
      const existing = itemMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        quantity: 0,
        revenue: 0,
        purchasePrice: 0,
      };

      const matchedProd = products.find((p) => p.id === item.productId);
      const buyPrice = matchedProd ? matchedProd.purchasePrice : item.price * 0.6;

      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
      existing.purchasePrice = buyPrice;
      itemMap.set(item.productId, existing);
    });
  });

  const productBreakdown = Array.from(itemMap.values()).sort(
    (a, b) => b.quantity - a.quantity
  );

  const totalHPP = productBreakdown.reduce(
    (sum, p) => sum + p.purchasePrice * p.quantity,
    0
  );
  const estimatedGrossProfit = netSales - totalHPP;
  const profitMarginPercent = netSales > 0 ? (estimatedGrossProfit / netSales) * 100 : 0;

  // Payment Breakdown
  const paymentMap = new Map<string, { count: number; total: number }>();
  completedTrx.forEach((t) => {
    const existing = paymentMap.get(t.paymentMethod) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += t.total;
    paymentMap.set(t.paymentMethod, existing);
  });
  const paymentBreakdown = Array.from(paymentMap.entries());

  // Cashier Breakdown
  const cashierMap = new Map<string, { count: number; total: number }>();
  completedTrx.forEach((t) => {
    const name = t.cashierName || storeProfile.owner || 'Kasir Umum';
    const existing = cashierMap.get(name) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += t.total;
    cashierMap.set(name, existing);
  });
  const cashierBreakdown = Array.from(cashierMap.entries());

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-[#4648d4]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1b1b23]">
                Pratinjau Cetak Laporan Penjualan
              </h3>
              <p className="text-xs text-[#767680]">
                Dokumen rekap detail transaksi penjualan ({periodLabel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="hidden sm:flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  printFormat === 'a4'
                    ? 'bg-white text-[#4648d4] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4 / Lembar Resmi
              </button>
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  printFormat === 'thermal'
                    ? 'bg-white text-[#4648d4] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Struk Thermal Kasir
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-[#767680] hover:bg-[#f3f2fa] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable Printable Preview */}
        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-4">
          {/* Printable Container with styling for print */}
          <div
            id="printable-sales-report"
            className={`mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs text-slate-800 ${
              printFormat === 'thermal' ? 'max-w-sm font-mono text-xs' : 'max-w-2xl text-xs'
            }`}
          >
            {/* Store & Document Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
                {storeProfile.name}
              </h1>
              <p className="text-xs text-slate-600">{storeProfile.branch}</p>
              <p className="text-[11px] text-slate-500">{storeProfile.address} • Telp: {storeProfile.phone}</p>
              <div className="pt-2">
                <span className="inline-block bg-slate-100 border border-slate-300 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
                  LAPORAN DETAIL TRANSAKSI PENJUALAN
                </span>
              </div>
            </div>

            {/* Report Meta Info */}
            <div className="grid grid-cols-2 gap-2 py-3 border-b border-dashed border-slate-300 text-[11px]">
              <div>
                <span className="text-slate-500 block">Periode Laporan:</span>
                <strong className="text-slate-900">{periodLabel}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Dicetak Pada:</span>
                <span className="text-slate-800">{currentDate} {currentTime}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Transaksi Selesai:</span>
                <strong className="text-slate-900">{completedTrx.length} Nota Terbit</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Total Item Terjual:</span>
                <strong className="text-slate-900">{totalQtySold} Unit Produk</strong>
              </div>
            </div>

            {/* 1. Ringkasan Finansial Eksekutif */}
            <div className="py-3 border-b border-slate-200 space-y-2">
              <h2 className="font-extrabold uppercase tracking-wider text-slate-900 text-[11px] flex items-center gap-1.5">
                <span>1. RINGKASAN OMZET & PROFIT</span>
              </h2>
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-600">Omzet Kotor (Gross Subtotal):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(grossSales)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Total Diskon Promo:</span>
                    <span>-{formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                {totalTax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Total Pajak Terkumpul:</span>
                    <span>{formatCurrency(totalTax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-300 text-sm font-black text-slate-900">
                  <span>TOTAL OMZET BERSIH:</span>
                  <span className="text-[#4648d4]">{formatCurrency(netSales)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                  <span>Rata-Rata Transaksi (AOV):</span>
                  <span>{formatCurrency(Math.round(aov))} / nota</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-800 font-semibold pt-1 border-t border-dashed border-slate-200">
                  <span>Estimasi Laba Kotor (Gross Profit):</span>
                  <span>
                    {formatCurrency(Math.round(estimatedGrossProfit))} ({profitMarginPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Rincian Metode Pembayaran */}
            <div className="py-3 border-b border-slate-200 space-y-2">
              <h2 className="font-extrabold uppercase tracking-wider text-slate-900 text-[11px]">
                2. RINCIAN METODE PEMBAYARAN
              </h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
                    <th className="py-1">Metode</th>
                    <th className="py-1 text-center">Jumlah Nota</th>
                    <th className="py-1 text-right">Total Nominal</th>
                    <th className="py-1 text-right">Porsi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentBreakdown.map(([method, data]) => {
                    const percent = netSales > 0 ? (data.total / netSales) * 100 : 0;
                    return (
                      <tr key={method}>
                        <td className="py-1 font-bold text-slate-800">{method}</td>
                        <td className="py-1 text-center">{data.count}</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(data.total)}</td>
                        <td className="py-1 text-right font-bold text-slate-700">{percent.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 3. Rincian Kinerja Kasir */}
            <div className="py-3 border-b border-slate-200 space-y-2">
              <h2 className="font-extrabold uppercase tracking-wider text-slate-900 text-[11px]">
                3. REKAP PENJUALAN PER KASIR
              </h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
                    <th className="py-1">Nama Kasir</th>
                    <th className="py-1 text-center">Nota</th>
                    <th className="py-1 text-right">Total Penjualan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashierBreakdown.map(([name, data]) => (
                    <tr key={name}>
                      <td className="py-1 font-bold text-slate-800">{name}</td>
                      <td className="py-1 text-center">{data.count}</td>
                      <td className="py-1 text-right font-semibold">{formatCurrency(data.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Rincian Produk Terjual */}
            <div className="py-3 space-y-2">
              <h2 className="font-extrabold uppercase tracking-wider text-slate-900 text-[11px]">
                4. DAFTAR ITEM PRODUK TERJUAL ({productBreakdown.length} PRODUK)
              </h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
                    <th className="py-1 w-6">No</th>
                    <th className="py-1">Nama Produk</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Total Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productBreakdown.map((item, idx) => (
                    <tr key={item.productId}>
                      <td className="py-1 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-1 font-bold text-slate-800 truncate max-w-[200px]">
                        {item.productName}
                      </td>
                      <td className="py-1 text-center font-bold">{item.quantity}</td>
                      <td className="py-1 text-right font-semibold">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature / Validation Footer */}
            <div className="pt-6 mt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[11px]">
              <div className="space-y-12">
                <p className="text-slate-600">Dibuat Oleh (Petugas Kasir)</p>
                <div>
                  <p className="font-bold underline text-slate-900">
                    {cashierBreakdown[0]?.[0] || storeProfile.owner}
                  </p>
                  <p className="text-[10px] text-slate-500">Staf Kasir Bertugas</p>
                </div>
              </div>
              <div className="space-y-12">
                <p className="text-slate-600">Disetujui Oleh (Pemilik / Manager)</p>
                <div>
                  <p className="font-bold underline text-slate-900">{storeProfile.owner}</p>
                  <p className="text-[10px] text-slate-500">Pemilik Toko / Manajemen</p>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="text-center pt-4 text-[9px] text-slate-400">
              Dokumen ini dihasilkan secara otomatis oleh DelPOS Kasir & Akuntansi Cloud • Simpan sebagai arsip toko
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#f3f2fa] shrink-0">
          <div className="text-xs text-[#767680] text-center sm:text-left">
            Siap dicetak ke printer standar atau simpan PDF melalui menu cetak browser.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-[#4648d4] hover:bg-[#3435ad] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-98"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Laporan Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Print Specific CSS to isolate printable container */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-sales-report, #printable-sales-report * {
            visibility: visible;
          }
          #printable-sales-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 10mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

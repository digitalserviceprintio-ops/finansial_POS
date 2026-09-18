import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateFinancialPdfReport, PdfReportFilterOptions } from '../../utils/pdfReportGenerator';
import { formatLocalDateToISO, isDateInRange } from '../../utils/dateUtils';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportType?: 'all_summary' | 'cashflow' | 'profit_loss' | 'product_sales';
  initialStartDate?: string;
  initialEndDate?: string;
  initialPeriod?:
    | 'Semua'
    | 'Hari Ini'
    | 'Kemarin'
    | '7 Hari Terakhir'
    | '30 Hari Terakhir'
    | 'Bulan Ini'
    | 'Bulan Lalu'
    | 'Tahun Ini'
    | 'Kustom';
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  initialReportType = 'all_summary',
  initialStartDate,
  initialEndDate,
  initialPeriod,
}) => {
  const { storeProfile, transactions, expenses, products, formatCurrency, showToast, cashierName } =
    useApp();

  // Filters State
  const [period, setPeriod] = useState<
    'Semua' | 'Hari Ini' | 'Kemarin' | '7 Hari Terakhir' | '30 Hari Terakhir' | 'Bulan Ini' | 'Bulan Lalu' | 'Tahun Ini' | 'Kustom'
  >(() => initialPeriod || (initialStartDate && initialEndDate ? 'Kustom' : 'Bulan Ini'));

  const [startDate, setStartDate] = useState(() => {
    if (initialStartDate) return initialStartDate;
    const d = new Date();
    d.setDate(1);
    return formatLocalDateToISO(d);
  });
  const [endDate, setEndDate] = useState(() => initialEndDate || formatLocalDateToISO(new Date()));
  const [reportType, setReportType] = useState<'all_summary' | 'cashflow' | 'profit_loss' | 'product_sales'>(
    initialReportType
  );

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialStartDate && initialEndDate) {
        setStartDate(initialStartDate);
        setEndDate(initialEndDate);
        setPeriod(initialPeriod || 'Kustom');
      } else if (initialPeriod) {
        setPeriod(initialPeriod);
      }
      if (initialReportType) {
        setReportType(initialReportType);
      }
    }
  }, [isOpen, initialStartDate, initialEndDate, initialPeriod, initialReportType]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Semua');
  const [cashierFilter, setCashierFilter] = useState<string>('Semua');
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculate filtered date bounds
  const getDatesForPeriod = () => {
    const today = new Date();
    const todayStr = formatLocalDateToISO(today);

    if (period === 'Semua') {
      return { start: undefined, end: undefined, label: 'Semua Periode (Semua Waktu)' };
    }
    if (period === 'Hari Ini') {
      return { start: todayStr, end: todayStr, label: 'Hari Ini' };
    }
    if (period === 'Kemarin') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = formatLocalDateToISO(yesterday);
      return { start: yStr, end: yStr, label: 'Kemarin' };
    }
    if (period === '7 Hari Terakhir') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { start: formatLocalDateToISO(d), end: todayStr, label: '7 Hari Terakhir' };
    }
    if (period === '30 Hari Terakhir') {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { start: formatLocalDateToISO(d), end: todayStr, label: '30 Hari Terakhir' };
    }
    if (period === 'Bulan Ini') {
      const start = formatLocalDateToISO(new Date(today.getFullYear(), today.getMonth(), 1));
      return { start, end: todayStr, label: 'Bulan Ini' };
    }
    if (period === 'Bulan Lalu') {
      const start = formatLocalDateToISO(new Date(today.getFullYear(), today.getMonth() - 1, 1));
      const end = formatLocalDateToISO(new Date(today.getFullYear(), today.getMonth(), 0));
      return { start, end, label: 'Bulan Lalu' };
    }
    if (period === 'Tahun Ini') {
      const start = formatLocalDateToISO(new Date(today.getFullYear(), 0, 1));
      return { start, end: todayStr, label: 'Tahun Ini' };
    }
    return { start: startDate, end: endDate, label: `${startDate} s/d ${endDate}` };
  };

  const dates = getDatesForPeriod();

  // Filter transactions (include Selesai or uncancelled orders)
  let filteredTrx = transactions.filter((t) => t.status === 'Selesai' || !t.status);
  if (paymentMethod !== 'Semua') {
    filteredTrx = filteredTrx.filter((t) => t.paymentMethod === paymentMethod);
  }
  if (cashierFilter !== 'Semua') {
    filteredTrx = filteredTrx.filter((t) => t.cashierName === cashierFilter);
  }
  if (dates.start || dates.end) {
    filteredTrx = filteredTrx.filter((t) => isDateInRange(t.date, t.timestamp, dates.start, dates.end));
  }

  // Filter expenses
  let filteredExp = expenses;
  if (dates.start || dates.end) {
    filteredExp = filteredExp.filter((e) => isDateInRange(e.date, e.timestamp, dates.start, dates.end));
  }

  // Calculate metrics
  const totalOmzet = filteredTrx.reduce((acc, t) => acc + t.total, 0);
  const totalSubtotal = filteredTrx.reduce((acc, t) => acc + t.subtotal, 0);
  const totalCashOut = filteredExp.reduce((acc, e) => acc + e.amount, 0);

  const totalHPP = filteredTrx.reduce((acc, t) => {
    return (
      acc +
      t.items.reduce((itemAcc, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const buyPrice = prod ? prod.purchasePrice : item.price * 0.6;
        return itemAcc + buyPrice * item.quantity;
      }, 0)
    );
  }, 0);

  const grossProfit = totalSubtotal - totalHPP;
  const netProfit = grossProfit - totalCashOut;
  const netMarginPercent = totalSubtotal > 0 ? Math.round((netProfit / totalSubtotal) * 100) : 0;

  // Product sales ranking for preview
  const productSalesMap: Record<string, { name: string; category: string; price: number; qty: number; total: number }> = {};
  filteredTrx.forEach((trx) => {
    trx.items?.forEach((item: any) => {
      const prod = products.find((p) => p.id === item.productId);
      const productName =
        item.productName ||
        item.name ||
        (item.product && item.product.name) ||
        prod?.name ||
        'Produk';
      const pKey = item.productId || productName;

      if (!productSalesMap[pKey]) {
        productSalesMap[pKey] = {
          name: productName,
          category: prod?.category || item.category || 'Umum',
          price: item.price || prod?.sellingPrice || 0,
          qty: 0,
          total: 0,
        };
      }
      const itemQty = Number(item.quantity) || 1;
      const itemPrice = Number(item.price) || prod?.sellingPrice || 0;
      productSalesMap[pKey].qty += itemQty;
      productSalesMap[pKey].total += itemPrice * itemQty;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Extract unique cashiers
  const cashiersList = Array.from(new Set(transactions.map((t) => t.cashierName).filter(Boolean)));

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const options: PdfReportFilterOptions = {
        periodLabel: dates.label,
        startDate: dates.start,
        endDate: dates.end,
        reportType,
        paymentMethod,
        cashierFilter,
        includeSignatures,
        orientation: 'portrait',
      };

      const savedName = generateFinancialPdfReport(storeProfile, transactions, expenses, products, options, 'download');
      showToast(`Laporan PDF berhasil diunduh: ${savedName}`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Gagal memproses dokumen PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintDocument = () => {
    setIsGenerating(true);
    try {
      const options: PdfReportFilterOptions = {
        periodLabel: dates.label,
        startDate: dates.start,
        endDate: dates.end,
        reportType,
        paymentMethod,
        cashierFilter,
        includeSignatures,
        orientation: 'portrait',
      };

      generateFinancialPdfReport(storeProfile, transactions, expenses, products, options, 'print');
      showToast('Membuka pratinjau cetak PDF dokumen resmi...', 'info');
    } catch (err) {
      console.error('Print PDF error:', err);
      // Fallback
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/30 border border-indigo-400/30 text-white shadow-inner">
              <FileText className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  Cetak & Unduh Laporan Finansial PDF
                </h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  Format Standar Akuntansi
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Dokumen resmi dengan kop toko, nomor seri dokumen, dan lembar pengesahan
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-export-pdf-modal"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Layout: 2 Columns (Left: Filters, Right: Interactive Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left Column: Filter Controls */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-50/50 space-y-5 overflow-y-auto">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
              <span>Pengaturan & Filter Dokumen</span>
            </div>

            {/* 1. Tipe Laporan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Jenis Dokumen Laporan</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'all_summary', label: 'Ringkasan Lengkap', sub: 'Omzet, P&L, Beban, Ranking' },
                  { id: 'profit_loss', label: 'Laba & Rugi (P&L)', sub: 'Standar SAK EMKM' },
                  { id: 'cashflow', label: 'Arus Kas & Beban', sub: 'Buku Kas Masuk/Keluar' },
                  { id: 'product_sales', label: 'Ranking Produk', sub: 'Omzet & Kontribusi Unit' },
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`btn-report-type-${item.id}`}
                    type="button"
                    onClick={() => setReportType(item.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      reportType === item.id
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/20 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-extrabold">{item.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Periode Waktu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Periode Tanggal</span>
                <span className="text-[10px] text-indigo-600 font-semibold">{dates.label}</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  'Semua',
                  'Hari Ini',
                  'Kemarin',
                  '7 Hari Terakhir',
                  '30 Hari Terakhir',
                  'Bulan Ini',
                  'Bulan Lalu',
                  'Tahun Ini',
                  'Kustom',
                ].map((p) => (
                  <button
                    key={p}
                    id={`btn-period-${p.replace(/\s+/g, '-').toLowerCase()}`}
                    type="button"
                    onClick={() => setPeriod(p as any)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                      period === p
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Inputs */}
              {period === 'Kustom' && (
                <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Mulai Dari</span>
                    <input
                      type="date"
                      id="input-pdf-start-date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Sampai Tanggal</span>
                    <input
                      type="date"
                      id="input-pdf-end-date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Filter Metode Pembayaran & Kasir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Metode Bayar</label>
                <select
                  id="select-pdf-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="Semua">Semua Metode</option>
                  <option value="Tunai">Tunai / Cash</option>
                  <option value="QRIS">QRIS Dinamis</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="Kartu Debit">Kartu Debit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Filter Kasir</label>
                <select
                  id="select-pdf-cashier"
                  value={cashierFilter}
                  onChange={(e) => setCashierFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="Semua">Semua Kasir</option>
                  {cashiersList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Opsi Lembar Pengesahan */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="checkbox-pdf-signatures"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  Sertakan Kolom Tanda Tangan & Cap Validasi Resmi
                </span>
              </label>
              <p className="text-[10px] text-slate-500 pl-6 mt-0.5">
                Menyertakan lembar pengesahan kasir dan pimpinan di halaman penutup laporan.
              </p>
            </div>
          </div>

          {/* Right Column: Live Interactive Document Preview */}
          <div className="lg:col-span-7 p-5 sm:p-6 bg-slate-200/60 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Pratinjau Dokumen Cetak (Live Preview)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                    {filteredTrx.length} Nota Transaksi
                  </span>
                  <span className="text-[11px] font-bold text-rose-700 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                    {filteredExp.length} Pos Beban
                  </span>
                </div>
              </div>

              {/* Printable Document Paper Card */}
              <div
                id="printable-pdf-document"
                className="bg-white rounded-2xl p-6 shadow-md border border-slate-300 text-slate-900 font-sans space-y-4 max-h-[520px] overflow-y-auto"
              >
                {/* Kop Surat */}
                <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-black tracking-tight text-slate-900">
                      {storeProfile.name.toUpperCase()}
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      {storeProfile.address || 'Jl. Raya Utama Bisnis No. 88'} | Telp: {storeProfile.phone || '0812-3456-7890'}
                    </p>
                    <p className="text-[10px] text-indigo-700 font-bold mt-0.5">
                      DelPOS - Sistem Kasir & Akuntansi Finansial Terintegrasi
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      DOC/FIN/{new Date().toISOString().slice(0, 10).replace(/-/g, '')}/PDF
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1">
                      Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Judul Laporan */}
                <div className="text-center py-1 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    {reportType === 'all_summary' && 'LAPORAN KEUANGAN & PEMBUKUAN LENGKAP'}
                    {reportType === 'profit_loss' && 'LAPORAN LABA & RUGI KOMPREHENSIF (SAK EMKM)'}
                    {reportType === 'cashflow' && 'BUKU ARUS KAS MASUK & BEBAN KELUAR'}
                    {reportType === 'product_sales' && 'LAPORAN KINERJA & RANKING PENJUALAN PRODUK'}
                  </h3>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Periode: <strong className="font-bold text-slate-800">{dates.label}</strong> | Kasir: {cashierFilter} | Bayar: {paymentMethod}
                  </p>
                </div>

                {/* Empty State Notice if No Data in Selected Range */}
                {filteredTrx.length === 0 && filteredExp.length === 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 text-xs">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">Tidak ada catatan data pada periode ini</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Silakan klik tombol <strong>"Semua"</strong> pada pilihan periode tanggal di sebelah kiri untuk melihat seluruh data riwayat penjualan dan pengeluaran Anda.
                      </p>
                    </div>
                  </div>
                )}

                {/* KPI Summary Strip */}
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Omzet Masuk</p>
                    <p className="text-[11px] font-black text-emerald-700">{formatCurrency(totalOmzet)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Estimasi HPP</p>
                    <p className="text-[11px] font-black text-rose-700">{formatCurrency(totalHPP)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Total Beban</p>
                    <p className="text-[11px] font-black text-amber-700">{formatCurrency(totalCashOut)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Laba Bersih</p>
                    <p className={`text-[11px] font-black ${netProfit >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                      {formatCurrency(netProfit)}
                    </p>
                  </div>
                </div>

                {/* TABEL SECTION 1: LABA RUGI (P&L) */}
                {(reportType === 'profit_loss' || reportType === 'all_summary') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800">
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Rincian Laba & Rugi (P&L Standar SAK EMKM)</span>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            <th className="p-2">Pos Akuntansi</th>
                            <th className="p-2 text-center">Volume / Keterangan</th>
                            <th className="p-2 text-right">Nominal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-2 font-bold text-slate-800">1. Pendapatan Penjualan Bersih</td>
                            <td className="p-2 text-center text-slate-500">{filteredTrx.length} Transaksi Selesai</td>
                            <td className="p-2 text-right font-extrabold text-emerald-700">{formatCurrency(totalOmzet)}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-800">2. Harga Pokok Penjualan (HPP)</td>
                            <td className="p-2 text-center text-slate-500">Estimasi Modal Kulakan</td>
                            <td className="p-2 text-right font-bold text-rose-700">({formatCurrency(totalHPP)})</td>
                          </tr>
                          <tr className="bg-emerald-50/50">
                            <td className="p-2 font-black text-emerald-950">LABA KOTOR (GROSS PROFIT)</td>
                            <td className="p-2 text-center text-emerald-700 font-semibold">
                              Margin Kotor: {totalSubtotal > 0 ? Math.round((grossProfit / totalSubtotal) * 100) : 0}%
                            </td>
                            <td className="p-2 text-right font-black text-emerald-800">{formatCurrency(grossProfit)}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-800">3. Total Beban Operasional Usaha</td>
                            <td className="p-2 text-center text-slate-500">{filteredExp.length} Pos Biaya Tercatat</td>
                            <td className="p-2 text-right font-bold text-rose-700">({formatCurrency(totalCashOut)})</td>
                          </tr>
                          <tr className="bg-indigo-50 font-black">
                            <td className="p-2 text-indigo-950">LABA BERSIH USAHA (NET PROFIT)</td>
                            <td className="p-2 text-center text-indigo-700">Margin Bersih: {netMarginPercent}%</td>
                            <td className={`p-2 text-right ${netProfit >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                              {formatCurrency(netProfit)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TABEL SECTION 2: ARUS KAS & BEBAN OPERASIONAL */}
                {(reportType === 'cashflow' || reportType === 'all_summary') && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-rose-600" />
                        <span>Buku Catatan Pengeluaran Kas (Beban Usaha)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Total {filteredExp.length} Catatan
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            <th className="p-2">Tanggal</th>
                            <th className="p-2">Keterangan Beban</th>
                            <th className="p-2">Kategori</th>
                            <th className="p-2">Penerima</th>
                            <th className="p-2 text-right">Nominal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredExp.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-3 text-center text-slate-500 italic">
                                Tidak ada pengeluaran kas pada periode ini
                              </td>
                            </tr>
                          ) : (
                            filteredExp.slice(0, 5).map((exp, idx) => (
                              <tr key={exp.id || idx}>
                                <td className="p-2 font-mono text-slate-600">{exp.date}</td>
                                <td className="p-2 font-bold text-slate-800">{exp.description}</td>
                                <td className="p-2 text-slate-600">{exp.category}</td>
                                <td className="p-2 text-slate-500">{exp.recipient || '-'}</td>
                                <td className="p-2 text-right font-extrabold text-rose-700">
                                  {formatCurrency(exp.amount)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TABEL SECTION 3: TOP PRODUK TERLARIS */}
                {(reportType === 'product_sales' || reportType === 'all_summary') && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
                        <span>Kinerja & Ranking Penjualan Produk Teratas</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {topProducts.length} Produk Unggulan
                      </span>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            <th className="p-2 text-center w-8">#</th>
                            <th className="p-2">Nama Produk</th>
                            <th className="p-2">Kategori</th>
                            <th className="p-2 text-right">Harga</th>
                            <th className="p-2 text-center">Terjual</th>
                            <th className="p-2 text-right">Total Omzet</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {topProducts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                                Belum ada data penjualan produk pada periode ini
                              </td>
                            </tr>
                          ) : (
                            topProducts.map((p, idx) => (
                              <tr key={idx}>
                                <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-2 font-bold text-slate-800">{p.name}</td>
                                <td className="p-2 text-slate-500">{p.category}</td>
                                <td className="p-2 text-right text-slate-700">{formatCurrency(p.price)}</td>
                                <td className="p-2 text-center font-bold text-indigo-700">{p.qty} unit</td>
                                <td className="p-2 text-right font-extrabold text-emerald-700">
                                  {formatCurrency(p.total)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TABEL SECTION 4: DAFTAR NOTA TRANSAKSI TERPILIH */}
                {filteredTrx.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-800">
                      <span>Sampel Transaksi Penjualan Terpilih ({filteredTrx.length} Nota)</span>
                      <span className="text-[9px] text-slate-500 font-normal">Menampilkan 5 nota terkini</span>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            <th className="p-2">No. Nota</th>
                            <th className="p-2">Tanggal</th>
                            <th className="p-2">Kasir</th>
                            <th className="p-2">Metode</th>
                            <th className="p-2 text-right">Total Belanja</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredTrx.slice(0, 5).map((t, idx) => (
                            <tr key={t.id || idx}>
                              <td className="p-2 font-mono font-bold text-indigo-700">{t.orderNumber || t.id}</td>
                              <td className="p-2 text-slate-600">{t.date} {t.time || ''}</td>
                              <td className="p-2 text-slate-700">{t.cashierName || 'Kasir'}</td>
                              <td className="p-2">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-700">
                                  {t.paymentMethod}
                                </span>
                              </td>
                              <td className="p-2 text-right font-black text-emerald-700">
                                {formatCurrency(t.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Signatures Preview */}
                {includeSignatures && (
                  <div className="grid grid-cols-2 pt-4 border-t border-slate-200 text-center text-[9px] text-slate-600">
                    <div>
                      <p>Dibuat Oleh Kasir/Admin:</p>
                      <div className="h-9"></div>
                      <p className="font-bold text-slate-900">({cashierFilter !== 'Semua' ? cashierFilter : (cashierName || 'Staff Kasir')})</p>
                    </div>
                    <div>
                      <p>Disetujui Oleh Pemilik Toko:</p>
                      <div className="h-9"></div>
                      <p className="font-bold text-slate-900">({storeProfile.owner || 'Pemilik Toko'})</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-300 mt-4">
              <button
                type="button"
                id="btn-cancel-export-pdf"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                id="btn-print-pdf-window"
                onClick={handlePrintDocument}
                disabled={isGenerating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / Print Window</span>
              </button>

              <button
                type="button"
                id="btn-download-pdf-doc"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-xs font-extrabold text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{isGenerating ? 'Memproses PDF...' : 'Unduh Dokumen PDF (.pdf)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

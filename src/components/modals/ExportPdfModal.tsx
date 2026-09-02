import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  SlidersHorizontal,
  Building2,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateFinancialPdfReport, PdfReportFilterOptions } from '../../utils/pdfReportGenerator';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportType?: 'all_summary' | 'cashflow' | 'profit_loss' | 'product_sales';
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  initialReportType = 'all_summary',
}) => {
  const { storeProfile, transactions, expenses, products, formatCurrency, showToast, cashierName } =
    useApp();

  // Filters State
  const [period, setPeriod] = useState<
    'Hari Ini' | 'Kemarin' | '7 Hari Terakhir' | '30 Hari Terakhir' | 'Bulan Ini' | 'Bulan Lalu' | 'Tahun Ini' | 'Kustom'
  >('Bulan Ini');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState<'all_summary' | 'cashflow' | 'profit_loss' | 'product_sales'>(
    initialReportType
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('Semua');
  const [cashierFilter, setCashierFilter] = useState<string>('Semua');
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculate filtered records for preview
  const getDatesForPeriod = () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (period === 'Hari Ini') return { start: todayStr, end: todayStr, label: 'Hari Ini' };
    if (period === 'Kemarin') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      return { start: yStr, end: yStr, label: 'Kemarin' };
    }
    if (period === '7 Hari Terakhir') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString().slice(0, 10), end: todayStr, label: '7 Hari Terakhir' };
    }
    if (period === '30 Hari Terakhir') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString().slice(0, 10), end: todayStr, label: '30 Hari Terakhir' };
    }
    if (period === 'Bulan Ini') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      return { start, end: todayStr, label: 'Bulan Ini' };
    }
    if (period === 'Bulan Lalu') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
      const end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().slice(0, 10);
      return { start, end, label: 'Bulan Lalu' };
    }
    if (period === 'Tahun Ini') {
      const start = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
      return { start, end: todayStr, label: 'Tahun Ini' };
    }
    return { start: startDate, end: endDate, label: `${startDate} s/d ${endDate}` };
  };

  const dates = getDatesForPeriod();

  // Filter transactions
  let filteredTrx = transactions.filter((t) => t.status === 'Selesai');
  if (paymentMethod !== 'Semua') {
    filteredTrx = filteredTrx.filter((t) => t.paymentMethod === paymentMethod);
  }
  if (cashierFilter !== 'Semua') {
    filteredTrx = filteredTrx.filter((t) => t.cashierName === cashierFilter);
  }
  if (dates.start) {
    filteredTrx = filteredTrx.filter((t) => t.date >= dates.start);
  }
  if (dates.end) {
    filteredTrx = filteredTrx.filter((t) => t.date <= dates.end);
  }

  // Filter expenses
  let filteredExp = expenses.filter((e) => {
    if (dates.start && e.date < dates.start) return false;
    if (dates.end && e.date > dates.end) return false;
    return true;
  });

  // Calculate stats
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

      const savedName = generateFinancialPdfReport(storeProfile, transactions, expenses, products, options);
      showToast(`Laporan PDF berhasil diunduh: ${savedName}`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Gagal memproses dokumen PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintDocument = () => {
    window.print();
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
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
                    type="button"
                    onClick={() => setPeriod(p as any)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
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
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Sampai Tanggal</span>
                    <input
                      type="date"
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
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800">
                  Sertakan Kolom Tanda Tangan & Cap Validasi Resmi
                </span>
              </label>
              <p className="text-[10px] text-slate-500 pl-6 mt-0.5">
                Menyertakan kolom tanda tangan Kasir dan Pemilik Toko di bagian bawah laporan.
              </p>
            </div>
          </div>

          {/* Right Column: Live Interactive Document Preview */}
          <div className="lg:col-span-7 p-5 sm:p-6 bg-slate-200/50 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Pratinjau Dokumen Cetak (Live Paper Preview)
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                  {filteredTrx.length} Transaksi Terpilih
                </span>
              </div>

              {/* Printable Document Paper Card */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-300 text-slate-900 font-sans space-y-4 max-h-[500px] overflow-y-auto">
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
                      DelPOS - Sistem Kasir & Akuntansi Finansial
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      DOC/FIN/{new Date().toISOString().slice(0, 10).replace(/-/g, '')}/PDF
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1">
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Judul Laporan */}
                <div className="text-center py-1">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    {reportType === 'all_summary' && 'LAPORAN KEUANGAN & PEMBUKUAN LENGKAP'}
                    {reportType === 'profit_loss' && 'LAPORAN LABA & RUGI KOMPREHENSIF (P&L)'}
                    {reportType === 'cashflow' && 'BUKU ARUS KAS & BIAYA OPERASIONAL'}
                    {reportType === 'product_sales' && 'LAPORAN KINERJA PENJUALAN PRODUK'}
                  </h3>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Periode: <strong className="font-bold text-slate-800">{dates.label}</strong> | Kasir: {cashierFilter} | Bayar: {paymentMethod}
                  </p>
                </div>

                {/* KPI Summary Strip */}
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Omzet Masuk</p>
                    <p className="text-[11px] font-black text-emerald-700">{formatCurrency(totalOmzet)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Modal/HPP</p>
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

                {/* Preview Mini Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2">Pos Akuntansi</th>
                        <th className="p-2 text-center">Rincian</th>
                        <th className="p-2 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2 font-bold text-slate-800">1. Pendapatan Penjualan Bersih</td>
                        <td className="p-2 text-center text-slate-500">{filteredTrx.length} Trx Selesai</td>
                        <td className="p-2 text-right font-extrabold text-emerald-700">{formatCurrency(totalOmzet)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800">2. Harga Pokok Penjualan (HPP)</td>
                        <td className="p-2 text-center text-slate-500">Estimasi Modal</td>
                        <td className="p-2 text-right font-bold text-rose-700">({formatCurrency(totalHPP)})</td>
                      </tr>
                      <tr className="bg-emerald-50/40">
                        <td className="p-2 font-black text-slate-900">LABA KOTOR (GROSS PROFIT)</td>
                        <td className="p-2 text-center text-slate-600">-</td>
                        <td className="p-2 text-right font-black text-emerald-800">{formatCurrency(grossProfit)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800">3. Total Beban Operasional</td>
                        <td className="p-2 text-center text-slate-500">{filteredExp.length} Pos Biaya</td>
                        <td className="p-2 text-right font-bold text-rose-700">({formatCurrency(totalCashOut)})</td>
                      </tr>
                      <tr className="bg-indigo-50 font-black">
                        <td className="p-2 text-indigo-950">LABA BERSIH (NET PROFIT)</td>
                        <td className="p-2 text-center text-indigo-700">Margin: {netMarginPercent}%</td>
                        <td className={`p-2 text-right ${netProfit >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                          {formatCurrency(netProfit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures Preview */}
                {includeSignatures && (
                  <div className="grid grid-cols-2 pt-4 border-t border-slate-200 text-center text-[9px] text-slate-600">
                    <div>
                      <p>Dibuat Oleh Kasir/Admin:</p>
                      <div className="h-10"></div>
                      <p className="font-bold text-slate-900">({cashierFilter !== 'Semua' ? cashierFilter : 'Staff Kasir'})</p>
                    </div>
                    <div>
                      <p>Disetujui Oleh Pemilik Toko:</p>
                      <div className="h-10"></div>
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
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handlePrintDocument}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / Print Window</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-xs font-extrabold text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{isGenerating ? 'Membuat PDF...' : 'Unduh Dokumen PDF (.pdf)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

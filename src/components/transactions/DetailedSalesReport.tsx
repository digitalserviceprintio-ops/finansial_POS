import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  Download,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  Building,
  QrCode,
  User,
  ShoppingBag,
  Clock,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Percent,
  Sparkles,
  ChevronRight,
  RotateCcw,
  BarChart3,
  DollarSign,
  PieChart,
  ArrowLeft,
  X,
  Package,
} from 'lucide-react';
import { Transaction, Product, StoreProfile } from '../../types';
import { PrintSalesReportModal } from '../modals/PrintSalesReportModal';

interface DetailedSalesReportProps {
  transactions: Transaction[];
  products: Product[];
  storeProfile: StoreProfile;
  formatCurrency: (val: number) => string;
  selectedPeriod: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'this_month' | 'custom';
  setSelectedPeriod: (
    period: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'this_month' | 'custom'
  ) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (val: string) => void;
  onEndDateChange?: (val: string) => void;
  onClearDateRange?: () => void;
  onSelectPeriodPreset?: (
    preset: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'this_month'
  ) => void;
  activePeriodLabel?: string;
  onBackToTransactions: () => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const DetailedSalesReport: React.FC<DetailedSalesReportProps> = ({
  transactions,
  products,
  storeProfile,
  formatCurrency,
  selectedPeriod,
  setSelectedPeriod,
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  onClearDateRange,
  onSelectPeriodPreset,
  activePeriodLabel,
  onBackToTransactions,
  showToast,
}) => {
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productSortBy, setProductSortBy] = useState<'qty' | 'revenue' | 'profit' | 'name'>('qty');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Period label helper
  const periodLabel = useMemo(() => {
    if (activePeriodLabel) return activePeriodLabel;
    switch (selectedPeriod) {
      case 'today':
        return 'Hari Ini';
      case 'yesterday':
        return 'Kemarin';
      case 'week':
        return '7 Hari Terakhir';
      case 'this_month':
        return 'Bulan Ini';
      case 'month':
        return '30 Hari Terakhir';
      default:
        return 'Semua Periode';
    }
  }, [selectedPeriod, activePeriodLabel]);

  // Executive Financial Statistics
  const financialStats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === 'Selesai');
    const pending = transactions.filter((t) => t.status === 'Tertunda');
    const cancelled = transactions.filter((t) => t.status === 'Dibatalkan');

    const grossSales = completed.reduce((sum, t) => sum + t.subtotal, 0);
    const totalDiscounts = completed.reduce((sum, t) => sum + (t.discount || 0), 0);
    const totalTaxes = completed.reduce((sum, t) => sum + (t.tax || 0), 0);
    const netSales = completed.reduce((sum, t) => sum + t.total, 0);

    const totalQtySold = completed.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const aov = completed.length > 0 ? netSales / completed.length : 0;

    // Calculate product items aggregation
    const itemMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        category: string;
        image: string;
        quantity: number;
        revenue: number;
        avgPrice: number;
        purchasePrice: number;
        grossProfit: number;
      }
    >();

    completed.forEach((trx) => {
      trx.items.forEach((item) => {
        const matchedProd = products.find((p) => p.id === item.productId);
        const buyPrice = matchedProd ? matchedProd.purchasePrice : item.price * 0.6;
        const category = matchedProd ? matchedProd.category : 'Umum';

        const existing = itemMap.get(item.productId) || {
          productId: item.productId,
          productName: item.productName,
          category,
          image: item.image,
          quantity: 0,
          revenue: 0,
          avgPrice: item.price,
          purchasePrice: buyPrice,
          grossProfit: 0,
        };

        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        itemMap.set(item.productId, existing);
      });
    });

    const items = Array.from(itemMap.values()).map((it) => {
      const totalHPP = it.purchasePrice * it.quantity;
      const profit = it.revenue - totalHPP;
      return {
        ...it,
        avgPrice: it.quantity > 0 ? it.revenue / it.quantity : it.avgPrice,
        grossProfit: profit,
      };
    });

    const totalHPP = items.reduce((sum, i) => sum + i.purchasePrice * i.quantity, 0);
    const estimatedProfit = netSales - totalHPP;
    const profitMargin = netSales > 0 ? (estimatedProfit / netSales) * 100 : 0;

    return {
      totalTransactions: transactions.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      grossSales,
      totalDiscounts,
      totalTaxes,
      netSales,
      totalQtySold,
      aov,
      totalHPP,
      estimatedProfit,
      profitMargin,
      items,
    };
  }, [transactions, products]);

  // Filtered & Sorted Product Sales
  const filteredProducts = useMemo(() => {
    let result = financialStats.items.filter((item) => {
      const q = productSearchQuery.toLowerCase().trim();
      return (
        !q ||
        item.productName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      if (productSortBy === 'qty') return b.quantity - a.quantity;
      if (productSortBy === 'revenue') return b.revenue - a.revenue;
      if (productSortBy === 'profit') return b.grossProfit - a.grossProfit;
      if (productSortBy === 'name') return a.productName.localeCompare(b.productName);
      return 0;
    });

    return result;
  }, [financialStats.items, productSearchQuery, productSortBy]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const completed = transactions.filter((t) => t.status === 'Selesai');
    const map = new Map<string, { count: number; total: number }>();

    completed.forEach((t) => {
      const existing = map.get(t.paymentMethod) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += t.total;
      map.set(t.paymentMethod, existing);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [transactions]);

  // Cashier Breakdown
  const cashierBreakdown = useMemo(() => {
    const completed = transactions.filter((t) => t.status === 'Selesai');
    const map = new Map<string, { count: number; total: number; cash: number; nonCash: number }>();

    completed.forEach((t) => {
      const name = t.cashierName || storeProfile.owner || 'Kasir Umum';
      const existing = map.get(name) || { count: 0, total: 0, cash: 0, nonCash: 0 };
      existing.count += 1;
      existing.total += t.total;
      if (t.paymentMethod === 'Tunai') {
        existing.cash += t.total;
      } else {
        existing.nonCash += t.total;
      }
      map.set(name, existing);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [transactions, storeProfile]);

  // Hourly Peak Breakdown
  const hourlyPeakStats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === 'Selesai');
    const timeSlots = {
      pagi: { label: 'Pagi (06:00 - 11:59)', count: 0, total: 0 },
      siang: { label: 'Siang (12:00 - 14:59)', count: 0, total: 0 },
      sore: { label: 'Sore (15:00 - 17:59)', count: 0, total: 0 },
      malam: { label: 'Malam (18:00 - 23:59)', count: 0, total: 0 },
    };

    completed.forEach((t) => {
      let hour = 12;
      if (t.time) {
        const parts = t.time.split(':');
        hour = parseInt(parts[0], 10) || 12;
      } else if (t.timestamp) {
        hour = new Date(t.timestamp).getHours();
      }

      if (hour >= 6 && hour < 12) {
        timeSlots.pagi.count += 1;
        timeSlots.pagi.total += t.total;
      } else if (hour >= 12 && hour < 15) {
        timeSlots.siang.count += 1;
        timeSlots.siang.total += t.total;
      } else if (hour >= 15 && hour < 18) {
        timeSlots.sore.count += 1;
        timeSlots.sore.total += t.total;
      } else {
        timeSlots.malam.count += 1;
        timeSlots.malam.total += t.total;
      }
    });

    return Object.values(timeSlots);
  }, [transactions]);

  // Export Detailed CSV
  const handleExportDetailedReportCSV = () => {
    if (financialStats.items.length === 0) {
      showToast('Tidak ada data penjualan untuk diekspor pada periode ini', 'warning');
      return;
    }

    const lines: string[] = [];
    lines.push(`"LAPORAN DETAIL TRANSAKSI PENJUALAN - ${storeProfile.name}"`);
    lines.push(`"Periode: ${periodLabel}"`);
    lines.push(`"Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}"`);
    lines.push('');
    lines.push('"RINGKASAN EKSEKUTIF"');
    lines.push(`"Total Omzet Kotor (Rp)","${financialStats.grossSales}"`);
    lines.push(`"Total Diskon (Rp)","${financialStats.totalDiscounts}"`);
    lines.push(`"Total Pajak (Rp)","${financialStats.totalTaxes}"`);
    lines.push(`"Total Omzet Bersih (Rp)","${financialStats.netSales}"`);
    lines.push(`"Estimasi Total HPP (Rp)","${financialStats.totalHPP}"`);
    lines.push(`"Estimasi Laba Kotor (Rp)","${financialStats.estimatedProfit}"`);
    lines.push(`"Persentase Margin Laba","${financialStats.profitMargin.toFixed(1)}%"`);
    lines.push(`"Total Transaksi Selesai","${financialStats.completedCount}"`);
    lines.push(`"Total Unit Terjual","${financialStats.totalQtySold}"`);
    lines.push(`"Rata-rata Nilai Nota (AOV)","${Math.round(financialStats.aov)}"`);
    lines.push('');
    lines.push('"DETAIL PRODUK TERJUAL"');
    lines.push('"Peringkat","Nama Produk","Kategori","Qty Terjual","Harga Satuan (Rp)","Total Omzet (Rp)","Estimasi HPP (Rp)","Laba Kotor (Rp)","Kontribusi Omzet (%)"');

    filteredProducts.forEach((item, index) => {
      const contribution =
        financialStats.netSales > 0 ? (item.revenue / financialStats.netSales) * 100 : 0;
      lines.push(
        [
          index + 1,
          `"${item.productName.replace(/"/g, '""')}"`,
          `"${item.category.replace(/"/g, '""')}"`,
          item.quantity,
          Math.round(item.avgPrice),
          item.revenue,
          item.purchasePrice * item.quantity,
          item.grossProfit,
          `"${contribution.toFixed(1)}%"`,
        ].join(',')
      );
    });

    lines.push('');
    lines.push('"DETAIL METODE PEMBAYARAN"');
    lines.push('"Metode","Jumlah Transaksi","Total Nominal (Rp)","Persentase"');
    paymentBreakdown.forEach(([method, data]) => {
      const share = financialStats.netSales > 0 ? (data.total / financialStats.netSales) * 100 : 0;
      lines.push(`"${method}",${data.count},${data.total},"${share.toFixed(1)}%"`);
    });

    lines.push('');
    lines.push('"DETAIL KINERJA KASIR"');
    lines.push('"Nama Kasir","Jumlah Nota","Total Omzet (Rp)","Tunai (Rp)","Non-Tunai (Rp)"');
    cashierBreakdown.forEach(([name, data]) => {
      lines.push(`"${name}",${data.count},${data.total},${data.cash},${data.nonCash}`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `laporan_detail_penjualan_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Laporan detail penjualan (CSV) berhasil diunduh!', 'success');
  };

  return (
    <div id="detailed-sales-report-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Navigation & Actions */}
      <div className="rounded-3xl border border-[#e2e1ec] bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={onBackToTransactions}
              className="mt-0.5 sm:mt-0 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Kembali ke Daftar Nota Transaksi"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-[#1b1b23] tracking-tight">
                  Laporan Detail Transaksi Penjualan
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Periode: {periodLabel}
                </span>
              </div>
              <p className="text-xs text-[#767680] mt-0.5">
                Rangkuman performa omzet, keuntungan kotor, rincian per produk, kasir, dan metode pembayaran.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-blue-600" />
              <span>Cetak Laporan</span>
            </button>

            <button
              onClick={handleExportDetailedReportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Ekspor CSV Detail</span>
            </button>

            <button
              onClick={onBackToTransactions}
              className="flex items-center gap-1.5 rounded-xl bg-[#f3f2fa] px-3.5 py-2 text-xs font-bold text-[#4648d4] hover:bg-[#ebeaff] transition-all cursor-pointer"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Daftar Nota</span>
            </button>
          </div>
        </div>

        {/* Quick Period Selector & Date Range Filter */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {[
                { id: 'all', label: 'Semua Waktu' },
                { id: 'today', label: 'Hari Ini' },
                { id: 'yesterday', label: 'Kemarin' },
                { id: 'week', label: '7 Hari Terakhir' },
                { id: 'this_month', label: 'Bulan Ini' },
                { id: 'month', label: '30 Hari Terakhir' },
              ].map((p) => (
                <button
                  key={p.id}
                  id={`report-period-${p.id}`}
                  onClick={() => {
                    if (onSelectPeriodPreset) {
                      onSelectPeriodPreset(p.id as any);
                    } else {
                      setSelectedPeriod(p.id as any);
                    }
                  }}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === p.id
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#767680] font-medium">
              Menganalisis <strong>{financialStats.completedCount}</strong> transaksi selesai
            </span>
          </div>

          {/* Date Range Picker inside Detailed Report */}
          {onStartDateChange && onEndDateChange && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#4648d4]" />
                <span className="text-xs font-bold text-slate-800">
                  Filter Rentang Tanggal Laporan:
                </span>
                {periodLabel && (
                  <span className="rounded-md bg-[#4648d4]/10 text-[#4648d4] px-2 py-0.5 text-[10px] font-extrabold">
                    {periodLabel}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                  <label htmlFor="report-filter-start" className="text-[11px] font-bold text-[#767680]">
                    Mulai:
                  </label>
                  <input
                    id="report-filter-start"
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
                  />
                </div>

                <span className="text-slate-400 text-xs font-bold hidden sm:inline">-</span>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                  <label htmlFor="report-filter-end" className="text-[11px] font-bold text-[#767680]">
                    Akhir:
                  </label>
                  <input
                    id="report-filter-end"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
                  />
                </div>

                {(startDate || endDate) && onClearDateRange && (
                  <button
                    onClick={onClearDateRange}
                    className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    title="Hapus Filter Rentang Tanggal"
                  >
                    <X className="h-3 w-3" />
                    <span>Hapus Tanggal</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1. Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Omzet Bersih */}
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#767680] uppercase tracking-wider">
              Total Omzet Bersih
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-[#4648d4]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#1b1b23]">
            {formatCurrency(financialStats.netSales)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-[#767680]">
            <span>Kotor: {formatCurrency(financialStats.grossSales)}</span>
            {financialStats.totalDiscounts > 0 && (
              <span className="text-rose-600 font-bold">
                Disc: -{formatCurrency(financialStats.totalDiscounts)}
              </span>
            )}
          </div>
        </div>

        {/* Estimasi Laba Kotor */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Estimasi Laba Kotor
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-950">
            {formatCurrency(Math.round(financialStats.estimatedProfit))}
          </p>
          <p className="text-[10px] text-emerald-700 font-bold">
            Margin: {financialStats.profitMargin.toFixed(1)}% dari Omzet
          </p>
        </div>

        {/* Volume Penjualan & Qty */}
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#767680] uppercase tracking-wider">
              Volume Barang Terjual
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#1b1b23]">
            {financialStats.totalQtySold}{' '}
            <span className="text-xs font-normal text-[#767680]">Pcs / Unit</span>
          </p>
          <p className="text-[10px] text-[#767680]">
            Dari {financialStats.items.length} jenis produk berbeda
          </p>
        </div>

        {/* Rata-rata Nilai Belanja (AOV) */}
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#767680] uppercase tracking-wider">
              Rata-rata Nota (AOV)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#1b1b23]">
            {formatCurrency(Math.round(financialStats.aov))}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">
            {financialStats.completedCount} transaksi sukses
          </p>
        </div>
      </div>

      {/* 2. Detailed Product Sales Breakdown Table */}
      <div className="rounded-3xl border border-[#e2e1ec] bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#1b1b23]">
                Rincian Penjualan Berdasarkan Produk
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-700">
                {filteredProducts.length} Produk
              </span>
            </div>
            <p className="text-xs text-[#767680] mt-0.5">
              Analisis kuantitas terjual, total omzet, estimasi HPP modal, dan kontribusi laba tiap produk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search within products */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-48 sm:w-56 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#4648d4]"
              />
              {productSearchQuery && (
                <button
                  onClick={() => setProductSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Sort products */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs">
              <ArrowUpDown className="h-3 w-3 text-slate-400" />
              <select
                value={productSortBy}
                onChange={(e) => setProductSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-700 focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="qty">Terbanyak Terjual (Qty)</option>
                <option value="revenue">Omzet Tertinggi</option>
                <option value="profit">Laba Tertinggi</option>
                <option value="name">Nama Produk A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Table */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Tidak ada data penjualan produk untuk kriteria filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3">Produk & Kategori</th>
                  <th className="py-2.5 px-3 text-center">Qty Terjual</th>
                  <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right">Total Omzet</th>
                  <th className="py-2.5 px-3 text-right">Estimasi HPP</th>
                  <th className="py-2.5 px-3 text-right">Laba Kotor</th>
                  <th className="py-2.5 px-3 text-center">Porsi (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((item, index) => {
                  const contribution =
                    financialStats.netSales > 0
                      ? (item.revenue / financialStats.netSales) * 100
                      : 0;

                  return (
                    <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                            index === 0
                              ? 'bg-amber-100 text-amber-800'
                              : index === 1
                              ? 'bg-slate-200 text-slate-800'
                              : index === 2
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-500 font-medium'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="h-9 w-9 rounded-xl object-cover bg-slate-100 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                              {item.productName}
                            </p>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {item.quantity}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Unit</span>
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-700">
                        {formatCurrency(Math.round(item.avgPrice))}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        {formatCurrency(item.revenue)}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-500">
                        {formatCurrency(item.purchasePrice * item.quantity)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="font-extrabold text-emerald-700">
                          {formatCurrency(item.grossProfit)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-slate-700">
                            {contribution.toFixed(1)}%
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#4648d4] h-full rounded-full"
                              style={{ width: `${Math.min(100, contribution)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Secondary Breakdowns: Payment Method & Cashier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Methods Detail */}
        <div className="rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1b1b23]">
                  Rincian Metode Pembayaran
                </h3>
                <p className="text-[11px] text-[#767680]">Distribusi arus kas masuk berdasarkan jalur bayar</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {paymentBreakdown.length} Metode Aktif
            </span>
          </div>

          <div className="space-y-3">
            {paymentBreakdown.map(([method, data]) => {
              const share =
                financialStats.netSales > 0 ? (data.total / financialStats.netSales) * 100 : 0;

              return (
                <div key={method} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      {method === 'Tunai' ? (
                        <Banknote className="h-4 w-4 text-emerald-600" />
                      ) : method === 'Transfer Bank' ? (
                        <Building className="h-4 w-4 text-blue-600" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-purple-600" />
                      )}
                      <span>{method}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">
                      {formatCurrency(data.total)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        method === 'Tunai'
                          ? 'bg-emerald-500'
                          : method === 'Transfer Bank'
                          ? 'bg-blue-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(100, share)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{data.count} Transaksi Nota</span>
                    <span className="font-bold text-slate-700">{share.toFixed(1)}% dari Total Omzet</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cashier Performance Breakdown */}
        <div className="rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1b1b23]">
                  Rincian Kinerja Kasir Bertugas
                </h3>
                <p className="text-[11px] text-[#767680]">Pencatatan nota dan omzet per petugas kasir</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {cashierBreakdown.length} Kasir
            </span>
          </div>

          <div className="space-y-3">
            {cashierBreakdown.map(([cashier, data]) => {
              const avgCashier = data.count > 0 ? data.total / data.count : 0;
              const cashierShare =
                financialStats.netSales > 0 ? (data.total / financialStats.netSales) * 100 : 0;

              return (
                <div key={cashier} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-[#4648d4] font-bold text-xs">
                        {cashier.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900 text-xs">{cashier}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-xs block">
                        {formatCurrency(data.total)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {data.count} Nota Selesai
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tunai Fisik:</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(data.cash)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Rata-rata / Nota:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(Math.round(avgCashier))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Peak Sales Hours / Waktu Transaksi Tersibuk */}
      <div className="rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1b1b23]">
                Pola Waktu Penjualan Tersibuk (Peak Hours)
              </h3>
              <p className="text-[11px] text-[#767680]">
                Informasi distribusi transaksi berdasarkan jam buka toko untuk optimalisasi shift kasir.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {hourlyPeakStats.map((slot, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-center">
              <span className="text-[11px] font-bold text-slate-600 block">{slot.label}</span>
              <p className="text-lg font-black text-slate-900">{slot.count} Nota</p>
              <p className="text-[10px] text-slate-500 font-semibold">{formatCurrency(slot.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Print Sales Report Modal */}
      <PrintSalesReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        products={products}
        storeProfile={storeProfile}
        formatCurrency={formatCurrency}
        periodLabel={periodLabel}
      />
    </div>
  );
};

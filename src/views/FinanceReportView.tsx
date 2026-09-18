import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  Filter,
  ShoppingBag,
  Receipt,
  RotateCcw,
  PackageOpen,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReportSubTab } from '../types';
import { ExportAccountingModal } from '../components/modals/ExportAccountingModal';
import { ExportPdfModal } from '../components/modals/ExportPdfModal';
import { AccountingReportType } from '../utils/accountingExport';
import { INDONESIAN_MONTHS, isDateInRange, normalizeDateToISO } from '../utils/dateUtils';

interface FinanceReportViewProps {
  onOpenAddExpenseModal: () => void;
}

export const FinanceReportView: React.FC<FinanceReportViewProps> = ({ onOpenAddExpenseModal }) => {
  const {
    reportSubTab,
    setReportSubTab,
    transactions,
    expenses,
    deleteExpense,
    products,
    formatCurrency,
  } = useApp();

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Filter mode state: 'month' (per bulan spesifik) atau 'all' (semua periode)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 8 = Sep)

  const [filterMode, setFilterMode] = useState<'month' | 'all'>('month');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [onlyShowSoldProducts, setOnlyShowSoldProducts] = useState<boolean>(false);

  // Extract all available years from transactions, expenses, and current year
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentYear, currentYear - 1]);
    transactions.forEach((t) => {
      const iso = normalizeDateToISO(t.date, t.timestamp);
      if (iso) {
        const y = parseInt(iso.slice(0, 4), 10);
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    expenses.forEach((e) => {
      const iso = normalizeDateToISO(e.date, e.timestamp);
      if (iso) {
        const y = parseInt(iso.slice(0, 4), 10);
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions, expenses, currentYear]);

  // Compute date range for selected month
  const {
    startISO,
    endISO,
    monthLabel,
    periodDescription,
    isCurrentMonth,
    isPreviousMonth,
    daysInMonth,
  } = useMemo(() => {
    if (filterMode === 'all') {
      return {
        startISO: undefined,
        endISO: undefined,
        monthLabel: 'Semua Periode',
        periodDescription: 'Seluruh riwayat transaksi & pengeluaran operasional',
        isCurrentMonth: false,
        isPreviousMonth: false,
        daysInMonth: 0,
      };
    }

    const y = selectedYear;
    const m = selectedMonth;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${y}-${pad(m + 1)}-01`;
    const end = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
    const mName = INDONESIAN_MONTHS[m] || 'Bulan';
    const label = `${mName} ${y}`;
    const desc = `01 ${mName.slice(0, 3)} ${y} s/d ${lastDay} ${mName.slice(0, 3)} ${y}`;

    const isCurr = y === currentYear && m === currentMonth;
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const isPrev = y === prevDate.getFullYear() && m === prevDate.getMonth();

    return {
      startISO: start,
      endISO: end,
      monthLabel: label,
      periodDescription: desc,
      isCurrentMonth: isCurr,
      isPreviousMonth: isPrev,
      daysInMonth: lastDay,
    };
  }, [filterMode, selectedYear, selectedMonth, currentYear, currentMonth]);

  // Filter handlers
  const handlePrevMonth = () => {
    setFilterMode('month');
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setFilterMode('month');
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleSelectThisMonth = () => {
    setFilterMode('month');
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
  };

  const handleSelectLastMonth = () => {
    setFilterMode('month');
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    setSelectedYear(prevDate.getFullYear());
    setSelectedMonth(prevDate.getMonth());
  };

  // Filtered transactions & expenses based on selected month
  const completedTrx = useMemo(() => {
    return transactions.filter((t) => {
      if (t.status !== 'Selesai') return false;
      if (filterMode === 'all') return true;
      return isDateInRange(t.date, t.timestamp, startISO, endISO);
    });
  }, [transactions, filterMode, startISO, endISO]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterMode === 'all') return true;
      return isDateInRange(e.date, e.timestamp, startISO, endISO);
    });
  }, [expenses, filterMode, startISO, endISO]);

  // Calculations for Arus Kas & P&L
  const totalCashIn = useMemo(() => completedTrx.reduce((acc, t) => acc + t.total, 0), [completedTrx]);
  const totalRevenue = useMemo(() => completedTrx.reduce((acc, t) => acc + t.subtotal, 0), [completedTrx]);
  const totalCashOut = useMemo(() => filteredExpenses.reduce((acc, e) => acc + e.amount, 0), [filteredExpenses]);
  const netCashFlow = totalCashIn - totalCashOut;

  // COGS / HPP estimation based on transactions items in this period
  const totalHPP = useMemo(() => {
    return completedTrx.reduce((acc, t) => {
      return (
        acc +
        t.items.reduce((itemAcc, item) => {
          const prod = products.find((p) => p.id === item.productId);
          const buyPrice = prod ? prod.purchasePrice : item.price * 0.6;
          return itemAcc + buyPrice * item.quantity;
        }, 0)
      );
    }, 0);
  }, [completedTrx, products]);

  const grossProfit = totalRevenue - totalHPP;
  const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const netProfit = grossProfit - totalCashOut;
  const netMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Operational metrics
  const totalUnitsSold = useMemo(() => {
    return completedTrx.reduce(
      (acc, t) => acc + t.items.reduce((iAcc, item) => iAcc + item.quantity, 0),
      0
    );
  }, [completedTrx]);

  const avgBasketSize = completedTrx.length > 0 ? Math.round(totalRevenue / completedTrx.length) : 0;

  // Month-over-Month (MoM) Comparison with previous month
  const momStats = useMemo(() => {
    if (filterMode === 'all') return null;

    const prevMonthIdx = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYearVal = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const lastDayPrev = new Date(prevYearVal, prevMonthIdx + 1, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const prevStart = `${prevYearVal}-${pad(prevMonthIdx + 1)}-01`;
    const prevEnd = `${prevYearVal}-${pad(prevMonthIdx + 1)}-${pad(lastDayPrev)}`;

    const prevCompletedTrx = transactions.filter(
      (t) => t.status === 'Selesai' && isDateInRange(t.date, t.timestamp, prevStart, prevEnd)
    );
    const prevExpensesList = expenses.filter((e) =>
      isDateInRange(e.date, e.timestamp, prevStart, prevEnd)
    );

    const prevRevenue = prevCompletedTrx.reduce((acc, t) => acc + t.subtotal, 0);
    const prevCashOut = prevExpensesList.reduce((acc, e) => acc + e.amount, 0);
    const prevHPP = prevCompletedTrx.reduce((acc, t) => {
      return (
        acc +
        t.items.reduce((itemAcc, item) => {
          const prod = products.find((p) => p.id === item.productId);
          const buyPrice = prod ? prod.purchasePrice : item.price * 0.6;
          return itemAcc + buyPrice * item.quantity;
        }, 0)
      );
    }, 0);
    const prevGrossProfit = prevRevenue - prevHPP;
    const prevNetProfit = prevGrossProfit - prevCashOut;

    const revDiffPercent =
      prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : null;

    const netProfitDiffPercent =
      prevNetProfit !== 0
        ? Math.round(((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100)
        : null;

    const expenseDiffPercent =
      prevCashOut > 0 ? Math.round(((totalCashOut - prevCashOut) / prevCashOut) * 100) : null;

    const trxCountDiffPercent =
      prevCompletedTrx.length > 0
        ? Math.round(((completedTrx.length - prevCompletedTrx.length) / prevCompletedTrx.length) * 100)
        : null;

    const prevMonthName = INDONESIAN_MONTHS[prevMonthIdx] || 'Bulan';

    return {
      prevRevenue,
      prevCashOut,
      prevNetProfit,
      prevTrxCount: prevCompletedTrx.length,
      revDiffPercent,
      netProfitDiffPercent,
      expenseDiffPercent,
      trxCountDiffPercent,
      prevLabel: `${prevMonthName.slice(0, 3)} ${prevYearVal}`,
    };
  }, [
    filterMode,
    selectedMonth,
    selectedYear,
    transactions,
    expenses,
    products,
    totalRevenue,
    totalCashOut,
    netProfit,
    completedTrx.length,
  ]);

  // Expense breakdown by category for this period
  const expenseCategories = [
    'Bahan Baku',
    'Gaji Karyawan',
    'Utilitas',
    'Pemasaran',
    'Sewa Tempat',
    'Operasional',
    'Lainnya',
  ] as const;

  const expenseBreakdown = useMemo(() => {
    return expenseCategories.map((cat) => {
      const totalForCat = filteredExpenses
        .filter((e) => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      const percentage = totalCashOut > 0 ? Math.round((totalForCat / totalCashOut) * 100) : 0;
      return {
        category: cat,
        amount: totalForCat,
        percentage,
      };
    });
  }, [filteredExpenses, totalCashOut]);

  // Product sales aggregated specifically for this filtered period
  const productSalesPerformance = useMemo(() => {
    const itemMap = new Map<string, { quantity: number; revenue: number; hpp: number }>();

    completedTrx.forEach((trx) => {
      trx.items.forEach((item) => {
        const existing = itemMap.get(item.productId) || { quantity: 0, revenue: 0, hpp: 0 };
        const prod = products.find((p) => p.id === item.productId);
        const buyPrice = prod ? prod.purchasePrice : item.price * 0.6;
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        existing.hpp += buyPrice * item.quantity;
        itemMap.set(item.productId, existing);
      });
    });

    const list = products.map((prod) => {
      const stats = itemMap.get(prod.id) || { quantity: 0, revenue: 0, hpp: 0 };
      const soldInPeriod = stats.quantity;
      const omzetInPeriod = stats.revenue;
      const profitInPeriod = omzetInPeriod - stats.hpp;
      const contribution = totalRevenue > 0 ? Math.round((omzetInPeriod / totalRevenue) * 100) : 0;

      return {
        ...prod,
        periodSoldCount: soldInPeriod,
        periodOmzet: omzetInPeriod,
        periodProfit: profitInPeriod,
        contribution,
      };
    });

    // Sort by revenue descending
    const sorted = list.sort((a, b) => b.periodOmzet - a.periodOmzet);

    if (onlyShowSoldProducts) {
      return sorted.filter((p) => p.periodSoldCount > 0);
    }
    return sorted;
  }, [completedTrx, products, totalRevenue, onlyShowSoldProducts]);

  const activeSoldProductsCount = useMemo(() => {
    return productSalesPerformance.filter((p) => p.periodSoldCount > 0).length;
  }, [productSalesPerformance]);

  const getAccountingTypeForSubTab = (): AccountingReportType => {
    if (reportSubTab === 'cashflow') return 'cashflow_ledger';
    if (reportSubTab === 'profit_loss') return 'profit_loss';
    return 'product_sales';
  };

  const getPdfTypeForSubTab = (): 'all_summary' | 'cashflow' | 'profit_loss' | 'product_sales' => {
    if (reportSubTab === 'cashflow') return 'cashflow';
    if (reportSubTab === 'profit_loss') return 'profit_loss';
    if (reportSubTab === 'product_sales') return 'product_sales';
    return 'all_summary';
  };

  return (
    <div id="finance-report-view" className="space-y-6 pb-20 lg:pb-0">
      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1b1b23] tracking-tight">
              Laporan Keuangan UMKM
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#ebeaff] px-2.5 py-0.5 text-[11px] font-bold text-[#4648d4]">
              <Calendar className="h-3 w-3" />
              {monthLabel}
            </span>
          </div>
          <p className="text-xs text-[#767680] mt-0.5">
            Analisis kinerja omzet, arus kas, laba rugi, dan penjualan produk per bulan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Report Print & Download Button */}
          <button
            id="print-pdf-report-btn"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4648d4] to-[#2b2dbe] px-3.5 py-2 text-xs font-bold text-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xs cursor-pointer"
            title={`Cetak & Unduh Laporan PDF Resmi Periode ${monthLabel}`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Cetak Laporan PDF</span>
          </button>

          {/* Export CSV / Excel button */}
          <button
            id="export-report-btn"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] px-3.5 py-2 text-xs font-bold text-[#4648d4] hover:bg-[#ebeaff] hover:border-[#4648d4] transition-all shadow-xs cursor-pointer"
            title={`Ekspor Laporan Keuangan CSV / Excel Periode ${monthLabel}`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Ekspor CSV / Excel</span>
          </button>

          {/* Record Expense Button */}
          <button
            id="open-expense-modal-btn"
            onClick={onOpenAddExpenseModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#ba1a1a] px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* FILTER PERIODE LAPORAN BULANAN (BAR NAVIGASI & KONTROL BULAN) */}
      <div
        id="monthly-filter-bar"
        className="bg-white rounded-2xl border border-[#e2e1ec] p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1b1b23] mr-1">
              <Filter className="h-4 w-4 text-[#4648d4]" />
              <span>Filter Periode:</span>
            </div>

            {/* Quick shortcuts */}
            <div className="inline-flex rounded-xl bg-[#f3f2fa] p-1 border border-[#e2e1ec]/80">
              <button
                type="button"
                id="filter-this-month-btn"
                onClick={handleSelectThisMonth}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'month' && isCurrentMonth
                    ? 'bg-white text-[#4648d4] shadow-xs'
                    : 'text-[#46464f] hover:text-[#1b1b23]'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                id="filter-last-month-btn"
                onClick={handleSelectLastMonth}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'month' && isPreviousMonth
                    ? 'bg-white text-[#4648d4] shadow-xs'
                    : 'text-[#46464f] hover:text-[#1b1b23]'
                }`}
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                id="filter-all-time-btn"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-[#4648d4] shadow-xs'
                    : 'text-[#46464f] hover:text-[#1b1b23]'
                }`}
              >
                Semua Periode
              </button>
            </div>

            {/* Stepper Month Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] p-1 shadow-xs">
              <button
                type="button"
                id="prev-month-btn"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-[#46464f] hover:bg-[#ebeaff] hover:text-[#4648d4] transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Month Dropdown */}
              <select
                id="select-month-dropdown"
                value={filterMode === 'month' ? selectedMonth : ''}
                onChange={(e) => {
                  setFilterMode('month');
                  setSelectedMonth(parseInt(e.target.value, 10));
                }}
                className="bg-transparent text-xs font-bold text-[#1b1b23] py-1 px-2 border-0 outline-none cursor-pointer focus:ring-0"
              >
                {filterMode === 'all' && <option value="">Semua Bulan</option>}
                {INDONESIAN_MONTHS.map((mName, idx) => (
                  <option key={mName} value={idx}>
                    {mName}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                id="select-year-dropdown"
                value={filterMode === 'month' ? selectedYear : ''}
                onChange={(e) => {
                  setFilterMode('month');
                  setSelectedYear(parseInt(e.target.value, 10));
                }}
                className="bg-transparent text-xs font-bold text-[#4648d4] py-1 px-2 border-0 outline-none cursor-pointer focus:ring-0 border-l border-[#e2e1ec]"
              >
                {filterMode === 'all' && <option value="">Semua Tahun</option>}
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                id="next-month-btn"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-[#46464f] hover:bg-[#ebeaff] hover:text-[#4648d4] transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Jump back to current month if viewing another period */}
            {filterMode === 'month' && !isCurrentMonth && (
              <button
                type="button"
                onClick={handleSelectThisMonth}
                className="flex items-center gap-1 text-[11px] font-bold text-[#4648d4] hover:text-[#2b2dbe] bg-[#ebeaff] px-2.5 py-1.5 rounded-lg transition-colors"
                title="Kembali ke Bulan Sekarang"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Bulan Sekarang</span>
              </button>
            )}
          </div>

          {/* Right: Active Period Meta Info */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#f3f2fa]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ebeaff] text-[#4648d4] text-xs font-bold">
              <Calendar className="h-3.5 w-3.5" />
              <span>{monthLabel}</span>
              <span className="text-[10px] font-normal text-[#4648d4]/80">({periodDescription})</span>
            </div>

            <span className="text-xs text-[#767680] font-medium bg-[#f3f2fa] px-2.5 py-1 rounded-lg">
              {completedTrx.length} Transaksi • {filteredExpenses.length} Beban
            </span>
          </div>
        </div>
      </div>

      {/* RINGKASAN PERFORMA BISNIS BULANAN (MONTHLY PERFORMANCE SUMMARY CARD) */}
      <div
        id="monthly-performance-summary"
        className="rounded-2xl border border-[#e2e1ec] bg-gradient-to-br from-white via-[#fcf8ff] to-[#f4f3ff] p-5 sm:p-6 shadow-xs space-y-5"
      >
        {/* Banner Title & Health Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e2e1ec]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#4648d4] text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[#1b1b23] tracking-tight">
                  Ringkasan Performa Bisnis: {monthLabel}
                </h2>
                {isCurrentMonth && (
                  <span className="rounded-full bg-blue-100 text-[#4648d4] px-2 py-0.5 text-[10px] font-bold">
                    Berjalan
                  </span>
                )}
              </div>
              <p className="text-xs text-[#767680]">
                {filterMode === 'month'
                  ? `Hasil operasional usaha selama rentang tanggal ${periodDescription}`
                  : 'Akumulasi total operasional usaha dari seluruh catatan transaksi'}
              </p>
            </div>
          </div>

          {/* Business Health Pill */}
          <div className="flex items-center gap-2">
            {netProfit > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold shadow-xs">
                <TrendingUp className="h-4 w-4 text-emerald-700" />
                <span>Surplus Laba Bersih ({netMarginPercent}%)</span>
              </div>
            ) : netProfit < 0 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 text-red-800 text-xs font-extrabold shadow-xs">
                <TrendingDown className="h-4 w-4 text-red-700" />
                <span>Defisit Operasional</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold shadow-xs">
                <Info className="h-4 w-4 text-slate-600" />
                <span>Impas (Break-even)</span>
              </div>
            )}
          </div>
        </div>

        {/* 5 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Omzet Penjualan */}
          <div className="p-4 rounded-xl bg-white border border-[#e2e1ec] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#767680]">
                  Omzet Penjualan
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-black text-[#1b1b23] mt-2 tracking-tight">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[#f3f2fa] flex items-center justify-between text-[11px]">
              <span className="text-[#767680]">{completedTrx.length} transaksi</span>
              {momStats && momStats.revDiffPercent !== null && (
                <span
                  className={`font-bold inline-flex items-center ${
                    momStats.revDiffPercent >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {momStats.revDiffPercent >= 0 ? '↑ +' : '↓ '}
                  {momStats.revDiffPercent}% MoM
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Harga Pokok Penjualan (HPP) */}
          <div className="p-4 rounded-xl bg-white border border-[#e2e1ec] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#767680]">
                  Beban Pokok (HPP)
                </span>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-black text-[#1b1b23] mt-2 tracking-tight">
                {formatCurrency(totalHPP)}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[#f3f2fa] flex items-center justify-between text-[11px]">
              <span className="text-[#767680]">Laba Kotor:</span>
              <span className="font-extrabold text-[#4648d4]">{formatCurrency(grossProfit)}</span>
            </div>
          </div>

          {/* Card 3: Beban Operasional (Kas Keluar) */}
          <div className="p-4 rounded-xl bg-white border border-[#e2e1ec] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#767680]">
                  Beban Operasional
                </span>
                <div className="p-1.5 rounded-lg bg-red-50 text-red-700">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-black text-red-700 mt-2 tracking-tight">
                {formatCurrency(totalCashOut)}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[#f3f2fa] flex items-center justify-between text-[11px]">
              <span className="text-[#767680]">{filteredExpenses.length} catatan pos</span>
              {momStats && momStats.expenseDiffPercent !== null && (
                <span
                  className={`font-bold inline-flex items-center ${
                    momStats.expenseDiffPercent <= 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                  title="Perubahan pengeluaran dibanding bulan lalu"
                >
                  {momStats.expenseDiffPercent > 0 ? '↑ +' : '↓ '}
                  {momStats.expenseDiffPercent}% MoM
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Laba Bersih Usaha (Net Profit) */}
          <div className="p-4 rounded-xl bg-white border border-[#e2e1ec] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#767680]">
                  Laba Bersih Usaha
                </span>
                <div
                  className={`p-1.5 rounded-lg ${
                    netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {netProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
              </div>
              <p
                className={`text-xl font-black mt-2 tracking-tight ${
                  netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[#f3f2fa] flex items-center justify-between text-[11px]">
              <span className="text-[#767680]">Net Margin:</span>
              <span className="font-extrabold text-[#4648d4]">{netMarginPercent}%</span>
            </div>
          </div>

          {/* Card 5: Arus Kas Bersih (Net Cash Flow) */}
          <div className="p-4 rounded-xl bg-white border border-[#e2e1ec] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#767680]">
                  Arus Kas Bersih
                </span>
                <div className="p-1.5 rounded-lg bg-[#ebeaff] text-[#4648d4]">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <p
                className={`text-xl font-black mt-2 tracking-tight ${
                  netCashFlow >= 0 ? 'text-[#4648d4]' : 'text-red-700'
                }`}
              >
                {formatCurrency(netCashFlow)}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[#f3f2fa] flex items-center justify-between text-[11px]">
              <span className="text-[#767680]">Kas Masuk:</span>
              <span className="font-bold text-emerald-700">{formatCurrency(totalCashIn)}</span>
            </div>
          </div>
        </div>

        {/* Secondary Monthly Quick Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-[#e2e1ec]">
            <Receipt className="h-4 w-4 text-[#4648d4]" />
            <div>
              <span className="text-[10px] text-[#767680] block">Rata-rata Nilai Keranjang (AOV)</span>
              <strong className="text-xs text-[#1b1b23]">{formatCurrency(avgBasketSize)} / transaksi</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-[#e2e1ec]">
            <PackageOpen className="h-4 w-4 text-emerald-700" />
            <div>
              <span className="text-[10px] text-[#767680] block">Volume Barang Terjual</span>
              <strong className="text-xs text-[#1b1b23]">{totalUnitsSold} unit produk</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-[#e2e1ec]">
            <BarChart3 className="h-4 w-4 text-purple-700" />
            <div>
              <span className="text-[10px] text-[#767680] block">Produk Aktif Terjual di Bulan Ini</span>
              <strong className="text-xs text-[#1b1b23]">{activeSoldProductsCount} ragam SKU</strong>
            </div>
          </div>
        </div>
      </div>

      {/* REPORT SUB-TABS SWITCHER */}
      <div className="flex items-center gap-2 border-b border-[#e2e1ec] pb-1 overflow-x-auto">
        <button
          id="subtab-cashflow"
          onClick={() => setReportSubTab('cashflow')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            reportSubTab === 'cashflow'
              ? 'bg-[#4648d4] text-white shadow-xs'
              : 'text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23]'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Laporan Arus Kas</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              reportSubTab === 'cashflow' ? 'bg-white/20 text-white' : 'bg-[#f3f2fa] text-[#767680]'
            }`}
          >
            {filteredExpenses.length}
          </span>
        </button>

        <button
          id="subtab-profit-loss"
          onClick={() => setReportSubTab('profit_loss')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            reportSubTab === 'profit_loss'
              ? 'bg-[#4648d4] text-white shadow-xs'
              : 'text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23]'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Laporan Laba & Rugi</span>
        </button>

        <button
          id="subtab-product-sales"
          onClick={() => setReportSubTab('product_sales')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            reportSubTab === 'product_sales'
              ? 'bg-[#4648d4] text-white shadow-xs'
              : 'text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Laporan Penjualan Produk</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              reportSubTab === 'product_sales' ? 'bg-white/20 text-white' : 'bg-[#f3f2fa] text-[#767680]'
            }`}
          >
            {totalUnitsSold} unit
          </span>
        </button>
      </div>

      {/* TAB 1: LAPORAN ARUS KAS (CASH FLOW) */}
      {reportSubTab === 'cashflow' && (
        <div className="space-y-6">
          {/* Top 3 Summary Cards for Cashflow */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
                  Total Kas Masuk ({monthLabel})
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-700 mt-3 tracking-tight">
                {formatCurrency(totalCashIn)}
              </p>
              <p className="text-xs text-[#767680] mt-1">
                Dari {completedTrx.length} transaksi kasir POS periode {monthLabel}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
                  Total Kas Keluar ({monthLabel})
                </span>
                <div className="p-2 rounded-xl bg-red-50 text-red-700">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-red-700 mt-3 tracking-tight">
                {formatCurrency(totalCashOut)}
              </p>
              <p className="text-xs text-[#767680] mt-1">
                {filteredExpenses.length} catatan pengeluaran operasional
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
                  Arus Kas Bersih ({monthLabel})
                </span>
                <div className="p-2 rounded-xl bg-[#ebeaff] text-[#4648d4]">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <p
                className={`text-2xl font-extrabold mt-3 tracking-tight ${
                  netCashFlow >= 0 ? 'text-[#4648d4]' : 'text-red-700'
                }`}
              >
                {formatCurrency(netCashFlow)}
              </p>
              <p className="text-xs text-[#767680] mt-1">
                {netCashFlow >= 0
                  ? 'Kas operasional surplus positif di bulan ini'
                  : 'Defisit operasional pada bulan ini'}
              </p>
            </div>
          </div>

          {/* Breakdown & Expense Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense breakdown by category */}
            <div className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#1b1b23]">Struktur Beban Operasional</h3>
                <p className="text-xs text-[#767680]">Proporsi pengeluaran {monthLabel}</p>
              </div>

              {totalCashOut === 0 ? (
                <div className="text-center py-8 text-xs text-[#767680] bg-[#fcf8ff] rounded-xl border border-dashed border-[#e2e1ec]">
                  Belum ada pengeluaran operasional di periode {monthLabel}.
                </div>
              ) : (
                <div className="space-y-3">
                  {expenseBreakdown.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#46464f]">{item.category}</span>
                        <span className="text-[#1b1b23]">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#f3f2fa] overflow-hidden">
                        <div
                          style={{ width: `${item.percentage}%` }}
                          className="h-full rounded-full bg-[#ba1a1a]"
                        ></div>
                      </div>
                      <span className="text-[10px] text-[#767680] font-medium">
                        {item.percentage}% dari total kas keluar bulan ini
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense Ledger Table */}
            <div className="lg:col-span-2 rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#f3f2fa]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1b1b23]">Buku Catatan Kas Keluar</h3>
                    <span className="rounded bg-red-50 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                      {monthLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#767680]">
                    Rincian pengeluaran toko ({filteredExpenses.length} catatan)
                  </p>
                </div>
                <button
                  onClick={onOpenAddExpenseModal}
                  className="text-xs font-bold text-[#ba1a1a] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Beban</span>
                </button>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#767680] bg-[#fcf8ff] rounded-xl border border-dashed border-[#e2e1ec] space-y-2">
                  <p className="font-semibold text-[#1b1b23]">
                    Tidak ada catatan pengeluaran pada periode {monthLabel}.
                  </p>
                  <p>Klik tombol di atas jika ingin mencatat biaya operasional pada bulan ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e2e1ec] bg-[#fcf8ff] text-[#767680]">
                        <th className="py-2.5 px-3 font-bold uppercase">Tanggal</th>
                        <th className="py-2.5 px-3 font-bold uppercase">Keterangan</th>
                        <th className="py-2.5 px-3 font-bold uppercase">Kategori</th>
                        <th className="py-2.5 px-3 font-bold uppercase">Penerima</th>
                        <th className="py-2.5 px-3 font-bold uppercase">Nominal</th>
                        <th className="py-2.5 px-3 font-bold uppercase text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f2fa]">
                      {filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-[#fcf8ff]">
                          <td className="py-3 px-3 text-[#767680] whitespace-nowrap">{exp.date}</td>
                          <td className="py-3 px-3 font-bold text-[#1b1b23]">
                            {exp.description}
                            <span className="block text-[10px] font-mono text-[#767680] font-normal">
                              {exp.refNumber}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#46464f]">{exp.recipient || '-'}</td>
                          <td className="py-3 px-3 font-extrabold text-[#ba1a1a] whitespace-nowrap">
                            -{formatCurrency(exp.amount)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm('Hapus catatan pengeluaran ini?')) deleteExpense(exp.id);
                              }}
                              className="text-[#767680] hover:text-red-700 p-1 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN LABA & RUGI (PROFIT & LOSS SAK EMKM) */}
      {reportSubTab === 'profit_loss' && (
        <div className="space-y-6">
          {/* Top KPI Card */}
          <div className="rounded-2xl border border-[#e2e1ec] bg-gradient-to-r from-[#ebeaff] to-[#f4f3ff] p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#4648d4]">
                  Laba Bersih Usaha (Net Profit) • {monthLabel}
                </span>
                <h2 className="text-3xl font-black text-[#1b1b23] tracking-tight mt-1">
                  {formatCurrency(netProfit)}
                </h2>
                <p className="text-xs text-[#46464f] mt-1">
                  Margin Laba Bersih:{' '}
                  <strong className="font-extrabold text-[#4648d4]">{netMarginPercent}%</strong> dari total
                  omzet kotor periode {monthLabel}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#e2e1ec] shadow-xs">
                <div>
                  <p className="text-[11px] text-[#767680] font-semibold">Margin Laba</p>
                  <p className="text-xl font-extrabold text-emerald-700">{netMarginPercent}%</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchical P&L Statement Table */}
          <div className="rounded-2xl border border-[#e2e1ec] bg-white p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-[#e2e1ec] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#1b1b23]">
                  Laporan Laba Rugi Komprehensif • {monthLabel}
                </h3>
                <p className="text-xs text-[#767680]">
                  Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) • {periodDescription}
                </p>
              </div>
              <span className="text-xs font-bold text-[#4648d4] bg-[#ebeaff] px-3 py-1 rounded-xl">
                Periode: {monthLabel}
              </span>
            </div>

            <div className="divide-y divide-[#f3f2fa] text-xs">
              {/* Section 1: Pendapatan */}
              <div className="py-3">
                <div className="flex justify-between items-center font-bold text-[#1b1b23] text-sm">
                  <span>1. PENDAPATAN OPERASIONAL ({monthLabel})</span>
                  <span>{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="pl-4 mt-2 space-y-1.5 text-[#46464f]">
                  <div className="flex justify-between">
                    <span>Penjualan Bersih Kasir POS ({completedTrx.length} transaksi)</span>
                    <span>{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: HPP */}
              <div className="py-3">
                <div className="flex justify-between items-center font-bold text-[#ba1a1a] text-sm">
                  <span>2. HARGA POKOK PENJUALAN (HPP)</span>
                  <span>({formatCurrency(totalHPP)})</span>
                </div>
                <div className="pl-4 mt-2 space-y-1.5 text-[#46464f]">
                  <div className="flex justify-between">
                    <span>Beban Pokok Persediaan Bahan / Modal Kulakan Barang Terjual</span>
                    <span>{formatCurrency(totalHPP)}</span>
                  </div>
                </div>
              </div>

              {/* Gross Profit Subtotal */}
              <div className="py-3 bg-[#fcf8ff] px-3 rounded-xl font-bold flex justify-between text-sm text-[#4648d4]">
                <span>LABA KOTOR (GROSS PROFIT) • MARGIN {grossMarginPercent}%</span>
                <span>{formatCurrency(grossProfit)}</span>
              </div>

              {/* Section 3: Beban Operasional */}
              <div className="py-3">
                <div className="flex justify-between items-center font-bold text-[#ba1a1a] text-sm">
                  <span>3. BEBAN OPERASIONAL TOKO ({filteredExpenses.length} pos)</span>
                  <span>({formatCurrency(totalCashOut)})</span>
                </div>
                <div className="pl-4 mt-2 space-y-1.5 text-[#46464f]">
                  {expenseBreakdown.map((item) => (
                    <div key={item.category} className="flex justify-between">
                      <span>Beban {item.category}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Net Profit Grand Total */}
              <div className="py-4 bg-[#ebeaff] px-4 rounded-xl font-extrabold flex justify-between text-base text-[#1b1b23] border border-[#4648d4]/20">
                <span className="text-[#4648d4]">
                  LABA BERSIH PERIODE BERJALAN ({monthLabel.toUpperCase()})
                </span>
                <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN PENJUALAN PRODUK (PRODUCT SALES IN PERIOD) */}
      {reportSubTab === 'product_sales' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f3f2fa]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1b1b23]">
                    Performa Omzet & Unit Terjual Produk • {monthLabel}
                  </h3>
                  <span className="rounded bg-[#ebeaff] px-2 py-0.5 text-[10px] font-bold text-[#4648d4]">
                    {totalUnitsSold} Unit Total
                  </span>
                </div>
                <p className="text-xs text-[#767680]">
                  Evaluasi kontribusi masing-masing produk terhadap pendapatan bulan {monthLabel}
                </p>
              </div>

              {/* Filter toggle: Semua Produk vs Hanya Terjual */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-[#46464f] font-semibold cursor-pointer bg-[#f3f2fa] px-3 py-1.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={onlyShowSoldProducts}
                    onChange={(e) => setOnlyShowSoldProducts(e.target.checked)}
                    className="rounded text-[#4648d4] focus:ring-0 cursor-pointer"
                  />
                  <span>Hanya Produk Terjual ({activeSoldProductsCount})</span>
                </label>
              </div>
            </div>

            {productSalesPerformance.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#767680] bg-[#fcf8ff] rounded-xl border border-dashed border-[#e2e1ec] space-y-1">
                <p className="font-bold text-[#1b1b23]">
                  Tidak ada data produk yang cocok untuk periode {monthLabel}.
                </p>
                <p>Belum ada transaksi penjualan produk yang tercatat pada bulan ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e1ec] bg-[#fcf8ff] text-[#767680]">
                      <th className="py-3 px-4 font-bold uppercase">Peringkat</th>
                      <th className="py-3 px-4 font-bold uppercase">Produk</th>
                      <th className="py-3 px-4 font-bold uppercase">Kategori</th>
                      <th className="py-3 px-4 font-bold uppercase">Harga Jual</th>
                      <th className="py-3 px-4 font-bold uppercase">Unit Terjual ({monthLabel})</th>
                      <th className="py-3 px-4 font-bold uppercase">Total Omzet ({monthLabel})</th>
                      <th className="py-3 px-4 font-bold uppercase text-right">Kontribusi Omzet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f2fa]">
                    {productSalesPerformance.map((prod, idx) => {
                      return (
                        <tr key={prod.id} className="hover:bg-[#fcf8ff]">
                          <td className="py-3 px-4 font-bold text-[#767680]">
                            {prod.periodSoldCount > 0 ? `#${idx + 1}` : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="h-9 w-9 rounded-lg object-cover bg-[#f3f2fa]"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold text-[#1b1b23]">{prod.name}</span>
                                <span className="block text-[10px] text-[#767680] font-mono">
                                  {prod.sku}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded bg-[#ebeaff] px-2 py-0.5 text-[10px] font-semibold text-[#4648d4]">
                              {prod.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#1b1b23]">{formatCurrency(prod.sellingPrice)}</td>
                          <td className="py-3 px-4 font-bold">
                            <span
                              className={prod.periodSoldCount > 0 ? 'text-[#4648d4]' : 'text-[#767680]'}
                            >
                              {prod.periodSoldCount} unit
                            </span>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-[#1b1b23]">
                            {formatCurrency(prod.periodOmzet)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-xs">{prod.contribution}%</span>
                              <div className="w-16 h-1.5 bg-[#f3f2fa] rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${prod.contribution}%` }}
                                  className="h-full bg-[#4648d4] rounded-full"
                                ></div>
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
        </div>
      )}

      {/* Accounting CSV & Excel Export Modal with synchronized period */}
      <ExportAccountingModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultReportType={getAccountingTypeForSubTab()}
        initialStartDate={startISO}
        initialEndDate={endISO}
      />

      {/* PDF Official Printable Report Modal with synchronized period */}
      <ExportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        initialReportType={getPdfTypeForSubTab()}
        initialStartDate={startISO}
        initialEndDate={endISO}
        initialPeriod={filterMode === 'all' ? 'Semua' : 'Kustom'}
      />
    </div>
  );
};

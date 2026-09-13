import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  Printer,
  Eye,
  ArrowUpDown,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShoppingBag,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Send,
  Trash2,
  AlertCircle,
  PlusCircle,
  X,
  Smartphone,
  Share2,
  BarChart3,
  Mail,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction, PaymentMethod } from '../types';
import { DetailedSalesReport } from '../components/transactions/DetailedSalesReport';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    products,
    setCurrentTab,
    formatCurrency,
    reprintReceipt,
    deleteTransaction,
    updateTransactionStatus,
    showToast,
    storeProfile,
  } = useApp();

  // View Mode: List of receipts vs Detailed Sales Report
  const [viewMode, setViewMode] = useState<'list' | 'detail_report'>('list');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<
    'all' | 'today' | 'yesterday' | 'week' | 'month' | 'this_month' | 'custom'
  >('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'highest' | 'lowest'
  >('newest');

  // Selected Transaction for Detail Modal
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Date formatting helpers
  const formatToLocalDateInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatIndonesianDateLabel = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!year || !month || !day) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${day} ${months[month - 1]} ${year}`;
  };

  const getTrxLocalDate = (trx: Transaction): string => {
    if (trx.timestamp) {
      const d = new Date(trx.timestamp);
      if (!isNaN(d.getTime())) {
        return formatToLocalDateInput(d);
      }
    }
    if (trx.date && /^\d{4}-\d{2}-\d{2}$/.test(trx.date)) {
      return trx.date;
    }
    return '';
  };

  // Preset Period Selection Handler
  const handleSelectPeriodPreset = (
    preset: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'this_month'
  ) => {
    const today = new Date();
    const todayStr = formatToLocalDateInput(today);

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      setSelectedPeriod('all');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      setSelectedPeriod('today');
    } else if (preset === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatToLocalDateInput(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
      setSelectedPeriod('yesterday');
    } else if (preset === 'week') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      setStartDate(formatToLocalDateInput(past7));
      setEndDate(todayStr);
      setSelectedPeriod('week');
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatToLocalDateInput(startOfMonth));
      setEndDate(todayStr);
      setSelectedPeriod('this_month');
    } else if (preset === 'month') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      setStartDate(formatToLocalDateInput(past30));
      setEndDate(todayStr);
      setSelectedPeriod('month');
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setSelectedPeriod('custom');
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setSelectedPeriod('custom');
  };

  const handleClearDateRange = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPeriod('all');
  };

  // Active Period Human Readable Label
  const activePeriodLabel = useMemo(() => {
    if (startDate && endDate) {
      if (startDate === endDate) {
        const todayStr = formatToLocalDateInput(new Date());
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestStr = formatToLocalDateInput(yest);

        if (startDate === todayStr) {
          return `Hari Ini (${formatIndonesianDateLabel(startDate)})`;
        }
        if (startDate === yestStr) {
          return `Kemarin (${formatIndonesianDateLabel(startDate)})`;
        }
        return formatIndonesianDateLabel(startDate);
      }
      return `${formatIndonesianDateLabel(startDate)} s/d ${formatIndonesianDateLabel(endDate)}`;
    }
    if (startDate) {
      return `Mulai ${formatIndonesianDateLabel(startDate)}`;
    }
    if (endDate) {
      return `Sampai ${formatIndonesianDateLabel(endDate)}`;
    }
    return 'Semua Waktu';
  }, [startDate, endDate]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((trx) => {
        // Text Search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          trx.orderNumber.toLowerCase().includes(q) ||
          trx.cashierName.toLowerCase().includes(q) ||
          (trx.customer?.name && trx.customer.name.toLowerCase().includes(q)) ||
          trx.items.some((it) => it.productName.toLowerCase().includes(q));

        // Payment Filter
        const matchesPayment =
          selectedPayment === 'all' || trx.paymentMethod === selectedPayment;

        // Status Filter
        const matchesStatus =
          selectedStatus === 'all' || trx.status === selectedStatus;

        // Period & Date Range Filter
        let matchesPeriod = true;
        const trxDate = getTrxLocalDate(trx);

        if (startDate) {
          if (trxDate) {
            if (trxDate < startDate) matchesPeriod = false;
          } else if (trx.timestamp) {
            const startMs = new Date(`${startDate}T00:00:00`).getTime();
            if (trx.timestamp < startMs) matchesPeriod = false;
          }
        }

        if (matchesPeriod && endDate) {
          if (trxDate) {
            if (trxDate > endDate) matchesPeriod = false;
          } else if (trx.timestamp) {
            const endMs = new Date(`${endDate}T23:59:59.999`).getTime();
            if (trx.timestamp > endMs) matchesPeriod = false;
          }
        }

        // Fallback for period preset if dates not explicitly populated
        if (!startDate && !endDate && selectedPeriod !== 'all') {
          const trxTime = trx.timestamp || 0;
          const now = Date.now();
          const oneDayMs = 24 * 60 * 60 * 1000;

          if (selectedPeriod === 'today') {
            matchesPeriod = now - trxTime <= oneDayMs;
          } else if (selectedPeriod === 'yesterday') {
            matchesPeriod =
              now - trxTime > oneDayMs && now - trxTime <= 2 * oneDayMs;
          } else if (selectedPeriod === 'week') {
            matchesPeriod = now - trxTime <= 7 * oneDayMs;
          } else if (selectedPeriod === 'month') {
            matchesPeriod = now - trxTime <= 30 * oneDayMs;
          }
        }

        return matchesSearch && matchesPayment && matchesStatus && matchesPeriod;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.timestamp || 0) - (a.timestamp || 0);
        if (sortBy === 'oldest') return (a.timestamp || 0) - (b.timestamp || 0);
        if (sortBy === 'highest') return b.total - a.total;
        if (sortBy === 'lowest') return a.total - b.total;
        return 0;
      });
  }, [
    transactions,
    searchQuery,
    selectedPeriod,
    startDate,
    endDate,
    selectedPayment,
    selectedStatus,
    sortBy,
  ]);

  // Statistics calculation for the current filtered scope
  const stats = useMemo(() => {
    const completedTrx = filteredTransactions.filter((t) => t.status === 'Selesai');
    const totalRev = completedTrx.reduce((sum, t) => sum + t.total, 0);
    const count = completedTrx.length;
    const aov = count > 0 ? totalRev / count : 0;

    // Most popular payment method
    const paymentCounts: Record<string, number> = {};
    completedTrx.forEach((t) => {
      paymentCounts[t.paymentMethod] =
        (paymentCounts[t.paymentMethod] || 0) + 1;
    });
    let topMethod = 'Tunai';
    let maxCount = 0;
    Object.entries(paymentCounts).forEach(([method, c]) => {
      if (c > maxCount) {
        maxCount = c;
        topMethod = method;
      }
    });

    return {
      totalRev,
      count,
      aov,
      topMethod,
      topMethodCount: maxCount,
    };
  }, [filteredTransactions]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('Tidak ada data transaksi untuk diekspor', 'warning');
      return;
    }

    const headers = [
      'No. Nota',
      'Tanggal',
      'Waktu',
      'Kasir',
      'Pelanggan',
      'Metode Bayar',
      'Status',
      'Subtotal (Rp)',
      'Pajak (Rp)',
      'Diskon (Rp)',
      'Total (Rp)',
      'Item Terjual',
    ];

    const rows = filteredTransactions.map((t) => {
      const itemsList = t.items
        .map((it) => `${it.productName} (${it.quantity}x)`)
        .join('; ');
      return [
        `"${t.orderNumber}"`,
        `"${t.date}"`,
        `"${t.time}"`,
        `"${t.cashierName}"`,
        `"${t.customer?.name || 'Umum'}"`,
        `"${t.paymentMethod}"`,
        `"${t.status}"`,
        t.subtotal,
        t.tax,
        t.discount,
        t.total,
        `"${itemsList}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `riwayat_transaksi_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('File CSV riwayat transaksi berhasil diunduh!', 'success');
  };

  // Helper for Payment Icon
  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'Tunai':
        return <Banknote className="h-3.5 w-3.5 text-emerald-600" />;
      case 'Transfer Bank':
        return <Building className="h-3.5 w-3.5 text-blue-600" />;
      case 'Kartu Debit':
        return <CreditCard className="h-3.5 w-3.5 text-purple-600" />;
      default:
        return <Banknote className="h-3.5 w-3.5 text-gray-600" />;
    }
  };

  // WhatsApp share message
  const handleShareWhatsApp = (trx: Transaction) => {
    const itemsText = trx.items
      .map(
        (it) =>
          `• ${it.productName} x${it.quantity} = Rp ${(
            it.price * it.quantity
          ).toLocaleString()}`
      )
      .join('\n');

    const message = `*STRUK PENJUALAN - ${storeProfile.name}*
${storeProfile.branch}
${storeProfile.address}
Telp: ${storeProfile.phone}
--------------------------------
No. Nota : ${trx.orderNumber}
Tanggal  : ${trx.date} ${trx.time}
Kasir    : ${trx.cashierName}
Pelanggan: ${trx.customer?.name || 'Pelanggan Umum'}
--------------------------------
*RINCIAN ITEM:*
${itemsText}
--------------------------------
Subtotal : Rp ${trx.subtotal.toLocaleString()}
${trx.discount > 0 ? `Diskon   : -Rp ${trx.discount.toLocaleString()}\n` : ''}${
      trx.tax > 0 ? `Pajak    : Rp ${trx.tax.toLocaleString()}\n` : ''
    }*TOTAL    : Rp ${trx.total.toLocaleString()}*
Metode   : ${trx.paymentMethod}
Status   : ${trx.status}
--------------------------------
Terima kasih atas kunjungan Anda!`;

    const phone = trx.customer?.phone
      ? trx.customer.phone.replace(/[^0-9]/g, '')
      : '';
    const formattedPhone = phone.startsWith('0')
      ? '62' + phone.substring(1)
      : phone;
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
    showToast('Membuka WhatsApp untuk mengirim struk...', 'info');
  };

  const hasActiveFilters =
    Boolean(
      searchQuery ||
      startDate ||
      endDate ||
      selectedPeriod !== 'all' ||
      selectedPayment !== 'all' ||
      selectedStatus !== 'all' ||
      sortBy !== 'newest'
    );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedPeriod('all');
    setSelectedPayment('all');
    setSelectedStatus('all');
    setSortBy('newest');
  };

  return (
    <div id="transactions-view" className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e2e1ec]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#1b1b23] tracking-tight">
              Riwayat Transaksi & Penjualan
            </h1>
            <span className="rounded-full bg-[#ebeaff] px-2.5 py-0.5 text-xs font-extrabold text-[#4648d4]">
              {transactions.length} Total Nota
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#767680] mt-0.5">
            Daftar seluruh nota kasir, laporan penjualan detail per produk & kasir, serta cetak struk ulang.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Toggle Button between List & Detailed Sales Report */}
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'detail_report' : 'list')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              viewMode === 'detail_report'
                ? 'bg-indigo-50 border border-indigo-200 text-[#4648d4] hover:bg-indigo-100'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
            title="Beralih ke Laporan Penjualan Detail"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{viewMode === 'list' ? 'Laporan Penjualan Detail' : 'Kembali ke Daftar Nota'}</span>
          </button>

          {viewMode === 'list' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-[#e2e1ec] bg-white px-3.5 py-2 text-xs font-bold text-[#1b1b23] hover:bg-[#f3f2fa] transition-all shadow-2xs cursor-pointer"
              title="Unduh Data Riwayat Format CSV"
            >
              <Download className="h-3.5 w-3.5 text-[#767680]" />
              <span>Ekspor CSV</span>
            </button>
          )}

          <button
            onClick={() => setCurrentTab('pos')}
            className="flex items-center gap-1.5 rounded-xl bg-[#4648d4] px-4 py-2 text-xs font-bold text-white hover:bg-[#3435ad] transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Transaksi Baru (Kasir)</span>
          </button>
        </div>
      </div>

      {/* Sub-View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e2e1ec] pb-1 overflow-x-auto no-scrollbar">
        <button
          id="tab-transactions-list"
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            viewMode === 'list'
              ? 'bg-[#4648d4] text-white shadow-xs'
              : 'bg-white text-[#767680] hover:text-[#1b1b23] hover:bg-[#f3f2fa] border border-[#e2e1ec]'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Daftar Nota Transaksi</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              viewMode === 'list' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {filteredTransactions.length}
          </span>
        </button>

        <button
          id="tab-transactions-detail-report"
          onClick={() => setViewMode('detail_report')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            viewMode === 'detail_report'
              ? 'bg-[#4648d4] text-white shadow-xs'
              : 'bg-white text-[#767680] hover:text-[#1b1b23] hover:bg-[#f3f2fa] border border-[#e2e1ec]'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          <span>Laporan Penjualan Detail</span>
          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
            Detail & Cetak
          </span>
        </button>
      </div>

      {viewMode === 'detail_report' ? (
        <DetailedSalesReport
          transactions={filteredTransactions}
          products={products}
          storeProfile={storeProfile}
          formatCurrency={formatCurrency}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onClearDateRange={handleClearDateRange}
          onSelectPeriodPreset={handleSelectPeriodPreset}
          activePeriodLabel={activePeriodLabel}
          onBackToTransactions={() => setViewMode('list')}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Quick Banner to Detailed Report */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-blue-50/80 border border-indigo-100 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4648d4] text-white shadow-2xs shrink-0">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-extrabold text-[#1b1b23]">
                  Laporan Detail Transaksi Penjualan
                </p>
                <p className="text-[11px] text-[#767680]">
                  Rangkuman omzet, estimasi laba kotor, rincian per produk, rekap kasir, dan cetak lembar laporan resmi.
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewMode('detail_report')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4648d4] text-white font-bold text-xs hover:bg-[#3435ad] transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <span>Buka Laporan Detail</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* KPI Cards Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Omset */}
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#767680] uppercase tracking-wider">
              Total Omset Selesai
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-[#1b1b23]">
            {formatCurrency(stats.totalRev)}
          </p>
          <p className="text-[10px] text-[#767680] truncate" title={activePeriodLabel}>
            Periode: <strong className="text-[#4648d4] font-bold">{activePeriodLabel}</strong>
          </p>
        </div>

        {/* Card 2: Total Transaksi Berhasil */}
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#767680] uppercase tracking-wider">
              Transaksi Selesai
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-[#1b1b23]">
            {stats.count}{' '}
            <span className="text-xs font-normal text-[#767680]">Nota</span>
          </p>
          <p className="text-[10px] text-emerald-600 font-bold">100% Tercatat Otomatis</p>
        </div>

        {/* Card 3: Rata-rata Nilai Belanja (AOV) */}
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#767680] uppercase tracking-wider">
              Rata-rata / Nota
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-[#1b1b23]">
            {formatCurrency(Math.round(stats.aov))}
          </p>
          <p className="text-[10px] text-[#767680]">Average Order Value (AOV)</p>
        </div>

        {/* Card 4: Metode Bayar Terpopuler */}
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#767680] uppercase tracking-wider">
              Metode Terbanyak
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-[#1b1b23] truncate">
            {stats.topMethod}
          </p>
          <p className="text-[10px] text-[#767680]">
            {stats.topMethodCount} kali digunakan
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-xs space-y-3">
        {/* Search row & Quick Period Presets */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
            <input
              id="input-search-transactions"
              type="text"
              placeholder="Cari No. Nota (#ORD...), nama pelanggan, kasir, atau nama item barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] py-2.5 pl-10 pr-9 text-xs sm:text-sm text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Period Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'today', label: 'Hari Ini' },
              { id: 'yesterday', label: 'Kemarin' },
              { id: 'week', label: '7 Hari' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'month', label: '30 Hari' },
            ].map((p) => (
              <button
                key={p.id}
                id={`filter-period-${p.id}`}
                onClick={() => handleSelectPeriodPreset(p.id as any)}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === p.id
                    ? 'bg-[#4648d4] text-white shadow-xs'
                    : 'bg-[#f3f2fa] text-[#46464f] hover:bg-[#e2e1ec]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dedicated Date Range Filter Row (Rentang Tanggal Mulai & Akhir) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#fcf8ff] border border-[#e2e1ec]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ebeaff] text-[#4648d4] shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#1b1b23]">
                  Rentang Tanggal Penjualan:
                </span>
                {activePeriodLabel !== 'Semua Waktu' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#4648d4]/10 text-[#4648d4] px-2 py-0.5 text-[10px] font-extrabold">
                    <span>{activePeriodLabel}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#767680]">
                Pantau penjualan harian, mingguan, atau tentukan rentang tanggal mulai dan akhir secara kustom
              </p>
            </div>
          </div>

          {/* Date Input Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-[#e2e1ec] rounded-xl px-2.5 py-1.5 shadow-2xs">
              <label
                htmlFor="filter-start-date"
                className="text-[11px] font-bold text-[#767680] whitespace-nowrap cursor-pointer"
              >
                Mulai:
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="text-xs font-bold text-[#1b1b23] bg-transparent focus:outline-hidden cursor-pointer"
                title="Pilih Tanggal Mulai"
              />
            </div>

            <span className="text-[#767680] text-xs font-bold hidden sm:inline">-</span>

            <div className="flex items-center gap-1.5 bg-white border border-[#e2e1ec] rounded-xl px-2.5 py-1.5 shadow-2xs">
              <label
                htmlFor="filter-end-date"
                className="text-[11px] font-bold text-[#767680] whitespace-nowrap cursor-pointer"
              >
                Akhir:
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="text-xs font-bold text-[#1b1b23] bg-transparent focus:outline-hidden cursor-pointer"
                title="Pilih Tanggal Akhir"
              />
            </div>

            {(startDate || endDate) && (
              <button
                id="btn-clear-date-range"
                onClick={handleClearDateRange}
                className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                title="Hapus Filter Rentang Tanggal"
              >
                <X className="h-3 w-3" />
                <span>Hapus Tanggal</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#f3f2fa]">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter Payment Method */}
            <div className="flex items-center gap-1.5 bg-[#fcf8ff] border border-[#e2e1ec] rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-[#767680]">Bayar:</span>
              <select
                id="filter-payment-method"
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="bg-transparent font-bold text-[#1b1b23] focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="all">Semua Metode</option>
                <option value="Tunai">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Kartu Debit">Kartu Debit</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5 bg-[#fcf8ff] border border-[#e2e1ec] rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-[#767680]">Status:</span>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-bold text-[#1b1b23] focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Selesai">Selesai</option>
                <option value="Tertunda">Tertunda</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#fcf8ff] border border-[#e2e1ec] rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="h-3 w-3 text-[#767680]" />
              <select
                id="sort-transactions"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-[#1b1b23] focus:outline-hidden text-xs cursor-pointer"
              >
                <option value="newest">Waktu Terbaru</option>
                <option value="oldest">Waktu Terlama</option>
                <option value="highest">Nominal Tertinggi</option>
                <option value="lowest">Nominal Terendah</option>
              </select>
            </div>

            {/* Reset filter button */}
            {hasActiveFilters && (
              <button
                id="btn-reset-filters"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 underline px-2 py-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            {stats.totalRev > 0 && (
              <span className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold">
                Omset Filter: {formatCurrency(stats.totalRev)}
              </span>
            )}
            <span className="font-bold text-[#767680]">
              Menampilkan <strong>{filteredTransactions.length}</strong> dari{' '}
              {transactions.length} transaksi
            </span>
          </div>
        </div>
      </div>

      {/* Main Transactions List / Table */}
      {filteredTransactions.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-[#e2e1ec] bg-white p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4]">
            <Receipt className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-black text-[#1b1b23]">
              Tidak Ada Transaksi yang Ditemukan
            </h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              {hasActiveFilters
                ? 'Tidak ada data transaksi yang cocok dengan kata kunci atau filter pencarian Anda.'
                : 'Belum ada riwayat transaksi penjualan kasir yang tercatat.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="rounded-xl bg-[#f3f2fa] px-4 py-2.5 text-xs font-bold text-[#1b1b23] hover:bg-[#e2e1ec] transition-all"
              >
                Reset Semua Filter
              </button>
            ) : (
              <button
                onClick={() => setCurrentTab('pos')}
                className="flex items-center gap-2 rounded-xl bg-[#4648d4] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#3435ad] transition-all shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Buka Kasir POS</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* DESKTOP / TABLET VIEW (Table) */}
          <div className="hidden md:block rounded-2xl border border-[#e2e1ec] bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e2e1ec] bg-[#fcf8ff] text-[#767680]">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">
                      No. Nota & Waktu
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">
                      Pelanggan
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">
                      Item Terjual
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">
                      Kasir
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">
                      Metode
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">
                      Total Belanja
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f2fa]">
                  {filteredTransactions.map((trx) => (
                    <tr
                      key={trx.id}
                      className="hover:bg-[#fcf8ff] transition-colors group"
                    >
                      {/* Order & Time */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#4648d4] flex items-center gap-1.5">
                          <span>{trx.orderNumber}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#767680] mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{trx.date}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{trx.time}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-[#1b1b23]">
                          <User className="h-3.5 w-3.5 text-[#767680]" />
                          <span>{trx.customer ? trx.customer.name : 'Pelanggan Umum'}</span>
                        </div>
                        {trx.customer?.tier && (
                          <span className="inline-block mt-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {trx.customer.tier}
                          </span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-semibold text-[#1b1b23] truncate">
                          {trx.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
                        </p>
                        <p className="text-[10px] text-[#767680]">
                          {trx.items.reduce((s, i) => s + i.quantity, 0)} item total
                        </p>
                      </td>

                      {/* Cashier */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#46464f]">
                          {trx.cashierName || storeProfile.owner}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f2fa] px-2.5 py-1 text-xs font-bold text-[#1b1b23]">
                          {getPaymentIcon(trx.paymentMethod)}
                          <span>{trx.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            trx.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : trx.status === 'Tertunda'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              trx.status === 'Selesai'
                                ? 'bg-emerald-500'
                                : trx.status === 'Tertunda'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                          <span>{trx.status}</span>
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-sm text-[#1b1b23]">
                          {formatCurrency(trx.total)}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* PRIMARY ACTION: REPRINT STRUK */}
                          <button
                            onClick={() => reprintReceipt(trx)}
                            className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-xs active:scale-95"
                            title="Cetak Ulang Struk (Bluetooth / Printer)"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Reprint Struk</span>
                          </button>

                          {/* Secondary: View Detail */}
                          <button
                            onClick={() => setDetailTransaction(trx)}
                            className="flex items-center gap-1 rounded-xl border border-[#e2e1ec] bg-white hover:bg-[#f3f2fa] px-2.5 py-1.5 text-xs font-bold text-[#46464f] transition-all"
                            title="Lihat Rincian Lengkap"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detail</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (Responsive Android / Mobile Friendly) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTransactions.map((trx) => (
              <div
                key={trx.id}
                className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-xs space-y-3"
              >
                {/* Card Header: Order No & Status */}
                <div className="flex items-center justify-between pb-2 border-b border-[#f3f2fa]">
                  <div>
                    <span className="font-black text-sm text-[#4648d4]">
                      {trx.orderNumber}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-[#767680] mt-0.5">
                      <span>{trx.date}</span>
                      <span>•</span>
                      <span>{trx.time}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      trx.status === 'Selesai'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : trx.status === 'Tertunda'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    <span>{trx.status}</span>
                  </span>
                </div>

                {/* Items & Customer info */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#767680]">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      <span>Pelanggan:</span>
                    </span>
                    <strong className="text-[#1b1b23]">
                      {trx.customer ? trx.customer.name : 'Pelanggan Umum'}
                    </strong>
                  </div>

                  <div className="flex items-start justify-between text-[#767680] pt-1">
                    <span className="flex items-center gap-1 shrink-0">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Item:</span>
                    </span>
                    <p className="text-right font-medium text-[#1b1b23] line-clamp-1 max-w-[200px]">
                      {trx.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[#767680] pt-1">
                    <span>Metode Bayar:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#1b1b23]">
                      {getPaymentIcon(trx.paymentMethod)}
                      <span>{trx.paymentMethod}</span>
                    </span>
                  </div>
                </div>

                {/* Total & Action Bar */}
                <div className="pt-2.5 border-t border-[#f3f2fa] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#767680] block">Total Transaksi:</span>
                    <span className="font-black text-base text-[#1b1b23]">
                      {formatCurrency(trx.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailTransaction(trx)}
                      className="rounded-xl border border-[#e2e1ec] bg-white px-3 py-2 text-xs font-bold text-[#46464f] hover:bg-[#f3f2fa] transition-all"
                    >
                      Detail
                    </button>

                    {/* REPRINT BUTTON MOBILE */}
                    <button
                      onClick={() => reprintReceipt(trx)}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-xs active:scale-95"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Reprint Struk</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )}

      {/* DETAIL MODAL / TRANSACTION RECEIPT PREVIEW */}
      {detailTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1b1b23]">
                    Rincian Nota Penjualan
                  </h3>
                  <p className="text-xs text-[#767680]">
                    {detailTransaction.orderNumber} • {detailTransaction.date}{' '}
                    {detailTransaction.time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailTransaction(null)}
                className="rounded-xl p-2 text-[#767680] hover:bg-[#f3f2fa] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fcf8ff] border border-[#e2e1ec] text-xs">
              <div>
                <span className="text-[10px] text-[#767680] block font-semibold">
                  Kasir:
                </span>
                <span className="font-bold text-[#1b1b23]">
                  {detailTransaction.cashierName || storeProfile.owner}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#767680] block font-semibold">
                  Metode Bayar:
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-[#1b1b23]">
                  {getPaymentIcon(detailTransaction.paymentMethod)}
                  <span>{detailTransaction.paymentMethod}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#767680] block font-semibold">
                  Status:
                </span>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {detailTransaction.status}
                </span>
              </div>
            </div>

            {/* Customer Details if any */}
            {detailTransaction.customer && (
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                    {detailTransaction.customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-blue-950">
                      {detailTransaction.customer.name}
                    </p>
                    <p className="text-[11px] text-blue-800">
                      {detailTransaction.customer.phone || 'Tanpa no. telepon'}
                    </p>
                  </div>
                </div>
                {detailTransaction.customer.phone && (
                  <button
                    onClick={() => handleShareWhatsApp(detailTransaction)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Kirim WA</span>
                  </button>
                )}
              </div>
            )}

            {/* Product items table */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-[#767680] uppercase tracking-wider">
                Daftar Produk yang Dibeli
              </h4>
              <div className="divide-y divide-[#f3f2fa] border border-[#e2e1ec] rounded-2xl overflow-hidden bg-white">
                {detailTransaction.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="h-10 w-10 rounded-xl object-cover bg-[#f3f2fa] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#1b1b23] truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-[#767680]">
                          {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#1b1b23] shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 rounded-2xl bg-[#fcf8ff] border border-[#e2e1ec] space-y-2 text-xs">
              <div className="flex justify-between text-[#767680]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#1b1b23]">
                  {formatCurrency(detailTransaction.subtotal)}
                </span>
              </div>
              {detailTransaction.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon Promo:</span>
                  <span className="font-semibold">
                    -{formatCurrency(detailTransaction.discount)}
                  </span>
                </div>
              )}
              {detailTransaction.tax > 0 && (
                <div className="flex justify-between text-[#767680]">
                  <span>Pajak ({Math.round(storeProfile.taxRate * 100)}%):</span>
                  <span className="font-semibold text-[#1b1b23]">
                    {formatCurrency(detailTransaction.tax)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-[#e2e1ec] flex justify-between text-sm font-black text-[#1b1b23]">
                <span>Total Pembayaran:</span>
                <span className="text-[#4648d4] text-base">
                  {formatCurrency(detailTransaction.total)}
                </span>
              </div>
              {detailTransaction.cashGiven !== undefined && (
                <div className="pt-1 flex justify-between text-[11px] text-[#767680]">
                  <span>Uang Tunai Diterima:</span>
                  <span>{formatCurrency(detailTransaction.cashGiven)}</span>
                </div>
              )}
              {detailTransaction.change !== undefined && (
                <div className="flex justify-between text-[11px] text-[#767680]">
                  <span>Kembalian:</span>
                  <span>{formatCurrency(detailTransaction.change)}</span>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#f3f2fa]">
              <button
                onClick={() => {
                  reprintReceipt(detailTransaction);
                  setDetailTransaction(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-md active:scale-98"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Ulang Struk (Reprint)</span>
              </button>

              <button
                onClick={() => handleShareWhatsApp(detailTransaction)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all"
              >
                <Send className="h-4 w-4 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('gmail');
                  setDetailTransaction(null);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-bold text-red-700 hover:bg-red-100 transition-all"
                title="Buka Gmail untuk Kirim Struk"
              >
                <Mail className="h-4 w-4 text-red-600" />
                <span>Gmail</span>
              </button>

              <button
                onClick={() => setDetailTransaction(null)}
                className="rounded-xl bg-[#f3f2fa] px-4 py-3 text-xs font-bold text-[#1b1b23] hover:bg-[#e2e1ec] transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

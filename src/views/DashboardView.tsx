import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  QrCode,
  Banknote,
  CreditCard,
  Building,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';

export const DashboardView: React.FC = () => {
  const {
    transactions,
    products,
    customers,
    formatCurrency,
    setCurrentTab,
    setReportSubTab,
    setCompletedTransaction,
    setIsReceiptModalOpen,
  } = useApp();

  const [timeframe, setTimeframe] = useState<'Hari Ini' | '7 Hari' | 'Bulan Ini'>('Hari Ini');
  const [chartViewMode, setChartViewMode] = useState<'Mingguan' | 'Bulanan'>('Mingguan');

  // Calculations
  const completedTrx = transactions.filter((t) => t.status === 'Selesai');
  const totalSalesAmount = completedTrx.reduce((acc, t) => acc + t.total, 0);
  const totalTransactionCount = completedTrx.length;
  const lowStockProducts = products.filter((p) => p.stock <= (p.minStockAlert ?? 5));

  // Best sellers sorted by sold count
  const bestSellers = [...products]
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 4);

  // Formatted today
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  // Weekly Cashflow bars mock data
  const weeklyData = [
    { day: 'Sen', inVal: 3200000, outVal: 1800000 },
    { day: 'Sel', inVal: 4100000, outVal: 2200000 },
    { day: 'Rab', inVal: 4850000, outVal: 1950000 },
    { day: 'Kam', inVal: 3900000, outVal: 2500000 },
    { day: 'Jum', inVal: 5600000, outVal: 3100000 },
    { day: 'Sab', inVal: 6800000, outVal: 2800000 },
    { day: 'Min', inVal: 6200000, outVal: 2400000 },
  ];

  const maxWeeklyVal = 7000000;

  const handleOpenReceipt = (trx: Transaction) => {
    setCompletedTransaction(trx);
    setIsReceiptModalOpen(true);
  };

  return (
    <div id="dashboard-view" className="space-y-6 pb-20 lg:pb-0">
      {/* Header with Title, Date & Quick Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1b1b23] tracking-tight">
            Ringkasan Hari Ini
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#767680]">
            <Calendar className="h-3.5 w-3.5 text-[#4648d4]" />
            <span>{todayFormatted}</span>
            <span className="h-1 w-1 rounded-full bg-[#767680]"></span>
            <span className="text-emerald-700 font-semibold">Toko Buka (Shift Berjalan)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Cashier shortcut */}
          <button
            id="dash-open-pos-btn"
            onClick={() => setCurrentTab('pos')}
            className="flex items-center gap-1.5 rounded-xl bg-[#4648d4] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#3435ad] transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Buka Kasir POS</span>
          </button>

          {/* Timeframe dropdown */}
          <div className="flex rounded-xl bg-[#f3f2fa] p-1 border border-[#e2e1ec]">
            {(['Hari Ini', '7 Hari', 'Bulan Ini'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  timeframe === t
                    ? 'bg-white text-[#4648d4] shadow-xs'
                    : 'text-[#767680] hover:text-[#1b1b23]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Stat KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Penjualan */}
        <div
          id="kpi-total-sales"
          onClick={() => {
            setCurrentTab('reports');
            setReportSubTab('cashflow');
          }}
          className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs hover:border-[#4648d4]/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
              Total Penjualan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ebeaff] text-[#4648d4] group-hover:bg-[#4648d4] group-hover:text-white transition-colors">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-[#1b1b23] tracking-tight">
              {formatCurrency(totalSalesAmount || 4850000)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+12.5%</span>
              <span className="text-[#767680] font-normal">dibanding kemarin</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Transaksi */}
        <div
          id="kpi-total-transactions"
          onClick={() => setCurrentTab('pos')}
          className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs hover:border-[#4648d4]/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
              Total Transaksi
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-[#1b1b23] tracking-tight">
              {totalTransactionCount || 142} <span className="text-sm font-semibold text-[#767680]">Trx</span>
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+8.2%</span>
              <span className="text-[#767680] font-normal">rata-rata struk</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pelanggan */}
        <div
          id="kpi-customers"
          className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs hover:border-[#4648d4]/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
              Pelanggan Terdaftar
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-[#1b1b23] tracking-tight">
              {customers.length || 28} <span className="text-sm font-semibold text-[#767680]">Member</span>
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+4 Pelanggan Baru</span>
            </div>
          </div>
        </div>

        {/* Card 4: Sisa Stok Minim */}
        <div
          id="kpi-low-stock"
          onClick={() => setCurrentTab('products')}
          className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
              Sisa Stok Minim
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-[#ba1a1a] tracking-tight">
              {lowStockProducts.length} <span className="text-sm font-semibold text-[#767680]">Item</span>
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-800 font-semibold">
              <span>Perlu Restok Segera</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Side Bestseller Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cashflow & Sales Bar Visualization */}
        <div className="lg:col-span-2 rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f3f2fa]">
            <div>
              <h3 className="text-sm font-bold text-[#1b1b23]">Arus Kas & Tren Penjualan</h3>
              <p className="text-xs text-[#767680]">Pemasukan kasir vs Pengeluaran operasional</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs font-semibold mr-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4648d4]"></span>
                  <span className="text-[#46464f]">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ba1a1a]/70"></span>
                  <span className="text-[#46464f]">Pengeluaran</span>
                </div>
              </div>
              <div className="flex rounded-lg bg-[#f3f2fa] p-0.5 border border-[#e2e1ec]">
                {(['Mingguan', 'Bulanan'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setChartViewMode(m)}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                      chartViewMode === m
                        ? 'bg-white text-[#4648d4] shadow-xs'
                        : 'text-[#767680] hover:text-[#1b1b23]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4">
            <div className="flex items-end justify-between gap-3 h-52 pt-6">
              {weeklyData.map((item, idx) => {
                const inHeight = Math.round((item.inVal / maxWeeklyVal) * 100);
                const outHeight = Math.round((item.outVal / maxWeeklyVal) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="relative flex items-end justify-center gap-1.5 w-full h-full">
                      {/* Cash In Bar */}
                      <div
                        style={{ height: `${inHeight}%` }}
                        className="w-full max-w-[20px] rounded-t-md bg-[#4648d4] group-hover:bg-[#3435ad] transition-all relative"
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-[#1b1b23] px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          {formatCurrency(item.inVal)}
                        </span>
                      </div>
                      {/* Cash Out Bar */}
                      <div
                        style={{ height: `${outHeight}%` }}
                        className="w-full max-w-[20px] rounded-t-md bg-red-400 group-hover:bg-red-500 transition-all relative"
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-[#ba1a1a] px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          {formatCurrency(item.outVal)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#767680]">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary footer */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#fcf8ff] border border-[#e2e1ec] text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-[#46464f]">Total Pemasukan Mingguan:</span>
              <strong className="font-bold text-[#1b1b23]">Rp 34.650.000</strong>
            </div>
            <button
              onClick={() => {
                setCurrentTab('reports');
                setReportSubTab('cashflow');
              }}
              className="font-bold text-[#4648d4] hover:underline"
            >
              Lihat Detail Arus Kas →
            </button>
          </div>
        </div>

        {/* Right Col: Produk Terlaris */}
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#f3f2fa]">
            <div>
              <h3 className="text-sm font-bold text-[#1b1b23]">Produk Terlaris</h3>
              <p className="text-xs text-[#767680]">Berdasarkan kuantitas terjual</p>
            </div>
            <button
              onClick={() => {
                setCurrentTab('reports');
                setReportSubTab('product_sales');
              }}
              className="text-xs font-bold text-[#4648d4] hover:underline"
            >
              Semua
            </button>
          </div>

          <div className="space-y-3">
            {bestSellers.map((prod, index) => {
              const maxSold = bestSellers[0]?.soldCount || 1;
              const percent = Math.round(((prod.soldCount || 0) / maxSold) * 100);
              return (
                <div key={prod.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#fcf8ff] transition-colors">
                  <span className="text-xs font-extrabold text-[#767680] w-4">{index + 1}</span>
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="h-10 w-10 rounded-lg object-cover bg-[#f3f2fa]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#1b1b23] truncate">{prod.name}</h4>
                      <span className="text-xs font-extrabold text-[#4648d4] whitespace-nowrap">
                        {prod.soldCount || 0} terjual
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#f3f2fa] overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-[#4648d4] to-[#7375f0]"
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f3f2fa]">
          <div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Transaksi Kasir Terakhir</h3>
            <p className="text-xs text-[#767680]">Riwayat penjualan langsung dan struk tercetak</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTab('transactions')}
              className="flex items-center gap-1.5 rounded-xl border border-[#e2e1ec] bg-white px-3 py-1.5 text-xs font-bold text-[#4648d4] hover:bg-[#ebeaff] transition-all w-fit"
            >
              <span>Semua Riwayat</span>
            </button>
            <button
              onClick={() => setCurrentTab('pos')}
              className="flex items-center gap-1.5 rounded-xl bg-[#ebeaff] px-3 py-1.5 text-xs font-bold text-[#4648d4] hover:bg-[#4648d4] hover:text-white transition-all w-fit"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Transaksi Baru</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e1ec] bg-[#fcf8ff] text-[#767680]">
                <th className="py-2.5 px-3 font-bold uppercase">No. Pesanan</th>
                <th className="py-2.5 px-3 font-bold uppercase">Pelanggan</th>
                <th className="py-2.5 px-3 font-bold uppercase">Waktu</th>
                <th className="py-2.5 px-3 font-bold uppercase">Total Belanja</th>
                <th className="py-2.5 px-3 font-bold uppercase">Metode</th>
                <th className="py-2.5 px-3 font-bold uppercase">Status</th>
                <th className="py-2.5 px-3 font-bold uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2fa]">
              {transactions.slice(0, 5).map((trx) => (
                <tr key={trx.id} className="hover:bg-[#fcf8ff] transition-colors">
                  <td className="py-3 px-3 font-bold text-[#4648d4]">{trx.orderNumber}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-[#1b1b23]">
                      {trx.customer ? trx.customer.name : 'Pelanggan Umum'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#767680]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{trx.time}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-extrabold text-[#1b1b23]">
                    {formatCurrency(trx.total)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#f3f2fa] px-2 py-0.5 font-semibold text-[#46464f]">
                      {trx.paymentMethod === 'Tunai' ? (
                        <Banknote className="h-3 w-3 text-emerald-600" />
                      ) : trx.paymentMethod === 'Transfer Bank' ? (
                        <Building className="h-3 w-3 text-blue-600" />
                      ) : (
                        <CreditCard className="h-3 w-3 text-purple-600" />
                      )}
                      <span>{trx.paymentMethod}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        trx.status === 'Selesai'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {trx.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleOpenReceipt(trx)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#e2e1ec] bg-white px-2.5 py-1 text-xs font-semibold text-[#46464f] hover:border-[#4648d4] hover:text-[#4648d4] transition-colors"
                      title="Lihat & Cetak Struk"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Struk</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

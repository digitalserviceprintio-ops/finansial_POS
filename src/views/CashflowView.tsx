import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Download,
  Trash2,
  Receipt,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CashflowViewProps {
  onOpenAddExpenseModal: () => void;
}

export const CashflowView: React.FC<CashflowViewProps> = ({ onOpenAddExpenseModal }) => {
  const {
    transactions,
    expenses,
    deleteExpense,
    formatCurrency,
    showToast,
    setCurrentTab,
    setReportSubTab,
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cash In calculation
  const completedTrx = transactions.filter((t) => t.status === 'Selesai');
  const totalCashIn = completedTrx.reduce((acc, t) => acc + t.total, 0);
  const totalCashOut = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netCashBalance = totalCashIn - totalCashOut;

  // Combine transactions (Cash In) and expenses (Cash Out) into a single chronological ledger
  const inEntries = completedTrx.map((t) => ({
    id: t.id,
    date: `${t.date} - ${t.time}`,
    timestamp: t.timestamp,
    title: `Penjualan ${t.orderNumber}`,
    subtitle: t.customer?.name || 'Pelanggan Umum',
    category: 'Penjualan POS',
    type: 'in' as const,
    amount: t.total,
    method: t.paymentMethod,
  }));

  const outEntries = expenses.map((e) => ({
    id: e.id,
    date: `${e.date} - ${e.time}`,
    timestamp: e.timestamp,
    title: e.description,
    subtitle: e.recipient || e.refNumber,
    category: e.category,
    type: 'out' as const,
    amount: e.amount,
    method: 'Kas Tunai / Bank',
  }));

  const combinedLedger = [...inEntries, ...outEntries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((item) => {
      const matchesType =
        filterType === 'all' ||
        (filterType === 'in' && item.type === 'in') ||
        (filterType === 'out' && item.type === 'out');
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });

  return (
    <div id="cashflow-view" className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1b1b23] tracking-tight">
            Keuangan & Arus Kas
          </h1>
          <p className="text-xs text-[#767680] mt-0.5">
            Buku kas harian dan monitoring likuiditas bisnis UMKM
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentTab('reports');
              setReportSubTab('profit_loss');
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] px-3.5 py-2 text-xs font-bold text-[#46464f] hover:text-[#4648d4] hover:border-[#4648d4] transition-all shadow-xs"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Lihat Laba Rugi</span>
          </button>
          <button
            id="btn-catat-beban"
            onClick={onOpenAddExpenseModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#ba1a1a] px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Kas Masuk */}
        <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">Total Kas Masuk</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2 tracking-tight">
            +{formatCurrency(totalCashIn)}
          </p>
          <span className="text-[11px] text-[#767680]">{completedTrx.length} Transaksi Penjualan</span>
        </div>

        {/* Total Kas Keluar */}
        <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">Total Kas Keluar</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-700">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-red-700 mt-2 tracking-tight">
            -{formatCurrency(totalCashOut)}
          </p>
          <span className="text-[11px] text-[#767680]">{expenses.length} Catatan Beban Operasional</span>
        </div>

        {/* Saldo Akhir Kas */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#ebeaff] to-white border border-[#4648d4]/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4648d4]">Saldo Akhir Kas</span>
            <div className="p-2 rounded-xl bg-[#4648d4] text-white">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1b1b23] mt-2 tracking-tight">
            {formatCurrency(netCashBalance)}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold">Status Likuiditas Aman</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#e2e1ec] shadow-xs p-5 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-[#4648d4] text-white shadow-xs'
                  : 'bg-[#f3f2fa] text-[#46464f] hover:bg-[#e8e7f0]'
              }`}
            >
              Semua Arus Kas ({combinedLedger.length})
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filterType === 'in'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Kas Masuk (In)
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filterType === 'out'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              Kas Keluar (Out)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#767680]" />
            <input
              type="text"
              placeholder="Cari buku kas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-1.5 pl-8 pr-3 text-xs focus:border-[#4648d4] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Ledger List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e1ec] bg-[#fcf8ff] text-[#767680]">
                <th className="py-2.5 px-3 font-bold uppercase">Tanggal & Waktu</th>
                <th className="py-2.5 px-3 font-bold uppercase">Keterangan</th>
                <th className="py-2.5 px-3 font-bold uppercase">Kategori</th>
                <th className="py-2.5 px-3 font-bold uppercase">Metode</th>
                <th className="py-2.5 px-3 font-bold uppercase text-right">Nominal Arus Kas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2fa]">
              {combinedLedger.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#fcf8ff]">
                  <td className="py-3 px-3 text-[#767680] whitespace-nowrap">{entry.date}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-[#1b1b23]">{entry.title}</p>
                    <p className="text-[10px] text-[#767680]">{entry.subtitle}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        entry.type === 'in'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {entry.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#46464f]">{entry.method}</td>
                  <td className="py-3 px-3 text-right font-extrabold text-sm whitespace-nowrap">
                    <span className={entry.type === 'in' ? 'text-emerald-700' : 'text-red-700'}>
                      {entry.type === 'in' ? '+' : '-'}
                      {formatCurrency(entry.amount)}
                    </span>
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

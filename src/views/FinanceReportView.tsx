import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  Trash2,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReportSubTab } from '../types';

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
    showToast,
  } = useApp();

  const [datePeriod, setDatePeriod] = useState<'Bulan Ini' | 'Bulan Lalu' | 'Tahun Ini'>('Bulan Ini');

  // Calculations for Arus Kas & P&L
  const completedTrx = transactions.filter((t) => t.status === 'Selesai');
  const totalCashIn = completedTrx.reduce((acc, t) => acc + t.total, 0);
  const totalRevenue = completedTrx.reduce((acc, t) => acc + t.subtotal, 0);
  const totalCashOut = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netCashFlow = totalCashIn - totalCashOut;

  // COGS / HPP estimation based on transactions items
  const totalHPP = completedTrx.reduce((acc, t) => {
    return (
      acc +
      t.items.reduce((itemAcc, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const buyPrice = prod ? prod.purchasePrice : item.price * 0.6;
        return itemAcc + buyPrice * item.quantity;
      }, 0)
    );
  }, 0);

  const grossProfit = totalRevenue - totalHPP;
  const netProfit = grossProfit - totalCashOut;
  const netMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Expense breakdown by category
  const expenseCategories = [
    'Bahan Baku',
    'Gaji Karyawan',
    'Utilitas',
    'Pemasaran',
    'Sewa Tempat',
    'Operasional',
  ] as const;

  const expenseBreakdown = expenseCategories.map((cat) => {
    const totalForCat = expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    const percentage = totalCashOut > 0 ? Math.round((totalForCat / totalCashOut) * 100) : 0;
    return {
      category: cat,
      amount: totalForCat,
      percentage,
    };
  });

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (reportSubTab === 'cashflow') {
      csvContent += 'No,Tanggal,Tipe,Deskripsi/No Pesanan,Kategori,Jumlah (Rp)\n';
      transactions.forEach((t, i) => {
        csvContent += `${i + 1},"${t.date} ${t.time}",Kas Masuk,"${t.orderNumber} - ${t.customer?.name || 'Umum'}","Penjualan Kasir",${t.total}\n`;
      });
      expenses.forEach((e, i) => {
        csvContent += `${transactions.length + i + 1},"${e.date} ${e.time}",Kas Keluar,"${e.description}","${e.category}",-${e.amount}\n`;
      });
    } else if (reportSubTab === 'profit_loss') {
      csvContent += 'Komponen Laporan,Nominal (Rp),Persentase (%)\n';
      csvContent += `Pendapatan Penjualan,${totalRevenue},100%\n`;
      csvContent += `Harga Pokok Penjualan (HPP),${totalHPP},${Math.round((totalHPP / (totalRevenue || 1)) * 100)}%\n`;
      csvContent += `Laba Kotor,${grossProfit},${Math.round((grossProfit / (totalRevenue || 1)) * 100)}%\n`;
      csvContent += `Total Beban Operasional,${totalCashOut},${Math.round((totalCashOut / (totalRevenue || 1)) * 100)}%\n`;
      csvContent += `Laba Bersih,${netProfit},${netMarginPercent}%\n`;
    } else {
      csvContent += 'Peringkat,Nama Produk,SKU,Kategori,Harga Jual,Unit Terjual,Total Omset (Rp)\n';
      products.forEach((p, i) => {
        csvContent += `${i + 1},"${p.name}","${p.sku}","${p.category}",${p.sellingPrice},${p.soldCount || 0},${(p.soldCount || 0) * p.sellingPrice}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_FinansialPro_${reportSubTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan berhasil diunduh dalam format CSV', 'success');
  };

  return (
    <div id="finance-report-view" className="space-y-6 pb-20 lg:pb-0">
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1b1b23] tracking-tight">
            Laporan Keuangan UMKM
          </h1>
          <p className="text-xs text-[#767680] mt-0.5">
            Analisis arus kas harian, laba rugi, dan kinerja penjualan produk
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export button */}
          <button
            id="export-report-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] px-3.5 py-2 text-xs font-bold text-[#46464f] hover:border-[#4648d4] hover:text-[#4648d4] transition-all shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {/* Record Expense Button */}
          <button
            id="open-expense-modal-btn"
            onClick={onOpenAddExpenseModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#ba1a1a] px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Report Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#e2e1ec] pb-1 overflow-x-auto">
        <button
          id="subtab-cashflow"
          onClick={() => setReportSubTab('cashflow')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            reportSubTab === 'cashflow'
              ? 'bg-[#4648d4] text-white shadow-xs'
              : 'text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23]'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Laporan Arus Kas</span>
        </button>
        <button
          id="subtab-profit-loss"
          onClick={() => setReportSubTab('profit_loss')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            reportSubTab === 'product_sales'
              ? 'bg-[#4648d4] text-white shadow-xs'
              : 'text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Laporan Penjualan Produk</span>
        </button>
      </div>

      {/* TAB 1: LAPORAN ARUS KAS */}
      {reportSubTab === 'cashflow' && (
        <div className="space-y-6">
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
                  Total Kas Masuk (In)
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-700 mt-3 tracking-tight">
                {formatCurrency(totalCashIn)}
              </p>
              <p className="text-xs text-[#767680] mt-1">Dari transaksi POS kasir</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
                  Total Kas Keluar (Out)
                </span>
                <div className="p-2 rounded-xl bg-red-50 text-red-700">
                  <ArrowDownRight className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-red-700 mt-3 tracking-tight">
                {formatCurrency(totalCashOut)}
              </p>
              <p className="text-xs text-[#767680] mt-1">{expenses.length} catatan pengeluaran</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#767680]">
                  Arus Kas Bersih (Net)
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
                {netCashFlow >= 0 ? 'Kas operasional surplus positif' : 'Defisit operasional'}
              </p>
            </div>
          </div>

          {/* Breakdown & Expense Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense breakdown by category */}
            <div className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#1b1b23]">Struktur Biaya Operasional</h3>
                <p className="text-xs text-[#767680]">Proporsi pengeluaran berdasarkan pos beban</p>
              </div>

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
                    <span className="text-[10px] text-[#767680] font-medium">{item.percentage}% dari total</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Ledger Table */}
            <div className="lg:col-span-2 rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#f3f2fa]">
                <div>
                  <h3 className="text-sm font-bold text-[#1b1b23]">Buku Catatan Kas Keluar</h3>
                  <p className="text-xs text-[#767680]">Rincian pengeluaran operasional toko</p>
                </div>
                <button
                  onClick={onOpenAddExpenseModal}
                  className="text-xs font-bold text-[#ba1a1a] hover:underline"
                >
                  + Tambah Beban
                </button>
              </div>

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
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#fcf8ff]">
                        <td className="py-3 px-3 text-[#767680]">{exp.date}</td>
                        <td className="py-3 px-3 font-bold text-[#1b1b23]">
                          {exp.description}
                          <span className="block text-[10px] font-mono text-[#767680] font-normal">
                            {exp.refNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#46464f]">{exp.recipient || '-'}</td>
                        <td className="py-3 px-3 font-extrabold text-[#ba1a1a]">
                          -{formatCurrency(exp.amount)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Hapus catatan pengeluaran ini?')) deleteExpense(exp.id);
                            }}
                            className="text-[#767680] hover:text-red-700"
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
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN LABA & RUGI */}
      {reportSubTab === 'profit_loss' && (
        <div className="space-y-6">
          {/* Top KPI Card */}
          <div className="rounded-2xl border border-[#e2e1ec] bg-gradient-to-r from-[#ebeaff] to-[#f4f3ff] p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#4648d4]">
                  Laba Bersih Usaha (Net Profit)
                </span>
                <h2 className="text-3xl font-black text-[#1b1b23] tracking-tight mt-1">
                  {formatCurrency(netProfit)}
                </h2>
                <p className="text-xs text-[#46464f] mt-1">
                  Margin Laba Bersih:{' '}
                  <strong className="font-extrabold text-[#4648d4]">{netMarginPercent}%</strong> dari total
                  omzet kotor
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
            <div className="pb-3 border-b border-[#e2e1ec]">
              <h3 className="text-base font-bold text-[#1b1b23]">Laporan Laba Rugi Komprehensif</h3>
              <p className="text-xs text-[#767680]">
                Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)
              </p>
            </div>

            <div className="divide-y divide-[#f3f2fa] text-xs">
              {/* Section 1: Pendapatan */}
              <div className="py-3">
                <div className="flex justify-between items-center font-bold text-[#1b1b23] text-sm">
                  <span>1. PENDAPATAN OPERASIONAL</span>
                  <span>{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="pl-4 mt-2 space-y-1.5 text-[#46464f]">
                  <div className="flex justify-between">
                    <span>Penjualan Bersih Kasir POS</span>
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
                    <span>Beban Pokok Persediaan Bahan / Modal Kulakan</span>
                    <span>{formatCurrency(totalHPP)}</span>
                  </div>
                </div>
              </div>

              {/* Gross Profit Subtotal */}
              <div className="py-3 bg-[#fcf8ff] px-3 rounded-xl font-bold flex justify-between text-sm text-[#4648d4]">
                <span>LABA KOTOR (GROSS PROFIT)</span>
                <span>{formatCurrency(grossProfit)}</span>
              </div>

              {/* Section 3: Beban Operasional */}
              <div className="py-3">
                <div className="flex justify-between items-center font-bold text-[#ba1a1a] text-sm">
                  <span>3. BEBAN OPERASIONAL TOKO</span>
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
                <span className="text-[#4648d4]">LABA BERSIH TAHUN BERJALAN (NET PROFIT)</span>
                <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN PENJUALAN PRODUK */}
      {reportSubTab === 'product_sales' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e2e1ec] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f3f2fa]">
              <div>
                <h3 className="text-sm font-bold text-[#1b1b23]">Performa Omzet & Unit Terjual</h3>
                <p className="text-xs text-[#767680]">Evaluasi kontribusi masing-masing produk terhadap pendapatan</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e2e1ec] bg-[#fcf8ff] text-[#767680]">
                    <th className="py-3 px-4 font-bold uppercase">Peringkat</th>
                    <th className="py-3 px-4 font-bold uppercase">Produk</th>
                    <th className="py-3 px-4 font-bold uppercase">Kategori</th>
                    <th className="py-3 px-4 font-bold uppercase">Harga Jual</th>
                    <th className="py-3 px-4 font-bold uppercase">Unit Terjual</th>
                    <th className="py-3 px-4 font-bold uppercase">Total Omzet</th>
                    <th className="py-3 px-4 font-bold uppercase text-right">Kontribusi Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f2fa]">
                  {[...products]
                    .sort((a, b) => ((b.soldCount || 0) * b.sellingPrice) - ((a.soldCount || 0) * a.sellingPrice))
                    .map((prod, idx) => {
                      const omzet = (prod.soldCount || 0) * prod.sellingPrice;
                      const contribution = totalRevenue > 0 ? Math.round((omzet / totalRevenue) * 100) : 0;
                      return (
                        <tr key={prod.id} className="hover:bg-[#fcf8ff]">
                          <td className="py-3 px-4 font-bold text-[#767680]">#{idx + 1}</td>
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
                                <span className="block text-[10px] text-[#767680] font-mono">{prod.sku}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded bg-[#ebeaff] px-2 py-0.5 text-[10px] font-semibold text-[#4648d4]">
                              {prod.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#1b1b23]">{formatCurrency(prod.sellingPrice)}</td>
                          <td className="py-3 px-4 font-bold text-[#4648d4]">{prod.soldCount || 0} unit</td>
                          <td className="py-3 px-4 font-extrabold text-[#1b1b23]">{formatCurrency(omzet)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-xs">{contribution}%</span>
                              <div className="w-16 h-1.5 bg-[#f3f2fa] rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${contribution}%` }}
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
          </div>
        </div>
      )}
    </div>
  );
};

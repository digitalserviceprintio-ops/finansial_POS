import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Calendar,
  Layers,
  Settings2,
  Table as TableIcon,
  HelpCircle,
  TrendingUp,
  Wallet,
  ShoppingBag,
  BarChart3,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  AccountingReportType,
  ExportDelimiter,
  generateAccountingCSV,
  downloadCSV,
} from '../../utils/accountingExport';

interface ExportAccountingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReportType?: AccountingReportType;
}

export const ExportAccountingModal: React.FC<ExportAccountingModalProps> = ({
  isOpen,
  onClose,
  defaultReportType = 'sales_journal',
}) => {
  const {
    storeProfile,
    transactions,
    expenses,
    products,
    customers,
    currentUser,
    formatCurrency,
    showToast,
  } = useApp();

  const [reportType, setReportType] = useState<AccountingReportType>(defaultReportType);
  const [delimiter, setDelimiter] = useState<ExportDelimiter>(';');
  const [periodPreset, setPeriodPreset] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<'table' | 'raw'>('table');

  // Compute actual start & end date based on period preset
  const { startDate, endDate, dateFilterName } = useMemo(() => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    if (periodPreset === 'today') {
      return { startDate: todayStr, endDate: todayStr, dateFilterName: `Hari Ini (${todayStr})` };
    }

    if (periodPreset === 'last_7_days') {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 6);
      const pastStr = `${pastDate.getFullYear()}-${pad(pastDate.getMonth() + 1)}-${pad(pastDate.getDate())}`;
      return { startDate: pastStr, endDate: todayStr, dateFilterName: `7 Hari Terakhir (${pastStr} s/d ${todayStr})` };
    }

    if (periodPreset === 'this_month') {
      const monthStart = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
      return { startDate: monthStart, endDate: todayStr, dateFilterName: `Bulan Ini (${today.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})` };
    }

    if (periodPreset === 'last_month') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      const s = `${lastMonth.getFullYear()}-${pad(lastMonth.getMonth() + 1)}-01`;
      const e = `${lastMonthEnd.getFullYear()}-${pad(lastMonthEnd.getMonth() + 1)}-${pad(lastMonthEnd.getDate())}`;
      return { startDate: s, endDate: e, dateFilterName: `Bulan Lalu (${lastMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})` };
    }

    if (periodPreset === 'this_year') {
      const yearStart = `${today.getFullYear()}-01-01`;
      return { startDate: yearStart, endDate: todayStr, dateFilterName: `Tahun ${today.getFullYear()}` };
    }

    if (periodPreset === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        dateFilterName: `${customStartDate} s/d ${customEndDate}`,
      };
    }

    return { startDate: undefined, endDate: undefined, dateFilterName: 'Semua Periode Transaksi' };
  }, [periodPreset, customStartDate, customEndDate]);

  // Generate the CSV data & preview
  const generated = useMemo(() => {
    return generateAccountingCSV({
      reportType,
      delimiter,
      startDate,
      endDate,
      dateFilterName,
      storeProfile,
      transactions,
      expenses,
      products,
      customers,
      cashierName: currentUser?.fullName || 'Administrator Toko',
    });
  }, [
    reportType,
    delimiter,
    startDate,
    endDate,
    dateFilterName,
    storeProfile,
    transactions,
    expenses,
    products,
    customers,
    currentUser,
  ]);

  // Parse lines for table preview
  const parsedPreviewRows = useMemo(() => {
    // Strip BOM for preview
    const cleanContent = generated.csvContent.replace(/^\uFEFF/, '');
    const lines = cleanContent.split('\r\n').filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      // Split by delimiter considering quotes
      const regex = new RegExp(`(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}\\r\\n]+))`, 'g');
      const cells: string[] = [];
      // Simple splitting if no special quotes or tab
      if (delimiter === '\t' || !line.includes('"')) {
        return line.split(delimiter);
      }
      // Accurate CSV regex parse
      let match;
      const rowPattern = delimiter === ';' ? /("([^"]|"")*"|[^;]*)(;|$)/g : /("([^"]|"")*"|[^,]*)(,|$)/g;
      const rowCells: string[] = [];
      let entry: RegExpExecArray | null;
      while ((entry = rowPattern.exec(line)) !== null) {
        let cell = entry[1];
        if (cell === undefined || cell === '') {
          rowCells.push('');
        } else if (cell.startsWith('"') && cell.endsWith('"')) {
          rowCells.push(cell.slice(1, -1).replace(/""/g, '"'));
        } else {
          rowCells.push(cell);
        }
        if (entry.index + entry[0].length >= line.length) break;
      }
      return rowCells.length > 0 ? rowCells : line.split(delimiter);
    });
  }, [generated.csvContent, delimiter]);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadCSV(generated.csvContent, generated.filename);
    showToast(`File ${generated.filename} berhasil diunduh dengan tabel rapi!`, 'success');
    onClose();
  };

  const handleCopyClipboard = async () => {
    try {
      // For clipboard, TSV is the gold standard that pastes flawlessly into Excel & Google Sheets
      const tsvData = generateAccountingCSV({
        reportType,
        delimiter: '\t',
        startDate,
        endDate,
        dateFilterName,
        storeProfile,
        transactions,
        expenses,
        products,
        customers,
        cashierName: currentUser?.fullName || 'Administrator Toko',
      });
      await navigator.clipboard.writeText(tsvData.csvContent.replace(/^\uFEFF/, ''));
      setIsCopied(true);
      showToast('Tabel berhasil disalin ke clipboard! Buka Excel dan tekan Ctrl+V / Paste.', 'success');
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      showToast('Gagal menyalin ke clipboard', 'error');
    }
  };

  const reportOptions: { id: AccountingReportType; title: string; desc: string; icon: any }[] = [
    {
      id: 'sales_journal',
      title: 'Buku Jurnal Penjualan',
      desc: 'Daftar invoice transaksi, kasir, pelanggan, produk dibeli, subtotal, diskon, PPN, omzet & margin profit.',
      icon: ShoppingBag,
    },
    {
      id: 'profit_loss',
      title: 'Laporan Laba & Rugi (P&L)',
      desc: 'Standar akuntansi: Pendapatan bersih, HPP per kategori, Laba Kotor, Rincian Beban Operasional, dan Laba Bersih Usaha.',
      icon: TrendingUp,
    },
    {
      id: 'cashflow_ledger',
      title: 'Buku Kas & Mutasi Arus Kas',
      desc: 'Buku kas besar: mutasi debit (masuk) & kredit (keluar), referensi bukti, pihak terkait, dan saldo kumulatif berjalan.',
      icon: Wallet,
    },
    {
      id: 'product_sales',
      title: 'Rekap Penjualan per Produk',
      desc: 'Performa penjualan tiap SKU: harga beli/HPP, harga jual, total qty terjual, omzet, laba kotor, dan margin.',
      icon: BarChart3,
    },
    {
      id: 'all_in_one',
      title: 'Master Akuntansi Terpadu (All-in-One)',
      desc: 'Ringkasan eksekutif, tabel laba rugi, dan jurnal penjualan yang digabung rapi dalam satu file spreadsheet.',
      icon: FileText,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl rounded-3xl border border-[#e2e1ec] bg-white shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e1ec] bg-[#fcf8ff]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4] shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1b1b23] tracking-tight">
                Ekspor Laporan Keuangan &amp; Akuntansi
              </h2>
              <p className="text-xs text-[#767680]">
                Tabel spreadsheet rapi, kompatibel 100% dengan Microsoft Excel, Google Sheets, dan software akuntansi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Controls & Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Select Report Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#767680] mb-2.5">
              1. Pilih Jenis Laporan Akuntansi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reportOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = reportType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setReportType(opt.id)}
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#4648d4] bg-[#f5f4ff] ring-2 ring-[#4648d4]/20 shadow-xs'
                        : 'border-[#e2e1ec] bg-white hover:border-[#d2d1dc] hover:bg-[#fcf8ff]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div
                        className={`p-2 rounded-xl ${
                          isSelected ? 'bg-[#4648d4] text-white' : 'bg-[#f3f2fa] text-[#46464f]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? 'text-[#4648d4]' : 'text-[#1b1b23]'
                        }`}
                      >
                        {opt.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#767680] leading-relaxed line-clamp-2">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 & 3: Filter & Format Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#fcf8ff] p-4 rounded-2xl border border-[#e2e1ec]">
            {/* Periode Filter */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#767680] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#4648d4]" />
                <span>2. Periode Transaksi</span>
              </label>
              <select
                value={periodPreset}
                onChange={(e) => setPeriodPreset(e.target.value)}
                className="w-full rounded-xl border border-[#d2d1dc] bg-white px-3 py-2 text-xs font-semibold text-[#1b1b23] focus:border-[#4648d4] focus:outline-none"
              >
                <option value="this_month">📅 Bulan Ini (Rekomendasi)</option>
                <option value="last_month">📅 Bulan Lalu</option>
                <option value="today">⚡ Hari Ini Saja</option>
                <option value="last_7_days">📆 7 Hari Terakhir</option>
                <option value="this_year">🗓️ Tahun Berjalan Ini</option>
                <option value="all">🌐 Semua Periode Data</option>
                <option value="custom">🛠️ Kustom Rentang Tanggal</option>
              </select>

              {periodPreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                  <div>
                    <span className="text-[10px] text-[#767680] block font-semibold">Dari Tanggal:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full rounded-lg border border-[#d2d1dc] bg-white p-1.5 text-xs text-[#1b1b23]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#767680] block font-semibold">Sampai Tanggal:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full rounded-lg border border-[#d2d1dc] bg-white p-1.5 text-xs text-[#1b1b23]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Separator / Delimiter Settings */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#767680] flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5 text-[#4648d4]" />
                <span>3. Format Delimiter Spreadsheet</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDelimiter(';')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    delimiter === ';'
                      ? 'bg-[#4648d4] text-white border-[#4648d4] shadow-xs'
                      : 'bg-white text-[#46464f] border-[#d2d1dc] hover:bg-[#f3f2fa]'
                  }`}
                >
                  Excel Indonesia (;)
                  <span className="block text-[9px] font-normal opacity-80 mt-0.5">Rekomendasi Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDelimiter(',')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    delimiter === ','
                      ? 'bg-[#4648d4] text-white border-[#4648d4] shadow-xs'
                      : 'bg-white text-[#46464f] border-[#d2d1dc] hover:bg-[#f3f2fa]'
                  }`}
                >
                  Standard CSV (,)
                  <span className="block text-[9px] font-normal opacity-80 mt-0.5">Google Sheets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDelimiter('\t')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    delimiter === '\t'
                      ? 'bg-[#4648d4] text-white border-[#4648d4] shadow-xs'
                      : 'bg-white text-[#46464f] border-[#d2d1dc] hover:bg-[#f3f2fa]'
                  }`}
                >
                  Tab Separated (\t)
                  <span className="block text-[9px] font-normal opacity-80 mt-0.5">Copy / Paste</span>
                </button>
              </div>
              <p className="text-[10px] text-[#767680] leading-tight">
                💡 <strong>Tips Rapi:</strong> Format Titik Koma (;) dengan UTF-8 BOM otomatis membuka kolom tabel rapi di Microsoft Excel Windows tanpa berantakan ke Kolom A.
              </p>
            </div>
          </div>

          {/* Step 4: Live Table Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#767680] flex items-center gap-1.5">
                <TableIcon className="h-3.5 w-3.5 text-[#4648d4]" />
                <span>Pratinjau Tabel Laporan (Tampilan Rapi)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab('table')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    previewTab === 'table' ? 'bg-[#ebeaff] text-[#4648d4]' : 'text-[#767680] hover:text-[#1b1b23]'
                  }`}
                >
                  Tampilan Grid Tabel
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('raw')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    previewTab === 'raw' ? 'bg-[#ebeaff] text-[#4648d4]' : 'text-[#767680] hover:text-[#1b1b23]'
                  }`}
                >
                  Teks Mentah CSV
                </button>
              </div>
            </div>

            {previewTab === 'table' ? (
              <div className="border border-[#e2e1ec] rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="max-h-64 overflow-x-auto overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <tbody>
                      {parsedPreviewRows.slice(0, 15).map((row, rIdx) => {
                        const isHeader = rIdx === 7 || row[0]?.toString().includes('---') || row[0]?.toString().startsWith('===');
                        const isTotal = row[0]?.toString().includes('TOTAL') || row[0]?.toString().includes('LABA BERSIH');

                        return (
                          <tr
                            key={rIdx}
                            className={`border-b border-[#f3f2fa] ${
                              isHeader
                                ? 'bg-[#fcf8ff] font-bold text-[#1b1b23] uppercase text-[10px]'
                                : isTotal
                                ? 'bg-amber-50/50 font-black text-[#1b1b23]'
                                : 'hover:bg-[#fcf8ff]/60 text-[#46464f]'
                            }`}
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`px-3 py-2 whitespace-nowrap border-r border-[#f3f2fa] last:border-r-0 ${
                                  !isNaN(Number(cell)) && cell !== '' && cell.length < 15
                                    ? 'text-right font-mono text-[11px]'
                                    : ''
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {parsedPreviewRows.length > 15 && (
                  <div className="bg-[#fcf8ff] px-4 py-2 border-t border-[#e2e1ec] text-[11px] text-[#767680] text-center font-medium">
                    Menampilkan 15 baris pertama dari total {parsedPreviewRows.length} baris data. Semua baris akan disertakan saat diunduh.
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-[#e2e1ec] rounded-2xl bg-zinc-950 p-3.5 max-h-60 overflow-auto font-mono text-[11px] text-zinc-300">
                <pre>{generated.csvContent.replace(/^\uFEFF/, '').slice(0, 2000)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#e2e1ec] bg-[#fcf8ff]">
          <div className="text-xs text-[#767680] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#4648d4]" />
            <span>
              File: <strong className="text-[#1b1b23]">{generated.filename}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-[#d2d1dc] bg-white px-4 py-2.5 text-xs font-bold text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23] transition-all cursor-pointer shadow-xs"
            >
              {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{isCopied ? 'Tersalin!' : 'Salin Tabel (Excel Paste)'}</span>
            </button>

            {/* Download CSV button */}
            <button
              id="btn-confirm-download-csv"
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-[#4648d4] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#3435ad] active:scale-95 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Unduh File CSV Rapi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

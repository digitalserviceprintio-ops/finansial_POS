import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Calendar,
  Clock,
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  Layers,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Eye,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BackupData } from '../types';

export const BackupView: React.FC = () => {
  const {
    products,
    categories,
    transactions,
    expenses,
    customers,
    storeProfile,
    exportBackupJson,
    restoreBackupJson,
    formatCurrency,
    showToast,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<BackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Financial calculations
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Handle Export Full Backup
  const handleDownloadFullBackup = () => {
    const backupObj = exportBackupJson();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const now = new Date();
    const timestampStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `DelPOS_Backup_${storeProfile.name.replace(/\s+/g, '_')}_${timestampStr}.json`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`✅ File cadangan "${filename}" berhasil diunduh!`, 'success');
  };

  // Handle Export Transactions Only
  const handleDownloadTransactionsOnly = () => {
    const backupObj = {
      app: 'DelPOS',
      type: 'transactions_only',
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      store: storeProfile,
      summary: {
        totalTransactions: transactions.length,
        totalRevenue: totalRevenue,
        totalExpenses: expenses.length,
        totalExpenseAmount: totalExpenseAmount,
      },
      data: {
        transactions,
        expenses,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const now = new Date();
    const filename = `DelPOS_Transaksi_${now.toISOString().slice(0, 10)}.json`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('✅ Cadangan data transaksi berhasil diunduh!', 'success');
  };

  // Handle Export Products Only
  const handleDownloadProductsOnly = () => {
    const backupObj = {
      app: 'DelPOS',
      type: 'products_only',
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      store: storeProfile,
      summary: {
        totalProducts: products.length,
        totalCategories: categories.length,
      },
      data: {
        products,
        categories,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const now = new Date();
    const filename = `DelPOS_MasterProduk_${now.toISOString().slice(0, 10)}.json`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('✅ Cadangan master produk & katalog berhasil diunduh!', 'success');
  };

  // Handle Copy JSON string
  const handleCopyJson = () => {
    const backupObj = exportBackupJson();
    navigator.clipboard.writeText(JSON.stringify(backupObj, null, 2));
    setCopied(true);
    showToast('JSON cadangan disalin ke clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setParsedBackup(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Basic validation
        if (!parsed || typeof parsed !== 'object' || (!parsed.data && !parsed.products && !parsed.transactions)) {
          setParseError('Format file tidak valid. Pastikan file adalah format JSON cadangan DelPOS.');
          return;
        }

        // Normalize if old format or partial format
        const normalizedData: BackupData = {
          app: parsed.app || 'DelPOS',
          version: parsed.version || '1.2.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          exportedTimestamp: parsed.exportedTimestamp || Date.now(),
          store: parsed.store || storeProfile,
          summary: parsed.summary || {
            totalProducts: parsed.data?.products?.length || parsed.products?.length || 0,
            totalCategories: parsed.data?.categories?.length || parsed.categories?.length || 0,
            totalTransactions: parsed.data?.transactions?.length || parsed.transactions?.length || 0,
            totalExpenses: parsed.data?.expenses?.length || parsed.expenses?.length || 0,
            totalCustomers: parsed.data?.customers?.length || parsed.customers?.length || 0,
            totalRevenue: parsed.data?.transactions?.reduce((sum: number, t: any) => sum + (t.total || 0), 0) || 0,
            totalExpenseAmount: parsed.data?.expenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0,
          },
          data: {
            products: parsed.data?.products || parsed.products || [],
            categories: parsed.data?.categories || parsed.categories || [],
            transactions: parsed.data?.transactions || parsed.transactions || [],
            expenses: parsed.data?.expenses || parsed.expenses || [],
            customers: parsed.data?.customers || parsed.customers || [],
          },
        };

        setParsedBackup(normalizedData);
        setIsConfirmModalOpen(true);
      } catch (err: any) {
        setParseError('Gagal membaca file JSON: ' + (err.message || 'File rusak atau bukan JSON valid.'));
      }
    };
    reader.readAsText(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Execute Restore
  const handleExecuteRestore = () => {
    if (!parsedBackup) return;

    const result = restoreBackupJson(parsedBackup, restoreMode);
    if (result.success) {
      setIsConfirmModalOpen(false);
      setSelectedFile(null);
      setParsedBackup(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div id="backup-view" className="space-y-6 max-w-5xl mx-auto pb-20 lg:pb-0 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ebeaff] text-[#4648d4] shadow-2xs">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1b1b23] tracking-tight">
              Cadangan & Pemulihan Data (Backup JSON)
            </h1>
            <p className="text-xs text-[#767680] mt-0.5">
              Simpan salinan cadangan transaksi, produk, dan laporan keuangan ke file JSON offline secara aman
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadFullBackup}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4648d4] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3435ad] shadow-xs transition-all active:scale-98"
          >
            <Download className="h-4 w-4" />
            <span>Unduh Cadangan Lengkap</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics of Stored Data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#767680]">Total Transaksi</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-[#1b1b23]">{transactions.length} Data</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#767680]">Katalog & Menu</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-[#1b1b23]">{products.length} Produk</p>
          <p className="text-[11px] text-[#767680] mt-0.5">{categories.length} Kategori aktif</p>
        </div>

        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#767680]">Pengeluaran / Beban</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Receipt className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-[#1b1b23]">{expenses.length} Catatan</p>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">{formatCurrency(totalExpenseAmount)}</p>
        </div>

        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#767680]">Status Penyimpanan</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ebeaff] text-[#4648d4]">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-sm font-extrabold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tersinkron Lokal</span>
          </p>
          <p className="text-[11px] text-[#767680] mt-0.5">Format JSON Terstandar</p>
        </div>
      </div>

      {/* Main Grid: Backup Export & Restore Import */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* CARD 1: EKSPOR & UNDUH CADANGAN */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-[#e2e1ec] p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#f3f2fa]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1b1b23]">Ekspor File Cadangan JSON</h3>
                <p className="text-[11px] text-[#767680]">Simpan data keuangan ke memori laptop/HP Anda</p>
              </div>
            </div>

            <p className="text-xs text-[#46464f] leading-relaxed">
              Unduh salinan cadangan lengkap yang mencakup seluruh riwayat transaksi penjualan, arus kas pengeluaran, daftar produk, kategori, data pelanggan, dan profil toko.
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Full Backup */}
              <button
                id="btn-backup-full"
                onClick={handleDownloadFullBackup}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#d8d6fc] bg-[#ebeaff]/40 hover:bg-[#ebeaff] transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4648d4] text-white">
                    <FileJson className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1b1b23] group-hover:text-[#4648d4]">
                      Cadangan Lengkap Keseluruhan (.JSON)
                    </h4>
                    <p className="text-[10px] text-[#767680]">
                      {transactions.length} Trx • {products.length} Produk • {expenses.length} Pengeluaran
                    </p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-[#4648d4]" />
              </button>

              {/* Option 2: Transactions Only */}
              <button
                id="btn-backup-transactions"
                onClick={handleDownloadTransactionsOnly}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#e2e1ec] bg-[#fcf8ff] hover:bg-[#f3f2fa] transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1b1b23]">
                      Cadangan Transaksi & Keuangan Saja
                    </h4>
                    <p className="text-[10px] text-[#767680]">Khusus pembukuan kas & laporan penjualan</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-[#767680] group-hover:text-[#1b1b23]" />
              </button>

              {/* Option 3: Products Only */}
              <button
                id="btn-backup-products"
                onClick={handleDownloadProductsOnly}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#e2e1ec] bg-[#fcf8ff] hover:bg-[#f3f2fa] transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1b1b23]">
                      Cadangan Master Produk & Kategori Saja
                    </h4>
                    <p className="text-[10px] text-[#767680]">Khusus data SKU, harga, dan level stok</p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-[#767680] group-hover:text-[#1b1b23]" />
              </button>
            </div>
          </div>

          {/* Copy JSON payload */}
          <div className="pt-3 border-t border-[#f3f2fa] flex items-center justify-between">
            <span className="text-[11px] text-[#767680]">Perlu teks raw JSON?</span>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 text-xs font-bold text-[#4648d4] hover:underline"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin JSON ke Clipboard'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: IMPOR & PULIHKAN DARI FILE JSON */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-[#e2e1ec] p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#f3f2fa]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1b1b23]">Pulihkan Data (Restore JSON)</h3>
                <p className="text-[11px] text-[#767680]">Unggah file cadangan yang telah disimpan sebelumnya</p>
              </div>
            </div>

            <p className="text-xs text-[#46464f] leading-relaxed">
              Pulihkan data kasir dan pembukuan Anda dari file JSON cadangan. Anda dapat memilih untuk menimpa semua data atau menggabungkannya dengan data yang ada saat ini.
            </p>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#d2d1dc] hover:border-[#4648d4] hover:bg-[#fcf8ff] rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4] group-hover:scale-105 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1b1b23]">
                  Klik untuk pilih file <span className="text-[#4648d4]">.JSON</span> atau drag & drop ke sini
                </p>
                <p className="text-[10px] text-[#767680] mt-0.5">
                  Mendukung file cadangan resmi DelPOS & AkuPos
                </p>
              </div>
            </div>

            {/* Error Message if parsing failed */}
            {parseError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#f3f2fa] flex items-center justify-between text-[11px] text-[#767680]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Pemeriksaan integritas skema data otomatis</span>
            </span>
          </div>
        </div>
      </div>

      {/* Safety & Guidelines Info Banner */}
      <div className="bg-[#fcf8ff] p-5 rounded-3xl border border-[#d8d6fc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ebeaff] text-[#4648d4] shrink-0">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1b1b23]">Tips Manajemen Salinan Cadangan</h4>
            <p className="text-[11px] text-[#767680]">
              Disarankan melakukan cadangan data secara berkala (misal setiap akhir minggu atau tutup buku bulanan) dan menyimpan file cadangan di Google Drive atau flashdisk pribadi.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RESTORE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {isConfirmModalOpen && parsedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#e2e1ec] space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4] shrink-0">
                <FileJson className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1b1b23]">
                  Konfirmasi Pemulihan Data Cadangan
                </h3>
                <p className="text-xs text-[#767680]">
                  Rincian data yang terbaca dari file cadangan yang dipilih:
                </p>
              </div>
            </div>

            {/* Backup Content Preview Box */}
            <div className="rounded-2xl border border-[#e2e1ec] bg-[#fcf8ff] p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#e2e1ec] pb-2">
                <span className="text-[#767680]">Nama Toko Cadangan:</span>
                <strong className="text-[#1b1b23]">{parsedBackup.store?.name || storeProfile.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#767680]">Waktu Dibuat:</span>
                <span className="font-mono text-[#1b1b23]">
                  {new Date(parsedBackup.exportedAt || Date.now()).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e2e1ec]">
                <div className="bg-white p-2.5 rounded-xl border border-[#e2e1ec]">
                  <span className="text-[10px] text-[#767680] block">Transaksi</span>
                  <strong className="text-sm text-[#1b1b23]">
                    {parsedBackup.data?.transactions?.length || 0} Trx
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#e2e1ec]">
                  <span className="text-[10px] text-[#767680] block">Produk / Menu</span>
                  <strong className="text-sm text-[#1b1b23]">
                    {parsedBackup.data?.products?.length || 0} Item
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#e2e1ec]">
                  <span className="text-[10px] text-[#767680] block">Kategori</span>
                  <strong className="text-sm text-[#1b1b23]">
                    {parsedBackup.data?.categories?.length || 0} Kategori
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#e2e1ec]">
                  <span className="text-[10px] text-[#767680] block">Pengeluaran</span>
                  <strong className="text-sm text-[#1b1b23]">
                    {parsedBackup.data?.expenses?.length || 0} Catatan
                  </strong>
                </div>
              </div>
            </div>

            {/* Restore Mode Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1b1b23]">Pilih Metode Pemulihan:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => setRestoreMode('replace')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    restoreMode === 'replace'
                      ? 'border-[#4648d4] bg-[#ebeaff] shadow-2xs'
                      : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
                  }`}
                >
                  <strong className="text-xs font-bold text-[#1b1b23] block">Timpa Data Lama</strong>
                  <span className="text-[10px] text-[#767680] mt-0.5 block">
                    Gantikan seluruh data saat ini dengan data cadangan ini secara bersih.
                  </span>
                </div>

                <div
                  onClick={() => setRestoreMode('merge')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    restoreMode === 'merge'
                      ? 'border-[#4648d4] bg-[#ebeaff] shadow-2xs'
                      : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
                  }`}
                >
                  <strong className="text-xs font-bold text-[#1b1b23] block">Gabungkan Data (Merge)</strong>
                  <span className="text-[10px] text-[#767680] mt-0.5 block">
                    Tambahkan item baru tanpa menghapus data yang ada sekarang.
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-[#767680] hover:text-[#1b1b23] transition-colors"
              >
                Batal
              </button>
              <button
                id="btn-confirm-restore"
                type="button"
                onClick={handleExecuteRestore}
                className="flex items-center gap-2 rounded-xl bg-[#4648d4] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#3435ad] transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mulai Pulihkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

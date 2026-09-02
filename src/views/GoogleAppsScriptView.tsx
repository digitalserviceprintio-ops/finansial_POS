import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
  Database,
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Layers,
  Receipt,
  Package,
  Wallet,
  Clock,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_GOOGLE_APPS_SCRIPT_CODE } from '../utils/googleAppsScript';
import { DelPOSLogo } from '../components/brand/DelPOSLogo';

export const GoogleAppsScriptView: React.FC = () => {
  const {
    googleSheetsConfig,
    updateGoogleSheetsConfig,
    googleSheetsSyncLogs,
    syncAllToGoogleSheets,
    testGoogleSheetsConnection,
    clearGoogleSheetsLogs,
    storeProfile,
    products,
    transactions,
    expenses,
    customerOrders,
    showToast,
  } = useApp();

  const [inputUrl, setInputUrl] = useState(googleSheetsConfig.webAppUrl || '');
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'guide' | 'code' | 'logs'>('config');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSaveConfig = () => {
    updateGoogleSheetsConfig({
      webAppUrl: inputUrl.trim(),
      enabled: inputUrl.trim().length > 0,
    });
  };

  const handleTestConnection = async () => {
    if (!inputUrl.trim()) {
      showToast('Masukkan Web App URL terlebih dahulu', 'warning');
      return;
    }
    setIsTesting(true);
    // update config first
    updateGoogleSheetsConfig({ webAppUrl: inputUrl.trim(), enabled: true });
    const res = await testGoogleSheetsConnection();
    setIsTesting(false);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    await syncAllToGoogleSheets();
    setIsSyncing(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(DEFAULT_GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    showToast('Kode Code.gs berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const isConnected = !!googleSheetsConfig.webAppUrl && googleSheetsConfig.lastSyncStatus === 'success';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-300 border border-emerald-400/30">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Integrasi Google Spreadsheet & Apps Script
                  </h1>
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-extrabold text-emerald-300 border border-emerald-400/30">
                    Live Auto-Sync
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                  Sinkronisasi otomatis transaksi, master produk, beban kas, dan antrian pesanan langsung ke Google Sheets.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
            }`}>
              <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isConnected ? 'Sinkronisasi Aktif' : 'Belum Terhubung'}</span>
            </div>
          </div>
        </div>

        {/* Tab Sub-navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-emerald-700/50 pt-4">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeSubTab === 'config'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Konfigurasi & Sinkron</span>
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeSubTab === 'guide'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Panduan Setup (1 Menit)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('code')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeSubTab === 'code'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Kode Script (Code.gs)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeSubTab === 'logs'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Log Sinkronisasi ({googleSheetsSyncLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeSubTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: URL & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-600" />
                <span>Pengaturan Webhook Google Apps Script</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan URL Web App hasil deploy Google Apps Script untuk menghubungkan DelPOS dengan Google Spreadsheet Anda.
              </p>

              <div className="mt-4 space-y-3">
                <label className="text-xs font-bold text-slate-700">
                  Google Apps Script Web App URL (berakhiran /exec)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveConfig}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shrink-0"
                    >
                      Simpan URL
                    </button>
                    <button
                      disabled={isTesting || !inputUrl.trim()}
                      onClick={handleTestConnection}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shrink-0"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Menguji...' : 'Tes Koneksi'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {googleSheetsConfig.lastSyncTimestamp && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    {googleSheetsConfig.lastSyncStatus === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <span className="text-slate-700 font-medium">
                      Status Terakhir: <b>{googleSheetsConfig.lastSyncMessage || 'OK'}</b>
                    </span>
                  </div>
                  <span className="text-slate-500 font-semibold text-[11px]">
                    {new Date(googleSheetsConfig.lastSyncTimestamp).toLocaleTimeString('id-ID')} WIB
                  </span>
                </div>
              )}
            </div>

            {/* Auto-Sync Rules Switcher */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span>Pemicu Otomatis (Live Auto-Sync Events)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pilih aksi mana saja di DelPOS yang langsung dikirimkan ke tabel Google Spreadsheet tanpa perlu ekspor manual.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Switch 1: Transaksi */}
                <div
                  onClick={() =>
                    updateGoogleSheetsConfig({
                      autoSyncTransactions: !googleSheetsConfig.autoSyncTransactions,
                    })
                  }
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    googleSheetsConfig.autoSyncTransactions
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Transaksi Kasir (POS)</p>
                      <p className="text-[10px] text-slate-500">Tercatat ke sheet Transaksi_Penjualan</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {googleSheetsConfig.autoSyncTransactions ? 'Aktif' : 'Mati'}
                  </span>
                </div>

                {/* Switch 2: Master Produk */}
                <div
                  onClick={() =>
                    updateGoogleSheetsConfig({
                      autoSyncProducts: !googleSheetsConfig.autoSyncProducts,
                    })
                  }
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    googleSheetsConfig.autoSyncProducts
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Master & Stok Produk</p>
                      <p className="text-[10px] text-slate-500">Tercatat ke sheet Master_Produk</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {googleSheetsConfig.autoSyncProducts ? 'Aktif' : 'Mati'}
                  </span>
                </div>

                {/* Switch 3: Beban Kas */}
                <div
                  onClick={() =>
                    updateGoogleSheetsConfig({
                      autoSyncExpenses: !googleSheetsConfig.autoSyncExpenses,
                    })
                  }
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    googleSheetsConfig.autoSyncExpenses
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Biaya & Kas Keluar</p>
                      <p className="text-[10px] text-slate-500">Tercatat ke sheet Biaya_Operasional</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {googleSheetsConfig.autoSyncExpenses ? 'Aktif' : 'Mati'}
                  </span>
                </div>

                {/* Switch 4: Antrian Order */}
                <div
                  onClick={() =>
                    updateGoogleSheetsConfig({
                      autoSyncOrders: !googleSheetsConfig.autoSyncOrders,
                    })
                  }
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    googleSheetsConfig.autoSyncOrders
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Antrian QR Mandiri</p>
                      <p className="text-[10px] text-slate-500">Tercatat ke sheet Antrian_Pesanan</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {googleSheetsConfig.autoSyncOrders ? 'Aktif' : 'Mati'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Full Sync Action & Sheet Structure */}
          <div className="space-y-6">
            {/* Mass Sync Box */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Sinkronisasi Massal (Sekali Klik)</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Kirim seluruh data toko yang ada saat ini ({products.length} produk, {transactions.length} transaksi, & {expenses.length} catatan biaya) ke Google Spreadsheet sekarang.
              </p>

              <button
                disabled={isSyncing || !inputUrl.trim()}
                onClick={handleSyncAll}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Mengunggah ke Sheets...' : 'Sinkronkan Seluruh Data Sekarang'}</span>
              </button>
            </div>

            {/* Sheets Layout Preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Struktur Sheet Otomatis yang Terbentuk
              </h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-blue-700">1. Transaksi_Penjualan</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{transactions.length} baris</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-emerald-700">2. Master_Produk</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{products.length} item</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-amber-700">3. Biaya_Operasional</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{expenses.length} baris</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-purple-700">4. Antrian_Pesanan</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{customerOrders.length} order</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800">5. Ringkasan_Bisnis</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Auto Formula</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guide Tab */}
      {activeSubTab === 'guide' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">
              Panduan Menghubungkan DelPOS ke Google Spreadsheet (1 Menit)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ikuti 4 langkah mudah di bawah ini untuk membuat Webhook Google Apps Script gratis dan otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-black text-white text-sm">
                1
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Buka Spreadsheet & Apps Script</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka Google Spreadsheet baru di browser Anda. Klik menu <b>Ekstensi</b> (Extensions) &gt; <b>Apps Script</b>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-black text-white text-sm">
                2
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Paste Kode Script Code.gs</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka tab <b>Kode Script (Code.gs)</b> di halaman ini, klik tombol <b>Salin Kode</b>, lalu paste seluruh kodenya ke editor Apps Script Google.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-black text-white text-sm">
                3
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Deploy sebagai Web App</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Klik tombol <b>Deploy</b> (Terapkan) biru di kanan atas &gt; <b>Deployment Baru</b>. Pilih jenis <b>Aplikasi Web</b>.
                  Pastikan <i>Siapa yang memiliki akses (Who has access)</i> disetel ke <b>Siapa saja (Anyone)</b>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-black text-white text-sm">
                4
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Salin Web App URL ke DelPOS</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Salin URL Aplikasi Web yang berakhiran <code>/exec</code>, tempelkan ke kolom URL di tab Konfigurasi, lalu klik <b>Tes Koneksi</b>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setActiveSubTab('code')}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs"
            >
              <span>Lanjut ke Kode Script Code.gs</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Code Editor Tab */}
      {activeSubTab === 'code' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <span>Script Code.gs untuk Google Apps Script</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Salin seluruh kode di bawah ini dan tempelkan ke Google Apps Script Spreadsheet Anda.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs shrink-0"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode Script'}</span>
            </button>
          </div>

          <div className="relative rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[500px]">
            <pre className="whitespace-pre">{DEFAULT_GOOGLE_APPS_SCRIPT_CODE}</pre>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeSubTab === 'logs' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Riwayat Audit Sinkronisasi</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Log rekaman setiap data yang terkirim dari DelPOS ke Google Spreadsheet.
              </p>
            </div>

            {googleSheetsSyncLogs.length > 0 && (
              <button
                onClick={clearGoogleSheetsLogs}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Bersihkan Log</span>
              </button>
            )}
          </div>

          {googleSheetsSyncLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">Belum ada aktivitas sinkronisasi yang tercatat.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {googleSheetsSyncLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="font-bold text-slate-900">{log.summary}</span>
                    </div>
                    {log.details && <p className="text-slate-500 text-[11px]">{log.details}</p>}
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID')} WIB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

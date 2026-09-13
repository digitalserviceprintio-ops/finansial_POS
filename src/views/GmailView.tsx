import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  FileText,
  Trash2,
  Inbox,
  LogOut,
  ExternalLink,
  Receipt,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  connectGmail,
  disconnectGmail,
  subscribeToGmailAuth,
  getGmailProfile,
  listGmailMessages,
  sendGmailMessage,
  createGmailDraft,
  trashGmailMessage,
  buildReceiptHtml,
  GmailUserProfile,
  GmailProfileStats,
  GmailMessageSummary,
} from '../utils/gmailService';
import { Transaction } from '../types';

export const GmailView: React.FC = () => {
  const { transactions, storeProfile, formatCurrency, showToast } = useApp();

  // Auth State
  const [currentUser, setCurrentUser] = useState<GmailUserProfile | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [profileStats, setProfileStats] = useState<GmailProfileStats | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);

  // Message List State
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT' | 'ALL'>('INBOX');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);

  // Compose Email State
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [composeType, setComposeType] = useState<'custom' | 'receipt' | 'report'>('custom');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Mandatory Confirmation Dialog for sending email (Workspace skill requirement)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'send' | 'trash' | 'disconnect';
    targetId?: string;
    payload?: any;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'send',
  });

  // Subscribe to Gmail auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToGmailAuth((user, connected) => {
      setCurrentUser(user);
      setIsConnected(connected);
      if (connected && user) {
        loadProfile();
        loadMessages();
      } else {
        setProfileStats(null);
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const stats = await getGmailProfile();
      setProfileStats(stats);
    } catch (err: unknown) {
      console.warn('Could not load profile stats:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadMessages = async (folder = activeFolder, query = searchQuery) => {
    setIsLoadingMessages(true);
    try {
      let q = query;
      let labelIds: string[] | undefined = undefined;
      if (folder === 'INBOX') {
        labelIds = ['INBOX'];
      } else if (folder === 'SENT') {
        labelIds = ['SENT'];
      }

      const res = await listGmailMessages({
        query: q || undefined,
        labelIds,
        maxResults: 12,
      });
      setMessages(res.messages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat pesan';
      showToast(msg, 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await connectGmail();
      if (res.success && res.user) {
        showToast(`Berhasil terhubung ke akun Gmail: ${res.user.email}`, 'success');
      } else if (!res.cancelled) {
        showToast(res.error || 'Gagal menghubungkan ke Gmail.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan otentikasi Google.';
      showToast(msg, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenDisconnectConfirm = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Putuskan Hubungan Akun Gmail?',
      description: `Sesi token akses akun ${currentUser?.email || ''} akan dihapus dari memori aplikasi DelPOS. Anda dapat menghubungkannya kembali kapan saja.`,
      actionType: 'disconnect',
    });
  };

  const handleExecuteDisconnect = async () => {
    await disconnectGmail();
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    showToast('Koneksi akun Gmail telah diputuskan.', 'info');
  };

  // Transaction selection helper for receipt compose
  const handleSelectTransactionForReceipt = (txId: string) => {
    setSelectedTransactionId(txId);
    const tx = transactions.find((t) => t.id === txId);
    if (tx) {
      setComposeSubject(`[Struk Resmi] Pembelian di ${storeProfile.name || 'DelPOS'} - ${tx.orderNumber || tx.id}`);
      if (tx.customer?.email) {
        setComposeTo(tx.customer.email);
      }
      const html = buildReceiptHtml(tx, storeProfile, formatCurrency);
      setComposeBody(html);
    }
  };

  // Report generation helper
  const handleSelectDailyReport = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTxs = transactions.filter((t) => (t.date && t.date.startsWith(todayStr)) || new Date(t.timestamp).toISOString().startsWith(todayStr));
    const totalSales = todayTxs.reduce((sum, t) => sum + (t.total || 0), 0);
    const cashSales = todayTxs.filter((t) => t.paymentMethod === 'Tunai').reduce((sum, t) => sum + (t.total || 0), 0);
    const transferSales = todayTxs.filter((t) => t.paymentMethod === 'Transfer Bank').reduce((sum, t) => sum + (t.total || 0), 0);
    const debitSales = todayTxs.filter((t) => t.paymentMethod === 'Kartu Debit').reduce((sum, t) => sum + (t.total || 0), 0);

    setComposeSubject(`[Laporan Penjualan Harian] ${storeProfile.name || 'DelPOS'} - ${new Date().toLocaleDateString('id-ID')}`);
    setComposeTo(currentUser?.email || '');

    const reportHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Laporan Penjualan Harian</h2>
        <p style="color: #64748b; font-size: 14px;">Toko: <strong>${storeProfile.name}</strong><br/>Tanggal: <strong>${new Date().toLocaleDateString('id-ID')}</strong></p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
        <table style="width: 100%; font-size: 14px; margin: 16px 0;">
          <tr><td>Total Transaksi</td><td style="text-align: right; font-weight: bold;">${todayTxs.length} Nota</td></tr>
          <tr><td>Total Omzet</td><td style="text-align: right; font-weight: bold; color: #16a34a;">${formatCurrency(totalSales)}</td></tr>
          <tr><td>Penjualan Tunai</td><td style="text-align: right;">${formatCurrency(cashSales)}</td></tr>
          <tr><td>Penjualan Transfer</td><td style="text-align: right;">${formatCurrency(transferSales)}</td></tr>
          <tr><td>Penjualan Kartu Debit</td><td style="text-align: right;">${formatCurrency(debitSales)}</td></tr>
        </table>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Dibuat otomatis oleh DelPOS Kasir Pintar via Gmail API</p>
      </div>
    `;
    setComposeBody(reportHtml);
  };

  // Open confirmation modal before sending (MANDATORY per Workspace skill)
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      showToast('Alamat email penerima wajib diisi.', 'warning');
      return;
    }
    if (!composeSubject.trim()) {
      showToast('Subjek email wajib diisi.', 'warning');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Pengiriman Email Gmail',
      description: `Apakah Anda yakin ingin mengirim email ini ke "${composeTo}" dengan subjek "${composeSubject}" menggunakan akun Gmail resmi Anda (${currentUser?.email})?`,
      actionType: 'send',
    });
  };

  // Execute actual send after user explicitly confirms in dialog
  const handleExecuteSend = async () => {
    setIsSending(true);
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    let finalBody = composeBody;
    if (composeType === 'custom') {
      finalBody = `<div style="font-family: sans-serif; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${composeBody}</div>`;
    }

    try {
      const res = await sendGmailMessage({
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        htmlBody: finalBody,
        fromName: storeProfile.name || 'DelPOS Store',
      });

      if (res.success) {
        showToast(`Email berhasil dikirim ke ${composeTo}!`, 'success');
        setIsComposeOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        // Refresh sent folder
        loadMessages('SENT');
        setActiveFolder('SENT');
      } else {
        showToast(res.error || 'Gagal mengirim email via Gmail.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim email.';
      showToast(msg, 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!composeTo.trim() && !composeSubject.trim()) {
      showToast('Isi penerima atau subjek terlebih dahulu untuk menyimpan draf.', 'warning');
      return;
    }
    try {
      const res = await createGmailDraft({
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        htmlBody: composeBody || '<p>(Draf Kosong)</p>',
        fromName: storeProfile.name,
      });
      if (res.success) {
        showToast('Draf email berhasil disimpan di Gmail Anda.', 'success');
        setIsComposeOpen(false);
      } else {
        showToast(res.error || 'Gagal menyimpan draf.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan draf.';
      showToast(msg, 'error');
    }
  };

  // Open confirmation modal before trashing email (MANDATORY per Workspace skill)
  const handleInitiateTrash = (msgId: string, subject?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Pindahkan Pesan ke Sampah?',
      description: `Apakah Anda yakin ingin memindahkan email "${subject || 'Tanpa Subjek'}" ke folder Sampah (Trash) di akun Gmail Anda? Tindakan ini dapat dibatalkan melalui Gmail.`,
      actionType: 'trash',
      targetId: msgId,
    });
  };

  const handleExecuteTrash = async (msgId: string) => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    try {
      const ok = await trashGmailMessage(msgId);
      if (ok) {
        showToast('Pesan berhasil dipindahkan ke Sampah Gmail.', 'info');
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        if (selectedMessage?.id === msgId) {
          setSelectedMessage(null);
        }
      } else {
        showToast('Gagal memindahkan pesan ke Sampah.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses penghapusan pesan.';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-[#1b1b23]">Integrasi Google Gmail</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                Official Google Workspace
              </span>
            </div>
            <p className="text-xs text-[#767680] mt-0.5">
              Kirim struk digital nota penjualan, laporan keuangan harian, dan pantau pesan langsung dari akun Gmail Anda.
            </p>
          </div>
        </div>

        {/* Auth Action */}
        <div className="flex items-center gap-2">
          {isConnected && currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setComposeType('custom');
                  setComposeSubject('');
                  setComposeTo('');
                  setComposeBody('');
                  setIsComposeOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0055EE] text-white text-xs font-bold hover:bg-[#003B99] transition-colors shadow-2xs cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Kirim Email</span>
              </button>

              <button
                onClick={handleOpenDisconnectConfirm}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                title="Putuskan Akun"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Putuskan</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Official Google Sign-In Button format as required by workspace-integration skill */}
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-[#dadce0] rounded-xl hover:bg-[#f8f9fa] transition-all shadow-xs text-xs font-bold text-[#3c4043] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isConnecting ? 'Menghubungkan...' : 'Masuk dengan Google (Gmail)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Info Bar (When Connected) */}
      {isConnected && currentUser && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Google User'}
                className="h-11 w-11 rounded-full border-2 border-emerald-300 shadow-xs object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                {(currentUser.displayName || currentUser.email || 'G').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950">
                  {currentUser.displayName || 'Akun Google'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Terhubung & Siap Kirim
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-mono mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {profileStats && (
              <div className="flex items-center gap-4 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-[#767680] text-[10px] block">Total Pesan</span>
                  <span className="font-bold text-[#1b1b23]">{profileStats.messagesTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="w-[1px] h-6 bg-emerald-200" />
                <div>
                  <span className="text-[#767680] text-[10px] block">Thread Aktif</span>
                  <span className="font-bold text-[#1b1b23]">{profileStats.threadsTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                loadProfile();
                loadMessages();
              }}
              disabled={isLoadingMessages}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white/80 px-2.5 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Perbarui</span>
            </button>
          </div>
        </div>
      )}

      {/* When Not Connected: Informative Showcase */}
      {!isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-[#1b1b23]">Struk Digital via Gmail</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Kirim struk nota penjualan dalam format HTML profesional langsung dari alamat Gmail toko Anda ke email pelanggan.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-[#1b1b23]">Laporan Harian Otomatis</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Kirimkan rekapitulasi penjualan harian kasir, total omzet, dan metode pembayaran tunai/QRIS ke email pemilik usaha.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-[#1b1b23]">Keamanan Resmi Google</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Token otorisasi aman disimpan hanya pada memori sesi aktif dan setiap aksi pengiriman selalu diverifikasi konfirmasi pengguna.
            </p>
          </div>
        </div>
      )}

      {/* Quick Action Cards (Kirim Struk Cepat / Laporan Cepat) */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Kirim Struk Transaksi */}
          <div className="bg-white p-4.5 rounded-2xl border border-[#e2e1ec] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black text-[#1b1b23]">Kirim Struk Penjualan Terakhir</h3>
                </div>
                <span className="text-[10px] text-[#767680]">Dari Transaksi Kasir</span>
              </div>
              <p className="text-xs text-[#767680] mb-3">
                Pilih transaksi dari riwayat kasir untuk langsung diformat menjadi struk digital siap kirim.
              </p>

              {transactions.length > 0 ? (
                <div className="space-y-1.5">
                  {transactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] hover:border-blue-300 transition-colors text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#1b1b23]">{tx.orderNumber || tx.id}</span>
                        <span className="text-[#767680] ml-2 font-medium">
                          {tx.customer?.name ? `(${tx.customer.name})` : ''}
                        </span>
                        <div className="text-[11px] text-[#767680]">
                          {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {formatCurrency(tx.total)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setComposeType('receipt');
                          handleSelectTransactionForReceipt(tx.id);
                          setIsComposeOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Kirim Struk
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-[#767680] bg-[#fcf8ff] rounded-xl border border-[#e2e1ec]">
                  Belum ada transaksi di kasir hari ini.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Kirim Laporan Harian */}
          <div className="bg-white p-4.5 rounded-2xl border border-[#e2e1ec] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black text-[#1b1b23]">Kirim Laporan Kasir Hari Ini</h3>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  {new Date().toLocaleDateString('id-ID')}
                </span>
              </div>
              <p className="text-xs text-[#767680] mb-3">
                Kirimkan ringkasan total penjualan, rincian omzet per metode pembayaran, dan jumlah nota ke email pemilik.
              </p>

              <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 text-xs mb-3 space-y-1">
                <div className="flex justify-between text-emerald-950 font-medium">
                  <span>Total Transaksi:</span>
                  <span className="font-bold">{transactions.length} Nota</span>
                </div>
                <div className="flex justify-between text-emerald-950 font-medium">
                  <span>Total Omzet:</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(transactions.reduce((s, t) => s + (t.total || 0), 0))}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setComposeType('report');
                handleSelectDailyReport();
                setIsComposeOpen(true);
              }}
              className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Format & Kirim Rekapitulasi</span>
            </button>
          </div>
        </div>
      )}

      {/* Gmail Inbox / Message Browser (When Connected) */}
      {isConnected && (
        <div className="bg-white rounded-2xl border border-[#e2e1ec] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#e2e1ec] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fcf8ff]">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-[#0055EE]" />
              <h2 className="text-xs font-black text-[#1b1b23]">Kotak Masuk & Pesan Terkirim Gmail</h2>
            </div>

            {/* Folder Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-[#ebeaff] p-0.5 border border-[#d2d1dc]">
                <button
                  onClick={() => {
                    setActiveFolder('INBOX');
                    loadMessages('INBOX');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFolder === 'INBOX'
                      ? 'bg-white text-[#0055EE] shadow-2xs'
                      : 'text-[#767680] hover:text-[#1b1b23]'
                  }`}
                >
                  Kotak Masuk
                </button>
                <button
                  onClick={() => {
                    setActiveFolder('SENT');
                    loadMessages('SENT');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeFolder === 'SENT'
                      ? 'bg-white text-[#0055EE] shadow-2xs'
                      : 'text-[#767680] hover:text-[#1b1b23]'
                  }`}
                >
                  Terkirim
                </button>
              </div>

              {/* Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadMessages(activeFolder, searchQuery);
                }}
                className="relative"
              >
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#767680]" />
                <input
                  type="text"
                  placeholder="Cari email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-xl border border-[#d2d1dc] bg-white text-[#1b1b23] focus:border-[#0055EE] focus:outline-none w-36 sm:w-48"
                />
              </form>
            </div>
          </div>

          {/* Message List */}
          <div className="divide-y divide-[#e2e1ec]">
            {isLoadingMessages ? (
              <div className="p-10 text-center text-xs text-[#767680] flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-[#0055EE]" />
                <span>Mengambil pesan dari Google Gmail...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#767680] flex flex-col items-center justify-center gap-1.5">
                <Mail className="h-8 w-8 text-[#767680]/40" />
                <p className="font-semibold">Tidak ada pesan ditemukan di folder ini.</p>
                <p className="text-[11px]">Gunakan tombol "Kirim Email" untuk mengirim struk atau pesan pertama Anda.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className="p-3.5 sm:p-4 hover:bg-[#fcf8ff] transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {msg.isUnread && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" title="Belum dibaca" />
                      )}
                      <span className={`text-xs truncate ${msg.isUnread ? 'font-black text-[#1b1b23]' : 'font-semibold text-[#46464f]'}`}>
                        {activeFolder === 'SENT' ? `Ke: ${msg.to || '(Penerima)'}` : msg.from || '(Pengirim)'}
                      </span>
                      <span className="text-[10px] text-[#767680] shrink-0">
                        {msg.date ? new Date(msg.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${msg.isUnread ? 'font-bold text-[#1b1b23]' : 'text-[#46464f]'}`}>
                      {msg.subject || '(Tanpa Subjek)'}
                    </p>
                    <p className="text-[11px] text-[#767680] truncate mt-0.5">
                      {msg.snippet || ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInitiateTrash(msg.id, msg.subject);
                      }}
                      className="p-1.5 rounded-lg text-[#767680] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Hapus ke Sampah"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-[#767680]" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detail Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#e2e1ec] shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-[#e2e1ec] bg-[#fcf8ff] flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <h3 className="text-xs font-black text-[#1b1b23] truncate">
                  {selectedMessage.subject || '(Tanpa Subjek)'}
                </h3>
                <p className="text-[11px] text-[#767680] truncate mt-0.5">
                  Dari: {selectedMessage.from}
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-xs font-bold text-[#767680] hover:text-[#1b1b23] px-2 py-1 rounded-lg hover:bg-[#ebeaff] transition-colors"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
              <div className="text-[11px] text-[#767680] space-y-0.5 border-b border-[#e2e1ec] pb-2">
                <div><strong>Kepada:</strong> {selectedMessage.to || '-'}</div>
                <div><strong>Tanggal:</strong> {selectedMessage.date || '-'}</div>
              </div>

              <div className="text-xs text-[#1b1b23] leading-relaxed whitespace-pre-wrap bg-[#fcf8ff] p-3.5 rounded-xl border border-[#e2e1ec]">
                {selectedMessage.snippet || '(Tidak ada cuplikan konten)'}
              </div>
            </div>

            <div className="p-3.5 border-t border-[#e2e1ec] bg-[#fcf8ff] flex justify-between items-center">
              <button
                onClick={() => {
                  handleInitiateTrash(selectedMessage.id, selectedMessage.subject);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Pindahkan ke Sampah</span>
              </button>

              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-1.5 bg-[#0055EE] text-white text-xs font-bold rounded-xl hover:bg-[#003B99] transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#e2e1ec] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#e2e1ec] bg-[#fcf8ff] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#1b1b23]">Tulis Email Baru (Gmail)</h3>
                  <p className="text-[10px] text-[#767680]">
                    Kirim dari: {currentUser?.email || 'Akun Gmail Anda'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-xs font-bold text-[#767680] hover:text-[#1b1b23] px-2 py-1 rounded-lg hover:bg-[#ebeaff] transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateSend} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* Template Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#767680] mb-1">
                  Pilih Template / Tipe Pesan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setComposeType('custom');
                      setComposeBody('');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      composeType === 'custom'
                        ? 'border-[#0055EE] bg-blue-50 text-[#0055EE]'
                        : 'border-[#d2d1dc] bg-[#fcf8ff] text-[#767680]'
                    }`}
                  >
                    Pesan Bebas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComposeType('receipt');
                      if (transactions.length > 0) {
                        handleSelectTransactionForReceipt(transactions[0].id);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      composeType === 'receipt'
                        ? 'border-[#0055EE] bg-blue-50 text-[#0055EE]'
                        : 'border-[#d2d1dc] bg-[#fcf8ff] text-[#767680]'
                    }`}
                  >
                    Struk Penjualan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComposeType('report');
                      handleSelectDailyReport();
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      composeType === 'report'
                        ? 'border-[#0055EE] bg-blue-50 text-[#0055EE]'
                        : 'border-[#d2d1dc] bg-[#fcf8ff] text-[#767680]'
                    }`}
                  >
                    Laporan Harian
                  </button>
                </div>
              </div>

              {/* Transaction Picker for Receipt */}
              {composeType === 'receipt' && (
                <div>
                  <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                    Pilih Nota Transaksi Penjualan
                  </label>
                  <select
                    value={selectedTransactionId}
                    onChange={(e) => handleSelectTransactionForReceipt(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-[#1b1b23] focus:border-[#0055EE] focus:outline-none"
                  >
                    <option value="">-- Pilih Transaksi --</option>
                    {transactions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.orderNumber || t.id} • {t.date || new Date(t.timestamp).toLocaleDateString('id-ID')} • {formatCurrency(t.total)} {t.customer?.name ? `(${t.customer.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipient */}
              <div>
                <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                  Email Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="pelanggan@email.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full text-xs rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-[#1b1b23] focus:border-[#0055EE] focus:outline-none"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                  Subjek Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Subjek email..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full text-xs rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-[#1b1b23] focus:border-[#0055EE] focus:outline-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                  Isi Pesan {composeType !== 'custom' ? '(HTML Template Siap Kirim)' : ''}
                </label>
                {composeType === 'custom' ? (
                  <textarea
                    rows={6}
                    required
                    placeholder="Ketik pesan Anda di sini..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="w-full text-xs rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-[#1b1b23] focus:border-[#0055EE] focus:outline-none font-sans resize-y"
                  />
                ) : (
                  <div className="border border-[#d2d1dc] rounded-xl p-3 bg-[#fcf8ff] max-h-56 overflow-y-auto">
                    <div className="text-[11px] text-[#767680] mb-2 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Template HTML sudah diformat dengan desain DelPOS</span>
                    </div>
                    <div
                      className="bg-white p-2 rounded-lg border border-slate-200 text-xs text-slate-700"
                      dangerouslySetInnerHTML={{ __html: composeBody }}
                    />
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Sesuai kebijakan privasi Google Workspace, Anda akan dimintai konfirmasi persetujuan sebelum email resmi terkirim ke kotak surat penerima.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#e2e1ec]">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-3 py-2 text-xs font-bold text-[#767680] hover:text-[#1b1b23] rounded-xl hover:bg-[#ebeaff] transition-colors cursor-pointer"
                >
                  Simpan Draf
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-[#767680] hover:text-[#1b1b23] rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0055EE] text-white text-xs font-bold hover:bg-[#003B99] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Lanjutkan & Kirim</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE & MUTATING WORKSPACE OPERATIONS */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e2e1ec] shadow-2xl p-5 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  confirmModal.actionType === 'send'
                    ? 'bg-blue-50 text-blue-600'
                    : confirmModal.actionType === 'trash'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {confirmModal.actionType === 'send' ? (
                  <Send className="h-6 w-6" />
                ) : confirmModal.actionType === 'trash' ? (
                  <Trash2 className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1b1b23]">{confirmModal.title}</h3>
                <p className="text-xs text-[#767680] leading-relaxed mt-1">{confirmModal.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e1ec]">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-[#767680] hover:text-[#1b1b23] rounded-xl hover:bg-[#ebeaff] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.actionType === 'send') {
                    handleExecuteSend();
                  } else if (confirmModal.actionType === 'trash' && confirmModal.targetId) {
                    handleExecuteTrash(confirmModal.targetId);
                  } else if (confirmModal.actionType === 'disconnect') {
                    handleExecuteDisconnect();
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer ${
                  confirmModal.actionType === 'send'
                    ? 'bg-[#0055EE] hover:bg-[#003B99]'
                    : confirmModal.actionType === 'trash'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.actionType === 'send'
                  ? 'Ya, Kirim Sekarang'
                  : confirmModal.actionType === 'trash'
                  ? 'Ya, Pindahkan ke Sampah'
                  : 'Ya, Putuskan Sesi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

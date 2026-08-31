import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Crown,
  Award,
  Star,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  Download,
  DollarSign,
  Calendar,
  Gift,
  Coins,
  CheckCircle2,
  X,
  UserPlus,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer, CustomerTier, Transaction } from '../types';

export const CustomersView: React.FC = () => {
  const {
    customers,
    transactions,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerDebtPayment,
    adjustCustomerPoints,
    setSelectedCustomer,
    setCurrentTab,
    formatCurrency,
    showToast,
    storeProfile,
  } = useApp();

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('Semua');
  const [debtFilter, setDebtFilter] = useState<'all' | 'has_debt' | 'no_debt'>('all');
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'name' | 'newest' | 'debt'>('spent');

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [isDebtPayModalOpen, setIsDebtPayModalOpen] = useState(false);
  const [debtPayingCustomer, setDebtPayingCustomer] = useState<Customer | null>(null);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState<number>(0);
  const [pointsAdjustModal, setPointsAdjustModal] = useState<{ isOpen: boolean; customer: Customer | null; amount: number; isAdding: boolean }>({
    isOpen: false,
    customer: null,
    amount: 10,
    isAdding: true,
  });

  // Form State for Add / Edit Customer
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    tier: CustomerTier;
    debt: number;
    avatarUrl: string;
  }>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    tier: 'Reguler',
    debt: 0,
    avatarUrl: '',
  });

  // Statistics calculation
  const totalCustomers = customers.length;
  const vipGoldCount = customers.filter((c) => c.tier === 'VIP' || c.tier === 'Gold').length;
  const totalLTV = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const totalDebt = customers.reduce((acc, c) => acc + (c.debt || 0), 0);
  const avgSpendPerCustomer = totalCustomers > 0 ? Math.round(totalLTV / totalCustomers) : 0;

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search query
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          c.name.toLowerCase().includes(query) ||
          (c.phone && c.phone.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.address && c.address.toLowerCase().includes(query)) ||
          (c.notes && c.notes.toLowerCase().includes(query));

        // Tier filter
        const matchesTier = selectedTierFilter === 'Semua' || c.tier === selectedTierFilter;

        // Debt filter
        let matchesDebt = true;
        if (debtFilter === 'has_debt') matchesDebt = (c.debt || 0) > 0;
        if (debtFilter === 'no_debt') matchesDebt = (c.debt || 0) === 0;

        return matchesQuery && matchesTier && matchesDebt;
      })
      .sort((a, b) => {
        if (sortBy === 'spent') return (b.totalSpent || 0) - (a.totalSpent || 0);
        if (sortBy === 'orders') return (b.totalOrders || 0) - (a.totalOrders || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'debt') return (b.debt || 0) - (a.debt || 0);
        if (sortBy === 'newest') {
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        }
        return 0;
      });
  }, [customers, searchQuery, selectedTierFilter, debtFilter, sortBy]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      tier: 'Reguler',
      debt: 0,
      avatarUrl: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
      tier: c.tier || 'Reguler',
      debt: c.debt || 0,
      avatarUrl: c.avatarUrl || '',
    });
    setIsAddEditModalOpen(true);
  };

  // Submit Form
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama pelanggan wajib diisi!', 'warning');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        tier: formData.tier,
        debt: Number(formData.debt) || 0,
        avatarUrl: formData.avatarUrl.trim() || undefined,
      });
    } else {
      addCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        tier: formData.tier,
        debt: Number(formData.debt) || 0,
        points: 0,
        totalOrders: 0,
        totalSpent: 0,
        avatarUrl: formData.avatarUrl.trim() || undefined,
      });
    }

    setIsAddEditModalOpen(false);
  };

  // Delete Customer with confirmation
  const handleDeleteCustomer = (c: Customer) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pelanggan "${c.name}"?`)) {
      deleteCustomer(c.id);
      if (detailCustomer?.id === c.id) {
        setDetailCustomer(null);
      }
    }
  };

  // Switch to POS with this customer selected
  const handleStartTransactionForCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCurrentTab('pos');
    showToast(`Pelanggan "${c.name}" dipilih untuk transaksi kasir`, 'info');
  };

  // Open WhatsApp chat
  const handleOpenWhatsApp = (phone?: string, name?: string) => {
    if (!phone) {
      showToast('Pelanggan tidak memiliki nomor telepon!', 'warning');
      return;
    }
    // Clean phone number (replace 08 with 628)
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const message = encodeURIComponent(
      `Halo Kak ${name || ''}, terima kasih telah menjadi pelanggan setia di ${storeProfile.name}. Ada yang bisa kami bantu hari ini?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Get transactions for customer
  const getCustomerTransactions = (customerId: string): Transaction[] => {
    return transactions.filter(
      (t) => t.customer?.id === customerId || t.customer?.name === detailCustomer?.name
    );
  };

  // Helper tier badge
  const renderTierBadge = (tier?: CustomerTier) => {
    switch (tier) {
      case 'VIP':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
            <Crown className="h-3 w-3" />
            VIP Member
          </span>
        );
      case 'Gold':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
            <Award className="h-3 w-3 text-amber-600" />
            Gold Tier
          </span>
        );
      case 'Silver':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
            <Star className="h-3 w-3 text-slate-500" />
            Silver Tier
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-[10px] font-medium text-zinc-700">
            <ShieldCheck className="h-3 w-3 text-zinc-500" />
            Reguler
          </span>
        );
    }
  };

  // Export customers to CSV with UTF-8 BOM & clean Excel tables
  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast('Tidak ada data pelanggan untuk diekspor', 'warning');
      return;
    }
    const headers = [
      'No',
      'ID Pelanggan',
      'Nama Lengkap',
      'No. WhatsApp / Telepon',
      'Email',
      'Alamat Domisili',
      'Tingkatan Tier',
      'Total Transaksi (Pesanan)',
      'Total Akumulasi Belanja (Rp)',
      'Poin Loyalitas',
      'Sisa Piutang / Bon (Rp)',
      'Catatan Khusus',
      'Tanggal Terdaftar',
    ];

    const escapeCell = (val: any) => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = customers.map((c, i) => [
      i + 1,
      c.id,
      escapeCell(c.name),
      escapeCell(c.phone || '-'),
      escapeCell(c.email || '-'),
      escapeCell(c.address || '-'),
      c.tier || 'Reguler',
      c.totalOrders || 0,
      c.totalSpent || 0,
      c.points || 0,
      c.debt || 0,
      escapeCell(c.notes || '-'),
      c.createdAt || '-',
    ]);

    const titleRow = `LAPORAN DATABASE PELANGGAN & MEMBER - ${storeProfile.name.toUpperCase()}`;
    const dateRow = `Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`;
    const csvContent =
      '\uFEFF' +
      [titleRow, dateRow, '', headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Data_Pelanggan_${storeProfile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Data pelanggan berhasil diekspor dengan tabel rapi!', 'success');
  };

  return (
    <div id="customers-view" className="space-y-6 pb-20 lg:pb-0">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#e2e1ec] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1b1b23] tracking-tight">
                Atur & Manajemen Pelanggan (CRM)
              </h2>
              <p className="text-xs sm:text-sm text-[#767680] mt-0.5">
                Kelola data pelanggan setia, tingkatan member (tier), poin loyalitas, riwayat pesanan, dan catatan piutang toko.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-export-customers"
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] px-3.5 py-2.5 text-xs font-bold text-[#46464f] hover:bg-[#e8e7f0] hover:text-[#1b1b23] transition-all cursor-pointer"
            title="Ekspor CSV Kontak Pelanggan"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          <button
            id="btn-add-customer"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-[#4648d4] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#3435ad] active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e1ec] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#767680]">
            <span className="text-xs font-semibold">Total Pelanggan</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-[#1b1b23]">{totalCustomers}</span>
            <span className="text-[11px] font-semibold text-emerald-600">Terdaftar</span>
          </div>
          <p className="text-[11px] text-[#767680] truncate">
            {vipGoldCount} member VIP / Gold aktif
          </p>
        </div>

        {/* Total LTV Revenue */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e1ec] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#767680]">
            <span className="text-xs font-semibold">Total Belanja (LTV)</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-black text-[#1b1b23]">{formatCurrency(totalLTV)}</span>
          </div>
          <p className="text-[11px] text-[#767680] truncate">
            Rerata {formatCurrency(avgSpendPerCustomer)} / orang
          </p>
        </div>

        {/* Loyalty Points Distributed */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e1ec] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#767680]">
            <span className="text-xs font-semibold">Poin Loyalitas</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {customers.reduce((a, c) => a + (c.points || 0), 0)}
            </span>
            <span className="text-[11px] font-semibold text-[#767680]">Poin</span>
          </div>
          <p className="text-[11px] text-[#767680] truncate">
            Otomatis dari kasir (1 poin / Rp 10.000)
          </p>
        </div>

        {/* Total Receivables / Debt */}
        <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs space-y-2 ${totalDebt > 0 ? 'border-red-200 bg-red-50/20' : 'border-[#e2e1ec]'}`}>
          <div className="flex items-center justify-between text-[#767680]">
            <span className="text-xs font-semibold">Total Piutang Belum Lunas</span>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${totalDebt > 0 ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-600'}`}>
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-lg sm:text-xl font-black ${totalDebt > 0 ? 'text-[#ba1a1a]' : 'text-[#1b1b23]'}`}>
              {formatCurrency(totalDebt)}
            </span>
          </div>
          <p className="text-[11px] text-[#767680] truncate">
            {customers.filter((c) => (c.debt || 0) > 0).length} pelanggan memiliki tagihan
          </p>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white rounded-2xl p-4 border border-[#e2e1ec] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
            <input
              id="search-customer-input"
              type="text"
              placeholder="Cari nama pelanggan, nomor WhatsApp, email, atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#767680] hover:text-[#1b1b23]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Debt Filter Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="filter-customer-debt"
              value={debtFilter}
              onChange={(e) => setDebtFilter(e.target.value as any)}
              className="rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] px-3 py-2.5 text-xs font-semibold text-[#46464f] focus:border-[#4648d4] focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Status Piutang</option>
              <option value="has_debt">⚠️ Ada Piutang Saja</option>
              <option value="no_debt">✅ Lunas / Tanpa Piutang</option>
            </select>

            {/* Sort By Dropdown */}
            <select
              id="sort-customer-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] px-3 py-2.5 text-xs font-semibold text-[#46464f] focus:border-[#4648d4] focus:bg-white focus:outline-none"
            >
              <option value="spent">💰 Belanja Terbanyak (LTV)</option>
              <option value="orders">🛒 Pesanan Terbanyak</option>
              <option value="name">🔤 Nama (A - Z)</option>
              <option value="debt">⚠️ Piutang Terbesar</option>
              <option value="newest">📅 Paling Baru Terdaftar</option>
            </select>
          </div>
        </div>

        {/* Tier Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-bold text-[#767680] shrink-0 mr-1">Tingkatan:</span>
          {['Semua', 'VIP', 'Gold', 'Silver', 'Reguler'].map((tier) => {
            const isSelected = selectedTierFilter === tier;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTierFilter(tier)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#4648d4] text-white shadow-xs'
                    : 'bg-[#f3f2fa] text-[#46464f] hover:bg-[#e8e7f0]'
                }`}
              >
                {tier === 'Semua' ? 'Semua Tier' : tier}
              </button>
            );
          })}
          <span className="text-xs text-[#767680] ml-auto shrink-0 font-medium">
            Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan
          </span>
        </div>
      </div>

      {/* Customer List Table & Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#d2d1dc] bg-white p-12 text-center shadow-xs">
          <div className="h-16 w-16 rounded-full bg-[#f3f2fa] flex items-center justify-center text-[#767680] mb-3">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-[#1b1b23]">Pelanggan Tidak Ditemukan</h3>
          <p className="text-xs text-[#767680] max-w-sm mt-1">
            Tidak ada data pelanggan yang sesuai dengan kriteria pencarian atau filter yang dipilih.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTierFilter('Semua');
              setDebtFilter('all');
            }}
            className="mt-4 rounded-xl bg-[#ebeaff] px-4 py-2 text-xs font-bold text-[#4648d4] hover:bg-[#deddfc] transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#e2e1ec] shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1b1b23]">
              <thead className="border-b border-[#e2e1ec] bg-[#fcf8ff] text-[11px] font-bold text-[#767680] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Kontak & Alamat</th>
                  <th className="py-3.5 px-4 text-center">Tier & Poin</th>
                  <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                  <th className="py-3.5 px-4 text-right">Total Belanja (LTV)</th>
                  <th className="py-3.5 px-4 text-right">Piutang</th>
                  <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f2fa]">
                {filteredCustomers.map((c) => {
                  const hasDebt = (c.debt || 0) > 0;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#fcf8ff]/80 transition-colors group cursor-pointer"
                      onClick={() => setDetailCustomer(c)}
                    >
                      {/* Customer Info & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-tr from-[#4648d4] to-indigo-400 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            {c.avatarUrl ? (
                              <img
                                src={c.avatarUrl}
                                alt={c.name}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span>{c.name.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#1b1b23] hover:text-[#4648d4] transition-colors">
                                {c.name}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#767680] font-mono">{c.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          {c.phone ? (
                            <div className="flex items-center gap-1.5 text-xs text-[#46464f]">
                              <Phone className="h-3 w-3 text-emerald-600" />
                              <span>{c.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#767680] italic">Belum ada telepon</span>
                          )}
                          {c.address && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#767680] truncate">
                              <MapPin className="h-3 w-3 shrink-0 text-[#767680]" />
                              <span className="truncate">{c.address}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tier & Points */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {renderTierBadge(c.tier)}
                          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                            <Coins className="h-3 w-3" />
                            {c.points || 0} Poin
                          </span>
                        </div>
                      </td>

                      {/* Total Orders */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-sm text-[#1b1b23]">
                          {c.totalOrders || 0} <span className="text-xs font-normal text-[#767680]">kali</span>
                        </div>
                        {c.lastOrderDate && (
                          <span className="text-[10px] text-[#767680] block">
                            Terakhir: {c.lastOrderDate}
                          </span>
                        )}
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-extrabold text-sm text-[#4648d4]">
                          {formatCurrency(c.totalSpent || 0)}
                        </div>
                      </td>

                      {/* Debt */}
                      <td className="py-3.5 px-4 text-right">
                        {hasDebt ? (
                          <div>
                            <span className="font-black text-xs text-[#ba1a1a] block">
                              {formatCurrency(c.debt || 0)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDebtPayingCustomer(c);
                                setDebtPaymentAmount(c.debt || 0);
                                setIsDebtPayModalOpen(true);
                              }}
                              className="mt-0.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded-md"
                            >
                              Bayar Bon
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Lunas
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {/* WhatsApp Chat Button */}
                          <button
                            id={`btn-wa-${c.id}`}
                            onClick={() => handleOpenWhatsApp(c.phone, c.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-xs"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>

                          {/* POS Order Button */}
                          <button
                            id={`btn-pos-${c.id}`}
                            onClick={() => handleStartTransactionForCustomer(c)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ebeaff] text-[#4648d4] hover:bg-[#4648d4] hover:text-white transition-all shadow-xs"
                            title="Buka Kasir POS untuk Pelanggan Ini"
                          >
                            <ShoppingBag className="h-4 w-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            id={`btn-edit-${c.id}`}
                            onClick={() => handleOpenEditModal(c)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f2fa] text-[#46464f] hover:bg-[#e8e7f0] hover:text-[#1b1b23] transition-all"
                            title="Edit Data Pelanggan"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Detail Button */}
                          <button
                            id={`btn-detail-${c.id}`}
                            onClick={() => setDetailCustomer(c)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f2fa] text-[#46464f] hover:bg-[#e8e7f0] hover:text-[#1b1b23] transition-all"
                            title="Lihat Riwayat & Detail"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            id={`btn-del-${c.id}`}
                            onClick={() => handleDeleteCustomer(c)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-all"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-[#f3f2fa]">
            {filteredCustomers.map((c) => {
              const hasDebt = (c.debt || 0) > 0;
              return (
                <div
                  key={c.id}
                  className="p-4 space-y-3 hover:bg-[#fcf8ff] transition-colors"
                  onClick={() => setDetailCustomer(c)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 rounded-full overflow-hidden bg-gradient-to-tr from-[#4648d4] to-indigo-400 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                        ) : (
                          <span>{c.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1b1b23]">{c.name}</h4>
                        <p className="text-xs text-[#767680]">{c.phone || 'Tanpa no. telepon'}</p>
                      </div>
                    </div>

                    <div className="shrink-0">{renderTierBadge(c.tier)}</div>
                  </div>

                  {/* Summary badges */}
                  <div className="grid grid-cols-3 gap-2 bg-[#fcf8ff] p-2.5 rounded-xl border border-[#e2e1ec] text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#767680] block">Pesanan</span>
                      <span className="font-bold text-[#1b1b23]">{c.totalOrders || 0}x</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#767680] block">Total Belanja</span>
                      <span className="font-extrabold text-[#4648d4] text-[11px] truncate block">
                        {formatCurrency(c.totalSpent || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#767680] block">Piutang</span>
                      <span className={`font-bold text-[11px] ${hasDebt ? 'text-[#ba1a1a]' : 'text-emerald-600'}`}>
                        {hasDebt ? formatCurrency(c.debt || 0) : 'Lunas'}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenWhatsApp(c.phone, c.name)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-700 px-2.5 py-1.5 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleStartTransactionForCustomer(c)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#ebeaff] text-[#4648d4] px-2.5 py-1.5 text-xs font-bold hover:bg-[#4648d4] hover:text-white transition-all"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Kasir</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 rounded-lg bg-[#f3f2fa] text-[#46464f] hover:bg-[#e8e7f0]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(c)}
                        className="p-1.5 rounded-lg bg-red-50 text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT CUSTOMER */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-[#e2e1ec] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ebeaff] text-[#4648d4]">
                  {editingCustomer ? <Edit2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1b1b23]">
                    {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
                  </h3>
                  <p className="text-xs text-[#767680]">
                    {editingCustomer ? `ID: ${editingCustomer.id}` : 'Daftarkan pelanggan ke sistem CRM toko'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="rounded-lg p-1.5 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs sm:text-sm">
              {/* Name */}
              <div>
                <label className="block font-bold text-[#1b1b23] mb-1">
                  Nama Lengkap Pelanggan <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati / Toko Makmur"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1b1b23] mb-1">No. WhatsApp / Telepon</label>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1b1b23] mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Tier & Initial Debt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1b1b23] mb-1">Tingkatan Member (Tier)</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as CustomerTier })}
                    className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none font-semibold"
                  >
                    <option value="Reguler">Reguler (Standar)</option>
                    <option value="Silver">Silver (Belanja &gt; 350rb)</option>
                    <option value="Gold">Gold (Belanja &gt; 1jt)</option>
                    <option value="VIP">VIP (Belanja &gt; 2.5jt / Prioritas)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1b1b23] mb-1">Saldo Piutang Awal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={formData.debt || ''}
                    onChange={(e) => setFormData({ ...formData, debt: Number(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block font-bold text-[#1b1b23] mb-1">Alamat Pengiriman / Domisili</label>
                <input
                  type="text"
                  placeholder="Jl. Mawar No. 10, Jakarta..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-[#1b1b23] mb-1">Catatan &amp; Preferensi Khusus</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Suka kopi tanpa gula, langganan catering kantor..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block font-bold text-[#1b1b23] mb-1">URL Foto Profil (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f3f2fa]">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="rounded-xl border border-[#d2d1dc] px-4 py-2.5 font-bold text-[#46464f] hover:bg-[#f3f2fa]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#4648d4] px-5 py-2.5 font-bold text-white shadow-xs hover:bg-[#3435ad]"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CUSTOMER DETAIL & TRANSACTION HISTORY */}
      {/* ========================================================================= */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-[#e2e1ec] bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Detail Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#f3f2fa]">
              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#4648d4] to-indigo-400 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {detailCustomer.avatarUrl ? (
                    <img
                      src={detailCustomer.avatarUrl}
                      alt={detailCustomer.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{detailCustomer.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#1b1b23]">{detailCustomer.name}</h3>
                    {renderTierBadge(detailCustomer.tier)}
                  </div>
                  <p className="text-xs text-[#767680] mt-0.5">
                    ID: {detailCustomer.id} • Terdaftar sejak {detailCustomer.createdAt || 'Awal tahun'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailCustomer(null)}
                className="rounded-lg p-1.5 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Contact & Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#fcf8ff] p-3.5 rounded-2xl border border-[#e2e1ec] space-y-1.5">
                <span className="font-bold text-[#767680] block text-[11px] uppercase tracking-wider">
                  Informasi Kontak
                </span>
                <div className="flex items-center gap-2 text-[#1b1b23]">
                  <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{detailCustomer.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#1b1b23]">
                  <Mail className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>{detailCustomer.email || '-'}</span>
                </div>
                <div className="flex items-start gap-2 text-[#1b1b23]">
                  <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{detailCustomer.address || 'Alamat belum diatur'}</span>
                </div>
                {detailCustomer.notes && (
                  <p className="mt-2 text-[11px] text-[#46464f] bg-white p-2 rounded-xl border border-[#e2e1ec] italic">
                    &quot;{detailCustomer.notes}&quot;
                  </p>
                )}
              </div>

              {/* Financial & Loyalty Summary */}
              <div className="bg-[#fcf8ff] p-3.5 rounded-2xl border border-[#e2e1ec] space-y-2.5 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-[#767680] block text-[11px] uppercase tracking-wider">
                    Statistik Nilai Pelanggan
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-[#e2e1ec]">
                      <span className="text-[10px] text-[#767680] block">Total Belanja</span>
                      <span className="font-black text-xs sm:text-sm text-[#4648d4]">
                        {formatCurrency(detailCustomer.totalSpent || 0)}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-[#e2e1ec]">
                      <span className="text-[10px] text-[#767680] block">Frekuensi Order</span>
                      <span className="font-bold text-xs sm:text-sm text-[#1b1b23]">
                        {detailCustomer.totalOrders || 0} Kali
                      </span>
                    </div>
                  </div>

                  {/* Loyalty Points row */}
                  <div className="mt-2 flex items-center justify-between bg-amber-50 border border-amber-200 p-2 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-amber-600" />
                      <span className="font-bold text-amber-900">{detailCustomer.points || 0} Poin Loyalitas</span>
                    </div>
                    <button
                      onClick={() =>
                        setPointsAdjustModal({
                          isOpen: true,
                          customer: detailCustomer,
                          amount: 10,
                          isAdding: true,
                        })
                      }
                      className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-md hover:bg-amber-700"
                    >
                      Ubah Poin
                    </button>
                  </div>

                  {/* Debt status */}
                  {(detailCustomer.debt || 0) > 0 ? (
                    <div className="mt-2 flex items-center justify-between bg-red-50 border border-red-200 p-2 rounded-xl text-xs">
                      <span className="font-bold text-red-900">
                        Piutang: {formatCurrency(detailCustomer.debt || 0)}
                      </span>
                      <button
                        onClick={() => {
                          setDebtPayingCustomer(detailCustomer);
                          setDebtPaymentAmount(detailCustomer.debt || 0);
                          setIsDebtPayModalOpen(true);
                        }}
                        className="text-[10px] font-bold bg-[#ba1a1a] text-white px-2 py-0.5 rounded-md hover:bg-red-800"
                      >
                        Bayar Piutang
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleOpenWhatsApp(detailCustomer.phone, detailCustomer.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white py-2 font-bold hover:bg-emerald-700 transition-all text-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      setDetailCustomer(null);
                      handleStartTransactionForCustomer(detailCustomer);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#4648d4] text-white py-2 font-bold hover:bg-[#3435ad] transition-all text-xs"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Buka POS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Purchase History */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#1b1b23] flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#4648d4]" />
                Riwayat Transaksi Pelanggan
              </h4>

              {getCustomerTransactions(detailCustomer.id).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d2d1dc] p-6 text-center text-xs text-[#767680]">
                  Belum ada riwayat transaksi tercatat untuk pelanggan ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {getCustomerTransactions(detailCustomer.id).map((trx) => (
                    <div
                      key={trx.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1b1b23]">{trx.orderNumber}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            {trx.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#767680]">
                          {trx.date} • {trx.time} • Kasir: {trx.cashierName}
                        </span>
                        <div className="text-[11px] text-[#46464f]">
                          {trx.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-sm text-[#4648d4] block">
                          {formatCurrency(trx.total)}
                        </span>
                        <span className="text-[10px] text-[#767680] font-medium">{trx.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#f3f2fa]">
              <button
                onClick={() => {
                  const target = detailCustomer;
                  setDetailCustomer(null);
                  handleOpenEditModal(target);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-[#4648d4] hover:underline"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Profil Pelanggan
              </button>
              <button
                onClick={() => setDetailCustomer(null)}
                className="rounded-xl bg-[#f3f2fa] px-4 py-2 text-xs font-bold text-[#46464f] hover:bg-[#e8e7f0]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PAY DEBT (BAYAR PIUTANG) */}
      {/* ========================================================================= */}
      {isDebtPayModalOpen && debtPayingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-[#e2e1ec] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1b1b23]">Catat Pembayaran Piutang</h3>
                  <p className="text-xs text-[#767680]">{debtPayingCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDebtPayModalOpen(false)}
                className="rounded-lg p-1.5 text-[#767680] hover:bg-[#f3f2fa]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 p-3 rounded-2xl text-xs space-y-1">
              <span className="text-red-700 font-semibold">Total Sisa Piutang Saat Ini:</span>
              <p className="text-lg font-black text-[#ba1a1a]">
                {formatCurrency(debtPayingCustomer.debt || 0)}
              </p>
            </div>

            <div>
              <label className="block font-bold text-xs text-[#1b1b23] mb-1">
                Nominal Pembayaran Diterima (Rp)
              </label>
              <input
                type="number"
                min="1000"
                max={debtPayingCustomer.debt || 0}
                value={debtPaymentAmount || ''}
                onChange={(e) => setDebtPaymentAmount(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-sm font-bold text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setDebtPaymentAmount(debtPayingCustomer.debt || 0)}
                  className="rounded-lg bg-[#ebeaff] px-2.5 py-1 text-xs font-bold text-[#4648d4]"
                >
                  Lunasi Penuh ({formatCurrency(debtPayingCustomer.debt || 0)})
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f3f2fa]">
              <button
                type="button"
                onClick={() => setIsDebtPayModalOpen(false)}
                className="rounded-xl border border-[#d2d1dc] px-4 py-2 text-xs font-bold text-[#46464f]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (debtPaymentAmount <= 0) {
                    showToast('Masukkan nominal pembayaran piutang!', 'warning');
                    return;
                  }
                  recordCustomerDebtPayment(debtPayingCustomer.id, debtPaymentAmount);
                  setIsDebtPayModalOpen(false);
                  if (detailCustomer?.id === debtPayingCustomer.id) {
                    setDetailCustomer((prev) =>
                      prev ? { ...prev, debt: Math.max(0, (prev.debt || 0) - debtPaymentAmount) } : null
                    );
                  }
                }}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADJUST POINTS */}
      {/* ========================================================================= */}
      {pointsAdjustModal.isOpen && pointsAdjustModal.customer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-[#e2e1ec] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-[#1b1b23]">Sesuaikan Poin Loyalitas</h3>
              </div>
              <button
                onClick={() => setPointsAdjustModal({ ...pointsAdjustModal, isOpen: false })}
                className="rounded-lg p-1.5 text-[#767680] hover:bg-[#f3f2fa]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs">
              <span className="text-amber-900 font-semibold block">Pelanggan: {pointsAdjustModal.customer.name}</span>
              <span className="text-amber-800 font-bold mt-1 block">
                Poin Saat Ini: {pointsAdjustModal.customer.points || 0} Poin
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPointsAdjustModal({ ...pointsAdjustModal, isAdding: true })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl ${
                    pointsAdjustModal.isAdding
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#f3f2fa] text-[#46464f]'
                  }`}
                >
                  + Tambah Poin
                </button>
                <button
                  type="button"
                  onClick={() => setPointsAdjustModal({ ...pointsAdjustModal, isAdding: false })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl ${
                    !pointsAdjustModal.isAdding
                      ? 'bg-[#ba1a1a] text-white'
                      : 'bg-[#f3f2fa] text-[#46464f]'
                  }`}
                >
                  - Kurang Poin
                </button>
              </div>

              <input
                type="number"
                min="1"
                value={pointsAdjustModal.amount || ''}
                onChange={(e) =>
                  setPointsAdjustModal({ ...pointsAdjustModal, amount: Math.max(1, Number(e.target.value) || 0) })
                }
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-3 text-sm font-bold text-[#1b1b23] focus:border-[#4648d4] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f2fa]">
              <button
                type="button"
                onClick={() => setPointsAdjustModal({ ...pointsAdjustModal, isOpen: false })}
                className="rounded-xl border border-[#d2d1dc] px-3.5 py-2 text-xs font-bold text-[#46464f]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const delta = pointsAdjustModal.isAdding
                    ? pointsAdjustModal.amount
                    : -pointsAdjustModal.amount;
                  adjustCustomerPoints(pointsAdjustModal.customer!.id, delta);
                  if (detailCustomer?.id === pointsAdjustModal.customer!.id) {
                    setDetailCustomer((prev) =>
                      prev ? { ...prev, points: Math.max(0, (prev.points || 0) + delta) } : null
                    );
                  }
                  setPointsAdjustModal({ ...pointsAdjustModal, isOpen: false });
                }}
                className="rounded-xl bg-[#4648d4] px-4 py-2 text-xs font-bold text-white hover:bg-[#3435ad]"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

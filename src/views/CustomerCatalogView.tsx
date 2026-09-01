import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  UtensilsCrossed,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Store,
  Phone,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Banknote,
  Receipt,
  QrCode,
  Tag,
  RefreshCw,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Product, CustomerOrder, CustomerOrderItem } from '../types';
import { QueueOrderReceiptModal } from '../components/modals/QueueOrderReceiptModal';

interface CustomerCatalogViewProps {
  onBackToApp?: () => void;
}

export const CustomerCatalogView: React.FC<CustomerCatalogViewProps> = ({ onBackToApp }) => {
  const {
    products,
    categories,
    storeProfile,
    formatCurrency,
    addCustomerOrder,
    customerOrders,
    setCurrentTab,
    showToast,
  } = useApp();

  // URL parameters for auto table detection (e.g. ?meja=04)
  const [tableNumber, setTableNumber] = useState<string>('01');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'Bayar di Kasir (Tunai)' | 'Transfer Bank' | 'Kartu Debit'
  >('Bayar di Kasir (Tunai)');

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customerCart, setCustomerCart] = useState<CustomerOrderItem[]>([]);
  const [isTrayOpen, setIsTrayOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [activeQueueTicket, setActiveQueueTicket] = useState<CustomerOrder | null>(null);
  const [isThermalReceiptModalOpen, setIsThermalReceiptModalOpen] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Initialize table number from URL params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mejaParam = urlParams.get('meja');
      if (mejaParam) {
        setTableNumber(mejaParam);
      }
    }
  }, []);

  // Filter products by category and availability
  const categoryNames = ['Semua', ...categories.map((c) => c.name)];
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Semua' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const addToCustomerCart = (product: Product) => {
    if (product.stock <= 0 || !product.isAvailable) {
      showToast(`Stok ${product.name} sedang habis.`, 'warning');
      return;
    }

    setCustomerCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Jumlah pesanan mencapai batas stok (${product.stock})`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            price: product.sellingPrice,
            quantity: 1,
            image: product.image,
            notes: '',
          },
        ];
      }
    });
    showToast(`+1 ${product.name} dimasukkan ke baki pesanan`, 'success');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCustomerCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            const prod = products.find((p) => p.id === productId);
            if (prod && newQty > prod.stock) {
              showToast(`Maksimal stok tersedia ${prod.stock}`, 'warning');
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CustomerOrderItem[];
    });
  };

  const updateItemNotes = (productId: string, notes: string) => {
    setCustomerCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, notes } : item))
    );
  };

  const totalItemsCount = customerCart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = customerCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * (storeProfile.taxRate || 0.1));
  const total = subtotal + tax;

  // Submit Order to Queue
  const handleSubmitOrder = () => {
    if (!customerName.trim()) {
      showToast('Mohon masukkan nama pemesan terlebih dahulu', 'warning');
      return;
    }
    if (customerCart.length === 0) {
      showToast('Baki pesanan masih kosong', 'warning');
      return;
    }

    const tableOrRoomLabel =
      orderType === 'DINE_IN' ? `Meja ${tableNumber.trim() || 'Umum'}` : 'Bungkus / Takeaway';

    const newOrder = addCustomerOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      tableOrRoom: tableOrRoomLabel,
      items: customerCart,
      subtotal,
      tax,
      total,
      paymentMethod: selectedPaymentMethod,
      isPaid: false,
      source: 'QR_CATALOG',
    });

    setActiveQueueTicket(newOrder);
    setCustomerCart([]);
    setIsCheckoutModalOpen(false);
    setIsTrayOpen(false);
    setIsThermalReceiptModalOpen(true);

    // Trigger celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast(`Pesanan #${newOrder.queueNumber} berhasil dikirim! Struk antrian diterbitkan.`, 'success');
  };

  const handleCopyBank = (accNo: string) => {
    navigator.clipboard.writeText(accNo.replace(/\D/g, ''));
    setCopiedBank(accNo);
    showToast(`Nomor rekening ${accNo} disalin!`, 'info');
    setTimeout(() => setCopiedBank(null), 2000);
  };

  // Find updated ticket status if active
  const liveTicket = activeQueueTicket
    ? customerOrders.find((o) => o.id === activeQueueTicket.id) || activeQueueTicket
    : null;

  return (
    <div className="min-h-screen bg-[#f8f9fe] text-[#1b1b23] pb-28">
      {/* Top Mobile/Customer Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e2e1ec] px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#4648d4] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-[#1b1b23] tracking-tight">
                  {storeProfile.name}
                </h1>
                <span className="bg-[#ebeaff] text-[#4648d4] text-[10px] font-black px-2 py-0.5 rounded-full">
                  Katalog Digital
                </span>
              </div>
              <p className="text-[11px] text-[#767680] font-medium flex items-center gap-1.5">
                <span>{storeProfile.branch || 'Pemesanan Mandiri'}</span>
                <span>•</span>
                <span className="font-bold text-[#4648d4]">
                  {orderType === 'DINE_IN' ? `Meja ${tableNumber}` : 'Bungkus / Takeaway'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="flex items-center gap-1 text-xs font-bold text-[#767680] hover:text-[#1b1b23] bg-[#f3f2fa] hover:bg-[#ebeaff] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                title="Kembali ke Aplikasi Utama POS"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Kembali ke POS</span>
              </button>
            )}

            {/* Tray Trigger Button */}
            <button
              type="button"
              onClick={() => setIsTrayOpen(true)}
              className="relative flex items-center gap-2 bg-[#4648d4] hover:bg-[#383ab2] active:scale-95 text-white px-3.5 py-2 rounded-2xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Baki ({totalItemsCount})</span>
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Announcement Banner */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="bg-gradient-to-r from-[#4648d4] via-[#5b5de6] to-[#7052ff] text-white p-4 sm:p-5 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-xs text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Self-Order & Antrian Otomatis
              </span>
              <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Langsung Terhubung ke Kasir
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black tracking-tight">
              {storeProfile.catalogHeadline || 'Pesan Menu Favorit Anda Tanpa Antre di Kasir'}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-xl">
              {storeProfile.catalogAnnouncement ||
                'Pilih menu, masukkan ke baki, dan dapatkan nomor antrian digital seketika.'}
            </p>
          </div>

          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-4">
            <UtensilsCrossed className="h-32 w-32 text-white" />
          </div>
        </div>
      </div>

      {/* Active Queue Ticket Tracker Alert (if customer already placed an order) */}
      {liveTicket && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#4648d4] shadow-md space-y-3">
            <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-[#f3f2fa]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#4648d4]">
                  TIKET ANTRIAN AKTIF ANDA
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#1b1b23] tracking-tight">
                    #{liveTicket.queueNumber}
                  </span>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full ${
                      liveTicket.status === 'MENUNGGU'
                        ? 'bg-amber-100 text-amber-800'
                        : liveTicket.status === 'DIPROSES'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : liveTicket.status === 'SIAP'
                        ? 'bg-emerald-100 text-emerald-800'
                        : liveTicket.status === 'SELESAI'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {liveTicket.status === 'MENUNGGU' && '⏳ Menunggu Konfirmasi Dapur'}
                    {liveTicket.status === 'DIPROSES' && '🍳 Sedang Disiapkan / Dimasak'}
                    {liveTicket.status === 'SIAP' && '🔔 Siap Diambil / Disajikan!'}
                    {liveTicket.status === 'SELESAI' && '✅ Selesai & Lunas'}
                    {liveTicket.status === 'DIBATALKAN' && '❌ Dibatalkan'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-[#767680]">Waktu Pesan</span>
                <p className="text-xs font-black text-[#1b1b23]">{liveTicket.orderTime}</p>
                <p className="text-[11px] font-bold text-[#4648d4]">{liveTicket.tableOrRoom}</p>
              </div>
            </div>

            {/* Status Step Indicator */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div
                className={`p-2 rounded-xl text-[11px] font-bold ${
                  liveTicket.status === 'MENUNGGU' ||
                  liveTicket.status === 'DIPROSES' ||
                  liveTicket.status === 'SIAP' ||
                  liveTicket.status === 'SELESAI'
                    ? 'bg-[#ebeaff] text-[#4648d4]'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                1. Diterima
              </div>
              <div
                className={`p-2 rounded-xl text-[11px] font-bold ${
                  liveTicket.status === 'DIPROSES' ||
                  liveTicket.status === 'SIAP' ||
                  liveTicket.status === 'SELESAI'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                2. Diproses
              </div>
              <div
                className={`p-2 rounded-xl text-[11px] font-bold ${
                  liveTicket.status === 'SIAP' || liveTicket.status === 'SELESAI'
                    ? 'bg-emerald-100 text-emerald-800 font-black'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                3. Siap Saji
              </div>
            </div>

            {/* Items Summary & Action */}
            <div className="bg-[#fcf8ff] p-3 rounded-2xl border border-[#e2e1ec] text-xs space-y-2">
              <div className="flex justify-between font-bold text-[#52525c]">
                <span>{liveTicket.items.length} Menu ({liveTicket.customerName})</span>
                <span className="font-extrabold text-[#4648d4]">{formatCurrency(liveTicket.total)}</span>
              </div>
              <p className="text-[11px] text-[#767680] truncate">
                {liveTicket.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
              </p>
              
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#f3f2fa]">
                <button
                  type="button"
                  onClick={() => setIsThermalReceiptModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-[#cac4d0] hover:bg-[#ebeaff] hover:border-[#4648d4] text-[#4648d4] text-xs font-black shadow-2xs transition-all cursor-pointer"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Lihat / Cetak Struk Antrian Thermal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-5 space-y-4">
        {/* Search & Category Pills */}
        <div className="bg-white rounded-2xl p-4 border border-[#e2e1ec] shadow-xs space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu makanan, minuman, atau snack..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f8f9fe] border border-[#cac4d0] text-xs sm:text-sm font-medium text-[#1b1b23] focus:bg-white focus:border-[#4648d4] focus:outline-none focus:ring-1 focus:ring-[#4648d4]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categoryNames.map((catName) => (
              <button
                key={catName}
                type="button"
                onClick={() => setSelectedCategory(catName)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === catName
                    ? 'bg-[#4648d4] text-white shadow-xs'
                    : 'bg-[#f3f2fa] text-[#767680] hover:bg-[#ebeaff] hover:text-[#4648d4]'
                }`}
              >
                {catName}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3 sm:gap-4">
          {filteredProducts.map((product) => {
            const inCartItem = customerCart.find((c) => c.productId === product.id);
            const isOutOfStock = product.stock <= 0 || !product.isAvailable;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-[#e2e1ec] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Product Image & Stock Badge */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isOutOfStock ? (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Stok Habis
                      </span>
                    </div>
                  ) : (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                        Tersedia: {product.stock}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <span className="bg-white/90 backdrop-blur-xs text-[#4648d4] text-[10px] font-black px-2 py-0.5 rounded-lg shadow-2xs">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#1b1b23] line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-[#767680] font-mono">{product.sku}</p>
                    <p className="text-xs sm:text-sm font-black text-[#4648d4] mt-1">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                  </div>

                  {/* Add / Adjust Controls */}
                  <div className="pt-2 border-t border-[#f3f2fa]">
                    {inCartItem ? (
                      <div className="flex items-center justify-between bg-[#ebeaff] p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, -1)}
                          className="h-7 w-7 rounded-lg bg-white text-[#4648d4] flex items-center justify-center font-bold shadow-2xs hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-black text-[#4648d4] px-2">
                          {inCartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, 1)}
                          disabled={inCartItem.quantity >= product.stock}
                          className="h-7 w-7 rounded-lg bg-[#4648d4] text-white flex items-center justify-center font-bold shadow-2xs hover:bg-[#383ab2] disabled:opacity-50 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCustomerCart(product)}
                        disabled={isOutOfStock}
                        className="w-full flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-extrabold bg-[#4648d4] hover:bg-[#383ab2] active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Pesan</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#e2e1ec] space-y-2">
            <AlertCircle className="h-10 w-10 text-[#767680] mx-auto" />
            <h4 className="text-sm font-extrabold text-[#1b1b23]">Menu tidak ditemukan</h4>
            <p className="text-xs text-[#767680]">Coba kata kunci pencarian lain atau pilih kategori Semua.</p>
          </div>
        )}
      </main>

      {/* Floating Bottom Order Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-3 inset-x-3 max-w-xl mx-auto z-40 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-[#1b1b23] text-white p-3.5 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-3 pl-1">
              <div className="h-10 w-10 rounded-2xl bg-[#4648d4] text-white flex items-center justify-center font-black text-xs shadow-md">
                {totalItemsCount}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Estimasi ({totalItemsCount} Menu)
                </span>
                <p className="text-base font-black text-amber-300 tracking-tight">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTrayOpen(true)}
              className="flex items-center gap-1.5 bg-[#4648d4] hover:bg-[#383ab2] active:scale-95 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <span>Lihat Baki & Pesan</span>
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Customer Tray / Order Summary Drawer */}
      {isTrayOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[#f3f2fa] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#ebeaff] text-[#4648d4] flex items-center justify-center font-bold">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1b1b23]">Baki Pesanan Anda</h3>
                  <p className="text-xs text-[#767680] font-medium">{totalItemsCount} item dipilih</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrayOpen(false)}
                className="p-2 rounded-xl text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {customerCart.length === 0 ? (
                <div className="text-center py-16 space-y-2 text-[#767680]">
                  <ShoppingBag className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-[#1b1b23]">Baki Anda Masih Kosong</p>
                  <p className="text-xs">Silakan pilih menu dari katalog untuk memesan.</p>
                </div>
              ) : (
                customerCart.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-[#fcf8ff] p-3.5 rounded-2xl border border-[#e2e1ec] space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="h-12 w-12 rounded-xl object-cover border border-[#e2e1ec] shrink-0"
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-extrabold text-[#1b1b23] line-clamp-1">
                          {item.productName}
                        </h4>
                        <p className="text-xs font-black text-[#4648d4] mt-0.5">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#e2e1ec]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="h-6 w-6 rounded-lg bg-[#f3f2fa] text-[#4648d4] flex items-center justify-center font-bold hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black px-1">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="h-6 w-6 rounded-lg bg-[#4648d4] text-white flex items-center justify-center font-bold hover:bg-[#383ab2] cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Notes per item */}
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(item.productId, e.target.value)}
                      placeholder="Catatan khusus (contoh: pedas, tanpa es, sedikit gula)..."
                      className="w-full text-[11px] font-medium bg-white px-3 py-1.5 rounded-xl border border-[#cac4d0] focus:border-[#4648d4] focus:outline-none"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Tray Footer / Summary */}
            {customerCart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-[#f3f2fa] bg-[#fcf8ff] space-y-3">
                <div className="space-y-1.5 text-xs text-[#52525c]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#1b1b23]">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak Resto / PB1 ({Math.round((storeProfile.taxRate || 0.1) * 100)}%)</span>
                    <span className="font-bold text-[#1b1b23]">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#1b1b23] pt-1.5 border-t border-[#e2e1ec]">
                    <span>Total Pembayaran</span>
                    <span className="text-base font-black text-[#4648d4]">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsTrayOpen(false);
                    setIsCheckoutModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#4648d4] hover:bg-[#383ab2] active:scale-95 text-white py-3 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  <span>Lanjut ke Check Out Antrian</span>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal: Input Nama, Meja, & Metode Bayar */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-[#ebeaff] text-[#4648d4] flex items-center justify-center font-bold">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1b1b23]">Konfirmasi Pesanan Mandiri</h3>
                  <p className="text-xs text-[#767680] font-medium">Nomor antrian akan diterbitkan otomatis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-2 rounded-xl text-[#767680] hover:bg-[#f3f2fa] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Input Data Pemesan */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-[#1b1b23] mb-1">
                  Nama Anda / Pemesan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama Anda (contoh: Mas Doni, Rian)"
                  className="w-full rounded-xl border border-[#cac4d0] px-3.5 py-2 text-xs font-bold text-[#1b1b23] focus:border-[#4648d4] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-extrabold text-[#1b1b23] mb-1">
                    Tipe Pesanan
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as 'DINE_IN' | 'TAKEAWAY')}
                    className="w-full rounded-xl border border-[#cac4d0] px-3 py-2 text-xs font-bold text-[#1b1b23] focus:border-[#4648d4] focus:outline-none"
                  >
                    <option value="DINE_IN">Makan di Tempat (Dine-in)</option>
                    <option value="TAKEAWAY">Bungkus / Takeaway</option>
                  </select>
                </div>

                {orderType === 'DINE_IN' ? (
                  <div>
                    <label className="block text-xs font-extrabold text-[#1b1b23] mb-1">
                      Nomor Meja
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Contoh: 01, 02"
                      className="w-full rounded-xl border border-[#cac4d0] px-3 py-2 text-xs font-bold text-[#1b1b23] focus:border-[#4648d4] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-extrabold text-[#1b1b23] mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full rounded-xl border border-[#cac4d0] px-3 py-2 text-xs font-bold text-[#1b1b23] focus:border-[#4648d4] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-xs font-extrabold text-[#1b1b23] mb-1.5">
                  Pilihan Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('Bayar di Kasir (Tunai)')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedPaymentMethod === 'Bayar di Kasir (Tunai)'
                        ? 'border-[#4648d4] bg-[#ebeaff] text-[#4648d4]'
                        : 'border-[#cac4d0] bg-white text-[#767680] hover:bg-[#f3f2fa]'
                    }`}
                  >
                    <Banknote className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold">Bayar di Kasir</p>
                      <p className="text-[10px] font-medium text-[#767680]">Tunai saat dipanggil</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('Transfer Bank')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedPaymentMethod === 'Transfer Bank'
                        ? 'border-[#4648d4] bg-[#ebeaff] text-[#4648d4]'
                        : 'border-[#cac4d0] bg-white text-[#767680] hover:bg-[#f3f2fa]'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold">Transfer Bank</p>
                      <p className="text-[10px] font-medium text-[#767680]">BCA / BRI / Mandiri</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* If Transfer Bank is selected, show store bank accounts */}
              {selectedPaymentMethod === 'Transfer Bank' && (
                <div className="bg-sky-50 p-3 rounded-2xl border border-sky-200 space-y-2">
                  <span className="text-[11px] font-extrabold text-sky-800">
                    Rekening Toko untuk Pembayaran Transfer:
                  </span>
                  {(storeProfile.bankAccounts || [
                    { bankName: 'BCA', accountNumber: '8830-1928-33', accountHolder: 'BUDI SANTOSO / TOKO 2R' },
                    { bankName: 'BRI', accountNumber: '0206-01-002849-50-8', accountHolder: 'TOKO 2R MAJU BERSAMA' },
                  ]).map((bank, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2 rounded-xl border border-sky-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-black text-[#1b1b23]">{bank.bankName}</span>: {bank.accountNumber}
                        <p className="text-[10px] text-slate-500 font-semibold">a.n. {bank.accountHolder}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyBank(bank.accountNumber)}
                        className="text-[10px] font-bold px-2 py-1 bg-sky-100 text-sky-800 rounded-lg hover:bg-sky-200 cursor-pointer"
                      >
                        {copiedBank === bank.accountNumber ? 'Disalin!' : 'Salin'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Total & Check Out */}
              <div className="bg-[#fcf8ff] p-3.5 rounded-2xl border border-[#d8d6fc] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-[#767680] uppercase">Total Tagihan</span>
                  <p className="text-xl font-black text-[#4648d4]">{formatCurrency(total)}</p>
                </div>
                <span className="text-xs font-extrabold bg-[#ebeaff] text-[#4648d4] px-3 py-1 rounded-xl">
                  {totalItemsCount} Menu
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl border border-[#cac4d0] text-xs font-bold text-[#767680] hover:bg-[#f3f2fa] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                className="flex-2 py-2.5 rounded-2xl bg-[#4648d4] hover:bg-[#383ab2] text-white text-xs font-black shadow-md transition-all cursor-pointer"
              >
                Kirim Pesanan & Ambil Antrian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETAIL THERMAL QUEUE RECEIPT MODAL */}
      <QueueOrderReceiptModal
        order={liveTicket}
        storeProfile={storeProfile}
        isOpen={isThermalReceiptModalOpen}
        onClose={() => setIsThermalReceiptModalOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
};

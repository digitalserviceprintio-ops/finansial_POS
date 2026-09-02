import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  User,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Tag,
  CreditCard,
  ScanLine,
  Receipt,
  Keyboard,
  Zap,
  ChefHat,
  Building2,
  Smartphone,
  ExternalLink,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCategory, Product, PaymentMethod } from '../types';
import { BarcodeScannerModal } from '../components/modals/BarcodeScannerModal';

export const POSView: React.FC = () => {
  const {
    products,
    categories: appCategories,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    selectedCustomer,
    setSelectedCustomer,
    customers,
    setCurrentTab,
    setIsPaymentModalOpen,
    setPendingPaymentMethod,
    storeProfile,
    formatCurrency,
    showToast,
    customerOrders,
    setIsCatalogQRModalOpen,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const recognitionRef = useRef<any>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
  }, []);

  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Browser Anda belum mendukung input suara. Gunakan Chrome atau Edge.', 'warning');
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID'; // Bahasa Indonesia
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        showToast('🎙️ Mendengarkan suara... Ucapkan nama produk', 'info');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setVoiceTranscript(transcript);
        setPosSearchQuery(transcript);

        if (event.results[current].isFinal) {
          setIsListening(false);
          // Try to auto-match product if exact match or clear match
          const cleanVoice = transcript.trim().toLowerCase();
          const matched = products.find(
            (p) =>
              p.name.toLowerCase().includes(cleanVoice) ||
              cleanVoice.includes(p.name.toLowerCase()) ||
              p.sku.toLowerCase() === cleanVoice
          );

          if (matched) {
            if (matched.stock > 0 && matched.isAvailable) {
              showToast(`Suara terdeteksi: "${transcript}" - Produk ditemukan!`, 'success');
            } else {
              showToast(`Suara terdeteksi: "${transcript}" (Stok habis)`, 'warning');
            }
          } else {
            showToast(`Suara terdeteksi: "${transcript}"`, 'info');
          }
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('Izin mikrofon ditolak. Izinkan akses mikrofon di browser.', 'warning');
        } else if (event.error === 'no-speech') {
          showToast('Tidak ada suara terdeteksi. Silakan coba lagi.', 'info');
        } else {
          showToast(`Gagal memproses suara: ${event.error}`, 'warning');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
      showToast('Tidak dapat mengaktifkan mikrofon.', 'warning');
    }
  };

  const categoryNames: string[] = ['Semua', ...appCategories.map((c) => c.name)];
  const activeOrdersCount = customerOrders.filter(
    (o) => o.status === 'MENUNGGU' || o.status === 'DIPROSES'
  ).length;

  // Global hotkeys for ultra-fast cashier transactions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 focuses search
      if (e.key === 'F1') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-product') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
      // F2 or Ctrl+B / Cmd+B opens barcode scanner
      if (e.key === 'F2' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        setIsBarcodeScannerOpen(true);
      }
      // F3 triggers voice search
      if (e.key === 'F3' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        startVoiceSearch();
      }
      // F4 opens customer catalog QR
      if (e.key === 'F4') {
        e.preventDefault();
        setIsCatalogQRModalOpen(true);
      }
      // F8 triggers cash payment
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setPendingPaymentMethod('Tunai');
          setIsPaymentModalOpen(true);
        } else {
          showToast('Keranjang masih kosong, pilih produk terlebih dahulu.', 'info');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, setPendingPaymentMethod, setIsPaymentModalOpen, setIsCatalogQRModalOpen, showToast, isListening]);

  // Filter products by category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Semua' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(posSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Enter key in Search (for manual SKU typing or hardware barcode scanners)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && posSearchQuery.trim()) {
      e.preventDefault();
      const clean = posSearchQuery.trim().toLowerCase();
      // Look for exact SKU match first, then exact ID, then single filtered result
      const exactMatch =
        products.find((p) => p.sku.toLowerCase() === clean || p.id.toLowerCase() === clean) ||
        (filteredProducts.length === 1 ? filteredProducts[0] : null);

      if (exactMatch) {
        if (exactMatch.stock <= 0 || !exactMatch.isAvailable) {
          showToast(`Produk "${exactMatch.name}" stok habis!`, 'warning');
        } else {
          addToCart(exactMatch);
          showToast(`+1 ${exactMatch.name} (${exactMatch.sku}) masuk keranjang`, 'success');
          setPosSearchQuery('');
        }
      } else if (filteredProducts.length > 1) {
        showToast(`Ditemukan ${filteredProducts.length} produk yang cocok. Pilih produk dari daftar.`, 'info');
      } else {
        showToast(`Barcode / SKU "${posSearchQuery}" tidak ditemukan`, 'warning');
      }
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  const tax = Math.round(subtotal * storeProfile.taxRate);
  const total = subtotal + tax;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleQuickPay = (method: PaymentMethod) => {
    if (cart.length === 0) {
      showToast('Keranjang belanja masih kosong!', 'warning');
      return;
    }
    setPendingPaymentMethod(method);
    setIsPaymentModalOpen(true);
  };

  return (
    <div id="pos-view" className="flex flex-col lg:flex-row h-full gap-6 pb-20 lg:pb-0">
      {/* Left side: Product Catalog & Category filters */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Akses Cepat Transaksi & QR Code Katalog Pelanggan Banner */}
        <div className="bg-gradient-to-r from-[#4648d4] via-[#5659e4] to-[#118eea] text-white p-3.5 sm:p-4 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <Zap className="h-5 w-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-tight">
                  Akses Cepat Kasir & Self-Order
                </span>
                <span className="bg-white/20 text-[10px] font-bold px-2 py-0.2 rounded-full backdrop-blur-xs">
                  Sistem Antrian Otomatis
                </span>
              </div>
              <p className="text-[11px] text-white/90 font-medium">
                Barcode Scanner: <kbd className="px-1 py-0.5 rounded bg-black/20 font-mono text-[10px]">F2</kbd> • QR Katalog: <kbd className="px-1 py-0.5 rounded bg-black/20 font-mono text-[10px]">F4</kbd> • Bayar: <kbd className="px-1 py-0.5 rounded bg-black/20 font-mono text-[10px]">F8</kbd>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {/* QR Katalog Standee */}
            <button
              type="button"
              onClick={() => setIsCatalogQRModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white text-[#4648d4] hover:bg-sky-50 active:scale-95 px-3 py-2 rounded-2xl text-[11px] font-black shadow-xs transition-all cursor-pointer"
              title="Tampilkan QR Code Katalog Pelanggan (F4)"
            >
              <QrCode className="h-4 w-4 text-[#118eea]" />
              <span>QR Katalog (F4)</span>
            </button>

            {/* Antrian Pesanan Counter */}
            <button
              type="button"
              onClick={() => setCurrentTab('orders')}
              className="flex-1 sm:flex-none relative flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 px-3 py-2 rounded-2xl text-[11px] font-black shadow-xs transition-all cursor-pointer"
              title="Lihat Dashboard Antrian Pesanan Masuk"
            >
              <ChefHat className="h-4 w-4" />
              <span>Antrian</span>
              {activeOrdersCount > 0 && (
                <span className="h-4 min-w-[16px] px-1 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            {/* Suara Voice Search Quick Button */}
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-bold backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-2 ring-white/50'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Cari Produk dengan Suara (F3)"
            >
              {isListening ? (
                <Volume2 className="h-4 w-4 text-amber-200 animate-bounce" />
              ) : (
                <Mic className="h-4 w-4 text-amber-300" />
              )}
              <span className="hidden sm:inline">{isListening ? 'Mendengarkan...' : 'Suara (F3)'}</span>
              <span className="sm:hidden">{isListening ? 'Mendengar' : 'Suara'}</span>
            </button>

            {/* Barcode Camera Scan */}
            <button
              type="button"
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white px-2.5 py-2 rounded-2xl text-[11px] font-bold backdrop-blur-xs transition-all cursor-pointer"
              title="Scan Barcode Kamera (F2)"
            >
              <ScanLine className="h-4 w-4 text-amber-300" />
              <span className="hidden sm:inline">Scan (F2)</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-3xl p-4 border border-[#e2e1ec] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input & Barcode Scan Trigger */}
            <div className="flex items-center gap-2 w-full flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                <input
                  id="pos-search-product"
                  type="text"
                  placeholder="Cari menu / scan barcode / tekan F3 untuk suara..."
                  value={posSearchQuery}
                  onChange={(e) => setPosSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className={`w-full rounded-2xl border py-2.5 pl-10 pr-18 text-xs sm:text-sm text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20 transition-all ${
                    isListening
                      ? 'border-rose-400 bg-rose-50/50 ring-2 ring-rose-300'
                      : 'border-[#d2d1dc] bg-[#fcf8ff]'
                  }`}
                />

                {/* Right action icons: Clear & Voice Input */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {posSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPosSearchQuery('')}
                      className="p-1 text-xs text-[#767680] hover:text-[#1b1b23] cursor-pointer rounded-full hover:bg-slate-200/50"
                      title="Hapus pencarian"
                    >
                      ✕
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={startVoiceSearch}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                        : 'text-[#4648d4] hover:bg-[#ebeaff]'
                    }`}
                    title={
                      voiceSupported
                        ? isListening
                          ? 'Klik untuk berhenti mendengar'
                          : 'Cari dengan Suara (F3)'
                        : 'Browser tidak mendukung Web Speech API'
                    }
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Barcode Scanner Button */}
              <button
                id="btn-scan-barcode-pos"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-[#4648d4] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#3435ad] active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Buka Kamera Barcode Scanner POS (Hotkey: F2)"
              >
                <ScanLine className="h-4 w-4" />
                <span className="hidden sm:inline">Scan Barcode</span>
                <span className="sm:hidden">Scan</span>
              </button>

              {/* Riwayat Transaksi Quick Button */}
              <button
                id="btn-pos-history-shortcut"
                onClick={() => setCurrentTab('transactions')}
                className="flex items-center gap-1.5 rounded-2xl border border-[#e2e1ec] bg-[#fcf8ff] px-3 py-2.5 text-xs font-bold text-[#4648d4] hover:bg-[#ebeaff] transition-all shrink-0 cursor-pointer"
                title="Lihat Riwayat Transaksi & Cetak Ulang Struk"
              >
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Riwayat</span>
              </button>
            </div>

            {/* Quick Count Info */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#767680] whitespace-nowrap self-end sm:self-center">
              <Tag className="h-3.5 w-3.5 text-[#4648d4]" />
              <span>{filteredProducts.length} Menu</span>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categoryNames.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`cat-chip-${cat.toLowerCase()}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'bg-[#f3f2fa] text-[#46464f] hover:bg-[#e8e7f0] hover:text-[#1b1b23]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Voice Search Active Status Bar */}
          {isListening && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-md animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-bounce">
                  <Mic className="h-4 w-4 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black leading-tight flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-300 animate-ping" />
                    <span>Mendengarkan Suara Kasir...</span>
                  </p>
                  <p className="text-[11px] text-rose-100 truncate mt-0.5 font-medium">
                    {voiceTranscript ? `"${voiceTranscript}"` : 'Sebutkan nama produk (contoh: "Kopi Susu", "Ayam Bakar")...'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startVoiceSearch}
                className="px-3 py-1.5 rounded-xl bg-white text-rose-700 text-xs font-black shadow-xs hover:bg-rose-50 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                Selesai
              </button>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#d2d1dc] bg-white p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-[#767680]/50 mb-3" />
              <p className="text-sm font-bold text-[#1b1b23]">Produk Tidak Ditemukan</p>
              <p className="text-xs text-[#767680] mt-1 max-w-xs">
                Tidak ada produk dengan kata kunci &quot;{posSearchQuery}&quot; pada kategori {selectedCategory}.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('Semua');
                  setPosSearchQuery('');
                }}
                className="mt-4 rounded-xl bg-[#ebeaff] px-4 py-2 text-xs font-bold text-[#4648d4] hover:bg-[#deddfc] transition-colors"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                const isOutOfStock = product.stock <= 0 || !product.isAvailable;

                return (
                  <div
                    key={product.id}
                    id={`pos-product-${product.id}`}
                    onClick={() => {
                      if (!isOutOfStock) {
                        addToCart(product);
                      } else {
                        showToast(`Stok "${product.name}" habis!`, 'warning');
                      }
                    }}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-3 transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'border-gray-200 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'border-[#4648d4] ring-2 ring-[#4648d4]/20 shadow-sm'
                        : 'border-[#e2e1ec] hover:border-[#4648d4]/50 hover:shadow-md'
                    }`}
                  >
                    {/* Image & Badge */}
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-[#f3f2fa] mb-2.5">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />

                      {/* Stock status badge */}
                      <span
                        className={`absolute top-2 right-2 rounded-lg px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs shadow-2xs ${
                          product.stock <= 0
                            ? 'bg-rose-500 text-white'
                            : product.stock <= 5
                            ? 'bg-amber-500 text-white'
                            : 'bg-black/60 text-white'
                        }`}
                      >
                        {product.stock <= 0 ? 'Habis' : `Stok: ${product.stock}`}
                      </span>

                      {/* In-cart count bubble */}
                      {inCart && (
                        <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#4648d4] text-[11px] font-bold text-white shadow-md">
                          {inCart.quantity}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-xs font-bold text-[#1b1b23] line-clamp-1 group-hover:text-[#4648d4]">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-[10px] font-mono text-[#767680]">{product.sku}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs sm:text-sm font-extrabold text-[#4648d4]">
                          {formatCurrency(product.sellingPrice)}
                        </span>
                        <span className="text-[10px] text-[#767680] font-medium bg-[#f3f2fa] px-1.5 py-0.5 rounded">
                          /{product.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Active Cart & Checkout Panel */}
      <div id="pos-cart-panel" className="w-full lg:w-96 flex flex-col rounded-3xl border border-[#e2e1ec] bg-white shadow-xs scroll-mt-20">
        {/* Cart Header */}
        <div className="p-4 border-b border-[#f3f2fa] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ebeaff] text-[#4648d4]">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-extrabold text-[#1b1b23]">Keranjang Kasir</h2>
            </div>
            {cart.length > 0 && (
              <button
                id="btn-clear-cart"
                onClick={clearCart}
                className="flex items-center gap-1 text-[11px] font-bold text-[#ba1a1a] hover:underline cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Customer Selector Dropdown */}
          <div className="relative">
            <div
              id="btn-select-customer-pos"
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-[#fcf8ff] border border-[#e2e1ec] hover:border-[#4648d4] cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <User className="h-4 w-4 text-[#4648d4] shrink-0" />
                <div className="truncate text-left">
                  <p className="text-xs font-bold text-[#1b1b23] truncate">
                    {selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum (Tanpa Member)'}
                  </p>
                  <p className="text-[10px] text-[#767680] truncate">
                    {selectedCustomer
                      ? `${selectedCustomer.phone || 'Tanpa no HP'} • Poin: ${selectedCustomer.points || 0}`
                      : 'Klik untuk pilih member'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#4648d4] bg-[#ebeaff] px-2 py-0.5 rounded-full shrink-0">
                {selectedCustomer?.tier || 'Ganti'}
              </span>
            </div>

            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-[#e2e1ec] bg-white p-2 shadow-xl space-y-1">
                <div
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerDropdown(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl text-xs hover:bg-[#f3f2fa] cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-[#767680]" />
                  <span>Pelanggan Umum</span>
                </div>

                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setShowCustomerDropdown(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer ${
                      selectedCustomer?.id === c.id ? 'bg-[#ebeaff] text-[#4648d4] font-bold' : 'hover:bg-[#f3f2fa]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{c.name}</span>
                        {c.tier && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                            {c.tier}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#767680]">
                        {c.phone || 'Tanpa no HP'} • {c.points || 0} Poin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Itemized List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[360px]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <ShoppingBag className="h-10 w-10 text-[#767680]/40 mb-2" />
              <p className="text-xs font-bold text-[#1b1b23]">Keranjang Kosong</p>
              <p className="text-[11px] text-[#767680] mt-0.5">Pilih produk di katalog atau scan barcode barang.</p>
              <button
                id="btn-scan-empty-cart"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="mt-3.5 flex items-center gap-1.5 rounded-xl bg-[#ebeaff] px-3.5 py-1.5 text-xs font-bold text-[#4648d4] hover:bg-[#deddfc] transition-colors"
              >
                <ScanLine className="h-3.5 w-3.5" />
                <span>Scan Barcode Kamera</span>
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                id={`cart-item-${item.product.id}`}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl border border-[#f3f2fa] bg-[#fcf8ff]"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-12 w-12 rounded-xl object-cover bg-white"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#1b1b23] truncate">{item.product.name}</h4>
                  <p className="text-[11px] font-semibold text-[#4648d4]">
                    {formatCurrency(item.product.sellingPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-white rounded-xl border border-[#e2e1ec] p-1">
                  <button
                    id={`cart-minus-${item.product.id}`}
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="h-5 w-5 flex items-center justify-center rounded-lg text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
                  >
                    {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-[#ba1a1a]" /> : <Minus className="h-3 w-3" />}
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-[#1b1b23]">{item.quantity}</span>
                  <button
                    id={`cart-plus-${item.product.id}`}
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="h-5 w-5 flex items-center justify-center rounded-lg text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Calculations & Payment Trigger */}
        <div className="p-4 border-t border-[#f3f2fa] bg-[#fcf8ff] space-y-3 rounded-b-3xl">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#767680]">
              <span>Subtotal ({totalItemsCount} item)</span>
              <span className="font-semibold text-[#1b1b23]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#767680]">
              <span>Pajak Resto / PB1 ({Math.round(storeProfile.taxRate * 100)}%)</span>
              <span className="font-semibold text-[#1b1b23]">{formatCurrency(tax)}</span>
            </div>
            <div className="border-t border-[#e2e1ec] pt-2 flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#1b1b23]">Total Pembayaran</span>
              <span className="text-lg font-extrabold text-[#4648d4]">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Quick Payment Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="pos-pay-transfer-btn"
              disabled={cart.length === 0}
              onClick={() => handleQuickPay('Transfer Bank')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#4648d4] bg-[#ebeaff] py-2.5 text-xs font-bold text-[#4648d4] hover:bg-[#4648d4] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <Building2 className="h-4 w-4" />
              <span>Transfer Bank</span>
            </button>
            <button
              id="pos-pay-cash-btn"
              disabled={cart.length === 0}
              onClick={() => handleQuickPay('Tunai')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <Banknote className="h-4 w-4" />
              <span>Bayar Tunai</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Quick Cart Bar for Mobile (when items in cart) */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-3.5 right-3.5 sm:left-6 sm:right-6 lg:hidden z-30 flex items-center justify-between gap-3 p-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-black text-xs text-white shrink-0 shadow-xs">
              {totalItemsCount}
            </div>
            <div className="truncate">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Belanja</p>
              <p className="text-sm font-black text-white truncate">{formatCurrency(total)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                const el = document.getElementById('pos-cart-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
            >
              Lihat Rincian
            </button>
            <button
              onClick={() => handleQuickPay('Tunai')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-extrabold text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Banknote className="h-4 w-4" />
              <span>Bayar</span>
            </button>
          </div>
        </div>
      )}

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
      />
    </div>
  );
};

import React, { useState } from 'react';
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
    setIsPaymentModalOpen,
    setPendingPaymentMethod,
    storeProfile,
    formatCurrency,
    showToast,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  const categoryNames: string[] = ['Semua', ...appCategories.map((c) => c.name)];

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
        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-[#e2e1ec] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input & Barcode Scan Trigger */}
            <div className="flex items-center gap-2 w-full flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                <input
                  id="pos-search-product"
                  type="text"
                  placeholder="Cari produk kasir berdasarkan nama atau SKU..."
                  value={posSearchQuery}
                  onChange={(e) => setPosSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20"
                />
                {posSearchQuery && (
                  <button
                    onClick={() => setPosSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#767680] hover:text-[#1b1b23]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Barcode Scanner Button */}
              <button
                id="btn-scan-barcode-pos"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#4648d4] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#3435ad] active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Buka Kamera Barcode Scanner POS"
              >
                <ScanLine className="h-4 w-4" />
                <span className="hidden sm:inline">Scan Barcode</span>
                <span className="sm:hidden">Scan</span>
              </button>
            </div>

            {/* Quick Count Info */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#767680] whitespace-nowrap self-end sm:self-center">
              <Tag className="h-3.5 w-3.5 text-[#4648d4]" />
              <span>{filteredProducts.length} Produk Tersedia</span>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categoryNames.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`cat-chip-${cat.toLowerCase()}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
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
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d2d1dc] bg-white p-12 text-center">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= 5;

                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-3 transition-all duration-150 ${
                      isOutOfStock
                        ? 'opacity-60 border-[#e2e1ec] cursor-not-allowed'
                        : 'border-[#e2e1ec] hover:border-[#4648d4] hover:shadow-md cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    {/* Badge In Cart / Low Stock */}
                    {inCart && (
                      <div className="absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#4648d4] text-[11px] font-bold text-white shadow-xs">
                        {inCart.quantity}
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      {isOutOfStock ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Sisa {product.stock}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Stok {product.stock}
                        </span>
                      )}
                    </div>

                    {/* Product Image */}
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-[#fcf8ff] mb-2.5">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>

                    {/* Product Details */}
                    <div>
                      <span className="text-[10px] font-semibold text-[#767680] uppercase tracking-wider">
                        {product.sku}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1b1b23] line-clamp-1 leading-snug">
                        {product.name}
                      </h4>
                    </div>

                    {/* Price and Add Action */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#f3f2fa]">
                      <span className="text-xs sm:text-sm font-extrabold text-[#4648d4]">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <button
                        id={`btn-add-${product.id}`}
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) addToCart(product);
                        }}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                          isOutOfStock
                            ? 'bg-[#f3f2fa] text-[#767680] cursor-not-allowed'
                            : 'bg-[#ebeaff] text-[#4648d4] hover:bg-[#4648d4] hover:text-white shadow-xs'
                        }`}
                        title="Tambah ke Keranjang"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Order Cart & Bill Summary */}
      <div className="w-full lg:w-96 flex flex-col rounded-2xl border border-[#e2e1ec] bg-white shadow-xs">
        {/* Header: Title & Customer Selector */}
        <div className="p-4 border-b border-[#f3f2fa] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ebeaff] text-[#4648d4]">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1b1b23]">Pesanan Aktif</h3>
            </div>
            {cart.length > 0 && (
              <button
                id="pos-clear-cart-btn"
                onClick={clearCart}
                className="text-xs font-semibold text-[#ba1a1a] hover:underline"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="relative">
            <div
              id="customer-selector-btn"
              onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              className="flex items-center justify-between p-2.5 rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] cursor-pointer hover:border-[#4648d4] transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-[#ebeaff] text-[#4648d4] flex items-center justify-center">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1b1b23]">
                    {selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum'}
                  </p>
                  <p className="text-[10px] text-[#767680]">
                    {selectedCustomer?.phone || 'Transaksi Reguler'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#4648d4] hover:underline">Ganti</span>
            </div>

            {showCustomerDropdown && (
              <div className="absolute left-0 right-0 mt-1 rounded-xl border border-[#e2e1ec] bg-white p-2 shadow-xl z-30 max-h-48 overflow-y-auto">
                <div
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerDropdown(false);
                  }}
                  className="p-2 text-xs font-medium hover:bg-[#fcf8ff] rounded-lg cursor-pointer text-[#46464f]"
                >
                  Pelanggan Umum (Non-Member)
                </div>
                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setShowCustomerDropdown(false);
                    }}
                    className={`p-2 text-xs font-medium hover:bg-[#fcf8ff] rounded-lg cursor-pointer flex items-center justify-between ${
                      selectedCustomer?.id === c.id ? 'bg-[#ebeaff] text-[#4648d4] font-bold' : 'text-[#1b1b23]'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-[#767680]">{c.phone}</span>
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
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[#f3f2fa] bg-[#fcf8ff]"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-12 w-12 rounded-lg object-cover bg-white"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#1b1b23] truncate">{item.product.name}</h4>
                  <p className="text-[11px] font-semibold text-[#4648d4]">
                    {formatCurrency(item.product.sellingPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-white rounded-lg border border-[#e2e1ec] p-1">
                  <button
                    id={`cart-minus-${item.product.id}`}
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="h-5 w-5 flex items-center justify-center rounded text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
                  >
                    {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-[#ba1a1a]" /> : <Minus className="h-3 w-3" />}
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-[#1b1b23]">{item.quantity}</span>
                  <button
                    id={`cart-plus-${item.product.id}`}
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="h-5 w-5 flex items-center justify-center rounded text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Calculations & Payment Trigger */}
        <div className="p-4 border-t border-[#f3f2fa] bg-[#fcf8ff] space-y-3 rounded-b-2xl">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#767680]">
              <span>Subtotal ({totalItemsCount} item)</span>
              <span className="font-semibold text-[#1b1b23]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#767680]">
              <span>PPN / Pajak Resto ({storeProfile.taxRate * 100}%)</span>
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
              id="pos-pay-qris-btn"
              disabled={cart.length === 0}
              onClick={() => handleQuickPay('QRIS')}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#4648d4] bg-[#ebeaff] py-2.5 text-xs font-bold text-[#4648d4] hover:bg-[#4648d4] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <QrCode className="h-4 w-4" />
              <span>QRIS Instan</span>
            </button>
            <button
              id="pos-pay-cash-btn"
              disabled={cart.length === 0}
              onClick={() => handleQuickPay('Tunai')}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4648d4] py-2.5 text-xs font-bold text-white hover:bg-[#3435ad] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <Banknote className="h-4 w-4" />
              <span>Bayar Tunai</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
      />
    </div>
  );
};

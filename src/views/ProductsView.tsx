import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  Boxes,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory } from '../types';

interface ProductsViewProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const { products, categories: appCategories, deleteProduct, restockProduct, formatCurrency, setCurrentTab, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock' | 'sold'>('name');
  const [quickRestockId, setQuickRestockId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  const categoryOptions: string[] = ['Semua', ...appCategories.map((c) => c.name)];

  // Low stock products calculation based on individual minStockAlert (default 5)
  const lowStockAlertProducts = products.filter(
    (p) => p.stock <= (p.minStockAlert ?? 5)
  );
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Semua' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();

    const minLimit = p.minStockAlert ?? 5;
    let matchesStock = true;
    if (stockFilter === 'available') matchesStock = p.stock > minLimit;
    if (stockFilter === 'low') matchesStock = p.stock <= minLimit;
    if (stockFilter === 'empty') matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
    if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
    if (sortBy === 'stock') return a.stock - b.stock;
    if (sortBy === 'sold') return (b.soldCount || 0) - (a.soldCount || 0);
    return 0;
  });

  const handleQuickRestockSubmit = (id: string, amountToRestock?: number) => {
    const qty = amountToRestock !== undefined ? amountToRestock : restockAmount;
    if (qty > 0) {
      restockProduct(id, qty);
      setQuickRestockId(null);
      showToast(`Berhasil menambah stok (+${qty} unit)`, 'success');
    }
  };

  return (
    <div id="products-view" className="space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1b1b23] tracking-tight">
            Daftar Produk & Stok
          </h1>
          <p className="text-xs text-[#767680] mt-0.5">
            Total {products.length} item terdaftar dalam katalog POS kasir
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-manage-categories"
            onClick={() => setCurrentTab('categories')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#4648d4]/30 bg-[#ebeaff] px-3.5 py-2.5 text-xs font-bold text-[#4648d4] hover:bg-[#d8d6fc] transition-all"
          >
            <span>Kelola Kategori ({appCategories.length})</span>
          </button>
          <button
            id="add-product-btn"
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4648d4] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#3435ad] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Peringatan Stok Minimum Banner Alert */}
      {lowStockAlertProducts.length > 0 && (
        <div
          id="min-stock-alert-banner"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-2xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/70 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950 flex items-center gap-2">
                <span>Peringatan Stok Minimum!</span>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                  {lowStockAlertProducts.length} Produk Perlu Diisi Ulang
                </span>
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Ada {outOfStockCount > 0 ? `${outOfStockCount} produk habis dan ` : ''}
                {lowStockAlertProducts.length} produk berada pada atau di bawah batas minimum stok yang telah Anda tetapkan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                stockFilter === 'low'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-amber-200/80 text-amber-900 hover:bg-amber-300'
              }`}
            >
              {stockFilter === 'low' ? 'Tampilkan Semua' : 'Filter Produk Kritis'}
            </button>
          </div>
        </div>
      )}

      {/* Filter & Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e2e1ec] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
            <input
              id="inventory-search"
              type="text"
              placeholder="Cari nama atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2 pl-9 pr-3 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              id="inventory-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2 px-3 text-xs font-medium text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  Kategori: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock filter with minimum alert option */}
          <div>
            <select
              id="inventory-stock-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'available' | 'low' | 'empty')}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2 px-3 text-xs font-medium text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Status Stok ({products.length})</option>
              <option value="low">⚠️ Di Bawah Batas Min. ({lowStockAlertProducts.length})</option>
              <option value="empty">❌ Stok Habis ({outOfStockCount})</option>
              <option value="available">✅ Stok Aman ({products.length - lowStockAlertProducts.length})</option>
            </select>
          </div>

          {/* Sort selector */}
          <div>
            <select
              id="inventory-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2 px-3 text-xs font-medium text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
            >
              <option value="name">Urutan: Nama (A - Z)</option>
              <option value="stock">Stok: Paling Sedikit (Prioritas Restok)</option>
              <option value="price_asc">Harga: Terendah ke Tertinggi</option>
              <option value="price_desc">Harga: Tertinggi ke Terendah</option>
              <option value="sold">Paling Terlaris</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Data Table */}
      <div className="bg-white rounded-2xl border border-[#e2e1ec] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e1ec] bg-[#fcf8ff] text-[#767680]">
                <th className="py-3 px-4 font-bold uppercase">Produk</th>
                <th className="py-3 px-4 font-bold uppercase">SKU</th>
                <th className="py-3 px-4 font-bold uppercase">Harga Beli</th>
                <th className="py-3 px-4 font-bold uppercase">Harga Jual</th>
                <th className="py-3 px-4 font-bold uppercase">Margin</th>
                <th className="py-3 px-4 font-bold uppercase">Stok & Peringatan Min.</th>
                <th className="py-3 px-4 font-bold uppercase">Terjual</th>
                <th className="py-3 px-4 font-bold uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2fa]">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#767680]">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-xs text-[#1b1b23]">Tidak ada produk yang cocok</p>
                    <p className="text-[11px] mt-0.5">Coba sesuaikan filter pencarian Anda</p>
                  </td>
                </tr>
              ) : (
                sortedProducts.map((prod) => {
                  const marginRp = prod.sellingPrice - prod.purchasePrice;
                  const marginPercent = Math.round((marginRp / prod.sellingPrice) * 100);
                  const minLimit = prod.minStockAlert ?? 5;
                  const isOutOfStock = prod.stock <= 0;
                  const isUnderMinLimit = prod.stock > 0 && prod.stock <= minLimit;

                  return (
                    <tr
                      key={prod.id}
                      className={`transition-colors ${
                        isOutOfStock
                          ? 'bg-red-50/40 hover:bg-red-50/70'
                          : isUnderMinLimit
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-[#fcf8ff]'
                      }`}
                    >
                      {/* Product Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="h-10 w-10 rounded-xl object-cover bg-[#f3f2fa] shrink-0 border border-[#e2e1ec]"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-bold text-[#1b1b23] line-clamp-1">{prod.name}</p>
                            <span className="rounded bg-[#ebeaff] px-1.5 py-0.5 text-[10px] font-semibold text-[#4648d4]">
                              {prod.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-medium text-[#767680]">{prod.sku}</td>

                      {/* Purchase Price */}
                      <td className="py-3 px-4 text-[#767680]">{formatCurrency(prod.purchasePrice)}</td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 font-bold text-[#1b1b23]">{formatCurrency(prod.sellingPrice)}</td>

                      {/* Margin */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <TrendingUp className="h-3 w-3" />
                          <span>{marginPercent}%</span>
                          <span className="text-[10px] text-[#767680] font-normal">
                            (+{formatCurrency(marginRp)})
                          </span>
                        </div>
                      </td>

                      {/* Stock Status & Min Stock Alert */}
                      <td className="py-3 px-4">
                        {quickRestockId === prod.id ? (
                          <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-white border border-[#4648d4] shadow-xs">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={restockAmount}
                                onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                                className="w-16 rounded-lg border border-[#d2d1dc] px-2 py-1 text-xs font-bold text-center"
                                autoFocus
                              />
                              <button
                                onClick={() => handleQuickRestockSubmit(prod.id)}
                                className="rounded-lg bg-[#4648d4] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#3435ad]"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setQuickRestockId(null)}
                                className="text-[11px] text-[#767680] px-1 hover:text-[#1b1b23]"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <span>Preset:</span>
                              <button
                                onClick={() => handleQuickRestockSubmit(prod.id, 5)}
                                className="rounded bg-[#f3f2fa] px-1.5 py-0.5 hover:bg-[#ebeaff] text-[#4648d4] font-bold"
                              >
                                +5
                              </button>
                              <button
                                onClick={() => handleQuickRestockSubmit(prod.id, 10)}
                                className="rounded bg-[#f3f2fa] px-1.5 py-0.5 hover:bg-[#ebeaff] text-[#4648d4] font-bold"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleQuickRestockSubmit(prod.id, 25)}
                                className="rounded bg-[#f3f2fa] px-1.5 py-0.5 hover:bg-[#ebeaff] text-[#4648d4] font-bold"
                              >
                                +25
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  isOutOfStock
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : isUnderMinLimit
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {isOutOfStock ? (
                                  <>
                                    <AlertCircle className="h-3 w-3 text-red-600" />
                                    <span>Habis (0)</span>
                                  </>
                                ) : isUnderMinLimit ? (
                                  <>
                                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                                    <span>Menipis ({prod.stock})</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    <span>{prod.stock} unit</span>
                                  </>
                                )}
                              </span>

                              <button
                                onClick={() => {
                                  setQuickRestockId(prod.id);
                                  setRestockAmount(10);
                                }}
                                className="rounded-md bg-[#f3f2fa] px-2 py-0.5 text-[10px] font-bold text-[#4648d4] hover:bg-[#ebeaff] transition-colors"
                                title="Tambah Stok Cepat"
                              >
                                +Restok
                              </button>
                            </div>

                            {/* Alert threshold indicator */}
                            <div className="flex items-center gap-1 text-[10px] text-[#767680]">
                              <span>Batas Min:</span>
                              <strong className={isUnderMinLimit || isOutOfStock ? 'text-amber-800 font-bold' : 'text-[#1b1b23]'}>
                                {minLimit} unit
                              </strong>
                              {(isUnderMinLimit || isOutOfStock) && (
                                <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">
                                  (Perlu Re-stock)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Sold Count */}
                      <td className="py-3 px-4 font-semibold text-[#46464f]">
                        {prod.soldCount || 0} unit
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`edit-prod-${prod.id}`}
                            onClick={() => onOpenEditModal(prod)}
                            className="rounded-lg p-1.5 text-[#767680] hover:bg-[#ebeaff] hover:text-[#4648d4] transition-colors"
                            title="Edit Produk & Batas Stok"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`delete-prod-${prod.id}`}
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus produk "${prod.name}"?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-[#767680] hover:bg-red-50 hover:text-[#ba1a1a] transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


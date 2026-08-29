import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  Package,
  Layers,
  Edit2,
  Trash2,
  TrendingUp,
  ShoppingCart,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Utensils,
  Coffee,
  Cookie,
  ShoppingBag,
  Gift,
  ArrowRight,
  Boxes,
  CheckCircle2,
  AlertCircle,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryItem, Product } from '../types';
import { AddCategoryModal } from '../components/modals/AddCategoryModal';

interface CategoriesViewProps {
  onOpenAddProductModal?: (defaultCategory?: string) => void;
  onOpenEditProductModal?: (product: Product) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Utensils,
  Coffee,
  Cookie,
  ShoppingBag,
  Gift,
  Package,
};

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  onOpenAddProductModal,
  onOpenEditProductModal,
}) => {
  const {
    categories,
    products,
    transactions,
    deleteCategory,
    setCurrentTab,
    formatCurrency,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryItem | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'products' | 'revenue' | 'sold'>('name');

  // Filter categories by search
  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Analytics calculations
  const totalCategoriesCount = categories.length;
  const totalProductsCount = products.length;

  // Compute sales and items per category
  const getCategoryStats = (categoryName: string) => {
    const categoryProducts = products.filter(
      (p) => p.category.toLowerCase() === categoryName.toLowerCase()
    );
    const productIds = new Set(categoryProducts.map((p) => p.id));

    let totalSoldItems = 0;
    let totalRevenue = 0;

    transactions.forEach((trx) => {
      trx.items.forEach((item) => {
        if (productIds.has(item.productId)) {
          totalSoldItems += item.quantity;
          totalRevenue += item.price * item.quantity;
        }
      });
    });

    const totalStock = categoryProducts.reduce((acc, p) => acc + p.stock, 0);
    const lowStockCount = categoryProducts.filter((p) => p.stock <= (p.minStockAlert ?? 5)).length;

    return {
      productCount: categoryProducts.length,
      products: categoryProducts,
      totalSoldItems,
      totalRevenue,
      totalStock,
      lowStockCount,
    };
  };

  // Sort categories
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const statsA = getCategoryStats(a.name);
    const statsB = getCategoryStats(b.name);

    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'products') return statsB.productCount - statsA.productCount;
    if (sortBy === 'revenue') return statsB.totalRevenue - statsA.totalRevenue;
    if (sortBy === 'sold') return statsB.totalSoldItems - statsA.totalSoldItems;
    return 0;
  });

  // Find top category by revenue
  const topCategory = categories.reduce<CategoryItem | null>((top, current) => {
    const currentStats = getCategoryStats(current.name);
    if (!top) return current;
    const topStats = getCategoryStats(top.name);
    return currentStats.totalRevenue > topStats.totalRevenue ? current : top;
  }, null);

  const totalAllRevenue = categories.reduce(
    (sum, c) => sum + getCategoryStats(c.name).totalRevenue,
    0
  );

  const handleEdit = (cat: CategoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setIsAddModalOpen(true);
  };

  const handleDelete = (cat: CategoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const stats = getCategoryStats(cat.name);
    if (
      stats.productCount > 0 &&
      !window.confirm(
        `Kategori "${cat.name}" masih memiliki ${stats.productCount} produk. Yakin ingin menghapus?`
      )
    ) {
      return;
    }
    deleteCategory(cat.id);
    if (selectedCategoryDetail?.id === cat.id) {
      setSelectedCategoryDetail(null);
    }
  };

  return (
    <div id="categories-view" className="space-y-5 animate-in fade-in duration-150 pb-20 lg:pb-0">
      {/* Top Header & Overview */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-xl bg-[#ebeaff] p-2 text-[#4648d4]">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1b1b23]">
                Kategori Produk
              </h1>
              <p className="text-xs text-[#767680] mt-0.5">
                Tabel master kategori barang, pengelompokan etalase POS, dan rekapitulasi penjualan per kelompok
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('products')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] px-3.5 py-2.5 text-xs font-bold text-[#1b1b23] hover:bg-[#f3f2fa] transition-all"
          >
            <Package className="h-4 w-4 text-[#767680]" />
            <span>Lihat Semua Produk</span>
          </button>
          <button
            id="btn-add-category"
            onClick={() => {
              setEditingCategory(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4648d4] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3435ad] shadow-xs transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Kategori Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#767680]">Total Kategori</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ebeaff] text-[#4648d4]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#1b1b23]">{totalCategoriesCount}</p>
          <p className="mt-0.5 text-[11px] text-[#767680]">Kelompok etalase aktif</p>
        </div>

        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#767680]">Total Produk Terdaftar</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#1b1b23]">{totalProductsCount}</p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold">Tersinkron di kasir POS</p>
        </div>

        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#767680]">Kategori Terlaris</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-lg font-extrabold text-[#1b1b23] truncate">
            {topCategory ? topCategory.name : '-'}
          </p>
          <p className="mt-0.5 text-[11px] text-[#767680]">
            Omset:{' '}
            <strong className="text-[#4648d4]">
              {topCategory ? formatCurrency(getCategoryStats(topCategory.name).totalRevenue) : 'Rp 0'}
            </strong>
          </p>
        </div>

        <div className="rounded-2xl border border-[#e2e1ec] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#767680]">Total Omset Keseluruhan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-lg font-extrabold text-[#1b1b23] truncate">
            {formatCurrency(totalAllRevenue)}
          </p>
          <p className="mt-0.5 text-[11px] text-purple-700 font-semibold">Dari semua transaksi selesai</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e2e1ec] shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
            <input
              id="search-category-input"
              type="text"
              placeholder="Cari nama atau deskripsi kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2 pl-9 pr-3 text-xs text-[#1b1b23] placeholder-[#767680] focus:border-[#4648d4] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Sort Selector */}
          <div>
            <select
              id="sort-category-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2 px-3 text-xs font-medium text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
            >
              <option value="name">Urutan: Nama Kategori (A - Z)</option>
              <option value="products">Urutan: Jumlah Produk Terbanyak</option>
              <option value="revenue">Urutan: Omset Penjualan Tertinggi</option>
              <option value="sold">Urutan: Item Terjual Terbanyak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clean Category Data Table */}
      <div className="bg-white rounded-2xl border border-[#e2e1ec] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e1ec] bg-[#fcf8ff] text-[#767680]">
                <th className="py-3 px-4 font-bold uppercase w-12 text-center">No</th>
                <th className="py-3 px-4 font-bold uppercase min-w-[200px]">Kategori</th>
                <th className="py-3 px-4 font-bold uppercase min-w-[220px]">Deskripsi</th>
                <th className="py-3 px-4 font-bold uppercase text-center">Jumlah Produk</th>
                <th className="py-3 px-4 font-bold uppercase text-center">Total Stok</th>
                <th className="py-3 px-4 font-bold uppercase text-center">Item Terjual</th>
                <th className="py-3 px-4 font-bold uppercase">Total Omset</th>
                <th className="py-3 px-4 font-bold uppercase text-center">Status POS</th>
                <th className="py-3 px-4 font-bold uppercase text-right min-w-[180px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2fa]">
              {sortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#767680]">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-40 text-[#4648d4]" />
                    <p className="font-bold text-xs text-[#1b1b23]">Tidak ada kategori yang ditemukan</p>
                    <p className="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian Anda</p>
                  </td>
                </tr>
              ) : (
                sortedCategories.map((category, index) => {
                  const stats = getCategoryStats(category.name);
                  const IconComponent = ICON_MAP[category.iconName || 'Package'] || Package;
                  const isSelected = selectedCategoryDetail?.id === category.id;

                  return (
                    <React.Fragment key={category.id}>
                      <tr
                        className={`transition-colors ${
                          isSelected ? 'bg-[#ebeaff]/40' : 'hover:bg-[#fcf8ff]'
                        }`}
                      >
                        {/* Number */}
                        <td className="py-3.5 px-4 text-center font-bold text-[#767680]">
                          {index + 1}
                        </td>

                        {/* Category Name & Icon */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-2xs shrink-0"
                              style={{ backgroundColor: category.color || '#4648d4' }}
                            >
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-[#1b1b23] text-xs">{category.name}</p>
                              <span className="font-mono text-[10px] text-[#767680]">
                                /{category.slug}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4">
                          <p className="text-[#767680] text-[11px] line-clamp-2 max-w-xs">
                            {category.description || 'Pengelompokan produk etalase kasir.'}
                          </p>
                        </td>

                        {/* Product Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center rounded-full bg-[#f3f2fa] px-2.5 py-1 text-xs font-bold text-[#1b1b23]">
                            {stats.productCount} Produk
                          </span>
                        </td>

                        {/* Total Stock */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-[#1b1b23]">{stats.totalStock} unit</span>
                            {stats.lowStockCount > 0 && (
                              <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                {stats.lowStockCount} perlu restok
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Items Sold */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-emerald-700">
                            {stats.totalSoldItems} unit
                          </span>
                        </td>

                        {/* Revenue */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-[#1b1b23]">
                            {formatCurrency(stats.totalRevenue)}
                          </span>
                        </td>

                        {/* POS Status */}
                        <td className="py-3.5 px-4 text-center">
                          {stats.productCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Aktif di Kasir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f2fa] px-2.5 py-0.5 text-[10px] font-semibold text-[#767680]">
                              Belum Ada Menu
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Products Toggle */}
                            <button
                              id={`toggle-cat-detail-${category.id}`}
                              onClick={() =>
                                setSelectedCategoryDetail(
                                  isSelected ? null : category
                                )
                              }
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                                isSelected
                                  ? 'bg-[#4648d4] text-white shadow-xs'
                                  : 'bg-[#ebeaff] text-[#4648d4] hover:bg-[#d8d6fc]'
                              }`}
                              title="Lihat Daftar Produk"
                            >
                              <Eye className="h-3 w-3" />
                              <span>{isSelected ? 'Tutup' : 'Lihat'}</span>
                              {isSelected ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </button>

                            {/* Add Product directly to category */}
                            <button
                              id={`add-prod-to-${category.id}`}
                              onClick={() => {
                                if (onOpenAddProductModal) {
                                  onOpenAddProductModal(category.name);
                                } else {
                                  setCurrentTab('products');
                                }
                              }}
                              className="rounded-lg bg-[#f3f2fa] p-1.5 text-[#1b1b23] hover:bg-[#ebeaff] hover:text-[#4648d4] transition-colors"
                              title={`Tambah Produk ke "${category.name}"`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>

                            {/* Edit Category */}
                            <button
                              id={`edit-cat-${category.id}`}
                              onClick={(e) => handleEdit(category, e)}
                              className="rounded-lg p-1.5 text-[#767680] hover:bg-[#ebeaff] hover:text-[#4648d4] transition-colors"
                              title="Edit Kategori"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete Category */}
                            <button
                              id={`delete-cat-${category.id}`}
                              onClick={(e) => handleDelete(category, e)}
                              className="rounded-lg p-1.5 text-[#767680] hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Product List Row */}
                      {isSelected && (
                        <tr>
                          <td colSpan={9} className="bg-[#fcf8ff] p-4 border-b border-[#e2e1ec]">
                            <div className="rounded-2xl border border-[#d8d6fc] bg-white p-4 space-y-3 shadow-2xs animate-in fade-in duration-150">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#f3f2fa]">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                                    style={{ backgroundColor: category.color || '#4648d4' }}
                                  >
                                    <IconComponent className="h-3.5 w-3.5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-[#1b1b23]">
                                      Daftar Produk dalam Kategori: {category.name}
                                    </h4>
                                    <p className="text-[11px] text-[#767680]">
                                      {stats.productCount} menu terdaftar • Total stok {stats.totalStock} unit
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (onOpenAddProductModal) {
                                        onOpenAddProductModal(category.name);
                                      } else {
                                        setCurrentTab('products');
                                      }
                                    }}
                                    className="flex items-center gap-1 rounded-xl bg-[#4648d4] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#3435ad] transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>+ Produk Baru ke {category.name}</span>
                                  </button>
                                </div>
                              </div>

                              {stats.products.length === 0 ? (
                                <p className="text-center py-6 text-xs text-[#767680]">
                                  Belum ada produk dalam kategori ini. Klik tombol di atas untuk menambahkan produk baru.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-[#f3f2fa] bg-[#fcf8ff] text-[#767680] text-[10px] uppercase">
                                        <th className="py-2 px-3">Produk</th>
                                        <th className="py-2 px-3">SKU</th>
                                        <th className="py-2 px-3">Harga Beli</th>
                                        <th className="py-2 px-3">Harga Jual</th>
                                        <th className="py-2 px-3">Stok & Alert</th>
                                        <th className="py-2 px-3">Terjual</th>
                                        <th className="py-2 px-3 text-right">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f3f2fa]">
                                      {stats.products.map((prod) => {
                                        const minLimit = prod.minStockAlert ?? 5;
                                        const isLow = prod.stock <= minLimit;
                                        return (
                                          <tr key={prod.id} className="hover:bg-[#fcf8ff]">
                                            <td className="py-2.5 px-3">
                                              <div className="flex items-center gap-2.5">
                                                <img
                                                  src={prod.image}
                                                  alt={prod.name}
                                                  className="h-8 w-8 rounded-lg object-cover border border-[#e2e1ec]"
                                                  referrerPolicy="no-referrer"
                                                />
                                                <div>
                                                  <span className="font-bold text-[#1b1b23] block">
                                                    {prod.name}
                                                  </span>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-[#767680] text-[11px]">
                                              {prod.sku}
                                            </td>
                                            <td className="py-2.5 px-3 text-[#767680]">
                                              {formatCurrency(prod.purchasePrice)}
                                            </td>
                                            <td className="py-2.5 px-3 font-bold text-[#1b1b23]">
                                              {formatCurrency(prod.sellingPrice)}
                                            </td>
                                            <td className="py-2.5 px-3">
                                              <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                  prod.stock === 0
                                                    ? 'bg-red-100 text-red-800'
                                                    : isLow
                                                    ? 'bg-amber-100 text-amber-900'
                                                    : 'bg-emerald-50 text-emerald-800'
                                                }`}
                                              >
                                                {prod.stock === 0
                                                  ? 'Habis (0)'
                                                  : isLow
                                                  ? `Menipis (${prod.stock})`
                                                  : `${prod.stock} unit`}
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-[#767680]">
                                              {prod.soldCount || 0} unit
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                              <button
                                                onClick={() => {
                                                  if (onOpenEditProductModal) {
                                                    onOpenEditProductModal(prod);
                                                  } else {
                                                    setCurrentTab('products');
                                                  }
                                                }}
                                                className="rounded-lg bg-[#ebeaff] px-2 py-1 text-[10px] font-bold text-[#4648d4] hover:bg-[#d8d6fc]"
                                              >
                                                Edit Produk
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCategory(null);
        }}
        editingCategory={editingCategory}
      />
    </div>
  );
};

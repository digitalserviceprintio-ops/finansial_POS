import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  Tag,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Plus,
  Upload,
  FolderOpen,
  Trash2,
  CheckCircle2,
  Sparkles,
  Camera,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
}) => {
  const { addProduct, updateProduct, showToast, categories, products } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const presetImages = [
    {
      name: 'Nasi Goreng',
      category: 'Makanan',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfR5Pdn3xlH6kNL7Sribb2g7FCj5gUgnn1eLdC79NNntKlHtD1S3zaaipZVZuNVz_YgVcXnC86Q91UePTw_VvxJtVXNVVZSfgQWfcoyHJ0hK7Iv_imP5wgRHcxn2tJhLFQrfa0hOqaap3zZNPmQRt59gn18eoxjeLOZo8Ans3UyC2d9XtriWwLxo1HXGbAOks9SqK6owHl18nspDp_pbkbDReedDOtmqPY3JAVIChaXHsDgDU53EE',
    },
    {
      name: 'Es Teh Manis',
      category: 'Minuman',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7Zu2NcYxPIXpKcVaD5y2xsc1SES82i0C3RCEexLjxcXmt0c7QiRB5IA0w-NAhZW8-iHMP2txwAHzKmyR8Phf6D43t0w5JrEY_RrR8yV7jpZYoarJwXdW_qyJQxSYws4HJw7ye4g-Gwztdxi__jKUrePjpKIKOWXNrVMByrhmdH-zBE9ZSy-z4FfELnP-LIlnYzRIiIGbvBirR5YveblMdCFGShuku2IjrZeA8cb-XDFPCY-ePT-0',
    },
    {
      name: 'Ayam Goreng Sambal',
      category: 'Makanan',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJE9Y2Pg_fV5H_woiQTFdgWY4FnWtlqUU8HfD8F7DPrvKoQnDA9pa4X4Mlo4F_wqtlC7qAwGWlseQnB03NKlFIQDMZNjui9zWRatzvIDau-1ffWciMeoDIyJZpvM_9Sd2xNCi6s483bh3YXTK20hZZU25i9vW2Hq6b_q7ulArs3tNm0qc3ZMdDfhxbmJLKV51Dh56DkrnYgrH8XKklD6HBLeOuOeJKmZu_MdIPjt-tdqk7z4xHoTo',
    },
    {
      name: 'Kopi Arabika',
      category: 'Minuman',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1NXAiU6vQqA1MhfHcehAdMGSaOwlz3sr-WsoVtk_7-JOty_dCKsTtESxtZ5EKMONG6vysR1AyV-ZWML2Bke-ri8LQQZ4myFq3ta61GP3XyTJw7vyNzuIEDlahvZElIm9UhUVnrDawRLuwECYcK6JXxgiQWWZWUrZ9in-ZUmdmhYnO31nXbpf49oxUj4P6-BXk-XJHkdl_RxRIE5BYKJQ9EEJBkaMK--yiIzZYQ2hnkeRi7x6vueo',
    },
    {
      name: 'Cokelat Batang',
      category: 'Snack',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcXcLO7xSOSdeWj7ew1g73jFlfg10OBvaFDBlp8jBYkCIfQTThkjWgMFSpm8nLyHnjG194TvUPuxr62FRc3P1mnS-ayYtapN2KB1tRlilQdqtvKRxyLmV_8s4Xyp7Re3D_6RaD0RgfblYFg1_o-sSvhjacG04mFJKaKHw9FaE_YsFPvC0cGaXCBg4IdcMKbiJgz92VGuX6LMi5vysBtWHMNS8I5iWxzHYF29yc_jmDWuRo1F8B3_A',
    },
    {
      name: 'Beras Premium',
      category: 'Sembako',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmWJkdRNjQg01szc_vu7Qk0ZmlRjRQrcUyEX_nY4HUqSqYHiu0KJezJWPYHh0_ERXX9VWfogPKYOGjTkf5SvnoanI3P93I81_lGMIg2cyjJ-tapiufsHWyTDYwe39FH8vJCMfHmi7aJty-GXPJAYQOHfDZaw4oxyED6jlQBGw9Rli_AkhkQwzKbrdoaIviNeX3QR8tNkeDEj5WVmhm7cUlVzuYAbfEy_kpBhdAlE2N0lbEFRtocJI',
    },
    {
      name: 'Keripik Singkong',
      category: 'Snack',
      url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Minyak Goreng',
      category: 'Sembako',
      url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const [imageTab, setImageTab] = useState<'gallery' | 'presets' | 'url'>('gallery');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadedFromGallery, setIsUploadedFromGallery] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Makanan' as ProductCategory,
    purchasePrice: 10000,
    sellingPrice: 15000,
    stock: 20,
    minStockAlert: 5,
    image: presetImages[0].url,
    isAvailable: true,
  });

  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [skuReason, setSkuReason] = useState<string | null>(null);
  const [skuAlternatives, setSkuAlternatives] = useState<string[]>([]);
  const [skuSource, setSkuSource] = useState<'ai' | 'heuristic' | null>(null);

  useEffect(() => {
    setSkuReason(null);
    setSkuAlternatives([]);
    setSkuSource(null);

    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        sku: editingProduct.sku,
        category: editingProduct.category,
        purchasePrice: editingProduct.purchasePrice,
        sellingPrice: editingProduct.sellingPrice,
        stock: editingProduct.stock,
        minStockAlert: editingProduct.minStockAlert ?? 5,
        image: editingProduct.image,
        isAvailable: editingProduct.isAvailable,
      });
      // Check if image is base64
      if (editingProduct.image.startsWith('data:image')) {
        setIsUploadedFromGallery(true);
        setImageTab('gallery');
      } else {
        setIsUploadedFromGallery(false);
      }
    } else {
      setFormData({
        name: '',
        sku: `PRD-${Math.floor(100 + Math.random() * 900)}`,
        category: categories[0]?.name || 'Makanan',
        purchasePrice: 10000,
        sellingPrice: 15000,
        stock: 20,
        minStockAlert: 5,
        image: presetImages[0].url,
        isAvailable: true,
      });
      setIsUploadedFromGallery(false);
      setImageTab('gallery');
    }
  }, [editingProduct, isOpen, categories]);

  const handleGenerateAISku = async () => {
    if (!formData.name.trim()) {
      showToast('Ketik nama produk terlebih dahulu untuk membuat SKU dengan AI', 'warning');
      return;
    }

    setIsGeneratingSku(true);
    try {
      const existingSkus = products
        .map((p) => p.sku)
        .filter((s) => Boolean(s) && (editingProduct ? s !== editingProduct.sku : true));

      const res = await fetch('/api/generate-sku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          existingSkus,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi layanan generator SKU');
      }

      const data = await res.json();
      if (data.success && data.sku) {
        setFormData((prev) => ({ ...prev, sku: data.sku }));
        setSkuReason(data.reason || null);
        setSkuAlternatives(data.alternatives || []);
        setSkuSource(data.source || 'ai');
        showToast(
          data.source === 'ai'
            ? `SKU cerdas AI "${data.sku}" berhasil diterapkan!`
            : `SKU unik "${data.sku}" berhasil diterapkan!`,
          'success'
        );
      } else {
        showToast(data.error || 'Gagal menghasilkan kode SKU AI', 'error');
      }
    } catch (err: any) {
      console.error('SKU generation error:', err);
      showToast('Terjadi kendala saat menghasilkan SKU AI. Silakan coba lagi.', 'error');
    } finally {
      setIsGeneratingSku(false);
    }
  };

  // Image Processing & Compression from File / Gallery
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file format gambar (JPG, PNG, WebP, GIF)', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Downscale to max 800x800 for optimal local storage and fast rendering
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, image: compressedDataUrl }));
          setIsUploadedFromGallery(true);
          showToast('Foto produk berhasil dipilih dari galeri!', 'success');
        } else {
          setFormData((prev) => ({ ...prev, image: rawDataUrl }));
          setIsUploadedFromGallery(true);
          showToast('Foto produk berhasil dipilih!', 'success');
        }
      };
      img.onerror = () => {
        showToast('Gagal memproses file gambar', 'warning');
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customImageUrl.trim()) return;
    setFormData((prev) => ({ ...prev, image: customImageUrl.trim() }));
    setIsUploadedFromGallery(false);
    showToast('Link gambar diterapkan!', 'success');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama produk tidak boleh kosong', 'warning');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
      showToast(`Produk "${formData.name}" berhasil diperbarui`, 'success');
    } else {
      addProduct(formData);
      showToast(`Produk "${formData.name}" berhasil ditambahkan`, 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#ebeaff] text-[#4648d4]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b1b23]">
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <p className="text-xs text-[#767680]">Katalog POS & Manajemen Stok</p>
            </div>
          </div>
          <button
            id="close-add-product-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#767680] hover:bg-[#f3f2fa] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Product Name */}
          <div>
            <label className="block font-bold text-[#1b1b23] mb-1">Nama Produk</label>
            <input
              id="input-product-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Nasi Goreng Spesial Telur, Es Kopi Susu..."
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
            />
          </div>

          {/* SKU and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#1b1b23] text-xs">
                  Kode SKU / Barcode
                </label>
                <button
                  type="button"
                  id="btn-generate-ai-sku"
                  onClick={handleGenerateAISku}
                  disabled={isGeneratingSku || !formData.name.trim()}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4648d4] hover:text-[#3435ad] disabled:opacity-40 disabled:cursor-not-allowed transition-all py-0.5 px-2 rounded-lg hover:bg-[#ebeaff] active:scale-95"
                  title="Buat kode SKU unik secara otomatis menggunakan AI"
                >
                  {isGeneratingSku ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-[#4648d4]" />
                      <span>Membuat SKU...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 text-[#4648d4]" />
                      <span>Buat SKU AI</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  id="input-product-sku"
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => {
                    setFormData({ ...formData, sku: e.target.value });
                    setSkuReason(null);
                  }}
                  placeholder="Contoh: MKN-NSG-01"
                  className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 font-mono text-xs uppercase text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                />
                {skuSource && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#ebeaff] text-[#4648d4] flex items-center gap-1 pointer-events-none">
                    <Sparkles className="h-2.5 w-2.5" />
                    {skuSource === 'ai' ? 'Gemini AI' : 'Auto SKU'}
                  </span>
                )}
              </div>

              {/* AI Explanation & Alternative Suggestions */}
              {skuReason && (
                <div className="mt-1.5 p-2 rounded-xl bg-[#ebeaff]/70 border border-[#d2d1dc] text-[11px] space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-1.5 text-[#3033a8]">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#4648d4]" />
                    <span className="leading-snug">{skuReason}</span>
                  </div>
                  {skuAlternatives.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#e2e1ec]">
                      <span className="text-[10px] text-[#767680] font-medium">Opsi lain:</span>
                      {skuAlternatives.map((alt, i) => (
                        <button
                          key={i}
                          type="button"
                          id={`btn-sku-alt-${i}`}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, sku: alt }));
                            showToast(`SKU diubah ke "${alt}"`, 'info');
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-[#4648d4] border border-[#d2d1dc] rounded-md hover:bg-[#4648d4] hover:text-white transition-colors"
                        >
                          {alt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-[#1b1b23] mb-1 text-xs">Kategori</label>
              <select
                id="select-product-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs font-medium text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#767680] mt-1">
                Kategori akan digunakan AI untuk membuat prefix kode SKU.
              </p>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-[#1b1b23] mb-1 text-[11px]">Harga Beli (HPP)</label>
              <input
                id="input-product-purchase-price"
                type="number"
                min="0"
                step="500"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1b1b23] mb-1 text-[11px]">Harga Jual POS</label>
              <input
                id="input-product-selling-price"
                type="number"
                min="0"
                step="500"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs font-bold text-[#4648d4] focus:border-[#4648d4] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1b1b23] mb-1 text-[11px]">Stok Saat Ini</label>
              <input
                id="input-product-stock"
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-amber-800 mb-1 text-[11px] flex items-center gap-1" title="Sistem akan memberi peringatan jika stok mencapai atau di bawah batas ini">
                <span>Batas Min. Stok</span>
                <span className="text-[10px] text-amber-600 font-normal">(Alert)</span>
              </label>
              <input
                id="input-product-min-stock-alert"
                type="number"
                min="1"
                required
                placeholder="5"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-amber-300 bg-amber-50/50 p-2.5 text-xs font-bold text-amber-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* PRODUCT IMAGE PICKER WITH GALLERY SUPPORT */}
          <div className="space-y-2.5 rounded-2xl border border-[#e2e1ec] bg-[#fcf8ff] p-3.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-bold text-[#1b1b23]">
                <ImageIcon className="h-4 w-4 text-[#4648d4]" />
                <span>Gambar Produk</span>
              </label>

              {/* Source Tabs */}
              <div className="flex items-center rounded-xl bg-white p-0.5 border border-[#e2e1ec] text-[11px]">
                <button
                  type="button"
                  id="tab-image-gallery"
                  onClick={() => setImageTab('gallery')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    imageTab === 'gallery'
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'text-[#767680] hover:text-[#1b1b23]'
                  }`}
                >
                  <FolderOpen className="h-3 w-3" />
                  <span>Dari Galeri / File</span>
                </button>
                <button
                  type="button"
                  id="tab-image-presets"
                  onClick={() => setImageTab('presets')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    imageTab === 'presets'
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'text-[#767680] hover:text-[#1b1b23]'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Preset</span>
                </button>
                <button
                  type="button"
                  id="tab-image-url"
                  onClick={() => setImageTab('url')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    imageTab === 'url'
                      ? 'bg-[#4648d4] text-white shadow-xs'
                      : 'text-[#767680] hover:text-[#1b1b23]'
                  }`}
                >
                  <span>Link URL</span>
                </button>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              id="product-gallery-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Current Selected Image Preview Bar */}
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-[#e2e1ec]">
              <img
                src={formData.image}
                alt="Pratinjau Produk"
                className="h-14 w-14 rounded-xl object-cover border border-[#e2e1ec] shrink-0 bg-neutral-100"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#1b1b23] truncate">
                  {formData.name || 'Pratinjau Gambar Produk'}
                </p>
                <p className="text-[10px] text-[#767680] mt-0.5 truncate">
                  {isUploadedFromGallery ? '✓ Gambar dari Galeri Perangkat' : 'Gambar Aktif'}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#4648d4] hover:underline"
                >
                  <Camera className="h-3 w-3" />
                  <span>Ganti dari Galeri</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Gallery / File Upload Area */}
            {imageTab === 'gallery' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#4648d4] bg-[#ebeaff]/60 scale-[1.01]'
                    : 'border-[#4648d4]/40 bg-white hover:border-[#4648d4] hover:bg-[#ebeaff]/30'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4] mb-2">
                  <Upload className="h-5 w-5 animate-bounce duration-1000" />
                </div>
                <p className="text-xs font-bold text-[#1b1b23]">
                  Klik untuk Memilih Foto dari Galeri
                </p>
                <p className="text-[11px] text-[#767680] mt-0.5 text-center">
                  atau tarik dan lepas file gambar ke sini (JPG, PNG, WebP)
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-[#4648d4] px-3 py-1.5 text-[11px] font-bold text-white shadow-xs">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>Buka Galeri Foto</span>
                </div>
              </div>
            )}

            {/* Tab 2: Presets Collection */}
            {imageTab === 'presets' && (
              <div className="space-y-2">
                <p className="text-[11px] text-[#767680]">Pilih salah satu gambar katalog siap pakai:</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {presetImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setFormData({ ...formData, image: img.url });
                        setIsUploadedFromGallery(false);
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        formData.image === img.url
                          ? 'border-[#4648d4] ring-2 ring-[#4648d4]/30 scale-105'
                          : 'border-[#e2e1ec] opacity-75 hover:opacity-100'
                      }`}
                      title={img.name}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {formData.image === img.url && (
                        <div className="absolute inset-0 bg-[#4648d4]/30 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Custom URL */}
            {imageTab === 'url' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/foto-produk.jpg"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 rounded-xl border border-[#d2d1dc] bg-white p-2 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="rounded-xl bg-[#4648d4] px-3 py-2 text-xs font-bold text-white hover:bg-[#3435ad]"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-[#f3f2fa] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e2e1ec] px-4 py-2.5 text-xs font-bold text-[#46464f] hover:bg-[#f3f2fa] transition-colors"
            >
              Batal
            </button>
            <button
              id="submit-product-btn"
              type="submit"
              className="rounded-xl bg-[#4648d4] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#3435ad] shadow-xs active:scale-98 transition-all"
            >
              {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


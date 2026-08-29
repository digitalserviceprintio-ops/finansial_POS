import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Tag,
  Palette,
  Layers,
  Utensils,
  Coffee,
  Cookie,
  ShoppingBag,
  Gift,
  Package,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryItem } from '../../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: CategoryItem | null;
}

const COLOR_PRESETS = [
  { name: 'Indigo', hex: '#4648d4' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Coral', hex: '#e06d53' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Cyan', hex: '#0891b2' },
  { name: 'Slate', hex: '#475569' },
];

const ICON_PRESETS = [
  { name: 'Utensils', label: 'Makanan', icon: Utensils },
  { name: 'Coffee', label: 'Minuman', icon: Coffee },
  { name: 'Cookie', label: 'Snack', icon: Cookie },
  { name: 'ShoppingBag', label: 'Sembako', icon: ShoppingBag },
  { name: 'Gift', label: 'Paket / Bundling', icon: Gift },
  { name: 'Package', label: 'Barang / Stok', icon: Package },
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
}) => {
  const { addCategory, updateCategory } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#4648d4');
  const [iconName, setIconName] = useState('Package');
  const [bannerImage, setBannerImage] = useState('');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setDescription(editingCategory.description || '');
      setColor(editingCategory.color || '#4648d4');
      setIconName(editingCategory.iconName || 'Package');
      setBannerImage(editingCategory.bannerImage || '');
    } else {
      setName('');
      setDescription('');
      setColor('#4648d4');
      setIconName('Package');
      setBannerImage('');
    }
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        iconName,
        bannerImage: bannerImage.trim() || undefined,
      });
    } else {
      addCategory({
        name: name.trim(),
        description: description.trim(),
        color,
        iconName,
        bannerImage: bannerImage.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-[#e2e1ec] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1b1b23]">
                {editingCategory ? 'Edit Kategori Produk' : 'Tambah Kategori Baru'}
              </h3>
              <p className="text-[11px] text-[#767680]">
                Atur pengelompokan menu & katalog toko Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1b1b23] mb-1">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Minuman Dingin, Kopi & Latte, Dessert"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] px-3.5 py-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1b1b23] mb-1">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan jenis menu dalam kategori ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] px-3.5 py-2 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20"
            />
          </div>

          {/* Color Palette Presets */}
          <div>
            <label className="block text-xs font-bold text-[#1b1b23] mb-2 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-[#4648d4]" />
              Warna Tema Kategori
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    color === c.hex
                      ? 'ring-2 ring-offset-2 ring-[#1b1b23] scale-110 shadow-xs'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {color === c.hex && <Sparkles className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1b1b23] mb-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#4648d4]" />
              Ikon Kategori
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ICON_PRESETS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    className={`flex items-center gap-2 rounded-xl p-2 text-xs font-medium border transition-all ${
                      isSelected
                        ? 'border-[#4648d4] bg-[#ebeaff] text-[#4648d4] font-bold shadow-xs'
                        : 'border-[#e2e1ec] bg-[#fcf8ff] text-[#46464f] hover:bg-[#f3f2fa]'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f3f2fa]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e2e1ec] px-4 py-2 text-xs font-semibold text-[#46464f] hover:bg-[#f3f2fa]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[#4648d4] px-5 py-2 text-xs font-bold text-white hover:bg-[#3435ad] shadow-xs"
            >
              {editingCategory ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

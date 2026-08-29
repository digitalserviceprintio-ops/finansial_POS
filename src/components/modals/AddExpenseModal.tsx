import React, { useState } from 'react';
import { X, Receipt, DollarSign, Calendar, Tag, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, showToast } = useApp();

  const categories = [
    'Bahan Baku',
    'Gaji Karyawan',
    'Utilitas',
    'Pemasaran',
    'Sewa Tempat',
    'Operasional',
    'Lainnya',
  ] as const;

  const [formData, setFormData] = useState({
    description: '',
    category: 'Bahan Baku' as typeof categories[number],
    amount: 150000,
    recipient: '',
    refNumber: `EXP-${Date.now().toString().slice(-6)}`,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || formData.amount <= 0) {
      showToast('Keterangan dan nominal pengeluaran harus diisi dengan benar', 'warning');
      return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    addExpense({
      date: dateFormatted,
      time: timeFormatted,
      description: formData.description,
      refNumber: formData.refNumber,
      category: formData.category,
      amount: formData.amount,
      recipient: formData.recipient || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-[#e2e1ec] bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-50 text-red-700">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b1b23]">Catat Beban / Pengeluaran</h3>
              <p className="text-xs text-[#767680]">Buku Kas Keluar & Arus Finansial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-[#767680] hover:bg-[#f3f2fa]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1b1b23] mb-1">Keterangan Beban / Pengeluaran</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Belanja Minyak Goreng & Beras di Pasar"
              className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#ba1a1a] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1b1b23] mb-1">Kategori Pos Beban</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs font-medium text-[#1b1b23] focus:border-[#ba1a1a] focus:bg-white focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#1b1b23] mb-1">Nominal (Rp)</label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs font-bold text-red-700 focus:border-[#ba1a1a] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1b1b23] mb-1">Penerima / Vendor</label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                placeholder="Contoh: Toko Berkah / PLN"
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 text-xs text-[#1b1b23] focus:border-[#ba1a1a] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1b1b23] mb-1">No. Bukti / Kuitansi</label>
              <input
                type="text"
                value={formData.refNumber}
                onChange={(e) => setFormData({ ...formData, refNumber: e.target.value })}
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] p-2.5 font-mono text-xs text-[#1b1b23] focus:border-[#ba1a1a] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#f3f2fa] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e2e1ec] px-4 py-2 text-xs font-bold text-[#46464f] hover:bg-[#f3f2fa]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#ba1a1a] px-5 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
            >
              Catat Kas Keluar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

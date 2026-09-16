import React, { useState } from 'react';
import {
  Landmark,
  CreditCard,
  Plus,
  Trash2,
  Edit3,
  Star,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  HelpCircle,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { StoreBankAccount } from '../../types';

interface StoreBankAccountSettingsProps {
  bankAccounts: StoreBankAccount[];
  onChange: (accounts: StoreBankAccount[]) => void;
  storeName: string;
  storeOwner: string;
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const POPULAR_INDONESIAN_BANKS = [
  { code: 'BCA', name: 'BCA (Bank Central Asia)', color: 'bg-blue-600 text-white' },
  { code: 'BRI', name: 'BRI (Bank Rakyat Indonesia)', color: 'bg-sky-600 text-white' },
  { code: 'Mandiri', name: 'Bank Mandiri', color: 'bg-[#002f6c] text-amber-300' },
  { code: 'BNI', name: 'BNI (Bank Negara Indonesia)', color: 'bg-orange-600 text-white' },
  { code: 'BSI', name: 'BSI (Bank Syariah Indonesia)', color: 'bg-emerald-600 text-white' },
  { code: 'CIMB', name: 'CIMB Niaga', color: 'bg-red-700 text-white' },
  { code: 'Permata', name: 'Permata Bank', color: 'bg-violet-700 text-white' },
  { code: 'Danamon', name: 'Bank Danamon', color: 'bg-amber-600 text-white' },
  { code: 'BTN', name: 'Bank BTN', color: 'bg-slate-800 text-white' },
  { code: 'Jago', name: 'Bank Jago', color: 'bg-amber-400 text-slate-950' },
  { code: 'SeaBank', name: 'SeaBank Indonesia', color: 'bg-orange-500 text-white' },
  { code: 'Blu', name: 'Blu by BCA Digital', color: 'bg-cyan-600 text-white' },
  { code: 'Lainnya', name: 'Bank Lainnya (Ketik Manual)', color: 'bg-indigo-600 text-white' },
];

export const getBankBadgeColor = (bankName: string): string => {
  const normalized = bankName.trim().toUpperCase();
  if (normalized.includes('BCA') && !normalized.includes('BLU')) return 'bg-blue-600 text-white';
  if (normalized.includes('BRI')) return 'bg-sky-600 text-white';
  if (normalized.includes('MANDIRI')) return 'bg-[#002f6c] text-amber-300';
  if (normalized.includes('BNI')) return 'bg-orange-600 text-white';
  if (normalized.includes('BSI') || normalized.includes('SYARIAH')) return 'bg-emerald-600 text-white';
  if (normalized.includes('CIMB')) return 'bg-red-700 text-white';
  if (normalized.includes('PERMATA')) return 'bg-violet-700 text-white';
  if (normalized.includes('DANAMON')) return 'bg-amber-600 text-white';
  if (normalized.includes('JAGO')) return 'bg-amber-400 text-slate-950';
  if (normalized.includes('SEABANK')) return 'bg-orange-500 text-white';
  if (normalized.includes('BLU')) return 'bg-cyan-600 text-white';
  return 'bg-indigo-600 text-white';
};

export const StoreBankAccountSettings: React.FC<StoreBankAccountSettingsProps> = ({
  bankAccounts,
  onChange,
  storeName,
  storeOwner,
  showToast,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Form Fields State
  const [selectedBankCode, setSelectedBankCode] = useState<string>('BCA');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const openAddForm = () => {
    setEditingIndex(null);
    setSelectedBankCode('BCA');
    setCustomBankName('');
    setAccountNumber('');
    setAccountHolder(storeOwner || storeName || '');
    setIsDefault(bankAccounts.length === 0);
    setNotes('');
    setIsEditorOpen(true);
  };

  const openEditForm = (index: number) => {
    const acc = bankAccounts[index];
    if (!acc) return;
    setEditingIndex(index);

    const matchedBank = POPULAR_INDONESIAN_BANKS.find(
      (b) => b.code.toUpperCase() === acc.bankName.toUpperCase() || b.name.toLowerCase().includes(acc.bankName.toLowerCase())
    );

    if (matchedBank && matchedBank.code !== 'Lainnya') {
      setSelectedBankCode(matchedBank.code);
      setCustomBankName('');
    } else {
      setSelectedBankCode('Lainnya');
      setCustomBankName(acc.bankName);
    }

    setAccountNumber(acc.accountNumber);
    setAccountHolder(acc.accountHolder);
    setIsDefault(!!acc.isDefault);
    setNotes(acc.notes || '');
    setIsEditorOpen(true);
  };

  const handleCopy = (accNum: string) => {
    navigator.clipboard.writeText(accNum.replace(/\D/g, ''));
    setCopiedAccount(accNum);
    showToast(`Nomor rekening ${accNum} berhasil disalin!`, 'info');
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleSetDefault = (index: number) => {
    const updated = bankAccounts.map((acc, idx) => ({
      ...acc,
      isDefault: idx === index,
    }));
    onChange(updated);
    showToast(`Bank ${bankAccounts[index].bankName} dijadikan rekening utama transfer!`, 'success');
  };

  const handleDelete = (index: number) => {
    const target = bankAccounts[index];
    if (!window.confirm(`Yakin ingin menghapus rekening ${target.bankName} (${target.accountNumber})?`)) {
      return;
    }

    const updated = bankAccounts.filter((_, idx) => idx !== index);
    // If deleted account was default and accounts remain, set first one as default
    if (target.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }

    onChange(updated);
    showToast(`Rekening ${target.bankName} berhasil dihapus.`, 'info');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const finalBankName =
      selectedBankCode === 'Lainnya' ? customBankName.trim() : selectedBankCode;

    if (!finalBankName) {
      showToast('Nama bank wajib diisi atau dipilih!', 'warning');
      return;
    }

    const cleanAccNumber = accountNumber.trim();
    if (!cleanAccNumber || cleanAccNumber.length < 4) {
      showToast('Nomor rekening minimal 4 digit angka!', 'warning');
      return;
    }

    const cleanHolder = accountHolder.trim();
    if (!cleanHolder) {
      showToast('Nama pemilik rekening (a.n.) wajib diisi!', 'warning');
      return;
    }

    const newAccountItem: StoreBankAccount = {
      id: editingIndex !== null && bankAccounts[editingIndex]?.id ? bankAccounts[editingIndex].id : `BANK-${Date.now()}`,
      bankName: finalBankName,
      accountNumber: cleanAccNumber,
      accountHolder: cleanHolder,
      isDefault: isDefault || bankAccounts.length === 0,
      notes: notes.trim() || undefined,
    };

    let updatedList: StoreBankAccount[] = [];

    if (editingIndex !== null) {
      // Editing existing
      updatedList = bankAccounts.map((item, idx) => {
        if (idx === editingIndex) {
          return newAccountItem;
        }
        // If the edited one is set to default, unmark others
        if (newAccountItem.isDefault) {
          return { ...item, isDefault: false };
        }
        return item;
      });
      showToast(`Rekening ${finalBankName} berhasil diperbarui!`, 'success');
    } else {
      // Adding new
      if (newAccountItem.isDefault) {
        updatedList = bankAccounts.map((item) => ({ ...item, isDefault: false }));
        updatedList.push(newAccountItem);
      } else {
        updatedList = [...bankAccounts, newAccountItem];
      }
      showToast(`Rekening ${finalBankName} berhasil ditambahkan!`, 'success');
    }

    onChange(updatedList);
    setIsEditorOpen(false);
    setEditingIndex(null);
  };

  const defaultAccount = bankAccounts.find((a) => a.isDefault) || bankAccounts[0];

  return (
    <div
      id="settings-bank-accounts"
      className="bg-white p-6 rounded-3xl border border-indigo-200/90 shadow-xs space-y-5 animate-in fade-in duration-150"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f3f2fa]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#1b1b23]">
                Pengaturan Akun Bank (Pembayaran Transfer)
              </h3>
              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                {bankAccounts.length} Rekening Aktif
              </span>
            </div>
            <p className="text-xs text-[#767680] mt-0.5">
              Daftar rekening bank toko untuk menerima transfer dari pelanggan di kasir POS dan QR Katalog online.
            </p>
          </div>
        </div>

        {!isEditorOpen && (
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Rekening Bank</span>
          </button>
        )}
      </div>

      {/* Inline Form / Modal for Adding/Editing Bank Account */}
      {isEditorOpen && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-[#fcf8ff] to-blue-50/50 border border-indigo-200 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <h4 className="text-xs font-extrabold text-[#1b1b23]">
                {editingIndex !== null ? 'Ubah Informasi Rekening Bank' : 'Tambah Rekening Bank Baru'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsEditorOpen(false);
                setEditingIndex(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pilihan Bank */}
              <div>
                <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                  Pilih Bank Tujuan
                </label>
                <select
                  value={selectedBankCode}
                  onChange={(e) => setSelectedBankCode(e.target.value)}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-white p-2.5 text-xs font-semibold text-[#1b1b23] focus:border-[#4648d4] focus:outline-hidden"
                  required
                >
                  {POPULAR_INDONESIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jika Bank Lainnya */}
              {selectedBankCode === 'Lainnya' ? (
                <div>
                  <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                    Ketik Nama Bank
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bank BJB, Bank Nagari, dll."
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    className="w-full rounded-xl border border-[#d2d1dc] bg-white p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:outline-hidden"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                    Label Singkat Bank
                  </label>
                  <input
                    type="text"
                    value={selectedBankCode}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-bold text-slate-600 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Nomor Rekening */}
              <div>
                <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                  Nomor Rekening Bank
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 8830192833 atau 0206-01-002849-50-8"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-white p-2.5 text-xs font-mono font-bold text-[#1b1b23] focus:border-[#4648d4] focus:outline-hidden"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Bisa menggunakan spasi atau tanda hubung (-) agar mudah dibaca kasir.
                </p>
              </div>

              {/* Atas Nama (a.n.) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#1b1b23]">
                    Nama Pemilik / Atas Nama (a.n.)
                  </label>
                  <div className="flex items-center gap-1">
                    {storeOwner && (
                      <button
                        type="button"
                        onClick={() => setAccountHolder(storeOwner)}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                      >
                        Pakai Owner
                      </button>
                    )}
                    {storeName && (
                      <button
                        type="button"
                        onClick={() => setAccountHolder(storeName)}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold ml-1.5"
                      >
                        Pakai Toko
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: BUDI SANTOSO / TOKO KITA"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-white p-2.5 text-xs font-bold text-[#1b1b23] focus:border-[#4648d4] focus:outline-hidden"
                  required
                />
              </div>

              {/* Catatan / Keterangan */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                  Catatan / Keterangan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rekening Utama Kasir, Rekening Tabungan Bisnis, dll."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-[#d2d1dc] bg-white p-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Checkbox Rekening Utama */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-indigo-100 hover:border-indigo-300 transition-colors">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-[#1b1b23] flex items-center gap-1.5">
                    <Star className={`h-3.5 w-3.5 ${isDefault ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                    <span>Jadikan Rekening Utama (Default)</span>
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Otomatis dipilih paling atas pada modal pembayaran kasir dan tampilan QR katalog.
                  </p>
                </div>
              </label>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditorOpen(false);
                  setEditingIndex(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>{editingIndex !== null ? 'Simpan Perubahan Rekening' : 'Tambahkan Rekening'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Registered Bank Accounts */}
      {bankAccounts.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-800">
              Belum Ada Rekening Bank yang Didaftarkan
            </h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
              Tambahkan minimal 1 rekening bank (BCA, BRI, Mandiri, dll.) agar kasir dapat menerima pembayaran transfer langsung.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Rekening Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bankAccounts.map((acc, index) => {
            const badgeClass = getBankBadgeColor(acc.bankName);
            return (
              <div
                key={acc.id || index}
                className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  acc.isDefault
                    ? 'bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/40 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  {/* Top Line: Badge & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide shadow-2xs ${badgeClass}`}>
                        {acc.bankName}
                      </span>
                      {acc.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          <span>Rekening Utama</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {!acc.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(index)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Jadikan Rekening Utama"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditForm(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Ubah Rekening"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus Rekening"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Account Number & Copy */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Nomor Rekening
                      </span>
                      <span className="font-mono text-sm font-extrabold text-[#1b1b23] tracking-wide truncate block">
                        {acc.accountNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(acc.accountNumber)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      {copiedAccount === acc.accountNumber ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700">Disalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Account Holder */}
                  <div className="text-xs space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Atas Nama (a.n.):</span>
                    <p className="font-extrabold text-slate-800 tracking-wide">{acc.accountHolder}</p>
                    {acc.notes && (
                      <p className="text-[10px] text-slate-500 italic mt-0.5">{acc.notes}</p>
                    )}
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span>Siap untuk POS & Transfer</span>
                  </span>
                  {acc.isDefault ? (
                    <span className="font-bold text-indigo-600">Prioritas #1</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(index)}
                      className="text-slate-500 hover:text-indigo-600 font-semibold"
                    >
                      Jadikan Utama
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Integration Info / Kasir Preview Card */}
      <div className="p-4 rounded-2xl bg-[#fcf8ff] border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">
              Integrasi Otomatis dengan Kasir POS & QR Katalog
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Saat kasir memilih metode <strong>Transfer Bank</strong> di layar kasir, rekening utama ({defaultAccount?.bankName || 'BCA'}) akan tampil pertama kali beserta tombol salin nomor rekening instan.
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-center">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Tersinkronisasi Real-time</span>
          </span>
        </div>
      </div>
    </div>
  );
};

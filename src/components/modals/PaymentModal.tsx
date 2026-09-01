import React, { useState, useEffect } from 'react';
import {
  X,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    pendingPaymentMethod,
    setPendingPaymentMethod,
    cart,
    selectedCustomer,
    storeProfile,
    processPayment,
    formatCurrency,
    showToast,
  } = useApp();

  const subtotal = cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  const tax = Math.round(subtotal * storeProfile.taxRate);
  const total = subtotal + tax;

  const [cashGiven, setCashGiven] = useState<number>(total);
  const [selectedBankIdx, setSelectedBankIdx] = useState<number>(0);
  const [bankRefNumber, setBankRefNumber] = useState<string>('');
  const [cardLastDigits, setCardLastDigits] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Sync cash default on modal open
  useEffect(() => {
    if (isPaymentModalOpen) {
      setCashGiven(total);
      if (pendingPaymentMethod === ('QRIS' as any)) {
        setPendingPaymentMethod('Tunai');
      }
    }
  }, [isPaymentModalOpen, total]);

  if (!isPaymentModalOpen) return null;

  const change = Math.max(0, cashGiven - total);
  const isCashSufficient = cashGiven >= total;

  // Preset cash nominals
  const cashPresets = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    50000,
    100000,
    200000,
    500000,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i);

  const bankAccounts = storeProfile.bankAccounts || [
    { bankName: 'BCA', accountNumber: '8830-1928-33', accountHolder: 'BUDI SANTOSO / TOKO 2R' },
    { bankName: 'BRI', accountNumber: '0206-01-002849-50-8', accountHolder: 'TOKO 2R MAJU BERSAMA' },
    { bankName: 'Mandiri', accountNumber: '137-00-1982736-1', accountHolder: 'TOKO 2R UMKM' },
  ];

  const handleCopyBankAcc = (accNumber: string) => {
    navigator.clipboard.writeText(accNumber.replace(/\D/g, ''));
    setCopiedBank(accNumber);
    showToast(`Nomor rekening ${accNumber} berhasil disalin!`, 'info');
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handleConfirmPayment = () => {
    if (pendingPaymentMethod === 'Tunai' && !isCashSufficient) {
      showToast('Uang tunai yang diterima kurang dari total tagihan!', 'warning');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      processPayment(pendingPaymentMethod, pendingPaymentMethod === 'Tunai' ? cashGiven : undefined);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4] shadow-xs">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1b1b23]">Pembayaran Transaksi Kasir</h3>
              <p className="text-xs text-[#767680] font-medium">
                {selectedCustomer
                  ? `${selectedCustomer.name} (${selectedCustomer.phone || 'Pelanggan'})`
                  : 'Pelanggan Umum'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="rounded-xl p-1.5 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23] cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#f3f2fa] rounded-2xl">
          <button
            type="button"
            onClick={() => setPendingPaymentMethod('Tunai')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              pendingPaymentMethod === 'Tunai'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-black/5'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            <Banknote className="h-4 w-4 text-emerald-600" />
            <span>Tunai / Cash</span>
          </button>

          <button
            type="button"
            onClick={() => setPendingPaymentMethod('Transfer Bank')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              pendingPaymentMethod === 'Transfer Bank'
                ? 'bg-white text-[#4648d4] shadow-xs ring-1 ring-black/5'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            <Building2 className="h-4 w-4 text-[#4648d4]" />
            <span>Transfer Bank</span>
          </button>

          <button
            type="button"
            onClick={() => setPendingPaymentMethod('Kartu Debit')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              pendingPaymentMethod === 'Kartu Debit'
                ? 'bg-white text-purple-700 shadow-xs ring-1 ring-black/5'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            <CreditCard className="h-4 w-4 text-purple-600" />
            <span>Kartu / EDC</span>
          </button>
        </div>

        {/* Total Bill Card */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#fcf8ff] to-[#f4f3ff] border border-[#d8d6fc]">
          <div>
            <span className="text-[10px] font-extrabold text-[#767680] uppercase tracking-wider">
              Total Tagihan Belanja
            </span>
            <p className="text-2xl font-black text-[#4648d4] tracking-tight">{formatCurrency(total)}</p>
          </div>
          <span className="rounded-xl bg-[#ebeaff] px-3 py-1.5 text-xs font-bold text-[#4648d4] border border-[#4648d4]/20 shadow-2xs">
            {cart.reduce((a, c) => a + c.quantity, 0)} Item
          </span>
        </div>

        {/* TAB 1: TUNAI */}
        {pendingPaymentMethod === 'Tunai' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-extrabold text-[#1b1b23] mb-1.5">
                Uang Diterima dari Pelanggan:
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-[#767680]">
                  Rp
                </span>
                <input
                  type="number"
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-11 pr-4 py-2.5 text-base font-black text-[#1b1b23] rounded-2xl border border-[#cac4d0] focus:border-emerald-600 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Nominal Presets */}
            <div>
              <span className="text-[11px] font-extrabold text-[#767680]">Nominal Cepat (Uang Pas / Pecahan):</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {cashPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashGiven(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      cashGiven === preset
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#f3f2fa] text-[#1b1b23] hover:bg-[#ebeaff]'
                    }`}
                  >
                    {preset === total ? '⚡ Uang Pas' : formatCurrency(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Calculation Box */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isCashSufficient
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase">
                  {isCashSufficient ? 'Kembalian Pelanggan' : 'Kekurangan Uang'}
                </span>
                <p className="text-xl font-black">
                  {isCashSufficient
                    ? formatCurrency(change)
                    : formatCurrency(Math.abs(total - cashGiven))}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                    isCashSufficient ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {isCashSufficient ? '✓ Cukup' : 'Kurang'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSFER BANK */}
        {pendingPaymentMethod === 'Transfer Bank' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#1b1b23]">
                Pilih Rekening Tujuan Transfer:
              </label>
              <div className="space-y-2">
                {bankAccounts.map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedBankIdx(idx)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedBankIdx === idx
                        ? 'border-[#4648d4] bg-[#ebeaff]/50 shadow-xs'
                        : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-[#4648d4] text-white flex items-center justify-center font-black text-xs">
                        {acc.bankName.substring(0, 3)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#1b1b23]">
                          Bank {acc.bankName} - <span className="font-mono">{acc.accountNumber}</span>
                        </p>
                        <p className="text-[10px] text-[#767680] font-semibold">a.n. {acc.accountHolder}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyBankAcc(acc.accountNumber);
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#cac4d0] text-[10px] font-bold text-[#4648d4] hover:bg-slate-100 cursor-pointer"
                    >
                      {copiedBank === acc.accountNumber ? 'Disalin' : 'Salin'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#1b1b23] mb-1">
                Nomor Referensi / Nama Pengirim (Opsional):
              </label>
              <input
                type="text"
                value={bankRefNumber}
                onChange={(e) => setBankRefNumber(e.target.value)}
                placeholder="Contoh: TRF-BCA-9921 / Doni"
                className="w-full px-3.5 py-2 text-xs font-bold text-[#1b1b23] rounded-xl border border-[#cac4d0] focus:border-[#4648d4] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 3: KARTU DEBIT / EDC */}
        {pendingPaymentMethod === 'Kartu Debit' && (
          <div className="space-y-3">
            <div className="bg-[#fcf8ff] p-3 rounded-2xl border border-[#e2e1ec] text-xs space-y-1">
              <span className="font-extrabold text-[#4648d4] flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                Mesin EDC Siap Digunakan
              </span>
              <p className="text-[11px] text-[#767680]">
                Silakan gesek atau masukkan kartu debit/kredit pelanggan pada mesin EDC kasir.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#1b1b23] mb-1">
                4 Digit Terakhir Kartu / No. Otorisasi (Opsional):
              </label>
              <input
                type="text"
                value={cardLastDigits}
                onChange={(e) => setCardLastDigits(e.target.value)}
                placeholder="Contoh: 4321 - APPR 981244"
                maxLength={20}
                className="w-full px-3.5 py-2 text-xs font-bold text-[#1b1b23] rounded-xl border border-[#cac4d0] focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Footer Confirm */}
        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(false)}
            className="flex-1 py-3 rounded-2xl border border-[#cac4d0] text-xs font-bold text-[#767680] hover:bg-[#f3f2fa] cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isProcessing || (pendingPaymentMethod === 'Tunai' && !isCashSufficient)}
            onClick={handleConfirmPayment}
            className={`flex-2 py-3 rounded-2xl text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              pendingPaymentMethod === 'Tunai'
                ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300'
                : pendingPaymentMethod === 'Transfer Bank'
                ? 'bg-[#4648d4] hover:bg-[#383ab2]'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isProcessing ? (
              <span>Memproses Pembayaran...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Konfirmasi Pembayaran ({formatCurrency(total)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Sparkles,
  ArrowRight,
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
  const [qrisTimer, setQrisTimer] = useState<number>(180); // 3 minutes
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset timer on open
  useEffect(() => {
    if (isPaymentModalOpen && pendingPaymentMethod === 'QRIS') {
      setQrisTimer(180);
      const interval = setInterval(() => {
        setQrisTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaymentModalOpen, pendingPaymentMethod]);

  if (!isPaymentModalOpen) return null;

  const change = Math.max(0, cashGiven - total);
  const isCashSufficient = cashGiven >= total;

  // Quick cash buttons
  const cashPresets = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    100000,
    200000,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i);

  const handleConfirmPayment = () => {
    if (pendingPaymentMethod === 'Tunai' && !isCashSufficient) {
      showToast('Uang tunai yang diterima kurang dari total belanja!', 'warning');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      // Trigger festive confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      processPayment(pendingPaymentMethod, pendingPaymentMethod === 'Tunai' ? cashGiven : undefined);
    }, 600);
  };

  const minutes = Math.floor(qrisTimer / 60);
  const seconds = qrisTimer % 60;
  const timerFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-[#e2e1ec] bg-white p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ebeaff] text-[#4648d4]">
              {pendingPaymentMethod === 'QRIS' ? <QrCode className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b1b23]">Pembayaran Kasir</h3>
              <p className="text-xs text-[#767680]">{selectedCustomer?.name || 'Pelanggan Umum'}</p>
            </div>
          </div>
          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className="rounded-xl p-1.5 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#f3f2fa] rounded-2xl">
          <button
            onClick={() => setPendingPaymentMethod('QRIS')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              pendingPaymentMethod === 'QRIS'
                ? 'bg-white text-[#4648d4] shadow-xs'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>QRIS Standar</span>
          </button>
          <button
            onClick={() => setPendingPaymentMethod('Tunai')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              pendingPaymentMethod === 'Tunai'
                ? 'bg-white text-[#4648d4] shadow-xs'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            <Banknote className="h-4 w-4" />
            <span>Tunai / Uang Pas</span>
          </button>
        </div>

        {/* Total Bill Pill */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#fcf8ff] border border-[#e2e1ec]">
          <div>
            <span className="text-[11px] font-bold text-[#767680] uppercase tracking-wider">
              Total Tagihan
            </span>
            <p className="text-2xl font-black text-[#4648d4] tracking-tight">{formatCurrency(total)}</p>
          </div>
          <span className="rounded-full bg-[#ebeaff] px-3 py-1 text-xs font-bold text-[#4648d4]">
            {cart.reduce((a, c) => a + c.quantity, 0)} Item
          </span>
        </div>

        {/* METHOD 1: QRIS SCREEN */}
        {pendingPaymentMethod === 'QRIS' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-2">
            <div className="relative p-4 rounded-3xl bg-white border-2 border-[#4648d4] shadow-md flex flex-col items-center">
              {/* Dynamic QR SVG Generator */}
              <div className="h-48 w-48 bg-white p-2 rounded-2xl border border-[#e2e1ec] flex items-center justify-center relative">
                <svg
                  viewBox="0 0 100 100"
                  className="h-full w-full"
                  shapeRendering="crispEdges"
                >
                  <rect width="100" height="100" fill="white" />
                  {/* Top-left marker */}
                  <rect x="10" y="10" width="25" height="25" fill="#1b1b23" rx="2" />
                  <rect x="15" y="15" width="15" height="15" fill="white" rx="1" />
                  <rect x="19" y="19" width="7" height="7" fill="#4648d4" rx="1" />
                  {/* Top-right marker */}
                  <rect x="65" y="10" width="25" height="25" fill="#1b1b23" rx="2" />
                  <rect x="70" y="15" width="15" height="15" fill="white" rx="1" />
                  <rect x="74" y="19" width="7" height="7" fill="#4648d4" rx="1" />
                  {/* Bottom-left marker */}
                  <rect x="10" y="65" width="25" height="25" fill="#1b1b23" rx="2" />
                  <rect x="15" y="70" width="15" height="15" fill="white" rx="1" />
                  <rect x="19" y="74" width="7" height="7" fill="#4648d4" rx="1" />
                  {/* QR Pattern dots */}
                  <rect x="42" y="12" width="6" height="6" fill="#1b1b23" />
                  <rect x="52" y="18" width="6" height="6" fill="#1b1b23" />
                  <rect x="40" y="28" width="6" height="6" fill="#1b1b23" />
                  <rect x="12" y="44" width="6" height="6" fill="#1b1b23" />
                  <rect x="24" y="48" width="6" height="6" fill="#1b1b23" />
                  <rect x="44" y="44" width="12" height="12" fill="#4648d4" rx="2" />
                  <rect x="65" y="42" width="6" height="6" fill="#1b1b23" />
                  <rect x="78" y="48" width="6" height="6" fill="#1b1b23" />
                  <rect x="42" y="66" width="6" height="6" fill="#1b1b23" />
                  <rect x="52" y="74" width="6" height="6" fill="#1b1b23" />
                  <rect x="68" y="68" width="8" height="8" fill="#1b1b23" />
                  <rect x="80" y="78" width="8" height="8" fill="#1b1b23" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-9 w-9 rounded-lg bg-white border border-[#4648d4] flex items-center justify-center text-[#4648d4] font-bold text-xs shadow-xs">
                    QRIS
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-[#46464f]">
                <Clock className="h-3.5 w-3.5 text-[#ba1a1a]" />
                <span>Berlaku hingga: {timerFormatted}</span>
              </div>
            </div>

            <p className="text-center text-xs text-[#767680] max-w-xs">
              Mendukung GoPay, OVO, Dana, ShopeePay, BCA, Mandiri, BRI, BNI & seluruh mobile banking.
            </p>
          </div>
        )}

        {/* METHOD 2: CASH SCREEN */}
        {pendingPaymentMethod === 'Tunai' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1b1b23] mb-1.5">
                Uang Tunai yang Diterima
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#767680]">
                  Rp
                </span>
                <input
                  id="cash-input"
                  type="number"
                  step="1000"
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-[#d2d1dc] bg-[#fcf8ff] py-3 pl-10 pr-4 text-base font-extrabold text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2">
              {cashPresets.map((val) => (
                <button
                  key={val}
                  onClick={() => setCashGiven(val)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                    cashGiven === val
                      ? 'border-[#4648d4] bg-[#ebeaff] text-[#4648d4]'
                      : 'border-[#e2e1ec] bg-white text-[#46464f] hover:bg-[#f3f2fa]'
                  }`}
                >
                  {val === total ? 'Uang Pas' : formatCurrency(val)}
                </button>
              ))}
            </div>

            {/* Change Calculation Display */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isCashSufficient
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isCashSufficient ? 'Kembalian Pelanggan' : 'Uang Pembayaran Kurang'}
                </span>
                <span className="text-xl font-black">
                  {isCashSufficient ? formatCurrency(change) : formatCurrency(total - cashGiven)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            id="confirm-payment-btn"
            disabled={isProcessing || (pendingPaymentMethod === 'Tunai' && !isCashSufficient)}
            onClick={handleConfirmPayment}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4648d4] py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#3435ad] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <span>Memproses Pembayaran...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {pendingPaymentMethod === 'QRIS'
                    ? 'Simulasi Bayar QRIS Sukses & Cetak Struk'
                    : 'Konfirmasi Pembayaran Tunai & Selesai'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

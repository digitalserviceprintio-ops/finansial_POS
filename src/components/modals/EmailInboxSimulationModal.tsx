import React, { useState } from 'react';
import {
  Mail,
  X,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  ExternalLink,
  Store,
  Sparkles,
  Inbox,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const EmailInboxSimulationModal: React.FC = () => {
  const {
    isEmailModalOpen,
    setIsEmailModalOpen,
    latestSimulatedEmail,
    showToast,
  } = useApp();

  const [copied, setCopied] = useState(false);

  if (!isEmailModalOpen || !latestSimulatedEmail) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(latestSimulatedEmail.code);
    setCopied(true);
    showToast('Kode OTP berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="email-inbox-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-[#e2e1ec] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Email Client Header Bar */}
        <div className="bg-[#1b1b23] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4648d4] text-white">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Simulasi Kotak Masuk Email</span>
                <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 font-semibold">
                  Live Inbox
                </span>
              </div>
              <p className="text-[10px] text-[#a5a4b5]">{latestSimulatedEmail.to}</p>
            </div>
          </div>

          <button
            onClick={() => setIsEmailModalOpen(false)}
            className="rounded-lg p-1.5 text-[#a5a4b5] hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Email Body Preview */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#fcf8ff]">
          {/* Sender Details */}
          <div className="bg-white p-4 rounded-2xl border border-[#e2e1ec] shadow-2xs space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4648d4] text-white font-bold text-sm shadow-xs">
                  FP
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#1b1b23]">
                    FinansialPro UMKM Security &lt;auth@finansialpro.id&gt;
                  </h4>
                  <p className="text-[11px] text-[#767680]">
                    Kepada: <strong className="text-[#1b1b23]">{latestSimulatedEmail.to}</strong>
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-[#767680] flex items-center gap-1 bg-[#f3f2fa] px-2 py-1 rounded-md">
                <Clock className="h-3 w-3" />
                {latestSimulatedEmail.sentAt}
              </span>
            </div>

            <div className="pt-2 border-t border-[#f3f2fa]">
              <p className="text-xs font-bold text-[#1b1b23]">{latestSimulatedEmail.subject}</p>
            </div>
          </div>

          {/* Formatted HTML Email Body Card */}
          <div className="bg-white rounded-2xl border border-[#d2d1dc] p-6 shadow-sm space-y-5">
            {/* Brand Logo inside email */}
            <div className="flex items-center gap-2 pb-4 border-b border-[#f3f2fa]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#4648d4] to-[#2e2f9d] text-white">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-[#1b1b23]">FinansialPro UMKM</span>
                <p className="text-[10px] text-[#767680]">Sistem Kasir POS & Pembukuan Keuangan Digital</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#1b1b23]">
                Halo Pemilik Usaha,
              </h3>
              <p className="text-xs text-[#46464f] leading-relaxed">
                Terima kasih telah mendaftar di FinansialPro UMKM. Gunakan kode verifikasi di bawah ini untuk mengonfirmasi email dan mengaktifkan akun sistem kasir & pembukuan Anda:
              </p>
            </div>

            {/* OTP Code Box */}
            <div className="bg-[#ebeaff] border border-[#d8d6fc] p-5 rounded-2xl text-center space-y-3">
              <span className="text-[11px] font-bold text-[#4648d4] uppercase tracking-wider block">
                Kode Verifikasi Email (OTP)
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-[#1b1b23] bg-white px-5 py-2.5 rounded-xl border border-[#d2d1dc] shadow-xs select-all">
                  {latestSimulatedEmail.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className={`flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#4648d4] text-white hover:bg-[#3435ad]'
                  }`}
                  title="Salin Kode"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <p className="text-[10px] text-[#767680]">
                ⚠️ Kode ini berlaku selama <strong className="text-[#1b1b23]">10 menit</strong>. Jangan bagikan kode ini kepada siapapun.
              </p>
            </div>

            <div className="space-y-1.5 text-[11px] text-[#767680] pt-2 border-t border-[#f3f2fa]">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="font-semibold">Email Resmi Terenkripsi FinansialPro UMKM</span>
              </div>
              <p>Jika Anda tidak merasa melakukan pendaftaran ini, abaikan email ini secara aman.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#e2e1ec] flex items-center justify-between">
          <span className="text-[11px] text-[#767680]">
            Klik tombol salin lalu masukkan kode pada form verifikasi.
          </span>
          <button
            onClick={() => setIsEmailModalOpen(false)}
            className="rounded-xl bg-[#4648d4] px-5 py-2 text-xs font-bold text-white hover:bg-[#3435ad] transition-colors"
          >
            Tutup Kotak Masuk
          </button>
        </div>
      </div>
    </div>
  );
};

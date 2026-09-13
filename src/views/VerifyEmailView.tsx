import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  LogOut,
  Edit2,
  Check,
  X,
  Server,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DelPOSLogo } from '../components/brand/DelPOSLogo';
import { checkEmailServiceStatus, EmailServiceStatus } from '../utils/emailService';

export const VerifyEmailView: React.FC = () => {
  const {
    currentUser,
    confirmEmailVerification,
    resendVerificationCode,
    updateUserEmail,
    pendingEmailVerification,
    logoutUser,
    showToast,
  } = useApp();

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing email state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Real SMTP service status
  const [smtpStatus, setSmtpStatus] = useState<EmailServiceStatus | null>(null);
  const [isLoadingSmtpStatus, setIsLoadingSmtpStatus] = useState(true);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const activeEmail = currentUser?.email || pendingEmailVerification?.email || '';

  // Fetch live SMTP configuration
  useEffect(() => {
    let isMounted = true;
    checkEmailServiceStatus()
      .then((status) => {
        if (isMounted) {
          setSmtpStatus(status);
          setIsLoadingSmtpStatus(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingSmtpStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown timer for resending verification code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus the first input on load
  useEffect(() => {
    otpInputsRef.current[0]?.focus();
  }, []);

  // Handle single digit typing
  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    if (char && !/^[0-9]$/.test(char)) return;

    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    setErrorMessage('');

    // Auto advance focus to next box
    if (char && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // If all 6 digits are typed, auto-submit
    if (char && index === 5 && updated.every((d) => d !== '')) {
      handleVerify(updated.join(''));
    }
  };

  // Handle Backspace and Arrow keys
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const updated = [...otpDigits];
        updated[index] = '';
        setOtpDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle Paste event (e.g. user pastes 6 digits from clipboard or email)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    const cleaned = pasted.replace(/[^0-9]/g, '').slice(0, 6);
    if (!cleaned) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < cleaned.length; i++) {
      updated[i] = cleaned[i];
    }
    setOtpDigits(updated);

    const focusIdx = Math.min(cleaned.length, 5);
    otpInputsRef.current[focusIdx]?.focus();

    if (cleaned.length === 6) {
      handleVerify(cleaned);
    }
  };

  // Submit verification code
  const handleVerify = async (codeToSubmit?: string) => {
    const code = (codeToSubmit || otpDigits.join('')).trim();
    if (code.length !== 6) {
      setErrorMessage('Harap masukkan 6-digit kode verifikasi lengkap.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await confirmEmailVerification(code, activeEmail);
      if (res.success) {
        setSuccessMessage('Email berhasil diverifikasi! Membuka akses sistem POS...');
      } else {
        setErrorMessage(res.message || 'Kode verifikasi tidak sesuai atau telah kadaluarsa.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan verifikasi.';
      setErrorMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend code via SMTP
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    if (!activeEmail) {
      setErrorMessage('Alamat email tidak ditemukan untuk mengirim ulang kode.');
      return;
    }

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await resendVerificationCode(activeEmail);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();

      if (res.emailSent) {
        setSuccessMessage(`Kode baru berhasil dikirim via server SMTP ke ${activeEmail}.`);
      } else if (!res.configured) {
        showToast('Kredensial SMTP belum disetel. Kode baru diperbarui di layar.', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim ulang kode verifikasi.';
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  // Submit email address change
  const handleSaveNewEmail = async () => {
    if (!newEmailInput.trim()) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    setIsUpdatingEmail(true);
    setErrorMessage('');

    try {
      const res = await updateUserEmail(newEmailInput.trim());
      if (res.success) {
        setIsEditingEmail(false);
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(60);
        otpInputsRef.current[0]?.focus();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah email.';
      setErrorMessage(msg);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Helper dev code for instant testing if in dev environment without configured SMTP credentials
  const devTestCode = pendingEmailVerification?.devCode;

  return (
    <div className="min-h-screen bg-[#f8f9fe] flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Bar with Brand & Logout */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 mb-4">
        <DelPOSLogo size="md" />
        <button
          id="btn-verify-logout"
          onClick={logoutUser}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#46464f] hover:text-[#1b1b23] bg-white border border-[#e2e1ec] rounded-xl hover:bg-[#f3f2fa] transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Keluar / Ganti Akun</span>
        </button>
      </header>

      {/* Main Verification Container */}
      <main className="max-w-xl w-full mx-auto my-auto">
        <div className="bg-white rounded-3xl border border-[#e2e1ec] p-6 sm:p-8 shadow-sm">
          {/* Header Icon & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#4648d4] mb-3">
              <Mail className="h-8 w-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1b1b23] tracking-tight">
              Verifikasi Alamat Email Anda
            </h1>
            <p className="text-xs sm:text-sm text-[#767680] mt-1.5 max-w-md mx-auto leading-relaxed">
              Untuk melindungi keamanan transaksi dan data toko, akun Anda wajib diverifikasi melalui email sebelum dapat mengakses fitur kasir POS.
            </p>
          </div>

          {/* Target Email Box with Edit Feature */}
          <div className="bg-[#fcf8ff] border border-[#e2e1ec] rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between text-xs font-semibold text-[#46464f] mb-1.5">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-[#4648d4]" />
                Kode Verifikasi Dikirim Ke:
              </span>
              {!isEditingEmail && (
                <button
                  id="btn-edit-email"
                  type="button"
                  onClick={() => {
                    setNewEmailInput(activeEmail);
                    setIsEditingEmail(true);
                  }}
                  className="text-xs text-[#4648d4] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Ubah Email</span>
                </button>
              )}
            </div>

            {isEditingEmail ? (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="nama@email-baru.com"
                    className="w-full rounded-xl border border-[#4648d4] bg-white py-2 pl-3 pr-3 text-xs font-semibold text-[#1b1b23] focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUpdatingEmail}
                    onClick={handleSaveNewEmail}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#4648d4] rounded-lg hover:bg-[#393bbd] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{isUpdatingEmail ? 'Menyimpan...' : 'Simpan & Kirim Kode Baru'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingEmail}
                    onClick={() => setIsEditingEmail(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#767680] hover:text-[#1b1b23] bg-white border border-[#d2d1dc] rounded-lg hover:bg-[#f3f2fa] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Batal</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm sm:text-base font-extrabold text-[#1b1b23] tracking-wide break-all">
                  {activeEmail || 'Email Pengguna'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  Belum Terverifikasi
                </span>
              </div>
            )}
          </div>

          {/* Real SMTP Server Status Indicator */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Server className="h-3.5 w-3.5 text-indigo-600" />
                <span>Status Pengiriman Server SMTP</span>
              </div>
              {isLoadingSmtpStatus ? (
                <span className="text-[10px] text-slate-500">Memeriksa status...</span>
              ) : smtpStatus?.configured ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Server SMTP Aktif ({smtpStatus.smtpHost}:{smtpStatus.smtpPort || 587})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                  <Info className="h-3 w-3" />
                  <span>SMTP Host: {smtpStatus?.smtpHost || 'smtp.gmail.com'}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Email dikirimkan secara otomatis menggunakan protokol SMTP aman. Pastikan untuk memeriksa kotak masuk (Inbox) serta folder <strong>Spam / Promosi</strong> jika email belum tampak.
            </p>

            {/* Test Helper / Dev Code banner (if SMTP credentials are not yet configured in preview environment) */}
            {devTestCode && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-indigo-50/70 p-2.5 rounded-xl">
                <div className="text-[11px] text-indigo-900">
                  <span className="font-bold">Mode Simulasi/Pengujian:</span> Kode OTP untuk email ini adalah{' '}
                  <span className="font-mono font-extrabold text-sm text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {devTestCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = devTestCode.split('');
                    setOtpDigits(digits);
                    handleVerify(devTestCode);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 transition-colors cursor-pointer"
                >
                  Isi & Verifikasi Otomatis
                </button>
              </div>
            )}
          </div>

          {/* 6-Digit OTP Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-center text-xs font-bold text-[#1b1b23] mb-3">
                Masukkan 6-Digit Kode Verifikasi Email
              </label>
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl border transition-all ${
                      digit
                        ? 'border-[#4648d4] bg-indigo-50/20 text-[#4648d4] shadow-sm'
                        : 'border-[#d2d1dc] bg-[#fcf8ff] text-[#1b1b23] focus:border-[#4648d4] focus:bg-white'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-100`}
                  />
                ))}
              </div>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Display */}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Confirm Button */}
            <button
              id="btn-confirm-email"
              type="submit"
              disabled={isVerifying || otpDigits.some((d) => d === '')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#4648d4] hover:bg-[#393bbd] text-white text-sm font-bold rounded-2xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Memverifikasi Kode Email...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Konfirmasi Email & Buka Akses Kasir POS</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Resend Action */}
            <div className="text-center pt-2">
              <p className="text-xs text-[#767680] mb-2">
                Tidak menerima email verifikasi di kotak masuk?
              </p>
              <button
                id="btn-resend-verification"
                type="button"
                disabled={resendCooldown > 0 || isResending}
                onClick={handleResend}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4648d4] hover:text-[#393bbd] disabled:text-[#767680] disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `Kirim Ulang Kode via SMTP (${resendCooldown}s)`
                    : 'Kirim Ulang Kode Verifikasi'}
                </span>
              </button>
            </div>
          </form>

          {/* Security & Access Protection Info */}
          <div className="mt-8 pt-6 border-t border-[#e2e1ec]">
            <div className="flex items-center gap-2 mb-2 text-xs font-extrabold text-[#1b1b23]">
              <Lock className="h-4 w-4 text-[#4648d4]" />
              <span>Mengapa Verifikasi Email Diperlukan?</span>
            </div>
            <ul className="text-xs text-[#767680] space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Memastikan pemilik usaha sah sebelum membuka akses transaksi kasir dan rekonsiliasi uang tunai.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Menerima struk transaksi digital pelanggan dan laporan tutup buku harian melalui server SMTP.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Pemulihan kata sandi darurat dan pencegahan akses tidak sah dari perangkat lain.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#767680] py-4">
        &copy; {new Date().getFullYear()} DelPOS Cloud System &bull; Keamanan Terotentikasi SMTP
      </footer>
    </div>
  );
};

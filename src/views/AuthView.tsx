import React, { useState, useRef, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  Building,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Clock,
  LogOut,
  HelpCircle,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DelPOSLogo } from '../components/brand/DelPOSLogo';
import { DelPOSFeatureBadges } from '../components/brand/DelPOSFeatureBadges';
import { AuthHeroIllustration } from '../components/auth/AuthHeroIllustration';
import { PasswordRequirementGuide } from '../components/auth/PasswordRequirementGuide';
import { validatePassword } from '../utils/security';

export const AuthView: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    sendVerificationEmail,
    verifyEmailCode,
    resendVerificationCode,
    loginWithCredentials,
    sendPasswordResetLink,
    resetUserPassword,
    showToast,
  } = useApp();

  // Auth Mode: 'register' | 'verify' | 'login' | 'forgot_password' | 'reset_password'
  const [mode, setMode] = useState<'register' | 'verify' | 'login' | 'forgot_password' | 'reset_password'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot & Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [isSubmittingResetPass, setIsSubmittingResetPass] = useState(false);

  // Register Form Data
  const [regFullName, setRegFullName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Verification State
  const [verifEmail, setVerifEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Login Form Data & Multi-Device Conflict State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [deviceConflict, setDeviceConflict] = useState<{
    userEmail: string;
    deviceName: string;
    loggedInAt: string;
  } | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Listen for reset password event from email simulation modal & URL params
  useEffect(() => {
    const handleOpenReset = (e: any) => {
      if (e.detail?.email && e.detail?.token) {
        setForgotEmail(e.detail.email);
        setResetToken(e.detail.token);
        setMode('reset_password');
        setErrorMessage('');
      }
    };
    window.addEventListener('delpos_open_reset_password', handleOpenReset);

    // Check URL parameters
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const emailParam = params.get('email');
      const tokenParam = params.get('token');
      if (action === 'reset_password' && emailParam && tokenParam) {
        setForgotEmail(emailParam);
        setResetToken(tokenParam);
        setMode('reset_password');
      }
    } catch {}

    return () => window.removeEventListener('delpos_open_reset_password', handleOpenReset);
  }, []);

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, resendTimer]);

  // Focus first input on verification mode open
  useEffect(() => {
    if (mode === 'verify') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [mode]);

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMessage('');

    // Auto move to next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto submit if all filled
    const completeCode = newDigits.join('');
    if (completeCode.length === 6) {
      handleVerifyOtp(completeCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      otpInputsRef.current[5]?.focus();
      handleVerifyOtp(pastedData);
    }
  };

  // Submit Registration Form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regFullName.trim() || !regBusinessName.trim() || !regEmail.trim()) {
      setErrorMessage('Harap lengkapi semua kolom pendaftaran.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Anda harus menyetujui Syarat dan Ketentuan.');
      return;
    }

    // Validate mandatory password combination: uppercase, lowercase, number, and special character
    const passCheck = validatePassword(regPassword, 8);
    if (!passCheck.isValid) {
      setErrorMessage(passCheck.message || 'Kata sandi harus mengandung kombinasi huruf besar, kecil, angka, dan karakter.');
      return;
    }

    try {
      const res = await sendVerificationEmail(
        regEmail.trim(),
        regFullName.trim(),
        regBusinessName.trim(),
        regPhone.trim() || '081234567890',
        regPassword
      );

      if (res.success) {
        setVerifEmail(regEmail.trim());
        setMode('verify');
        setResendTimer(60);
        setOtpDigits(['', '', '', '', '', '']);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim kode verifikasi.');
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Harap masukkan 6-digit kode OTP lengkap.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    setTimeout(() => {
      const res = verifyEmailCode(verifEmail, code);
      setIsVerifying(false);

      if (res.success) {
        showToast('🎉 Email berhasil diverifikasi! Selamat datang di DelPOS.', 'success');
      } else {
        setErrorMessage(res.message || 'Kode verifikasi tidak sesuai atau sudah kadaluarsa.');
      }
    }, 600);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await resendVerificationCode(verifEmail);
    setResendTimer(60);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage('');
  };

  // Submit Login with Multi-Device Check
  const handleLoginSubmit = async (e?: React.FormEvent, forceOverride: boolean = false) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setDeviceConflict(null);

    if (!loginEmail.trim()) {
      setErrorMessage('Harap masukkan email Anda.');
      return;
    }

    setIsSubmittingLogin(true);
    try {
      const res = await loginWithCredentials(loginEmail.trim(), loginPassword, forceOverride);
      if (res.success) {
        showToast(res.message, 'success');
        setDeviceConflict(null);
      } else if (res.isDeviceConflict && res.conflictSession) {
        setDeviceConflict({
          userEmail: loginEmail.trim(),
          deviceName: res.conflictSession.deviceName || 'Perangkat Lain',
          loggedInAt: res.conflictSession.loggedInAt,
        });
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk. Silakan coba lagi.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Recheck if previous device has logged out
  const handleRecheckSession = async () => {
    setIsCheckingConflict(true);
    setErrorMessage('');
    try {
      const res = await loginWithCredentials(loginEmail.trim(), loginPassword, false);
      if (res.success) {
        showToast('🎉 Perangkat sebelumnya telah logout! Masuk berhasil...', 'success');
        setDeviceConflict(null);
      } else if (res.isDeviceConflict) {
        showToast('⚠️ Perangkat lama masih aktif. Anda harus logout terlebih dahulu dari perangkat tersebut.', 'warning');
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setIsCheckingConflict(false);
    }
  };

  // Submit Forgot Password Link
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setResetSuccessMsg('');

    if (!forgotEmail.trim()) {
      setErrorMessage('Harap masukkan alamat email terdaftar Anda.');
      return;
    }

    setIsSendingReset(true);
    try {
      const res = await sendPasswordResetLink(forgotEmail.trim());
      if (res.success) {
        setResetSuccessMsg(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim link perubahan kata sandi.');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Submit New Password Reset
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate mandatory password combination: uppercase, lowercase, number, and special character
    const passCheck = validatePassword(newResetPassword, 8);
    if (!passCheck.isValid) {
      setErrorMessage(passCheck.message || 'Kata sandi baru harus memiliki kombinasi huruf besar, kecil, angka, dan karakter khusus.');
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setErrorMessage('Konfirmasi kata sandi baru tidak cocok. Periksa kembali.');
      return;
    }

    setIsSubmittingResetPass(true);
    try {
      const res = await resetUserPassword(forgotEmail.trim(), resetToken, newResetPassword);
      if (res.success) {
        setLoginEmail(forgotEmail.trim());
        setLoginPassword(newResetPassword);
        setMode('login');
        setResetSuccessMsg('');
        setNewResetPassword('');
        setConfirmResetPassword('');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengubah kata sandi.');
    } finally {
      setIsSubmittingResetPass(false);
    }
  };

  // Force takeover if old device is broken/lost/inaccessible
  const handleForceOverride = async () => {
    await handleLoginSubmit(undefined, true);
  };

  return (
    <div
      id="auth-gateway"
      className="min-h-screen bg-gradient-to-br from-[#f0f5ff] via-[#f7faff] to-[#eef4fe] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden"
    >
      {/* Background Soft Wave Light Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto z-10 py-6">
        {/* 2-Column Split Hero Layout matching user capture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Cashier Character Hero Illustration & Floating Badges */}
          <div className="hidden lg:flex lg:col-span-6 items-center justify-center">
            <AuthHeroIllustration />
          </div>

          {/* Right Column: 4 Feature Cards + Main DelPos Login Card */}
          <div className="lg:col-span-6 space-y-4 max-w-xl mx-auto lg:max-w-none w-full">
            {/* Top 4 Feature Highlights Badges (KASIR, KEUANGAN, LAPORAN, AMAN) */}
            <DelPOSFeatureBadges layout="grid" />

            {/* Main Auth Card Container */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#0047cc] via-[#0055EE] to-[#0077FF] p-6 sm:p-7 text-white relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DelPOSLogo variant="compact" size="lg" theme="dark" showPoweredBy={true} />
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-xs border border-white/20 shadow-2xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                    <span>v1.2 Cloud Secured</span>
                  </div>
                </div>

                {/* Mode Switcher Tabs */}
                {mode !== 'verify' && (
                  <div className="mt-6 flex rounded-2xl bg-black/25 p-1 backdrop-blur-xs">
                    <button
                      id="tab-register-btn"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage('');
                        setResetSuccessMsg('');
                      }}
                      className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        mode === 'register'
                          ? 'bg-white text-[#0055EE] shadow-md font-extrabold'
                          : 'text-white/90 hover:text-white'
                      }`}
                    >
                      Daftar Akun Baru
                    </button>
                    <button
                      id="tab-login-btn"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage('');
                        setResetSuccessMsg('');
                      }}
                      className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        mode === 'login' || mode === 'forgot_password' || mode === 'reset_password'
                          ? 'bg-white text-[#0055EE] shadow-md font-extrabold'
                          : 'text-white/90 hover:text-white'
                      }`}
                    >
                      Masuk ke Akun
                    </button>
                  </div>
                )}
              </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Multi-Device Login Conflict Warning */}
            {deviceConflict && (
              <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5 shadow-md space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                        Peringatan Perangkat Ganda
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-amber-950 mt-1">
                      Akun Sedang Aktif di Perangkat Lain
                    </h4>
                    <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                      Akun <strong className="text-amber-950">{deviceConflict.userEmail}</strong> saat ini terdeteksi sedang aktif dan terkunci di perangkat:
                    </p>

                    {/* Active Device Info Box */}
                    <div className="mt-2.5 rounded-xl border border-amber-200 bg-white/90 p-3 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Smartphone className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="font-bold truncate">{deviceConflict.deviceName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Waktu Masuk: {new Date(deviceConflict.loggedInAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {/* Strict System Rule Notice */}
                    <div className="mt-2.5 rounded-xl bg-amber-200/50 p-3 text-xs text-amber-950 leading-relaxed border border-amber-300/60">
                      <p className="font-bold flex items-center gap-1 text-amber-900">
                        <span>🔒 Kebijakan Keamanan Kasir:</span>
                      </p>
                      <p className="mt-1">
                        Satu akun kasir/toko hanya dapat aktif pada <strong>1 perangkat dalam satu waktu</strong> untuk mencegah bentrok data transaksi offline/online. 
                        <strong className="text-red-700 block mt-1">Harus log out terlebih dahulu dari perangkat tersebut jika mau pindah perangkat.</strong>
                      </p>
                    </div>

                    {/* Interactive Action Controls */}
                    <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRecheckSession}
                        disabled={isCheckingConflict}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2.5 text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isCheckingConflict ? 'animate-spin' : ''}`} />
                        <span>{isCheckingConflict ? 'Memeriksa Status...' : 'Cek Status Logout & Masuk Ulang'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleForceOverride}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 px-3 py-2.5 text-[11px] font-semibold transition-all cursor-pointer"
                        title="Gunakan ini jika perangkat sebelumnya hilang, rusak, atau baterai habis"
                      >
                        <LogOut className="h-3.5 w-3.5 text-amber-700" />
                        <span>Paksa Logout & Masuk Disini</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert Message (only when not device conflict) */}
            {errorMessage && !deviceConflict && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 animate-in fade-in duration-150">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* 1. REGISTER FORM (Pendaftaran Pengguna Baru) */}
            {/* ========================================================= */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-[#1b1b23]">Registrasi Pemilik Usaha Baru</h2>
                  <p className="text-xs text-[#767680]">
                    Daftarkan usaha Anda untuk mulai mengelola kasir POS, stok barang, dan arus kas otomatis.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                      Nama Lengkap Pemilik <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Budi Santoso"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2.5 pl-10 pr-3 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Nama Usaha / Brand */}
                  <div>
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                      Nama Brand / Toko UMKM <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Kopi Kenangan Kita"
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2.5 pl-10 pr-3 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email Aktif */}
                  <div>
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                      Email Aktif (Untuk OTP) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2.5 pl-10 pr-3 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Nomor WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type="tel"
                        placeholder="0812xxxxxxxx"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2.5 pl-10 pr-3 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Kata Sandi */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                      Kata Sandi / PIN Akun
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Contoh: Toko2026!#"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2.5 pl-10 pr-10 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#767680] hover:text-[#1b1b23]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Live Password Criteria & Strength Guide */}
                    <PasswordRequirementGuide password={regPassword} />
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="h-4 w-4 rounded text-[#4648d4] focus:ring-[#4648d4]"
                  />
                  <label htmlFor="terms-check" className="text-[11px] text-[#767680] cursor-pointer">
                    Saya menyetujui Ketentuan Layanan & Kebijakan Data DelPOS (powered by microdata2r)
                  </label>
                </div>

                {/* Submit button */}
                <button
                  id="submit-register-btn"
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4648d4] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#3435ad] transition-all active:scale-98"
                >
                  <Mail className="h-4 w-4" />
                  <span>Kirim Kode Verifikasi ke Email</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {/* Quick Demo Access Alternative */}
                <div className="pt-3 border-t border-[#f3f2fa] flex items-center justify-between">
                  <span className="text-[11px] text-[#767680]">Sudah punya akun terdaftar?</span>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs font-bold text-[#4648d4] hover:underline"
                  >
                    Masuk Sekarang
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* 2. VERIFY EMAIL CODE (OTP SCREEN) */}
            {/* ========================================================= */}
            {mode === 'verify' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4] shadow-xs">
                    <Mail className="h-7 w-7" />
                  </div>
                  <h2 className="text-lg font-extrabold text-[#1b1b23]">Verifikasi Email Anda</h2>
                  <p className="text-xs text-[#767680] max-w-sm mx-auto">
                    Kami telah mengirimkan 6-digit kode OTP ke email:{' '}
                    <strong className="text-[#1b1b23] block text-sm mt-0.5">{verifEmail}</strong>
                  </p>
                </div>

                {/* Real Email Delivery Info Box */}
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3.5 space-y-1.5 text-left">
                  <div className="flex items-start gap-2.5 text-xs text-blue-900">
                    <Mail className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-950 block">Periksa Kotak Masuk Email Anda</span>
                      <p className="text-blue-800 text-[11px] leading-relaxed mt-0.5">
                        Kode verifikasi telah dikirim langsung ke <strong>{verifEmail}</strong>. Silakan periksa folder <strong>Kotak Masuk (Inbox)</strong> atau folder <strong>Spam / Promosi</strong> jika dalam beberapa saat belum muncul.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6 Digit OTP Input Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputsRef.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="h-12 w-11 sm:h-14 sm:w-12 rounded-2xl border-2 border-[#d2d1dc] bg-[#fcf8ff] text-center font-mono text-xl sm:text-2xl font-extrabold text-[#1b1b23] shadow-xs focus:border-[#4648d4] focus:bg-white focus:outline-none transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#767680] px-2">
                    <span>Masa berlaku: 10 menit</span>
                    {resendTimer > 0 ? (
                      <span>Kirim ulang dalam <strong className="text-[#4648d4]">{resendTimer}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="font-bold text-[#4648d4] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Kirim Ulang Kode</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    id="btn-verify-otp"
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isVerifying}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4648d4] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#3435ad] transition-all disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Memverifikasi Kode...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verifikasi & Buka Aplikasi</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="w-full py-2 text-xs font-semibold text-[#767680] hover:text-[#1b1b23] transition-colors text-center"
                  >
                    ← Ubah Alamat Email Pendaftaran
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3. LOGIN FORM (Masuk ke Akun Terdaftar) */}
            {/* ========================================================= */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-[#1b1b23]">Masuk ke Akun Toko</h2>
                  <p className="text-xs text-[#767680]">
                    Masukkan email dan kata sandi Anda untuk mengakses akun toko.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1.5">
                      Email Terdaftar
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-3 pl-10 pr-3 text-xs text-[#1b1b23] focus:border-[#0055EE] focus:bg-white focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#1b1b23]">
                        Kata Sandi / PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail || '');
                          setMode('forgot_password');
                          setErrorMessage('');
                          setResetSuccessMsg('');
                        }}
                        className="text-xs font-bold text-[#0055EE] hover:text-[#003B99] hover:underline transition-colors cursor-pointer"
                      >
                        Lupa password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan kata sandi / PIN"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-3 pl-10 pr-10 text-xs text-[#1b1b23] focus:border-[#0055EE] focus:bg-white focus:outline-none transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#767680] hover:text-[#1b1b23] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  id="submit-login-btn"
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0055EE] hover:bg-[#0047cc] py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingLogin ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Memverifikasi Sesi Perangkat...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================= */}
            {/* 4. FORGOT PASSWORD FORM (Kirim Link Perubahan Password) */}
            {/* ========================================================= */}
            {mode === 'forgot_password' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage('');
                        setResetSuccessMsg('');
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Kembali ke Halaman Masuk"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-base sm:text-lg font-black text-[#1b1b23]">Lupa Kata Sandi</h2>
                  </div>
                  <p className="text-xs text-[#767680]">
                    Masukkan email terdaftar Anda. Kami akan mengirimkan link perubahan password ke email tersebut.
                  </p>
                </div>

                {resetSuccessMsg ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-start gap-2.5 text-emerald-800 text-xs">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-emerald-950 block">Link Berhasil Dikirim!</span>
                        <p className="text-emerald-800 leading-relaxed">{resetSuccessMsg}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-emerald-200/80">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setResetSuccessMsg('');
                        }}
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 transition-colors cursor-pointer text-center shadow-xs"
                      >
                        Kembali ke Halaman Masuk
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#1b1b23] mb-1.5">
                          Email Terdaftar
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                          <input
                            type="email"
                            required
                            placeholder="nama@email.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-3 pl-10 pr-3 text-xs text-[#1b1b23] focus:border-[#0055EE] focus:bg-white focus:outline-none transition-all shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingReset}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0055EE] hover:bg-[#0047cc] py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingReset ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Mengirim Link Perubahan Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Kirim Link Perubahan Password</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setErrorMessage('');
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        ← Batal & Kembali ke Masuk
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* ========================================================= */}
            {/* 5. RESET PASSWORD FORM (Buat Password Baru) */}
            {/* ========================================================= */}
            {mode === 'reset_password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-[#1b1b23]">Buat Kata Sandi Baru</h2>
                  <p className="text-xs text-[#767680]">
                    Masukkan kata sandi baru untuk akun <strong className="text-[#1b1b23]">{forgotEmail}</strong>.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Contoh: Rahasia2026@!"
                        value={newResetPassword}
                        onChange={(e) => setNewResetPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-3 pl-10 pr-10 text-xs text-[#1b1b23] focus:border-[#0055EE] focus:bg-white focus:outline-none transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#767680] hover:text-[#1b1b23] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Live Password Criteria & Strength Guide for Reset */}
                    <PasswordRequirementGuide password={newResetPassword} showAlways={true} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1.5">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        placeholder="Ulangi kata sandi baru"
                        value={confirmResetPassword}
                        onChange={(e) => setConfirmResetPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-3 pl-10 pr-10 text-xs text-[#1b1b23] focus:border-[#0055EE] focus:bg-white focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingResetPass}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0055EE] hover:bg-[#0047cc] py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingResetPass ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Menyimpan Kata Sandi Baru...</span>
                    </>
                  ) : (
                    <>
                      <span>Simpan Kata Sandi Baru & Masuk</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    ← Batal & Kembali ke Masuk
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* App Version & Copyright */}
        <div className="mt-4 text-center text-xs text-[#767680]">
          <p className="font-medium text-slate-500">
            <span className="font-bold text-slate-700">DelPos v1.2</span>
            <span className="mx-2 text-slate-300">•</span>
            <span>© {new Date().getFullYear()} DelPos. Hak Cipta Dilindungi.</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

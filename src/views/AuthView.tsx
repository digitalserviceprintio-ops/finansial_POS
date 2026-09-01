import React, { useState, useRef, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Inbox,
  AlertCircle,
  HelpCircle,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DelPOSLogo } from '../components/brand/DelPOSLogo';
import { DelPOSFeatureBadges } from '../components/brand/DelPOSFeatureBadges';

export const AuthView: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    sendVerificationEmail,
    verifyEmailCode,
    resendVerificationCode,
    loginWithCredentials,
    loginAsDemoUser,
    isEmailModalOpen,
    setIsEmailModalOpen,
    latestSimulatedEmail,
    showToast,
  } = useApp();

  // Auth Mode: 'register' | 'verify' | 'login'
  const [mode, setMode] = useState<'register' | 'verify' | 'login'>('register');
  const [showPassword, setShowPassword] = useState(false);

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

  // Login Form Data
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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
  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    const newCode = resendVerificationCode(verifEmail);
    setResendTimer(60);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage('');
    showToast(`Kode baru telah dikirimkan ke email ${verifEmail}`, 'info');
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Harap masukkan email Anda.');
      return;
    }

    const res = loginWithCredentials(loginEmail.trim(), loginPassword);
    if (res.success) {
      showToast('Masuk berhasil! Membuka sesi kasir...', 'success');
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div
      id="auth-gateway"
      className="min-h-screen bg-gradient-to-br from-[#f0eff8] via-[#fcf8ff] to-[#e8e6f7] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-xl">
        {/* Floating simulated email inbox banner if an email was sent */}
        {latestSimulatedEmail && (
          <div className="mb-4 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-[#4648d4]/30 shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold shrink-0">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1b1b23]">
                  Email Verifikasi Terkirim ke <span className="text-[#4648d4]">{latestSimulatedEmail.to}</span>
                </p>
                <p className="text-[11px] text-[#767680]">
                  Kode OTP Anda: <strong className="font-mono text-emerald-800 font-extrabold text-xs">{latestSimulatedEmail.code}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#4648d4] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#3435ad] transition-all shrink-0"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Buka Kotak Masuk</span>
            </button>
          </div>
        )}

        {/* Top Feature Highlights Bar from Image */}
        <div className="mb-4">
          <DelPOSFeatureBadges layout="grid" />
        </div>

        {/* Main Auth Card Container */}
        <div className="bg-white rounded-3xl border border-[#e2e1ec] shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#003B99] via-[#0055EE] to-[#0077FF] p-6 sm:p-7 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DelPOSLogo variant="compact" size="lg" theme="dark" showPoweredBy={true} />
              </div>

              <div className="hidden sm:flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                <span>v1.2 Cloud Secured</span>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            {mode !== 'verify' && (
              <div className="mt-6 flex rounded-2xl bg-black/20 p-1 backdrop-blur-xs">
                <button
                  id="tab-register-btn"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                    mode === 'register'
                      ? 'bg-white text-[#4648d4] shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Daftar Akun Baru
                </button>
                <button
                  id="tab-login-btn"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-white text-[#4648d4] shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Masuk ke Akun
                </button>
              </div>
            )}
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Error Alert Message */}
            {errorMessage && (
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
                        placeholder="Minimal 6 karakter"
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
                    Saya menyetujui Ketentuan Layanan & Kebijakan Data DelPOS (powered by AkuPos)
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

                {/* Simulated Email Button Trigger */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ebeaff] border border-[#d8d6fc] px-4 py-2 text-xs font-bold text-[#4648d4] hover:bg-[#d8d6fc] transition-colors shadow-2xs"
                  >
                    <Inbox className="h-4 w-4" />
                    <span>Lihat Email Masuk (Simulasi Live OTP)</span>
                  </button>
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
                  <h2 className="text-base font-extrabold text-[#1b1b23]">Masuk ke Akun Toko</h2>
                  <p className="text-xs text-[#767680]">
                    Gunakan email terdaftar atau pilih profil pengguna cepat di bawah.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1">Email Terdaftar</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2.5 pl-10 pr-3 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1b23] mb-1">Kata Sandi / PIN</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan kata sandi / PIN"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
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
                  </div>
                </div>

                <button
                  id="submit-login-btn"
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4648d4] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#3435ad] transition-all active:scale-98"
                >
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {/* Divider for Quick Demo Logins */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="w-full border-t border-[#e2e1ec]"></div>
                  <span className="absolute bg-white px-3 text-[10px] font-bold text-[#767680] uppercase tracking-wider">
                    Atau Masuk Cepat
                  </span>
                </div>

                {/* Quick Demo User Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => loginAsDemoUser('owner')}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-[#e2e1ec] bg-[#fcf8ff] hover:bg-[#ebeaff] hover:border-[#4648d4] transition-all text-left group"
                  >
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJ_UeVtMqix0sJCZHs2TtKM5-d72Pea84EAktZj50a8963OhMvLReqs1NHQ5_GHU31yQIOvnrJgSfVJ_GeiKlPatJEFijCOybVvFFiMGK5NOxgk9QrAVW_iXOt0iW_JoPaZYQPCnyP7yXiRGmSsKfKm7wGSICkKlm5wlq8E4GuzgUAsgAUa1swPQ-m8CDYgnJ9jjXFUt_9CTSEQH_yEVGaOFNO6eA39ylX7lz2CTC7oAh5YPsc0Mc"
                      alt="Budi Santoso"
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-white shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#1b1b23] group-hover:text-[#4648d4]">
                        Budi Santoso
                      </p>
                      <p className="text-[10px] text-[#767680] truncate">Owner Toko</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loginAsDemoUser('cashier')}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-[#e2e1ec] bg-[#fcf8ff] hover:bg-[#ebeaff] hover:border-[#4648d4] transition-all text-left group"
                  >
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoLtV3Bv2OBXPlq_WrGjzOKb2hx7Pr3DOTjypa8dkEKduOjjWvN91FeXpeuVJDGRacnpFhqLouF2glsjyg154-ONwKg9-AXq2ylnHCQIAwb0pQ9662t3tt1reJkfrz46PuKvm9rTpygmqRrJUs0iC2FvO13DZ8nlMx-0eSm-8yba6zLFIndlcCVnmVfynCOWQHJRodfFxaOXcZ1AmWZ9mFAugAFABkMmuQ6rlyglKy280HkFHaQKc"
                      alt="Siti Aisyah"
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-white shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#1b1b23] group-hover:text-[#4648d4]">
                        Siti Aisyah
                      </p>
                      <p className="text-[10px] text-[#767680] truncate">Kasir POS</p>
                    </div>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Security & Support Guarantee */}
        <div className="mt-6 text-center text-[11px] text-[#767680] space-y-1">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Semua data keuangan terenkripsi & tersimpan secara lokal dan aman.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

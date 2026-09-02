import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  LogOut,
  Sparkles,
  KeyRound,
  Store,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DelPOSLogo } from '../brand/DelPOSLogo';
import { APP_CONFIG } from '../../utils/appConfig';
import { soundManager } from '../../utils/soundAlert';

export const AppLockModal: React.FC = () => {
  const {
    isAppLocked,
    currentUser,
    storeProfile,
    unlockApp,
    logoutUser,
    lockDurationMinutes,
    showToast,
  } = useApp();

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [useKeypad, setUseKeypad] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when locked
  useEffect(() => {
    if (isAppLocked) {
      setPasswordInput('');
      setErrorMsg('');
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isAppLocked]);

  if (!isAppLocked || !currentUser) {
    return null;
  }

  const handleUnlock = (pwdToTest?: string) => {
    const password = pwdToTest !== undefined ? pwdToTest : passwordInput;
    if (!password.trim()) {
      setErrorMsg('Masukkan password atau PIN kasir');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const result = unlockApp(password);
    if (result.success) {
      setIsSuccess(true);
      soundManager.playSuccessChime();
      showToast('Kunci aplikasi berhasil dibuka!', 'success');
      setTimeout(() => {
        setPasswordInput('');
        setErrorMsg('');
        setIsSuccess(false);
      }, 350);
    } else {
      setErrorMsg(result.message || 'Password atau PIN tidak sesuai');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPasswordInput('');
      setErrorMsg('');
    } else if (val === 'BACK') {
      setPasswordInput((prev) => prev.slice(0, -1));
      setErrorMsg('');
    } else {
      if (passwordInput.length < 16) {
        const next = passwordInput + val;
        setPasswordInput(next);
        setErrorMsg('');
        // Auto unlock if 6 digits match pin
        if (next.length === 6) {
          setTimeout(() => handleUnlock(next), 100);
        }
      }
    }
  };

  const handleQuickUnlockDemo = () => {
    handleUnlock('123456');
  };

  return (
    <div
      id="app-lock-screen-modal"
      className="fixed inset-0 z-9999 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300"
    >
      <div
        className={`w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative transition-transform ${
          shake ? 'animate-bounce text-red-500' : ''
        }`}
      >
        {/* Top Gradient Banner */}
        <div className="bg-linear-to-br from-indigo-600 via-blue-600 to-indigo-800 p-6 sm:p-7 text-white text-center relative overflow-hidden">
          {/* Subtle background circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />

          {/* Brand Logo & Lock Status Badge */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 text-xs font-bold text-white">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Inaktivitas {lockDurationMinutes} Menit</span>
            </div>

            <div className="bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-black text-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sesi Aman
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg mb-3">
              {isSuccess ? (
                <Unlock className="w-8 h-8 text-emerald-300 animate-bounce" />
              ) : (
                <Lock className="w-8 h-8 text-amber-300" />
              )}
            </div>

            <h2 className="text-xl font-black tracking-tight text-white">
              Sistem Terkunci Otomatis
            </h2>
            <p className="text-xs text-blue-100 mt-1 max-w-xs mx-auto leading-relaxed">
              Aplikasi {APP_CONFIG.brand} terkunci karena tidak ada aktivitas selama {lockDurationMinutes} menit. Masukkan password/PIN untuk melanjutkan transaksi.
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-6 pt-5 pb-1">
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <img
              src={
                currentUser.avatarUrl ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ_UeVtMqix0sJCZHs2TtKM5-d72Pea84EAktZj50a8963OhMvLReqs1NHQ5_GHU31yQIOvnrJgSfVJ_GeiKlPatJEFijCOybVvFFiMGK5NOxgk9QrAVW_iXOt0iW_JoPaZYQPCnyP7yXiRGmSsKfKm7wGSICkKlm5wlq8E4GuzgUAsgAUa1swPQ-m8CDYgnJ9jjXFUt_9CTSEQH_yEVGaOFNO6eA39ylX7lz2CTC7oAh5YPsc0Mc'
              }
              alt={currentUser.fullName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/20 shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-900 truncate">
                  {currentUser.fullName}
                </p>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    currentUser.role === 'owner'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {currentUser.role === 'owner' ? 'Pemilik' : 'Kasir'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {storeProfile.name || 'Toko UMKM'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlock();
            }}
            className="space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Password / PIN Pengguna</span>
                </label>
                <button
                  type="button"
                  onClick={() => setUseKeypad(!useKeypad)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {useKeypad ? '⌨️ Gunakan Keyboard' : '🔢 Buka Numpad'}
                </button>
              </div>

              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Ketik password atau PIN..."
                  className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-semibold tracking-wider transition-all outline-hidden pr-11 ${
                    errorMsg
                      ? 'border-red-400 bg-red-50/50 text-red-900 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-2 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            {/* Touch Keypad (Numpad for Tablets & Mobile POS) */}
            {useKeypad && (
              <div className="grid grid-cols-3 gap-2 pt-1 pb-1 animate-in fade-in duration-200">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(
                  (btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => {
                        if (btn === 'C') handleKeypadPress('CLEAR');
                        else if (btn === '⌫') handleKeypadPress('BACK');
                        else handleKeypadPress(btn);
                      }}
                      className={`h-11 rounded-xl text-sm font-black transition-all active:scale-95 cursor-pointer shadow-2xs ${
                        btn === 'C'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : btn === '⌫'
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {btn}
                    </button>
                  )
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSuccess}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-spin" />
                  <span>Membuka Akses...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Buka Kunci Sesi</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Helper & Demo Pin */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleQuickUnlockDemo}
                className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition-colors"
                title="Buka otomatis dengan PIN standar 123456"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Buka Cepat (PIN: 123456)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logoutUser();
                }}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ganti Akun Kasir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

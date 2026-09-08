import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { validatePassword } from '../../utils/security';

interface PasswordRequirementGuideProps {
  password: string;
  showAlways?: boolean;
}

export const PasswordRequirementGuide: React.FC<PasswordRequirementGuideProps> = ({
  password,
  showAlways = false,
}) => {
  const result = validatePassword(password, 8);
  const isStarted = password.length > 0;

  if (!showAlways && !isStarted) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
        <span>Harus kombinasi huruf besar, kecil, angka, dan karakter (min. 8 karakter).</span>
      </div>
    );
  }

  const items = [
    {
      id: 'upper',
      label: 'Huruf besar (A-Z)',
      valid: result.hasUppercase,
    },
    {
      id: 'lower',
      label: 'Huruf kecil (a-z)',
      valid: result.hasLowercase,
    },
    {
      id: 'number',
      label: 'Angka (0-9)',
      valid: result.hasNumber,
    },
    {
      id: 'special',
      label: 'Karakter khusus / simbol (!@#$%)',
      valid: result.hasSpecialChar,
    },
    {
      id: 'length',
      label: 'Minimal 8 karakter',
      valid: result.hasMinLength,
    },
  ];

  return (
    <div className="mt-2 rounded-xl bg-slate-50/90 border border-slate-200/80 p-2.5 space-y-2 text-xs animate-in fade-in duration-200">
      {/* Strength indicator header */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 font-semibold">
          {result.isValid ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          )}
          <span className="text-slate-700">Kekuatan Kata Sandi:</span>
          <span
            className={`font-bold ${
              result.score <= 2
                ? 'text-red-600'
                : result.score <= 3
                ? 'text-amber-600'
                : result.score === 4
                ? 'text-blue-600'
                : 'text-emerald-600'
            }`}
          >
            {result.strengthLabel}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {result.score}/5 Kriteria
        </span>
      </div>

      {/* Strength Progress Bars */}
      <div className="grid grid-cols-5 gap-1 h-1.5">
        {[1, 2, 3, 4, 5].map((index) => {
          const isActive = index <= result.score;
          return (
            <div
              key={index}
              className={`h-full rounded-full transition-all duration-300 ${
                isActive ? result.strengthColor : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>

      {/* Check list criteria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 pt-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              item.valid ? 'text-emerald-700 font-medium' : 'text-slate-600'
            }`}
          >
            <span
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] ${
                item.valid
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {item.valid ? (
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              ) : (
                <X className="h-2.5 w-2.5" />
              )}
            </span>
            <span className={item.valid ? 'line-through-none' : ''}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

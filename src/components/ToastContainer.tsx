import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map((toast) => {
        let bg = 'bg-white border-[#e2e1ec] text-[#1b1b23]';
        let Icon = CheckCircle2;
        let iconColor = 'text-emerald-600';

        if (toast.type === 'warning') {
          bg = 'bg-amber-50 border-amber-200 text-amber-950';
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
        } else if (toast.type === 'error') {
          bg = 'bg-red-50 border-red-200 text-red-950';
          Icon = AlertCircle;
          iconColor = 'text-red-600';
        } else if (toast.type === 'info') {
          bg = 'bg-[#ebeaff] border-[#4648d4]/30 text-[#1b1b23]';
          Icon = Info;
          iconColor = 'text-[#4648d4]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-lg transition-all animate-in slide-in-from-bottom-2 ${bg}`}
          >
            <div className="flex items-center gap-2.5">
              <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
              <p className="text-xs font-semibold leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="rounded-lg p-1 text-[#767680] hover:text-[#1b1b23] hover:bg-black/5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

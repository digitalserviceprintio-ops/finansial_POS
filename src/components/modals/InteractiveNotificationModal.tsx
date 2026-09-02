import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Package,
  ShoppingBag,
  ArrowRight,
  Printer,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface InteractivePopupData {
  id: string;
  type: 'success' | 'warning' | 'info' | 'order' | 'stock';
  title: string;
  message: string;
  subMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  metaData?: Record<string, any>;
}

interface InteractiveNotificationModalProps {
  data: InteractivePopupData | null;
  onClose: () => void;
}

export const InteractiveNotificationModal: React.FC<InteractiveNotificationModalProps> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const getHeaderStyle = () => {
    switch (data.type) {
      case 'success':
        return {
          bg: 'bg-emerald-600',
          icon: <CheckCircle2 className="h-6 w-6 text-white" />,
          badge: 'Berhasil',
          badgeBg: 'bg-emerald-500/30 text-emerald-100',
        };
      case 'warning':
      case 'stock':
        return {
          bg: 'bg-amber-600',
          icon: <AlertTriangle className="h-6 w-6 text-white" />,
          badge: 'Perhatian Stok',
          badgeBg: 'bg-amber-500/30 text-amber-100',
        };
      case 'order':
        return {
          bg: 'bg-indigo-600',
          icon: <ShoppingBag className="h-6 w-6 text-white" />,
          badge: 'Pesanan Baru',
          badgeBg: 'bg-indigo-500/30 text-indigo-100',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-600',
          icon: <Info className="h-6 w-6 text-white" />,
          badge: 'Notifikasi',
          badgeBg: 'bg-blue-500/30 text-blue-100',
        };
    }
  };

  const style = getHeaderStyle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className={`${style.bg} px-6 py-5 text-white relative`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
              {style.icon}
            </div>
            <div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badgeBg}`}>
                {style.badge}
              </span>
              <h3 className="text-base font-extrabold tracking-tight mt-1 text-white">{data.title}</h3>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">{data.message}</p>

          {data.subMessage && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 leading-normal">
              {data.subMessage}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-end gap-2.5">
          {data.secondaryActionLabel && (
            <button
              type="button"
              onClick={() => {
                data.onSecondaryAction?.();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {data.secondaryActionLabel}
            </button>
          )}

          {data.actionLabel ? (
            <button
              type="button"
              onClick={() => {
                data.onAction?.();
                onClose();
              }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all cursor-pointer ${style.bg}`}
            >
              <span>{data.actionLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Mengerti / Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

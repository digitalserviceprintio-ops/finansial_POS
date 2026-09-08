import React from 'react';
import { Monitor, TrendingUp, PieChart, ShieldCheck } from 'lucide-react';

interface DelPOSFeatureBadgesProps {
  className?: string;
  layout?: 'grid' | 'row';
}

export const DelPOSFeatureBadges: React.FC<DelPOSFeatureBadgesProps> = ({
  className = '',
  layout = 'grid',
}) => {
  const features = [
    {
      id: 'kasir',
      title: 'KASIR',
      desc: 'Transaksi cepat & mudah',
      icon: Monitor,
      colorClass: 'text-[#0066FF]',
      titleColor: 'text-[#0066FF]',
    },
    {
      id: 'keuangan',
      title: 'KEUANGAN',
      desc: 'Pencatatan keuangan lebih rapi',
      icon: TrendingUp,
      colorClass: 'text-[#10B981]',
      titleColor: 'text-[#10B981]',
    },
    {
      id: 'laporan',
      title: 'LAPORAN',
      desc: 'Laporan lengkap & akurat',
      icon: PieChart,
      colorClass: 'text-[#F59E0B]',
      titleColor: 'text-[#D97706]',
    },
    {
      id: 'aman',
      title: 'AMAN',
      desc: 'Data aman & terpercaya',
      icon: ShieldCheck,
      colorClass: 'text-[#0284C7]',
      titleColor: 'text-[#0284C7]',
    },
  ];

  return (
    <div
      className={
        layout === 'grid'
          ? `grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 ${className}`
          : `flex flex-wrap items-center justify-between gap-2.5 ${className}`
      }
    >
      {features.map((f) => {
        const IconComponent = f.icon;
        return (
          <div
            key={f.id}
            className="flex flex-col items-center text-center px-3 py-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <div className={`mb-1.5 ${f.colorClass}`}>
              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
            </div>
            <span className={`text-[11px] sm:text-xs font-black tracking-wider uppercase ${f.titleColor}`}>
              {f.title}
            </span>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
              {f.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};

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
      bgClass: 'bg-blue-50 border-blue-100',
      tagClass: 'text-blue-700',
    },
    {
      id: 'keuangan',
      title: 'KEUANGAN',
      desc: 'Pencatatan keuangan lebih rapi',
      icon: TrendingUp,
      colorClass: 'text-[#10B981]',
      bgClass: 'bg-emerald-50 border-emerald-100',
      tagClass: 'text-emerald-700',
    },
    {
      id: 'laporan',
      title: 'LAPORAN',
      desc: 'Laporan lengkap & akurat',
      icon: PieChart,
      colorClass: 'text-[#F59E0B]',
      bgClass: 'bg-amber-50 border-amber-100',
      tagClass: 'text-amber-700',
    },
    {
      id: 'aman',
      title: 'AMAN',
      desc: 'Data aman & terpercaya',
      icon: ShieldCheck,
      colorClass: 'text-[#3B82F6]',
      bgClass: 'bg-indigo-50 border-indigo-100',
      tagClass: 'text-indigo-700',
    },
  ];

  return (
    <div
      className={
        layout === 'grid'
          ? `grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`
          : `flex flex-wrap items-center justify-between gap-3 ${className}`
      }
    >
      {features.map((f) => {
        const IconComponent = f.icon;
        return (
          <div
            key={f.id}
            className={`flex flex-col items-center text-center p-3 rounded-2xl bg-white border ${f.bgClass} shadow-xs hover:shadow-sm transition-all`}
          >
            <div className={`p-2 rounded-xl mb-1.5 ${f.colorClass}`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <span className={`text-xs font-black tracking-wider uppercase ${f.tagClass}`}>
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

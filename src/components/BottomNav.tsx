import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MainTab } from '../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, cart } = useApp();

  const navItems: { id: MainTab; label: string; icon: React.FC<{ className?: string }>; badgeCount?: number }[] = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Kasir', icon: ShoppingCart, badgeCount: cart.reduce((a, c) => a + c.quantity, 0) },
    { id: 'transactions', label: 'Riwayat', icon: Receipt },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[#e2e1ec] bg-white px-2 shadow-lg lg:hidden"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => setCurrentTab(item.id)}
            className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-all ${
              isActive ? 'text-[#4648d4]' : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            <div className="relative">
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {item.badgeCount && item.badgeCount > 0 ? (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[9px] font-bold text-white shadow-xs">
                  {item.badgeCount}
                </span>
              ) : null}
            </div>
            <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

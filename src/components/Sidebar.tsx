import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Wallet,
  BarChart3,
  HardDrive,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MainTab } from '../types';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    isSidebarOpen,
    setIsSidebarOpen,
    cart,
    products,
    categories,
    logoutUser,
  } = useApp();

  const lowStockCount = products.filter((p) => p.stock <= (p.minStockAlert ?? 5)).length;

  const navItems: { id: MainTab; label: string; icon: React.FC<{ className?: string }>; badge?: string; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      label: 'Penjualan (POS)',
      icon: ShoppingCart,
      badge: cart.length > 0 ? `${cart.reduce((a, c) => a + c.quantity, 0)} item` : 'Kasir',
      badgeColor: cart.length > 0 ? 'bg-[#ba1a1a] text-white' : 'bg-[#ebeaff] text-[#4648d4]',
    },
    {
      id: 'products',
      label: 'Produk & Stok',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} minim` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'categories',
      label: 'Kategori Produk',
      icon: Layers,
      badge: `${categories.length}`,
      badgeColor: 'bg-[#ebeaff] text-[#4648d4]',
    },
    {
      id: 'cashflow',
      label: 'Keuangan & Kas',
      icon: Wallet,
    },
    {
      id: 'reports',
      label: 'Laporan Finansial',
      icon: BarChart3,
      badge: 'Lengkap',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'backup',
      label: 'Cadangan (Backup JSON)',
      icon: HardDrive,
      badge: 'Lokal',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  const bottomNavItems: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    {
      id: 'settings',
      label: 'Pengaturan Toko',
      icon: Settings,
    },
    {
      id: 'about',
      label: 'Bantuan & Info',
      icon: HelpCircle,
    },
  ];

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside
        id="main-sidebar"
        className="fixed top-16 bottom-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-[#e2e1ec] bg-white p-4 shadow-sm transition-transform duration-200 ease-in-out lg:static lg:translate-x-0"
      >
        {/* Top Menu Section */}
        <div className="space-y-6">
          {/* Quick Cashier Action Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-[#4648d4] to-[#3435ad] p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ebeaff]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Kasir Cepat POS</span>
              </div>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">Aktif</span>
            </div>
            <p className="mt-2 text-xs text-[#ebeaff]/90 leading-relaxed">
              Layani pembeli dengan transaksi kilat & QRIS otomatis.
            </p>
            <button
              id="open-pos-quick-btn"
              onClick={() => {
                setCurrentTab('pos');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2 text-xs font-bold text-[#4648d4] shadow-xs hover:bg-[#f3f2fa] transition-all"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Buka Layar Kasir</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Primary Navigation List */}
          <div>
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#767680]">
              Menu Utama
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => {
                      setCurrentTab(item.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#ebeaff] text-[#4648d4] shadow-xs'
                        : 'text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 transition-colors ${
                          isActive ? 'text-[#4648d4]' : 'text-[#767680] group-hover:text-[#1b1b23]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4 pt-4 border-t border-[#f3f2fa]">
          {/* Quick Analytics Pill */}
          <div
            onClick={() => setCurrentTab('reports')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#fcf8ff] border border-[#e2e1ec] cursor-pointer hover:border-[#4648d4]/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#1b1b23]">Kesehatan Usaha</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Margin Positif 28%</p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-[#767680]" />
          </div>

          <div className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-bottom-${item.id}`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#ebeaff] text-[#4648d4]'
                      : 'text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23]'
                  }`}
                >
                  <Icon className="h-4 w-4 text-[#767680]" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              id="sidebar-logout-btn"
              onClick={() => logoutUser()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

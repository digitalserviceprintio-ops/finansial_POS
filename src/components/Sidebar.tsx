import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Users,
  Wallet,
  BarChart3,
  HardDrive,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ChefHat,
  QrCode,
  FileSpreadsheet,
  X,
  Smartphone,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MainTab } from '../types';
import { DelPOSLogo } from './brand/DelPOSLogo';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    isSidebarOpen,
    setIsSidebarOpen,
    cart,
    products,
    categories,
    customers,
    transactions,
    customerOrders,
    googleSheetsConfig,
    logoutUser,
    storeProfile,
    setIsPwaInstallModalOpen,
  } = useApp();

  const lowStockCount = products.filter((p) => p.stock <= (p.minStockAlert ?? 5)).length;
  const activeOrdersCount = customerOrders.filter(
    (o) => o.status === 'MENUNGGU' || o.status === 'DIPROSES'
  ).length;

  const isSheetsConnected = !!googleSheetsConfig.webAppUrl && googleSheetsConfig.lastSyncStatus === 'success';

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
      badgeColor: cart.length > 0 ? 'bg-[#ba1a1a] text-white font-black' : 'bg-[#ebeaff] text-[#4648d4]',
    },
    {
      id: 'orders',
      label: 'Antrian Pesanan',
      icon: ChefHat,
      badge: activeOrdersCount > 0 ? `${activeOrdersCount} antri` : 'Live',
      badgeColor: activeOrdersCount > 0 ? 'bg-amber-500 text-slate-950 font-black' : 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'customer_catalog',
      label: 'Katalog QR Mandiri',
      icon: QrCode,
      badge: 'Scan HP',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'google_apps_script',
      label: 'Integrasi Spreadsheet',
      icon: FileSpreadsheet,
      badge: isSheetsConnected ? 'Auto-Sync' : 'Setup',
      badgeColor: isSheetsConnected ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'transactions',
      label: 'Riwayat Transaksi',
      icon: Receipt,
      badge: `${transactions.length}`,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'products',
      label: 'Produk & Stok',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} minim` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      id: 'categories',
      label: 'Kategori Produk',
      icon: Layers,
      badge: `${categories.length}`,
      badgeColor: 'bg-[#ebeaff] text-[#4648d4]',
    },
    {
      id: 'customers',
      label: 'Atur Pelanggan',
      icon: Users,
      badge: `${customers.length}`,
      badgeColor: 'bg-blue-100 text-blue-800',
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

  const handleNavClick = (tab: MainTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Dark Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="main-sidebar"
        className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between border-r border-[#e2e1ec] bg-white shadow-2xl transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:h-[calc(100vh-4rem)] lg:w-64 lg:shadow-none no-scrollbar"
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 lg:hidden">
          <div className="flex items-center gap-2">
            <DelPOSLogo variant="compact" size="sm" showPoweredBy={false} />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{storeProfile.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">Menu Navigasi</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors"
            title="Tutup Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content (No visible scrollbar) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-5 no-scrollbar">
          {/* Quick Cashier Action Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-[#4648d4] to-[#3435ad] p-3.5 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ebeaff]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Kasir Cepat POS</span>
              </div>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">Aktif</span>
            </div>
            <p className="mt-1.5 text-xs text-[#ebeaff]/90 leading-relaxed">
              Transaksi kilat, barcode scanner, & QR katalog antrian.
            </p>
            <button
              id="open-pos-quick-btn"
              onClick={() => handleNavClick('pos')}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2 text-xs font-bold text-[#4648d4] shadow-xs hover:bg-[#f3f2fa] transition-all"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Buka Layar Kasir</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Primary Navigation List */}
          <div>
            <span className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#767680]">
              Menu Utama
            </span>
            <nav className="mt-1.5 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#ebeaff] text-[#4648d4] shadow-xs'
                        : 'text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#4648d4]' : 'text-[#767680] group-hover:text-[#1b1b23]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ${item.badgeColor}`}>
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
        <div className="border-t border-[#f3f2fa] p-3.5 bg-slate-50/50 space-y-2.5">
          {/* Pasang APK / Standalone App Button */}
          <button
            id="sidebar-pwa-install-btn"
            onClick={() => {
              setIsPwaInstallModalOpen(true);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className="flex w-full items-center justify-between p-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200/80 hover:bg-indigo-100/70 hover:border-indigo-300 transition-all text-left shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-2xs">
                <Smartphone className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-indigo-950">Pasang APK / PWA</p>
                <p className="text-[9px] text-indigo-600 font-semibold">Mode Layar Penuh HP</p>
              </div>
            </div>
            <Download className="h-3.5 w-3.5 text-indigo-500 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Quick Analytics Pill */}
          <div
            onClick={() => handleNavClick('reports')}
            className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e2e1ec] cursor-pointer hover:border-[#4648d4]/30 transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#1b1b23]">Kesehatan Usaha</p>
                <p className="text-[9px] text-emerald-600 font-semibold">Margin Positif 28%</p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-[#767680]" />
          </div>

          <div className="space-y-0.5">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-bottom-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
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
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#ba1a1a] hover:bg-red-50 transition-colors"
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

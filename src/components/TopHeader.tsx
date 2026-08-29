import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Smartphone,
  Monitor,
  ChevronDown,
  Store,
  LogOut,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  HardDrive,
  Mail,
  Inbox,
  Bluetooth,
  Printer,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DigitalClockAndCalendar } from './DigitalClockAndCalendar';
import {
  bluetoothPrinter,
  BluetoothPrinterState,
} from '../utils/bluetoothPrinter';
import { BluetoothPrinterModal } from './modals/BluetoothPrinterModal';

export const TopHeader: React.FC = () => {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isMobileSimulation,
    setIsMobileSimulation,
    searchGlobalQuery,
    setSearchGlobalQuery,
    storeProfile,
    cashierName,
    currentUser,
    setCurrentTab,
    products,
    transactions,
    latestSimulatedEmail,
    setIsEmailModalOpen,
    logoutUser,
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isBtModalOpen, setIsBtModalOpen] = useState(false);
  const [btState, setBtState] = useState<BluetoothPrinterState>(
    bluetoothPrinter.getState()
  );

  useEffect(() => {
    const unsubscribe = bluetoothPrinter.subscribe((state) => {
      setBtState(state);
    });
    return () => unsubscribe();
  }, []);

  // Notifications based on actual state
  const lowStockCount = products.filter((p) => p.stock <= (p.minStockAlert ?? 5)).length;
  const recentSalesCount = transactions.length;

  return (
    <>
      <header id="top-header" className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#e2e1ec] bg-white px-4 md:px-6 shadow-xs">
        {/* Left section: Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            id="toggle-sidebar-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-2 text-[#46464f] hover:bg-[#f3f2fa] transition-colors focus:outline-none"
            title="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4648d4] to-[#797bff] text-white shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-[#1b1b23] text-base leading-none">FinansialPro</span>
                <span className="rounded bg-[#ebeaff] px-1.5 py-0.5 text-[10px] font-semibold text-[#4648d4]">UMKM</span>
              </div>
              <p className="text-[11px] text-[#767680] font-medium leading-tight mt-0.5">{storeProfile.branch || storeProfile.name}</p>
            </div>
          </div>
        </div>

        {/* Center section: Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Cari transaksi, menu, produk, atau laporan..."
              value={searchGlobalQuery}
              onChange={(e) => setSearchGlobalQuery(e.target.value)}
              className="w-full rounded-full border border-[#d2d1dc] bg-[#fcf8ff] py-2 pl-10 pr-4 text-xs md:text-sm text-[#1b1b23] placeholder-[#767680] transition-all focus:border-[#4648d4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20"
            />
            {searchGlobalQuery && (
              <button
                onClick={() => setSearchGlobalQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#767680] hover:text-[#1b1b23]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right section: Controls, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Digital Clock & Interactive Calendar */}
          <DigitalClockAndCalendar />

          {/* Bluetooth Printer Status Indicator Button */}
          <button
            onClick={() => setIsBtModalOpen(true)}
            className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shadow-2xs ${
              btState.isConnected
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-[#fcf8ff] border-[#e2e1ec] text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]'
            }`}
            title="Pengaturan Printer Bluetooth Thermal"
          >
            <Bluetooth className={`h-3.5 w-3.5 ${btState.isConnected ? 'text-blue-600' : 'text-[#767680]'}`} />
            <span className="hidden xl:inline">
              {btState.isConnected ? (btState.deviceName || 'Thermal BT') : 'Printer BT'}
            </span>
            {btState.isConnected && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          {/* Live Email Inbox Shortcut if an OTP was sent */}
          {latestSimulatedEmail && (
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-purple-50 border border-purple-200 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-all shadow-2xs"
              title="Lihat Email OTP Masuk"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">OTP:</span>
              <span className="font-mono font-extrabold">{latestSimulatedEmail.code}</span>
            </button>
          )}

          {/* Device Switcher (Desktop / Mobile Mode Preview) */}
          <div className="hidden sm:flex items-center rounded-lg bg-[#f3f2fa] p-0.5 border border-[#e2e1ec]">
            <button
              id="switch-desktop-btn"
              onClick={() => setIsMobileSimulation(false)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                !isMobileSimulation
                  ? 'bg-white text-[#4648d4] shadow-xs font-semibold'
                  : 'text-[#767680] hover:text-[#1b1b23]'
              }`}
              title="Tampilan Desktop / POS Tablet"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Desktop</span>
            </button>
            <button
              id="switch-mobile-btn"
              onClick={() => setIsMobileSimulation(true)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                isMobileSimulation
                  ? 'bg-white text-[#4648d4] shadow-xs font-semibold'
                  : 'text-[#767680] hover:text-[#1b1b23]'
              }`}
              title="Simulasi Tampilan Ponsel Kasir"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Mobile</span>
            </button>
          </div>

          {/* Cashier Shift Status Chip */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200 text-xs font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Kasir: <strong className="font-semibold">{cashierName}</strong></span>
          </div>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              id="notification-bell-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative rounded-lg p-2 text-[#46464f] hover:bg-[#f3f2fa] transition-colors"
              title="Notifikasi"
            >
              <Bell className="h-5 w-5" />
              {lowStockCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ba1a1a] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ba1a1a]"></span>
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#e2e1ec] bg-white p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-[#f3f2fa] pb-2 px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#767680]">Pemberitahuan</h4>
                  <span className="rounded-full bg-[#ebeaff] px-2 py-0.5 text-[11px] font-semibold text-[#4648d4]">
                    {lowStockCount > 0 ? 'Perlu Perhatian' : 'Semua Beres'}
                  </span>
                </div>
                <div className="divide-y divide-[#f3f2fa] max-h-64 overflow-y-auto mt-2">
                  {lowStockCount > 0 && (
                    <div className="flex items-start gap-2.5 p-2 hover:bg-[#fcf8ff] rounded-lg transition-colors cursor-pointer" onClick={() => { setCurrentTab('products'); setShowNotifications(false); }}>
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[#1b1b23]">Stok Menipis ({lowStockCount} Produk)</p>
                        <p className="text-[11px] text-[#767680]">Segera lakukan restok untuk menghindari pesanan tertunda.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 p-2 hover:bg-[#fcf8ff] rounded-lg transition-colors cursor-pointer" onClick={() => { setCurrentTab('reports'); setShowNotifications(false); }}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#1b1b23]">Arus Kas Sinkron</p>
                      <p className="text-[11px] text-[#767680]">{recentSalesCount} transaksi berhasil tercatat hari ini.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 hover:bg-[#fcf8ff] rounded-lg transition-colors cursor-pointer" onClick={() => { setCurrentTab('backup'); setShowNotifications(false); }}>
                    <HardDrive className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#1b1b23]">Cadangan JSON Siap</p>
                      <p className="text-[11px] text-[#767680]">Ekspor data pembukuan & master produk kapan saja.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              id="profile-dropdown-btn"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-full p-1 pl-2 pr-1.5 hover:bg-[#f3f2fa] border border-[#e2e1ec] transition-all"
            >
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-[#1b1b23] leading-none">{currentUser?.fullName || storeProfile.owner}</span>
                <span className="text-[10px] text-[#767680] font-medium leading-none mt-0.5">
                  {currentUser?.role === 'cashier' ? 'Kasir POS' : 'Pemilik Toko'}
                </span>
              </div>
              <div className="relative">
                <img
                  src={currentUser?.avatarUrl || storeProfile.avatarUrl}
                  alt={currentUser?.fullName || storeProfile.owner}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </div>
              <ChevronDown className="h-4 w-4 text-[#767680]" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#e2e1ec] bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 bg-[#fcf8ff] rounded-xl mb-2">
                  <p className="text-xs font-bold text-[#1b1b23]">{currentUser?.fullName || storeProfile.owner}</p>
                  <p className="text-[11px] text-[#767680] truncate">{currentUser?.email || storeProfile.branch}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-medium w-fit">
                    <UserCheck className="h-3 w-3" />
                    <span>Email Terverifikasi</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsBtModalOpen(true);
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23] transition-colors"
                >
                  <Bluetooth className="h-4 w-4 text-blue-600" />
                  <span>Printer Bluetooth Thermal</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('backup');
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23] transition-colors"
                >
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  <span>Cadangan & Restore JSON</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#46464f] hover:bg-[#f3f2fa] hover:text-[#1b1b23] transition-colors"
                >
                  <Store className="h-4 w-4 text-[#4648d4]" />
                  <span>Profil & Pengaturan Toko</span>
                </button>
                <div className="border-t border-[#f3f2fa] my-1"></div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logoutUser();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#ba1a1a] hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar Akun (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Bluetooth Printer Modal from Header */}
      <BluetoothPrinterModal
        isOpen={isBtModalOpen}
        onClose={() => setIsBtModalOpen(false)}
      />
    </>
  );
};

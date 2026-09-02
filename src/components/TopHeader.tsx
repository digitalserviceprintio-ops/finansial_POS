import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Store,
  LogOut,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Mail,
  Bluetooth,
  Package,
  ArrowRight,
  CheckCheck,
  Trash2,
  Clock,
  Sparkles,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DigitalClockAndCalendar } from './DigitalClockAndCalendar';
import { BluetoothPrinterModal } from './modals/BluetoothPrinterModal';
import { InAppNotification } from '../types';
import { DelPOSLogo } from './brand/DelPOSLogo';

export const TopHeader: React.FC = () => {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    searchGlobalQuery,
    setSearchGlobalQuery,
    storeProfile,
    cashierName,
    currentUser,
    currentTab,
    setCurrentTab,
    products,
    cart,
    transactions,
    latestSimulatedEmail,
    setIsEmailModalOpen,
    logoutUser,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    deleteNotification,
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'stock' | 'system'>('all');
  const [isBtModalOpen, setIsBtModalOpen] = useState(false);

  // Global F4 shortcut to quickly jump to POS / Cashier
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        setCurrentTab('pos');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setCurrentTab]);

  // Filtered notifications
  const filteredNotifs = notifications.filter((n) => {
    if (notifFilter === 'stock') return n.type === 'stock_low' || n.type === 'stock_empty';
    if (notifFilter === 'system') return n.type !== 'stock_low' && n.type !== 'stock_empty';
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock <= (p.minStockAlert ?? 5)).length;

  const handleNotificationClick = (notif: InAppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.actionTab) {
      setCurrentTab(notif.actionTab);
    }
    setShowNotifications(false);
  };

  return (
    <>
      <header id="top-header" className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#e2e1ec] bg-white px-2.5 sm:px-4 md:px-6 shadow-xs">
        {/* Mobile Search Bar Overlay when active */}
        {isMobileSearchOpen ? (
          <div className="flex flex-1 items-center gap-2 py-2 animate-in fade-in duration-150">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
              <input
                id="mobile-global-search-input"
                type="text"
                autoFocus
                placeholder="Cari transaksi, produk, laporan..."
                value={searchGlobalQuery}
                onChange={(e) => setSearchGlobalQuery(e.target.value)}
                className="w-full rounded-full border border-[#4648d4] bg-[#fcf8ff] py-2 pl-9 pr-8 text-xs text-[#1b1b23] placeholder-[#767680] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20"
              />
              {searchGlobalQuery && (
                <button
                  onClick={() => setSearchGlobalQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#767680] hover:text-[#1b1b23] p-1"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchGlobalQuery('');
              }}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
            >
              Tutup
            </button>
          </div>
        ) : (
          <>
            {/* Left section: Toggle & Brand */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                id="toggle-sidebar-btn"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-xl p-2 text-[#46464f] hover:bg-[#f3f2fa] transition-colors focus:outline-none cursor-pointer"
                title="Toggle Sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-2 sm:gap-2.5">
                <DelPOSLogo variant="compact" size="md" showPoweredBy={false} />
                <div className="hidden lg:block h-5 w-px bg-slate-200" />
                <div className="hidden sm:block">
                  <p className="text-xs font-black text-[#1b1b23] leading-none truncate max-w-[130px] md:max-w-[180px] lg:max-w-[220px]">
                    {storeProfile.name}
                  </p>
                  <p className="text-[10px] text-[#767680] font-semibold leading-tight mt-0.5 truncate max-w-[130px] md:max-w-[180px] lg:max-w-[220px]">
                    {storeProfile.branch ? `Cabang ${storeProfile.branch}` : 'powered by AkuPos'}
                  </p>
                </div>
              </div>
            </div>

            {/* Center section: Search Bar (Desktop & Tablet) */}
            <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2 sm:mx-3 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
                <input
                  id="global-search-input"
                  type="text"
                  placeholder="Cari transaksi, menu, produk..."
                  value={searchGlobalQuery}
                  onChange={(e) => setSearchGlobalQuery(e.target.value)}
                  className="w-full rounded-full border border-[#d2d1dc] bg-[#fcf8ff] py-1.5 sm:py-2 pl-9 pr-8 text-xs text-[#1b1b23] placeholder-[#767680] transition-all focus:border-[#4648d4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20"
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
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Search Toggle Button */}
              <button
                id="mobile-search-toggle-btn"
                onClick={() => setIsMobileSearchOpen(true)}
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl p-2 text-[#46464f] hover:bg-[#f3f2fa] transition-colors focus:outline-none"
                title="Cari Data"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Akses Cepat Transaksi Penjualan / Kasir POS (F4) */}
              <button
                id="header-quick-pos-btn"
                onClick={() => setCurrentTab('pos')}
                className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  currentTab === 'pos'
                    ? 'bg-[#ebeaff] text-[#4648d4] ring-2 ring-[#4648d4]/30'
                    : 'bg-gradient-to-r from-[#4648d4] to-[#3435ad] text-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                }`}
                title="Akses Cepat Transaksi Penjualan / Kasir (F4)"
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Kasir</span>
                <span className="hidden lg:inline">POS</span>
                {cart.length > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    {cart.reduce((a, c) => a + c.quantity, 0)}
                  </span>
                )}
                <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-white/20 text-white">
                  F4
                </span>
              </button>

              {/* Real-time Digital Clock & Interactive Calendar */}
              <DigitalClockAndCalendar />

              {/* Live Email Inbox Shortcut if an OTP was sent */}
              {latestSimulatedEmail && (
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="hidden lg:flex items-center gap-1.5 rounded-xl bg-purple-50 border border-purple-200 px-2.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-all shadow-2xs shrink-0"
                  title="Lihat Email OTP Masuk"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">OTP:</span>
                  <span className="font-mono font-extrabold">{latestSimulatedEmail.code}</span>
                </button>
              )}

              {/* Cashier Shift Status Chip (Desktop) */}
              <div className="hidden 2xl:flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200 text-xs font-medium text-emerald-800 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Kasir: <strong className="font-semibold">{cashierName}</strong></span>
              </div>

              {/* In-App Notifications Center Popover */}
              <div className="relative">
                <button
                  id="notification-bell-btn"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#46464f] hover:bg-[#f3f2fa] transition-colors focus:outline-none cursor-pointer"
                  title="Pusat Notifikasi Stok & Sistem"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-xs animate-pulse">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    {/* Backdrop on mobile */}
                    <div
                      className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs md:hidden"
                      onClick={() => setShowNotifications(false)}
                    />

                    <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Header */}
                      <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 tracking-tight">Notifikasi Sistem</h4>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {unreadNotificationCount > 0 ? `${unreadNotificationCount} belum dibaca` : 'Semua tersinkron'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {unreadNotificationCount > 0 && (
                            <button
                              onClick={markAllNotificationsAsRead}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                              title="Tandai semua dibaca"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Tandai Dibaca</span>
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={clearNotifications}
                              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors"
                              title="Bersihkan daftar notifikasi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 bg-white border-b border-slate-100 text-[11px] font-medium text-slate-600">
                        <button
                          onClick={() => setNotifFilter('all')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            notifFilter === 'all'
                              ? 'bg-slate-900 text-white font-semibold shadow-xs'
                              : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          Semua ({notifications.length})
                        </button>
                        <button
                          onClick={() => setNotifFilter('stock')}
                          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                            notifFilter === 'stock'
                              ? 'bg-rose-600 text-white font-semibold shadow-xs'
                              : 'hover:bg-rose-50 text-rose-700'
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Stok ({lowStockCount})
                        </button>
                        <button
                          onClick={() => setNotifFilter('system')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            notifFilter === 'system'
                              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                              : 'hover:bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          Sistem
                        </button>
                      </div>

                      {/* Notifications List */}
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto bg-slate-50/30">
                        {filteredNotifs.length === 0 ? (
                          <div className="py-10 px-4 text-center">
                            <div className="h-10 w-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-800">Tidak Ada Peringatan Stok</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Semua persediaan produk aman di atas batas minimum.
                            </p>
                          </div>
                        ) : (
                          filteredNotifs.map((notif) => {
                            const isStockAlert = notif.type === 'stock_low' || notif.type === 'stock_empty';
                            const isEmpty = notif.type === 'stock_empty';

                            return (
                              <div
                                key={notif.id}
                                className={`p-3 transition-colors hover:bg-white flex items-start gap-3 relative group ${
                                  !notif.isRead ? 'bg-indigo-50/30 font-medium' : 'bg-white'
                                }`}
                              >
                                {!notif.isRead && (
                                  <span className="absolute top-3.5 right-3 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
                                )}

                                <div
                                  className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center shadow-2xs mt-0.5 ${
                                    isEmpty
                                      ? 'bg-rose-100 text-rose-700'
                                      : isStockAlert
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-indigo-100 text-indigo-700'
                                  }`}
                                >
                                  {isEmpty ? (
                                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                                  ) : isStockAlert ? (
                                    <Package className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <Sparkles className="h-4 w-4 text-indigo-600" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 pr-4">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span
                                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide ${
                                        isEmpty
                                          ? 'bg-rose-600 text-white'
                                          : isStockAlert
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-indigo-600 text-white'
                                      }`}
                                    >
                                      {isEmpty ? 'STOK HABIS' : isStockAlert ? 'MENIPIS' : 'INFO'}
                                    </span>
                                    <h5 className="text-xs font-bold text-slate-900 truncate">
                                      {notif.title}
                                    </h5>
                                  </div>

                                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                                    {notif.message}
                                  </p>

                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(notif.timestamp).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })} WIB
                                    </span>

                                    {isStockAlert && (
                                      <button
                                        onClick={() => handleNotificationClick(notif)}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-all shadow-2xs"
                                      >
                                        <span>Restok di Produk</span>
                                        <ArrowRight className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer Quick Action */}
                      <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => {
                            setCurrentTab('products');
                            setShowNotifications(false);
                          }}
                          className="text-xs font-bold text-slate-700 hover:text-indigo-600 px-2 py-1 rounded transition-colors flex items-center gap-1"
                        >
                          <Package className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Kelola Master Produk</span>
                        </button>
                        <span className="text-[10px] text-slate-400">DelPOS by AkuPos</span>
                      </div>
                    </div>
                  </>
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
                  className="flex items-center gap-1.5 sm:gap-2 rounded-full p-1 pl-1 sm:pl-2 pr-1 hover:bg-[#f3f2fa] border border-[#e2e1ec] transition-all cursor-pointer"
                >
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-[#1b1b23] leading-none max-w-[100px] lg:max-w-[130px] truncate">
                      {currentUser?.fullName || storeProfile.owner}
                    </span>
                    <span className="text-[10px] text-[#767680] font-medium leading-none mt-0.5">
                      {currentUser?.role === 'cashier' ? 'Kasir POS' : 'Pemilik Toko'}
                    </span>
                  </div>
                  <div className="relative">
                    <img
                      src={currentUser?.avatarUrl || storeProfile.avatarUrl}
                      alt={currentUser?.fullName || storeProfile.owner}
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover ring-2 ring-white"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 right-0 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[#767680] hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <>
                    {/* Backdrop on mobile */}
                    <div
                      className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs md:hidden"
                      onClick={() => setShowProfileMenu(false)}
                    />

                    <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-64 max-w-xs rounded-2xl border border-[#e2e1ec] bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Global Bluetooth Printer Modal */}
      <BluetoothPrinterModal
        isOpen={isBtModalOpen}
        onClose={() => setIsBtModalOpen(false)}
      />
    </>
  );
};

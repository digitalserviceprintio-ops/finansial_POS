import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Printer,
  QrCode,
  Search,
  Filter,
  Check,
  X,
  Play,
  RotateCcw,
  UtensilsCrossed,
  User,
  Phone,
  Banknote,
  CreditCard,
  ChefHat,
  Bell,
  Trash2,
  ExternalLink,
  Sparkles,
  Receipt,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomerOrder, CustomerOrderStatus } from '../types';
import { QueueOrderReceiptModal } from '../components/modals/QueueOrderReceiptModal';

interface OrdersQueueViewProps {
  onOpenQRModal?: () => void;
}

export const OrdersQueueView: React.FC<OrdersQueueViewProps> = ({ onOpenQRModal }) => {
  const {
    customerOrders,
    updateCustomerOrderStatus,
    deleteCustomerOrder,
    transferOrderToPOSCart,
    formatCurrency,
    showToast,
    storeProfile,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>('SEMUA_AKTIF');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<CustomerOrder | null>(null);

  // Filtered orders list
  const filteredOrders = customerOrders.filter((order) => {
    const matchesSearch =
      order.queueNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.tableOrRoom && order.tableOrRoom.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'SEMUA_AKTIF') {
      return order.status === 'MENUNGGU' || order.status === 'DIPROSES' || order.status === 'SIAP';
    }
    if (activeFilter === 'ALL') return true;
    return order.status === activeFilter;
  });

  // Statistics counters
  const waitingCount = customerOrders.filter((o) => o.status === 'MENUNGGU').length;
  const inProgressCount = customerOrders.filter((o) => o.status === 'DIPROSES').length;
  const readyCount = customerOrders.filter((o) => o.status === 'SIAP').length;
  const completedCount = customerOrders.filter((o) => o.status === 'SELESAI').length;

  const handlePrintKitchenTicket = (order: CustomerOrder) => {
    setSelectedOrderForReceipt(order);
  };

  return (
    <div id="orders-queue-view" className="space-y-6 pb-20 lg:pb-0">
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-[#4648d4] via-[#5659e4] to-[#118eea] text-white p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
            <ChefHat className="h-6 w-6 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black tracking-tight">
                Order Dashboard & Sistem Antrian Kasir
              </h2>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                Real-Time
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/90 font-medium">
              Pesanan mandiri pelanggan via QR Katalog otomatis masuk ke antrian kasir tanpa tumpang tindih.
            </p>
          </div>
        </div>

        {/* Quick QR Code Catalog Button */}
        {onOpenQRModal && (
          <button
            type="button"
            onClick={onOpenQRModal}
            className="flex items-center gap-2 bg-white text-[#4648d4] hover:bg-sky-50 active:scale-95 px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer shrink-0"
          >
            <QrCode className="h-4 w-4 text-[#118eea]" />
            <span>Tampilkan QR Katalog Pelanggan</span>
          </button>
        )}
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setActiveFilter('MENUNGGU')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === 'MENUNGGU'
              ? 'border-amber-400 bg-amber-50 shadow-sm'
              : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#767680]">Menunggu</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{waitingCount}</p>
          <p className="text-[11px] text-[#767680] font-medium mt-0.5">Perlu konfirmasi dapur</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('DIPROSES')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === 'DIPROSES'
              ? 'border-blue-400 bg-blue-50 shadow-sm'
              : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#767680]">Diproses / Dimasak</span>
            <ChefHat className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">{inProgressCount}</p>
          <p className="text-[11px] text-[#767680] font-medium mt-0.5">Sedang disiapkan</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('SIAP')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === 'SIAP'
              ? 'border-emerald-400 bg-emerald-50 shadow-sm'
              : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#767680]">Siap Diambil</span>
            <Bell className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{readyCount}</p>
          <p className="text-[11px] text-[#767680] font-medium mt-0.5">Siap saji ke meja</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('SELESAI')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === 'SELESAI'
              ? 'border-slate-400 bg-slate-100 shadow-sm'
              : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#767680]">Selesai / Lunas</span>
            <CheckCircle2 className="h-4 w-4 text-slate-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-700 mt-1">{completedCount}</p>
          <p className="text-[11px] text-[#767680] font-medium mt-0.5">Riwayat hari ini</p>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e2e1ec] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No Antrian, Nama, Meja..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f8f9fe] border border-[#cac4d0] text-xs font-bold text-[#1b1b23] focus:bg-white focus:border-[#4648d4] focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'SEMUA_AKTIF', label: 'Semua Aktif' },
            { id: 'MENUNGGU', label: 'Menunggu' },
            { id: 'DIPROSES', label: 'Diproses' },
            { id: 'SIAP', label: 'Siap Saji' },
            { id: 'SELESAI', label: 'Selesai' },
            { id: 'ALL', label: 'Semua Status' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#4648d4] text-white shadow-xs'
                  : 'bg-[#f3f2fa] text-[#767680] hover:bg-[#ebeaff] hover:text-[#4648d4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const isWaiting = order.status === 'MENUNGGU';
          const isInProgress = order.status === 'DIPROSES';
          const isReady = order.status === 'SIAP';
          const isCompleted = order.status === 'SELESAI';

          return (
            <div
              key={order.id}
              className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                isWaiting
                  ? 'bg-white border-amber-300 ring-2 ring-amber-100'
                  : isInProgress
                  ? 'bg-white border-blue-300 ring-2 ring-blue-50'
                  : isReady
                  ? 'bg-white border-emerald-300 ring-2 ring-emerald-50'
                  : 'bg-slate-50/70 border-[#e2e1ec] opacity-90'
              }`}
            >
              {/* Card Header: Queue Number, Table, Status */}
              <div className="p-4 border-b border-[#f3f2fa] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-[#1b1b23] tracking-tight bg-[#ebeaff] text-[#4648d4] px-3 py-1 rounded-xl">
                      #{order.queueNumber}
                    </span>
                    <span className="text-xs font-extrabold text-[#1b1b23] bg-gray-100 px-2.5 py-1 rounded-lg">
                      {order.tableOrRoom || 'Meja Umum'}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isWaiting
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : isInProgress
                        ? 'bg-blue-100 text-blue-800'
                        : isReady
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCompleted
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Customer Meta */}
                <div className="flex items-center justify-between text-xs text-[#767680] font-medium pt-1">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#4648d4]" />
                    <span className="font-bold text-[#1b1b23]">{order.customerName}</span>
                    {order.customerPhone && (
                      <span className="text-[11px] text-slate-500">({order.customerPhone})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{order.orderTime}</span>
                  </div>
                </div>
              </div>

              {/* Card Body: Item List with Checklist */}
              <div className="p-4 flex-1 space-y-2.5">
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 p-2 rounded-xl bg-[#fcf8ff] border border-[#e2e1ec]"
                    >
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-md bg-[#4648d4] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-[#1b1b23]">{item.productName}</p>
                          {item.notes && (
                            <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#767680] shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total & Payment Method */}
                <div className="pt-2 border-t border-[#f3f2fa] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#767680] uppercase">Metode Bayar</span>
                    <p className="text-xs font-extrabold text-[#1b1b23]">{order.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#767680] uppercase">Total Tagihan</span>
                    <p className="text-base font-black text-[#4648d4]">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-3 bg-[#fcf8ff] border-t border-[#e2e1ec] flex flex-wrap items-center gap-1.5">
                {/* Print Thermal Queue Receipt */}
                <button
                  type="button"
                  onClick={() => setSelectedOrderForReceipt(order)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#cac4d0] hover:bg-[#ebeaff] hover:border-[#4648d4] text-[#4648d4] hover:text-[#383ab2] text-xs font-black transition-all cursor-pointer shadow-2xs"
                  title="Lihat & Cetak Struk Antrian Thermal Ritel"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Struk Thermal</span>
                </button>

                {/* State Transition Actions */}
                {isWaiting && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateCustomerOrderStatus(order.id, 'DIPROSES')}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#4648d4] hover:bg-[#383ab2] active:scale-95 text-white py-2 px-3 rounded-xl text-xs font-black shadow-xs cursor-pointer"
                    >
                      <ChefHat className="h-3.5 w-3.5" />
                      <span>Proses Dapur</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => transferOrderToPOSCart(order)}
                      className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-2.5 rounded-xl text-xs font-black shadow-xs cursor-pointer"
                      title="Muat ke Kasir POS & Bayar"
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      <span>Bayar di POS</span>
                    </button>
                  </>
                )}

                {isInProgress && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateCustomerOrderStatus(order.id, 'SIAP')}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-2 px-3 rounded-xl text-xs font-black shadow-xs cursor-pointer"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span>Tandai Siap Saji</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => transferOrderToPOSCart(order)}
                      className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-2.5 rounded-xl text-xs font-black shadow-xs cursor-pointer"
                      title="Muat ke Kasir POS & Bayar"
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      <span>Bayar</span>
                    </button>
                  </>
                )}

                {isReady && (
                  <button
                    type="button"
                    onClick={() => updateCustomerOrderStatus(order.id, 'SELESAI', true)}
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-3 rounded-xl text-xs font-black shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Selesai & Lunas</span>
                  </button>
                )}

                {isCompleted && (
                  <div className="flex-1 flex items-center justify-between text-xs text-[#767680] font-bold px-2">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Pesanan Selesai
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteCustomerOrder(order.id)}
                      className="text-[#767680] hover:text-rose-600 p-1 rounded cursor-pointer"
                      title="Hapus dari antrian riwayat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#e2e1ec] space-y-3">
          <div className="h-16 w-16 bg-[#ebeaff] text-[#4648d4] rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-base font-extrabold text-[#1b1b23]">Tidak ada antrian pesanan</h3>
          <p className="text-xs text-[#767680] max-w-sm mx-auto">
            Semua pesanan telah diproses. Ketika pelanggan scan QR katalog dan memesan, pesanan akan langsung muncul di sini.
          </p>
          {onOpenQRModal && (
            <button
              type="button"
              onClick={onOpenQRModal}
              className="inline-flex items-center gap-2 bg-[#4648d4] text-white px-4 py-2 rounded-2xl text-xs font-black shadow-sm hover:bg-[#383ab2] cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Buka QR Code Katalog Pelanggan</span>
            </button>
          )}
        </div>
      )}

      {/* RETAIL THERMAL QUEUE RECEIPT MODAL */}
      <QueueOrderReceiptModal
        order={selectedOrderForReceipt}
        storeProfile={storeProfile}
        isOpen={!!selectedOrderForReceipt}
        onClose={() => setSelectedOrderForReceipt(null)}
        onShowToast={showToast}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Receipt,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DigitalClockAndCalendar: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { transactions, formatCurrency } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    totalSales: number;
    count: number;
    transactions: typeof transactions;
  } | null>(null);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format digital time (HH:mm:ss)
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  // Format Date in Indonesian
  const dayNameIndo = currentTime.toLocaleDateString('id-ID', { weekday: 'long' });
  const dateFormattedIndo = currentTime.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calendar calculations
  const currentYear = calendarViewDate.getFullYear();
  const currentMonth = calendarViewDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    setCalendarViewDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDayDetail(null);
  };

  const nextMonth = () => {
    setCalendarViewDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDayDetail(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCalendarViewDate(today);
    inspectDay(today.getDate());
  };

  // Inspect transactions on selected day
  const inspectDay = (day: number) => {
    const inspectDate = new Date(currentYear, currentMonth, day);
    const datePattern = inspectDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const dayTrx = transactions.filter((t) => {
      if (t.date === datePattern) return true;
      // also check timestamp match
      const trxDate = new Date(t.timestamp);
      return (
        trxDate.getFullYear() === currentYear &&
        trxDate.getMonth() === currentMonth &&
        trxDate.getDate() === day
      );
    });

    const totalSales = dayTrx.reduce((acc, t) => acc + t.total, 0);

    setSelectedDayDetail({
      dateStr: `${day} ${monthNames[currentMonth]} ${currentYear}`,
      totalSales,
      count: dayTrx.length,
      transactions: dayTrx,
    });
  };

  // Check if a day in current calendar view has transactions
  const hasTransactionsOnDay = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth, day);
    const datePattern = dayDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return transactions.some((t) => {
      if (t.date === datePattern) return true;
      const trxDate = new Date(t.timestamp);
      return (
        trxDate.getFullYear() === currentYear &&
        trxDate.getMonth() === currentMonth &&
        trxDate.getDate() === day
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  return (
    <div className="relative">
      {/* Digital Clock & Calendar Header Pill Button */}
      <button
        id="btn-open-clock-calendar"
        onClick={() => setShowCalendarPopover(!showCalendarPopover)}
        className={`flex items-center gap-2 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] px-2.5 sm:px-3.5 py-1.5 transition-all hover:border-[#4648d4]/40 hover:bg-[#ebeaff]/40 active:scale-98 ${
          showCalendarPopover ? 'border-[#4648d4] ring-2 ring-[#4648d4]/20 bg-[#ebeaff]/60' : ''
        }`}
        title="Klik untuk membuka Kalender & Rekap Transaksi"
      >
        {/* Live Digital Clock */}
        <div className="flex items-center gap-1.5 font-mono">
          <Clock className="h-3.5 w-3.5 text-[#4648d4] animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-[#1b1b23] tracking-tight">
            {hours}:{minutes}
            <span className="text-[10px] text-[#4648d4] font-semibold ml-0.5">:{seconds}</span>
          </span>
        </div>

        {/* Divider */}
        <div className="h-3.5 w-[1px] bg-[#d2d1dc]"></div>

        {/* Live Date display */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#46464f]">
          <CalendarIcon className="h-3 w-3 text-[#767680] hidden sm:inline" />
          <span className="truncate max-w-[120px] sm:max-w-none">
            {compact ? dateFormattedIndo : `${dayNameIndo}, ${dateFormattedIndo}`}
          </span>
        </div>

        <span className="hidden xl:inline rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
          WIB
        </span>
      </button>

      {/* Interactive Calendar & Time Popover */}
      {showCalendarPopover && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs md:hidden"
            onClick={() => setShowCalendarPopover(false)}
          />

          <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-3xl border border-[#e2e1ec] bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-[#f3f2fa] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ebeaff] text-[#4648d4]">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-base font-extrabold text-[#1b1b23]">
                      {hours}:{minutes}:{seconds}
                    </span>
                    <span className="rounded bg-[#ebeaff] px-1.5 py-0.2 text-[9px] font-bold text-[#4648d4]">
                      WIB
                    </span>
                  </div>
                  <p className="text-[11px] text-[#767680] font-medium">
                    {dayNameIndo}, {dateFormattedIndo}
                  </p>
                </div>
              </div>

              <button
                id="close-calendar-popover"
                onClick={() => setShowCalendarPopover(false)}
                className="rounded-lg p-1.5 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar Controls */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 font-bold text-xs text-[#1b1b23]">
                <CalendarIcon className="h-3.5 w-3.5 text-[#4648d4]" />
                <span>
                  {monthNames[currentMonth]} {currentYear}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={goToToday}
                  className="rounded-lg bg-[#f3f2fa] px-2 py-1 text-[10px] font-bold text-[#4648d4] hover:bg-[#ebeaff]"
                >
                  Hari Ini
                </button>
                <button
                  onClick={prevMonth}
                  className="rounded-lg p-1 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="rounded-lg p-1 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23]"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="mt-2.5 grid grid-cols-7 gap-1 text-center text-xs">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                <div
                  key={d}
                  className={`text-[10px] font-bold py-1 ${
                    i === 0 ? 'text-red-500' : i === 5 ? 'text-emerald-700' : 'text-[#767680]'
                  }`}
                >
                  {d}
                </div>
              ))}

              {/* Blank offset days */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-8 py-1"></div>
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNumber = idx + 1;
                const isCurrentToday = isToday(dayNumber);
                const hasTrx = hasTransactionsOnDay(dayNumber);

                return (
                  <button
                    key={`day-${dayNumber}`}
                    onClick={() => inspectDay(dayNumber)}
                    className={`relative flex flex-col items-center justify-center h-8 rounded-xl text-xs font-semibold transition-all ${
                      isCurrentToday
                        ? 'bg-[#4648d4] text-white font-bold shadow-xs'
                        : 'hover:bg-[#f3f2fa] text-[#1b1b23]'
                    }`}
                  >
                    <span>{dayNumber}</span>
                    {hasTrx && (
                      <span
                        className={`absolute bottom-1 h-1 w-1 rounded-full ${
                          isCurrentToday ? 'bg-amber-300' : 'bg-emerald-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Day Inspection Box */}
            {selectedDayDetail ? (
              <div className="mt-3 rounded-2xl bg-[#fcf8ff] p-2.5 border border-[#e2e1ec] space-y-1.5 animate-in fade-in duration-150 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1b1b23]">
                    {selectedDayDetail.dateStr}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {selectedDayDetail.count} Transaksi
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#46464f]">
                  <span>Total Omset Penjualan:</span>
                  <span className="font-bold text-[#4648d4]">
                    {formatCurrency(selectedDayDetail.totalSales)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-2.5 py-1.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Titik hijau menandakan tanggal ada transaksi kasir</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

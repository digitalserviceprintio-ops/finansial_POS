import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  PackageCheck,
  TrendingUp,
  FileSpreadsheet,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Mail,
  Phone,
  Store,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AboutView: React.FC = () => {
  const { setCurrentTab, storeProfile } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Bagaimana cara melakukan transaksi pembayaran dengan QRIS?',
      a: 'Pada menu Penjualan (POS), pilih produk yang diinginkan, lalu klik tombol "QRIS Instan". QR Code dinamis otomatis digenerate dan Anda bisa melakukan verifikasi instan serta mencetak struk thermal.',
    },
    {
      q: 'Apakah laporan laba rugi sudah sesuai standar SAK EMKM?',
      a: 'Ya! Laporan Finansial dirancang otomatis menghitung Penjualan Bersih, Harga Pokok Penjualan (HPP), Laba Kotor, dan Beban Operasional untuk menghasilkan Laba Bersih akurat.',
    },
    {
      q: 'Bagaimana cara menambahkan produk baru ke katalog kasir?',
      a: 'Buka menu "Produk & Stok", lalu klik "Tambah Produk Baru". Masukkan nama produk, kategori, harga beli, harga jual, dan jumlah stok fisik awal.',
    },
    {
      q: 'Apakah data transaksi dan kas tersimpan secara aman?',
      a: 'Semua data transaksi, katalog produk, dan pembukuan arus kas tersimpan secara tersinkronisasi dan dapat diekspor kapan saja ke format CSV.',
    },
  ];

  return (
    <div id="about-view" className="space-y-6 max-w-5xl mx-auto pb-20 lg:pb-0">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4648d4] via-[#393bb3] to-[#25267a] p-6 sm:p-10 text-white shadow-lg">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>FinansialPro UMKM - Versi 1.2.0</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Solusi Kasir POS & Pembukuan Finansial UMKM
            </h1>
            <p className="text-xs sm:text-sm text-[#ebeaff]/90 leading-relaxed">
              Didesain khusus untuk membantu pelaku usaha mikro, kecil, dan menengah di Indonesia
              menjalankan operasional kasir harian yang cepat, pencatatan otomatis, dan laporan laba rugi akurat.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setCurrentTab('pos')}
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#4648d4] shadow-md hover:bg-[#f3f2fa] transition-all"
              >
                Mulai Transaksi Kasir
              </button>
              <button
                onClick={() => setCurrentTab('reports')}
                className="rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
              >
                Buka Laporan Finansial
              </button>
            </div>
          </div>

          {/* 3D Illustration */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-xs sm:max-w-sm aspect-square">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4MPP3vc0P7eVZYnl4OofhRR6ltbNMXyfnv8A3zPmF5TdKRmhHbCj4iCM7-kQcKvyohW655OOtsz1diBflcA5EjDPfIFKHnCRkfiaNhg0KmC1FJ1RqabWQYSReGpP1Putqs4iZJ9MhOxEwuyeO5V57AOYkVFpWbTl0fsa5GJDouSeQMvVKh63aYJ0k4escu6HVr-pnc8IvLEd1x0EEE2-N1VPcLijkoOm6WDvg655oG9uh9RDSdzM"
                alt="FinansialPro 3D Illustration"
                className="h-full w-full object-contain drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Highlights Grid */}
      <div>
        <h2 className="text-base font-bold text-[#1b1b23] mb-4">Fitur Unggulan FinansialPro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#4648d4] flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Point of Sale (POS) Kilat</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Navigasi katalog cepat dengan kategori, manajemen keranjang intuitif, kalkulasi pajak otomatis, dan cetak struk thermal.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <PackageCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Manajemen Stok & Inventaris</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Pelacakan stok fisik berkurang otomatis setelah penjualan, peringatan stok menipis, dan fitur restok instan satu-klik.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Laporan Laba & Rugi Lengkap</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Kalkulasi otomatis HPP, laba kotor, beban operasional berkategori, hingga laba bersih usaha dan margin keuntungan.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Arus Kas & Ekspor Data</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Buku kas harian terpadu, pencatatan beban operasional, dan kemudahan ekspor laporan keuangan dalam format CSV.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Cloud Assurance */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#ebeaff] border border-[#4648d4]/20 text-[#1b1b23]">
        <div className="h-12 w-12 rounded-xl bg-[#4648d4] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-[#1b1b23] text-sm">Keamanan & Privasi Data Terjamin</h4>
          <p className="text-[#46464f] mt-0.5 leading-relaxed">
            Data transaksi, daftar harga, dan pembukuan Anda terenkripsi aman secara lokal dan cloud.
            Tidak ada pihak ketiga yang dapat mengakses rekapitulasi finansial Anda tanpa izin.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="rounded-2xl border border-[#e2e1ec] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#f3f2fa]">
          <HelpCircle className="h-5 w-5 text-[#4648d4]" />
          <h3 className="text-sm font-bold text-[#1b1b23]">Pertanyaan yang Sering Diajukan (FAQ)</h3>
        </div>

        <div className="divide-y divide-[#f3f2fa]">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between text-left text-xs font-bold text-[#1b1b23] hover:text-[#4648d4]"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-[#767680] leading-relaxed pl-2 border-l-2 border-[#4648d4]">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Support */}
      <div id="about-support-card" className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#ebeaff] text-[#4648d4] flex items-center justify-center shrink-0">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-[#1b1b23]">Butuh Bantuan Lebih Lanjut?</p>
            <p className="text-[#767680]">Hubungi tim dukungan FinansialPro UMKM</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            id="link-support-email"
            href="mailto:digitalserviceprint.io@gmail.com"
            className="flex items-center gap-1.5 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] px-3.5 py-2 font-semibold text-[#1b1b23] hover:border-[#4648d4] hover:bg-[#ebeaff] transition-all"
            title="Kirim email ke digitalserviceprint.io@gmail.com"
          >
            <Mail className="h-4 w-4 text-[#4648d4]" />
            <span>digitalserviceprint.io@gmail.com</span>
          </a>
          <a
            id="link-support-phone"
            href="tel:082186371356"
            className="flex items-center gap-1.5 rounded-xl bg-[#4648d4] px-3.5 py-2 font-bold text-white shadow-xs hover:bg-[#3435ad] transition-all"
            title="Hubungi telepon / WhatsApp 082186371356"
          >
            <Phone className="h-4 w-4" />
            <span>082186371356</span>
          </a>
        </div>
      </div>
    </div>
  );
};

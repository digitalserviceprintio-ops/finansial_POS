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
  PieChart,
  Monitor,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DelPOSLogo } from '../components/brand/DelPOSLogo';
import { DelPOSFeatureBadges } from '../components/brand/DelPOSFeatureBadges';

export const AboutView: React.FC = () => {
  const { setCurrentTab, storeProfile } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Bagaimana cara melakukan transaksi penjualan di DelPOS?',
      a: 'Pada menu Penjualan (POS), pilih produk yang diinginkan atau scan barcode, lalu klik tombol bayar Tunai, QRIS Dinamis, atau Transfer Bank. Struk thermal otomatis dapat dicetak ke printer Bluetooth atau RawBT.',
    },
    {
      q: 'Apakah DelPOS mendukung antrian pesanan dengan Katalog Mandiri?',
      a: 'Ya! Pelanggan dapat scan QR katalog mandiri dari smartphone mereka, memilih menu makanan/minuman/produk, mengirim pesanan, dan kasir dapat mencetak struk antrian thermal berformat ritel modern.',
    },
    {
      q: 'Apakah laporan laba rugi sudah sesuai standar SAK EMKM?',
      a: 'Ya! Laporan Finansial DelPOS dirancang otomatis menghitung Penjualan Bersih, Harga Pokok Penjualan (HPP), Laba Kotor, dan Beban Operasional untuk menghasilkan Laba Bersih akurat.',
    },
    {
      q: 'Bagaimana cara menambahkan produk baru ke katalog kasir?',
      a: 'Buka menu "Produk & Stok", lalu klik "Tambah Produk Baru". Masukkan nama produk, kategori, harga beli, harga jual, dan jumlah stok fisik awal.',
    },
    {
      q: 'Apakah data transaksi dan kas tersimpan secara aman?',
      a: 'Semua data transaksi, katalog produk, dan pembukuan arus kas tersimpan secara aman dan dapat diekspor kapan saja ke format CSV.',
    },
  ];

  return (
    <div id="about-view" className="space-y-6 max-w-5xl mx-auto pb-20 lg:pb-0">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B99] via-[#0055EE] to-[#0088FF] p-6 sm:p-10 text-white shadow-xl">
        {/* Background glow orb */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>DelPOS - Versi 1.2.0 (powered by AkuPos)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Solusi Kasir POS & Pembukuan Finansial Lengkap
            </h1>
            <p className="text-xs sm:text-sm text-cyan-50/90 leading-relaxed">
              Didesain khusus untuk membantu pelaku usaha mikro, kecil, dan menengah di Indonesia
              menjalankan operasional kasir harian yang cepat, antrian pesanan rapi, dan laporan laba rugi akurat.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setCurrentTab('pos')}
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#0055EE] shadow-md hover:bg-slate-50 transition-all"
              >
                Mulai Transaksi Kasir
              </button>
              <button
                onClick={() => setCurrentTab('orders')}
                className="rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
              >
                Lihat Antrian Pesanan
              </button>
            </div>
          </div>

          {/* 3D Brand Badge / Illustration */}
          <div className="flex justify-center">
            <div className="relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <DelPOSLogo variant="splash" size="2xl" showPoweredBy={true} />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Badges Grid (Directly from User Image) */}
      <div>
        <h2 className="text-base font-bold text-[#1b1b23] mb-3">Keunggulan Utama DelPOS</h2>
        <DelPOSFeatureBadges layout="grid" />
      </div>

      {/* Detailed Feature Breakdown */}
      <div>
        <h2 className="text-base font-bold text-[#1b1b23] mb-4">Fitur Lengkap Aplikasi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center">
              <Monitor className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Point of Sale (POS) Kilat</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Navigasi katalog cepat dengan kategori, barcode scanner, kalkulasi pajak otomatis, dan cetak struk thermal Bluetooth ESC/POS & RawBT.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <PackageCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Manajemen Stok & Inventaris</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Pelacakan stok fisik berkurang otomatis setelah transaksi, peringatan stok menipis, dan fitur restok instan satu-klik.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <PieChart className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Laporan Laba & Rugi Lengkap</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Kalkulasi otomatis HPP, laba kotor, beban operasional berkategori, hingga laba bersih usaha dan margin keuntungan sesuai SAK EMKM.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e2e1ec] shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Buku Kas & Ekspor Data</h3>
            <p className="text-xs text-[#767680] leading-relaxed">
              Pencatatan arus kas masuk/keluar, pelacakan beban harian, dan kemudahan ekspor riwayat serta laporan ke format CSV.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Cloud Assurance */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50 border border-blue-200 text-[#1b1b23]">
        <div className="h-12 w-12 rounded-xl bg-[#0055EE] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-[#1b1b23] text-sm">Keamanan & Privasi Data Terjamin</h4>
          <p className="text-[#46464f] mt-0.5 leading-relaxed">
            Data transaksi, daftar harga, dan pembukuan Anda terenkripsi aman secara lokal dan cloud.
            Didukung oleh teknologi sistem <strong>AkuPos</strong> yang terpercaya dan andal untuk operasional bisnis UMKM.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="rounded-2xl border border-[#e2e1ec] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#f3f2fa]">
          <HelpCircle className="h-5 w-5 text-[#0055EE]" />
          <h3 className="text-sm font-bold text-[#1b1b23]">Pertanyaan yang Sering Diajukan (FAQ)</h3>
        </div>

        <div className="divide-y divide-[#f3f2fa]">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between text-left text-xs font-bold text-[#1b1b23] hover:text-[#0055EE]"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-[#767680] leading-relaxed pl-2 border-l-2 border-[#0055EE]">
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
          <DelPOSLogo variant="icon-only" size="md" />
          <div>
            <p className="font-bold text-[#1b1b23]">Butuh Bantuan Lebih Lanjut?</p>
            <p className="text-[#767680]">Hubungi tim dukungan DelPOS powered by AkuPos</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            id="link-support-email"
            href="mailto:digitalserviceprint.io@gmail.com"
            className="flex items-center gap-1.5 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] px-3.5 py-2 font-semibold text-[#1b1b23] hover:border-[#0055EE] hover:bg-blue-50 transition-all"
            title="Kirim email ke digitalserviceprint.io@gmail.com"
          >
            <Mail className="h-4 w-4 text-[#0055EE]" />
            <span>digitalserviceprint.io@gmail.com</span>
          </a>
          <a
            id="link-support-phone"
            href="tel:082186371356"
            className="flex items-center gap-1.5 rounded-xl bg-[#0055EE] px-3.5 py-2 font-bold text-white shadow-xs hover:bg-[#0044CC] transition-all"
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

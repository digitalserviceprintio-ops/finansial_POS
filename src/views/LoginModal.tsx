import React, { useState } from 'react';
import { UserCheck, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DelPOSLogo } from '../components/brand/DelPOSLogo';

export const LoginModal: React.FC = () => {
  const { storeProfile, setCurrentTab, setCashierName, cashierName, showToast } = useApp();

  const cashierProfiles = [
    {
      name: 'Siti Aisyah',
      role: 'Kasir Shift Pagi',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoLtV3Bv2OBXPlq_WrGjzOKb2hx7Pr3DOTjypa8dkEKduOjjWvN91FeXpeuVJDGRacnpFhqLouF2glsjyg154-ONwKg9-AXq2ylnHCQIAwb0pQ9662t3tt1reJkfrz46PuKvm9rTpygmqRrJUs0iC2FvO13DZ8nlMx-0eSm-8yba6zLFIndlcCVnmVfynCOWQHJRodfFxaOXcZ1AmWZ9mFAugAFABkMmuQ6rlyglKy280HkFHaQKc',
    },
    {
      name: 'Budi Santoso',
      role: 'Pemilik Toko (Admin)',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ_UeVtMqix0sJCZHs2TtKM5-d72Pea84EAktZj50a8963OhMvLReqs1NHQ5_GHU31yQIOvnrJgSfVJ_GeiKlPatJEFijCOybVvFFiMGK5NOxgk9QrAVW_iXOt0iW_JoPaZYQPCnyP7yXiRGmSsKfKm7wGSICkKlm5wlq8E4GuzgUAsgAUa1swPQ-m8CDYgnJ9jjXFUt_9CTSEQH_yEVGaOFNO6eA39ylX7lz2CTC7oAh5YPsc0Mc',
    },
    {
      name: 'Andi Pratama',
      role: 'Kasir Shift Sore',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7B9KMRoYvNAmqNyV5w06IdeHLX2otFiqPJA8kZ3Goi212mrGTweb6BNH2e6e8Yb9MlgT8nzNzC-HWRvuUa2TOoyX4hVm44IyZcPbAocXR8y4C-lEK9s3rKLhxMg4b4pPpy_wMjMwxgNzG7yEfQlAU3aD4JIYfRfZRo6O6gWdkAwwkUTsSVqMbOO55lJ8DXxxWawcQlVMywxpMFfKkjQbZxcsAoEGnPnZvyDbWgRciVO1BOs7MuyU',
    },
  ];

  const [selectedUser, setSelectedUser] = useState(cashierName);
  const [pinCode, setPinCode] = useState('1234');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCashierName(selectedUser);
    showToast(`Selamat datang kembali di DelPOS, ${selectedUser}!`, 'success');
    setCurrentTab('dashboard');
  };

  const handleGoogleLogin = () => {
    setCashierName('Budi Santoso');
    showToast('Masuk berhasil dengan Akun Google Terverifikasi!', 'success');
    setCurrentTab('dashboard');
  };

  return (
    <div id="login-view" className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#e2e1ec] bg-white p-6 sm:p-8 shadow-xl space-y-6">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <DelPOSLogo variant="full" size="lg" showPoweredBy={true} />
          <p className="text-xs text-[#767680] mt-1">
            Pilih kasir bertugas untuk membuka sesi kasir {storeProfile.branch || storeProfile.name}
          </p>
        </div>

        {/* Quick Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d2d1dc] bg-[#fcf8ff] py-3 text-xs font-bold text-[#1b1b23] hover:bg-[#f3f2fa] transition-all shadow-xs"
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTghKMA5mtlcJ7W76Of67ziEkujDvDv4RkgK5VuT_CsbvsLEKOKrBT17jv_yptB6pCVlBG7hPRJVqJ3r1pWL9mNQQNJghue2oDDqIXLV_J7TvONws78FLpSB8GY_TzUtFwI6TX28miJgaMiJlpwNFCY2RGQcBo3D7Buyn1dpvOTmfn9L4wY-reRlXm4UAZHxHW2pFx1K_67DTntlk6vkNCAPBNSDPJhSqXz2L3en67LcTvcpspz10"
            alt="Google Logo"
            className="h-4 w-4 object-contain"
            referrerPolicy="no-referrer"
          />
          <span>Masuk Cepat dengan Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#e2e1ec]"></div>
          <span className="absolute bg-white px-3 text-[11px] font-bold text-[#767680] uppercase">
            Atau Pilih Kasir
          </span>
        </div>

        {/* Cashier List Selection */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            {cashierProfiles.map((c) => {
              const isSelected = selectedUser === c.name;
              return (
                <div
                  key={c.name}
                  onClick={() => setSelectedUser(c.name)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#4648d4] bg-[#ebeaff] shadow-xs'
                      : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#1b1b23]">{c.name}</h4>
                      <p className="text-[10px] text-[#767680]">{c.role}</p>
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#4648d4] bg-[#4648d4] text-white' : 'border-[#d2d1dc]'
                    }`}
                  >
                    {isSelected && <UserCheck className="h-3 w-3" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1b1b23] mb-1">PIN Keamanan Kasir</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767680]" />
              <input
                type="password"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Masukkan 4-6 digit PIN"
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2.5 pl-10 pr-4 text-xs font-mono text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4648d4] py-3 text-xs font-bold text-white shadow-md hover:bg-[#3435ad] transition-all"
          >
            <span>Buka Sesi Kasir POS</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-[11px] text-[#767680]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Sistem Pembukuan Kas Terverifikasi</span>
        </div>
      </div>
    </div>
  );
};

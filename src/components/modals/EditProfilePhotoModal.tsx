import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  Link2,
  FolderOpen,
  Camera,
  CheckCircle2,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DEFAULT_AVATAR_PRESETS,
  processAvatarImageFile,
  AvatarPreset,
} from '../../utils/avatarUtils';

interface EditProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabMode = 'upload' | 'presets' | 'url';

export const EditProfilePhotoModal: React.FC<EditProfilePhotoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { storeProfile, currentUser, updateStoreProfile, showToast } = useApp();

  const currentActiveAvatar = currentUser?.avatarUrl || storeProfile.avatarUrl;

  const [activeTab, setActiveTab] = useState<TabMode>('upload');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(currentActiveAvatar);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    sizeFormatted: string;
  } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with current avatar on modal open
  useEffect(() => {
    if (isOpen) {
      setSelectedAvatarUrl(currentUser?.avatarUrl || storeProfile.avatarUrl);
      setCustomUrlInput('');
      setUploadedFileInfo(null);
      setActiveTab('upload');
    }
  }, [isOpen, currentUser, storeProfile]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processAvatarImageFile(
        file,
        (dataUrl, info) => {
          setSelectedAvatarUrl(dataUrl);
          setUploadedFileInfo(info);
          showToast(`Foto "${info.name}" berhasil diambil dari galeri!`, 'success');
        },
        (errorMsg) => {
          showToast(errorMsg, 'warning');
        }
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processAvatarImageFile(
        file,
        (dataUrl, info) => {
          setSelectedAvatarUrl(dataUrl);
          setUploadedFileInfo(info);
          showToast(`Foto "${info.name}" berhasil diunggah!`, 'success');
        },
        (errorMsg) => {
          showToast(errorMsg, 'warning');
        }
      );
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const url = customUrlInput.trim();
    if (!url) {
      showToast('Harap masukkan URL foto yang valid', 'warning');
      return;
    }
    setSelectedAvatarUrl(url);
    setUploadedFileInfo(null);
    showToast('Tautan foto diterapkan!', 'info');
  };

  const handleSelectPreset = (preset: AvatarPreset) => {
    setSelectedAvatarUrl(preset.url);
    setUploadedFileInfo(null);
  };

  const handleSave = () => {
    if (!selectedAvatarUrl) {
      showToast('Pilih atau unggah foto terlebih dahulu', 'warning');
      return;
    }

    updateStoreProfile({
      avatarUrl: selectedAvatarUrl,
    });

    showToast('Foto profil pemilik usaha berhasil diperbarui!', 'success');
    onClose();
  };

  const handleResetToDefault = () => {
    const defaultPreset = DEFAULT_AVATAR_PRESETS[0];
    setSelectedAvatarUrl(defaultPreset.url);
    setUploadedFileInfo(null);
    showToast('Foto dikembalikan ke avatar default', 'info');
  };

  const filteredPresets = categoryFilter === 'Semua'
    ? DEFAULT_AVATAR_PRESETS
    : DEFAULT_AVATAR_PRESETS.filter((p) => p.category.toLowerCase().includes(categoryFilter.toLowerCase()));

  const isCustomUploaded = selectedAvatarUrl.startsWith('data:image');
  const isChanged = selectedAvatarUrl !== currentActiveAvatar;

  return (
    <div
      id="edit-profile-photo-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e2e1ec] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f3f2fa] px-5 py-4 bg-[#fcf8ff]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4] shadow-2xs">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1b1b23] tracking-tight">
                Foto Profil Pemilik Usaha
              </h2>
              <p className="text-xs text-[#767680]">
                Unggah dari galeri, jepret kamera, atau pilih preset avatar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#767680] hover:bg-white hover:text-[#1b1b23] transition-colors"
            title="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          {/* Active Preview Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#f8f7ff] via-white to-indigo-50/50 border border-[#e2e1ec]">
            <div className="relative group shrink-0">
              <img
                src={selectedAvatarUrl}
                alt="Pratinjau Foto Profil"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-[#ebeaff] shadow-md transition-transform"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#4648d4] text-white shadow-md hover:bg-[#3537b0] transition-transform hover:scale-105"
                title="Ganti dari Galeri"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="font-extrabold text-sm text-[#1b1b23] truncate">
                  {currentUser?.fullName || storeProfile.owner}
                </h3>
                <span className="text-[10px] font-bold text-[#4648d4] bg-[#ebeaff] px-2 py-0.5 rounded-full">
                  {currentUser?.role === 'cashier' ? 'Kasir' : 'Pemilik'}
                </span>
              </div>
              <p className="text-xs text-[#767680] mt-0.5 truncate">
                {storeProfile.name} • {storeProfile.branch}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-[11px]">
                {isCustomUploaded ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Foto Galeri Mandiri {uploadedFileInfo ? `(${uploadedFileInfo.sizeFormatted})` : ''}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                    <Sparkles className="h-3 w-3" />
                    <span>Preset Avatar Terpilih</span>
                  </span>
                )}
                {isChanged && (
                  <span className="inline-flex items-center font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Belum Disimpan
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center p-1 rounded-xl bg-[#f3f2fa] border border-[#e2e1ec] text-xs font-bold text-[#767680]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-[#4648d4] shadow-xs'
                  : 'hover:text-[#1b1b23]'
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Unggah dari Galeri</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeTab === 'presets'
                  ? 'bg-white text-[#4648d4] shadow-xs'
                  : 'hover:text-[#1b1b23]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Pilihan Preset</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeTab === 'url'
                  ? 'bg-white text-[#4648d4] shadow-xs'
                  : 'hover:text-[#1b1b23]'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>URL Gambar</span>
            </button>
          </div>

          {/* TAB 1: UPLOAD DARI GALERI / FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              {/* Hidden Native File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
                id="avatar-file-input"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center ${
                  isDragging
                    ? 'border-[#4648d4] bg-[#ebeaff]/40 scale-[0.99]'
                    : 'border-[#d2d1dc] bg-[#fcf8ff] hover:border-[#4648d4] hover:bg-white'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-[#4648d4] mb-3 shadow-2xs">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-extrabold text-[#1b1b23]">
                  Pilih Foto dari Galeri HP / Komputer
                </h4>
                <p className="text-xs text-[#767680] mt-1 max-w-xs leading-relaxed">
                  Sentuh atau klik untuk membuka galeri foto atau seret file gambar langsung ke kotak ini
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#4648d4] text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-[#3537b0] transition-all"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Buka Galeri Foto</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#767680] mt-3 font-medium">
                  Format didukung: JPG, PNG, WEBP, GIF (Otomatis dipotong persegi & dioptimalkan)
                </p>
              </div>

              {uploadedFileInfo && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-bold truncate">{uploadedFileInfo.name}</span>
                    <span className="text-emerald-700 shrink-0">({uploadedFileInfo.sizeFormatted})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-extrabold text-emerald-800 underline hover:text-emerald-950 shrink-0 ml-2"
                  >
                    Ganti Foto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRESET AVATARS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {['Semua', 'Pria', 'Wanita', 'Barista', 'Kuliner', 'Retail'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      categoryFilter === cat
                        ? 'bg-[#4648d4] text-white shadow-2xs'
                        : 'bg-[#f3f2fa] text-[#46464f] hover:bg-[#ebeaff]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1 no-scrollbar">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedAvatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`relative flex flex-col items-center p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#4648d4] bg-[#ebeaff]/40 shadow-xs scale-102'
                          : 'border-[#e2e1ec] bg-white hover:border-[#4648d4]/40 hover:bg-[#fcf8ff]'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="h-14 w-14 rounded-full object-cover shadow-2xs"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-[#4648d4] text-white flex items-center justify-center ring-2 ring-white shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-[#1b1b23] mt-2 text-center truncate w-full">
                        {preset.name}
                      </span>
                      <span className="text-[9px] text-[#767680] text-center">
                        {preset.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: URL GAMBAR */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1b1b23] mb-1">
                  Masukkan Tautan Gambar Langsung (URL)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://example.com/foto-profil.jpg"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] px-3 py-2.5 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-[#767680] mt-1">
                  Pastikan tautan dapat diakses publik dengan format .jpg, .png, atau .webp
                </p>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 text-white px-4 py-2.5 text-xs font-bold hover:bg-slate-900 transition-all w-full"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Terapkan URL Foto</span>
              </button>
            </form>
          )}

          {/* Safe Cloud & Local Persistence Notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f8f9fe] border border-[#e2e1ec] text-[11px] text-[#767680]">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Foto profil disimpan aman pada partisi data toko dan disinkronkan ke seluruh menu aplikasi kasir.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 border-t border-[#f3f2fa] px-5 py-4 bg-[#fcf8ff]">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-xs font-bold text-[#767680] hover:text-[#ba1a1a] transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Kembalikan Default</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl border border-[#d2d1dc] bg-white px-4 py-2.5 text-xs font-bold text-[#46464f] hover:bg-[#f3f2fa] transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-[#4648d4] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#3537b0] transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Simpan Foto Profil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

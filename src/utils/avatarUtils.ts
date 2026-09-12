/**
 * DelPOS Owner Avatar & Gallery Image Utilities
 * Powered by microdata2r
 */

export interface AvatarPreset {
  id: string;
  name: string;
  category: 'Pria' | 'Wanita' | 'Barista / Cafe' | 'Kuliner / Chef' | 'Retail & Dagang';
  url: string;
}

export const DEFAULT_AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'preset-budi',
    name: 'Budi (Pemilik Pria)',
    category: 'Pria',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ_UeVtMqix0sJCZHs2TtKM5-d72Pea84EAktZj50a8963OhMvLReqs1NHQ5_GHU31yQIOvnrJgSfVJ_GeiKlPatJEFijCOybVvFFiMGK5NOxgk9QrAVW_iXOt0iW_JoPaZYQPCnyP7yXiRGmSsKfKm7wGSICkKlm5wlq8E4GuzgUAsgAUa1swPQ-m8CDYgnJ9jjXFUt_9CTSEQH_yEVGaOFNO6eA39ylX7lz2CTC7oAh5YPsc0Mc',
  },
  {
    id: 'preset-siti',
    name: 'Siti (Pemilik Wanita)',
    category: 'Wanita',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoLtV3Bv2OBXPlq_WrGjzOKb2hx7Pr3DOTjypa8dkEKduOjjWvN91FeXpeuVJDGRacnpFhqLouF2glsjyg154-ONwKg9-AXq2ylnHCQIAwb0pQ9662t3tt1reJkfrz46PuKvm9rTpygmqRrJUs0iC2FvO13DZ8nlMx-0eSm-8yba6zLFIndlcCVnmVfynCOWQHJRodfFxaOXcZ1AmWZ9mFAugAFABkMmuQ6rlyglKy280HkFHaQKc',
  },
  {
    id: 'preset-barista',
    name: 'Barista & Cafe Owner',
    category: 'Barista / Cafe',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7B9KMRoYvNAmqNyV5w06IdeHLX2otFiqPJA8kZ3Goi212mrGTweb6BNH2e6e8Yb9MlgT8nzNzC-HWRvuUa2TOoyX4hVm44IyZcPbAocXR8y4C-lEK9s3rKLhxMg4b4pPpy_wMjMwxgNzG7yEfQlAU3aD4JIYfRfZRo6O6gWdkAwwkUTsSVqMbOO55lJ8DXxxWawcQlVMywxpMFfKkjQbZxcsAoEGnPnZvyDbWgRciVO1BOs7MuyU',
  },
  {
    id: 'preset-retail',
    name: 'Retail & Toko Modern',
    category: 'Retail & Dagang',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdVT5Ge0_B56pivGW9S29joD83BqOZlq4mFS37QNwdClBoNOPykFiDhmJpz01rrRcVALt-qt3gTDCCdoCU4cpiP4Qv4WmM_xuZ7Gw1Iw5mEOwy9zdjmlqsoFtETWLmXkpkvO079B6bE1FVO-U6i1VgAGE7Ehm12LDBunosqG61dwe-5ilOt1wDkGLCKtwtF-ASBRc0AcdkE-Sz_sn8HV9fEyOBwdX-LUme7BlTWrs1-T0X_FfcRRw',
  },
  {
    id: 'preset-chef',
    name: 'Chef & Usaha Resto',
    category: 'Kuliner / Chef',
    url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'preset-merchant-pria',
    name: 'Wirausaha Pria Formal',
    category: 'Pria',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'preset-merchant-wanita',
    name: 'Pengusaha Muda Wanita',
    category: 'Wanita',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=350&q=80',
  },
  {
    id: 'preset-resto-manager',
    name: 'Pengelola Restoran',
    category: 'Kuliner / Chef',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=350&q=80',
  },
];

/**
 * Process and compress an uploaded image from gallery/device storage
 * Centers square crop & compresses to ~480x480 max dimension for optimal performance
 */
export function processAvatarImageFile(
  file: File,
  onSuccess: (dataUrl: string, fileInfo: { name: string; sizeFormatted: string }) => void,
  onError: (errorMessage: string) => void
): void {
  if (!file.type.startsWith('image/')) {
    onError('Harap pilih file gambar yang valid (JPG, JPEG, PNG, WEBP, atau GIF).');
    return;
  }

  // File size limit check (e.g., max 15MB before compression)
  if (file.size > 15 * 1024 * 1024) {
    onError('Ukuran file terlalu besar (maksimal 15 MB).');
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const rawDataUrl = e.target?.result as string;
    if (!rawDataUrl) {
      onError('Gagal membaca data gambar dari perangkat.');
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const targetSize = 480;
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          onSuccess(rawDataUrl, {
            name: file.name,
            sizeFormatted: `${Math.round(file.size / 1024)} KB`,
          });
          return;
        }

        // Center square crop calculations
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);

        // Quality 0.88 gives sharp detail while keeping payload under ~70KB
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
        const sizeFormatted = approxBytes < 1024 * 1024
          ? `${Math.round(approxBytes / 1024)} KB`
          : `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`;

        onSuccess(compressedDataUrl, {
          name: file.name,
          sizeFormatted,
        });
      } catch (err) {
        console.warn('Canvas compression fallback:', err);
        onSuccess(rawDataUrl, {
          name: file.name,
          sizeFormatted: `${Math.round(file.size / 1024)} KB`,
        });
      }
    };

    img.onerror = () => {
      onError('File gambar rusak atau format tidak didukung oleh peramban.');
    };

    img.src = rawDataUrl;
  };

  reader.onerror = () => {
    onError('Gagal membuka file dari galeri perangkat.');
  };

  reader.readAsDataURL(file);
}

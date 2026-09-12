/**
 * WhatsApp OTP Service for DelPOS
 * Handles formatting, dispatching, and direct links for sending 6-digit OTP codes via WhatsApp
 * to the user's registered phone number.
 */

export interface WhatsAppOtpParams {
  phone: string;
  code: string;
  businessName?: string;
  fullName?: string;
}

export interface WhatsAppOtpResult {
  success: boolean;
  phone: string;
  code: string;
  message: string;
  waLink: string;
  dispatchedViaApi: boolean;
  apiMessage?: string;
  error?: string;
}

/**
 * Regex for Indonesian phone numbers:
 * Must start with '08', '628', or '+628', followed by 8 to 12 digits (total length 10 to 14 digits).
 * Examples: 081234567890, 6281234567890, +6281234567890
 */
export const INDONESIAN_PHONE_REGEX = /^(\+?62|0)8[1-9][0-9]{7,11}$/;

/**
 * Validates whether a phone number matches the required Indonesian mobile format.
 */
export function validateIndonesianPhoneNumber(phone: string): {
  isValid: boolean;
  message?: string;
  cleanedPhone?: string;
} {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      message: 'Nomor WhatsApp wajib diisi.',
    };
  }

  // Remove spaces, hyphens, parentheses
  const sanitized = phone.trim().replace(/[\s\-()]/g, '');

  if (!INDONESIAN_PHONE_REGEX.test(sanitized)) {
    if (!sanitized.startsWith('08') && !sanitized.startsWith('62') && !sanitized.startsWith('+62')) {
      return {
        isValid: false,
        message: 'Nomor telepon harus dimulai dengan 08 atau 62 (contoh: 081234567890 atau 6281234567890).',
      };
    }

    if (sanitized.length < 10) {
      return {
        isValid: false,
        message: 'Nomor telepon terlalu pendek. Minimal 10 digit (contoh: 08123456789).',
      };
    }

    if (sanitized.length > 15) {
      return {
        isValid: false,
        message: 'Nomor telepon terlalu panjang. Maksimal 14 digit.',
      };
    }

    return {
      isValid: false,
      message: 'Format nomor telepon tidak valid. Pastikan nomor seluler aktif diawali dengan 08 atau 62.',
    };
  }

  const clean = cleanWhatsAppNumber(sanitized);
  return {
    isValid: true,
    cleanedPhone: clean,
  };
}

/**
 * Converts Indonesian local phone numbers to standard WhatsApp format (e.g., 62812...)
 */
export function cleanWhatsAppNumber(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Formats a phone number for neat UI display (e.g., +62 812-3456-7890)
 */
export function formatDisplayPhone(phone: string): string {
  const cleaned = cleanWhatsAppNumber(phone);
  if (cleaned.startsWith('62') && cleaned.length >= 10) {
    const main = cleaned.slice(2);
    const p1 = main.slice(0, 3);
    const p2 = main.slice(3, 7);
    const p3 = main.slice(7);
    return `+62 ${p1}-${p2}${p3 ? '-' + p3 : ''}`;
  }
  return phone || '-';
}

/**
 * Generates official DelPOS OTP message for WhatsApp
 */
export function createWhatsAppOtpMessage(
  code: string,
  recipientName: string,
  businessName?: string
): string {
  const store = businessName ? ` (${businessName})` : '';
  return `*DELPOS - KODE VERIFIKASI RESMI (OTP)*\n\nHalo *${recipientName}*${store},\n\nBerikut adalah 6-digit kode OTP Anda untuk mengaktifkan akun kasir DelPOS:\n\n👉 *${code}* 👈\n\n⏳ *Masa Berlaku:* 10 Menit\n🔒 *Penting:* Jangan berikan kode ini kepada siapapun termasuk pihak yang mengaku sebagai DelPOS.\n\nTerima kasih,\n_Tim DelPOS UMKM System_`;
}

/**
 * Builds direct wa.me link to launch WhatsApp Web or App
 */
export function buildWhatsAppDirectLink(phone: string, message: string): string {
  const cleanPhone = cleanWhatsAppNumber(phone);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Sends OTP via backend API or generates direct WhatsApp link
 */
export async function sendWhatsAppOtp(params: WhatsAppOtpParams): Promise<WhatsAppOtpResult> {
  const cleanPhone = cleanWhatsAppNumber(params.phone);
  const recipientName = params.fullName || params.businessName || 'Pemilik Usaha';
  const message = createWhatsAppOtpMessage(params.code, recipientName, params.businessName);
  const directLink = buildWhatsAppDirectLink(params.phone, message);

  try {
    const res = await fetch('/api/send-whatsapp-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: cleanPhone,
        code: params.code,
        businessName: params.businessName,
        fullName: params.fullName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        phone: cleanPhone,
        code: params.code,
        message,
        waLink: data.waLink || directLink,
        dispatchedViaApi: !!data.dispatchedViaApi,
        apiMessage: data.apiMessage || 'OTP WhatsApp berhasil disiapkan.',
      };
    }
  } catch (err) {
    console.warn('[DelPOS WhatsApp] API call fallback to direct link:', err);
  }

  // Fallback to client-side direct link
  return {
    success: true,
    phone: cleanPhone,
    code: params.code,
    message,
    waLink: directLink,
    dispatchedViaApi: false,
    apiMessage: 'Tautan langsung WhatsApp siap dibuka.',
  };
}

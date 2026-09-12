import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper fallback SKU generator
function generateFallbackSku(name: string, category: string = 'Umum', existingSkus: string[] = []): {
  sku: string;
  alternatives: string[];
  reason: string;
} {
  const catMap: Record<string, string> = {
    makanan: 'MKN',
    minuman: 'MNM',
    snack: 'SNK',
    sembako: 'SBK',
    dessert: 'DST',
    elektronik: 'ELK',
    pakaian: 'BJU',
    atk: 'ATK',
    jasa: 'JSA',
  };

  const catKey = category.toLowerCase().trim();
  const catCode =
    catMap[catKey] ||
    category
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase() ||
    'PRD';

  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleanName.split(/\s+/).filter(Boolean);

  let nameCode = '';
  if (words.length >= 3) {
    nameCode = words.map((w) => w[0].toUpperCase()).slice(0, 3).join('');
  } else if (words.length === 2) {
    nameCode = (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 3) {
    nameCode = words[0].slice(0, 3).toUpperCase();
  } else {
    nameCode = (cleanName.slice(0, 3) || 'ITM').toUpperCase();
  }

  const findUnique = (base: string): string => {
    for (let i = 1; i <= 99; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      const candidate = `${catCode}-${base}-${numStr}`;
      if (!existingSkus.includes(candidate)) {
        return candidate;
      }
    }
    const rand = Math.floor(100 + Math.random() * 900);
    return `${catCode}-${base}-${rand}`;
  };

  const primarySku = findUnique(nameCode);
  const alt1 = findUnique(nameCode + 'X');
  const alt2 = `${catCode}-${cleanName.slice(0, 4).toUpperCase() || 'PROD'}-${Math.floor(10 + Math.random() * 90)}`;

  return {
    sku: primarySku,
    alternatives: [alt1, alt2].filter((s) => s !== primarySku),
    reason: `Dihasilkan otomatis berdasarkan kategori [${category}] dan nama [${name}].`,
  };
}

// Lazy Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY) {
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return geminiClient;
  }
  return null;
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: AI-Powered SKU Generator
app.post('/api/generate-sku', async (req, res) => {
  try {
    const { name, category = 'Makanan', existingSkus = [] } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Nama produk diperlukan untuk membuat kode SKU.',
      });
    }

    const trimmedName = name.trim();
    const trimmedCat = (category || 'Umum').trim();
    const existingList = Array.isArray(existingSkus) ? existingSkus.map(String) : [];

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `Anda adalah asisten AI kasir POS untuk sistem retail UMKM Indonesia.
Tugas Anda adalah membuat kode SKU (Stock Keeping Unit) yang cerdas, unik, terstandarisasi, dan mudah diingat oleh kasir/gudang.

Informasi Produk:
- Nama Produk: "${trimmedName}"
- Kategori Produk: "${trimmedCat}"
- Daftar SKU yang sudah ada (JANGAN GUNAKAN KEMBALI): ${existingList.slice(0, 50).join(', ') || 'Belum ada'}

Format SKU yang diharapkan:
- Pola standar: [KODE_KATEGORI_2_3_HURUF]-[KODE_NAMA_2_4_HURUF]-[NOMOR_2_3_DIGIT]
  Contoh: "MKN-NSG-01" (Makanan Nasi Goreng), "MNM-EST-02" (Minuman Es Teh), "SBK-MYK-01" (Sembako Minyak), "SNK-KRP-03" (Snack Keripik).
- Karakter: Huruf kapital, angka, dan tanda hubung (-) saja. Panjang antara 6 sampai 12 karakter.
- Berikan 1 SKU utama dan 2 alternatif SKU yang berbeda.
- Berikan penjelasan singkat (1 kalimat bahasa Indonesia) tentang arti singkatan kode tersebut.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sku: {
                  type: Type.STRING,
                  description: 'Primary unique SKU code in uppercase',
                },
                alternatives: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2 alternative SKU variations',
                },
                reason: {
                  type: Type.STRING,
                  description: 'Brief explanation in Indonesian',
                },
              },
              required: ['sku', 'alternatives', 'reason'],
            },
          },
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed && parsed.sku) {
            // Clean up SKU
            const cleanSku = String(parsed.sku).toUpperCase().replace(/[^A-Z0-9-]/g, '').trim();
            const cleanAlts = Array.isArray(parsed.alternatives)
              ? parsed.alternatives.map((s: string) =>
                  String(s).toUpperCase().replace(/[^A-Z0-9-]/g, '').trim()
                ).filter((s: string) => s && s !== cleanSku)
              : [];

            return res.json({
              success: true,
              sku: cleanSku,
              alternatives: cleanAlts,
              reason: parsed.reason || `Dihasilkan oleh AI untuk ${trimmedName}`,
              source: 'ai',
            });
          }
        }
      } catch (aiErr: any) {
        console.warn('Gemini SKU generation failed or timed out, falling back to smart heuristic:', aiErr?.message);
      }
    }

    // Fallback heuristic generator
    const fallback = generateFallbackSku(trimmedName, trimmedCat, existingList);
    return res.json({
      success: true,
      sku: fallback.sku,
      alternatives: fallback.alternatives,
      reason: fallback.reason,
      source: 'heuristic',
    });
  } catch (error: any) {
    console.error('Error generating SKU:', error);
    res.status(500).json({
      error: 'Gagal membuat kode SKU. Silakan coba lagi atau isi manual.',
    });
  }
});

// ==========================================
// API: VEO VIDEO GENERATION (veo-3.1-fast-generate-preview)
// ==========================================

// Step 1: Start Video Generation
app.post('/api/generate-video', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg', prompt, aspectRatio = '16:9' } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'Foto / Gambar diperlukan untuk menganimasikan video.',
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di server. Silakan atur di Settings > Secrets.',
      });
    }

    // Clean base64 string
    let cleanBase64 = image;
    let detectedMime = mimeType;
    if (image.startsWith('data:')) {
      const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1];
        cleanBase64 = match[2];
      } else {
        cleanBase64 = image.split(',')[1] || image;
      }
    }

    const targetRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
    const finalPrompt =
      prompt && typeof prompt === 'string' && prompt.trim()
        ? prompt.trim()
        : 'Animate this photo into an engaging cinematic commercial video with dynamic motion, smooth lighting transitions, and professional commercial aesthetics.';

    console.log(`[Veo Video] Initiating generation with model: veo-3.1-fast-generate-preview, ratio: ${targetRatio}`);

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: finalPrompt,
      image: {
        imageBytes: cleanBase64,
        mimeType: detectedMime,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: targetRatio,
      },
    });

    console.log(`[Veo Video] Operation started successfully: ${operation.name}`);

    return res.json({
      success: true,
      operationName: operation.name,
      model: 'veo-3.1-fast-generate-preview',
      aspectRatio: targetRatio,
    });
  } catch (error: any) {
    console.error('Error starting video generation:', error);
    let userMsg = error?.message || 'Gagal memulai pembuatan video Veo.';
    let isQuotaError = false;

    if (
      String(userMsg).includes('429') ||
      String(userMsg).includes('RESOURCE_EXHAUSTED') ||
      String(userMsg).includes('quota')
    ) {
      isQuotaError = true;
      userMsg =
        'Kuota Gemini API / Veo Anda telah habis atau mencapai batas (RESOURCE_EXHAUSTED / 429). Model video Veo memerlukan API Key dengan penagihan aktif (Billing / Pay-as-you-go). Silakan periksa atau pilih API Key berbayar Anda di menu Settings > Secrets atau coba beberapa saat lagi.';
    }

    return res.status(isQuotaError ? 429 : 500).json({
      error: userMsg,
      isQuotaError,
      rawError: error?.message,
    });
  }
});

// Step 2: Poll Video Status
app.post('/api/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;

    if (!operationName || typeof operationName !== 'string') {
      return res.status(400).json({ error: 'operationName diperlukan.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' });
    }

    const op = { name: operationName } as any;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const isDone = Boolean(updated.done);
    let errorMessage: string | null = null;
    let isQuotaError = false;

    const rawError = (updated as any).error;
    if (rawError) {
      const errStr =
        typeof rawError === 'string'
          ? rawError
          : String(rawError.message || JSON.stringify(rawError));

      if (
        errStr.includes('429') ||
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('quota')
      ) {
        isQuotaError = true;
        errorMessage =
          'Kuota Gemini API / Veo telah habis (RESOURCE_EXHAUSTED / 429). Silakan gunakan API Key yang memiliki saldo/billing aktif di Settings > Secrets atau tunggu kuota tereset.';
      } else {
        errorMessage = errStr;
      }
    }

    return res.json({
      success: true,
      done: isDone,
      error: errorMessage,
      isQuotaError,
      operationName,
    });
  } catch (error: any) {
    console.error('Error checking video status:', error);
    let errMsg = error?.message || 'Gagal memeriksa status proses video.';
    let isQuota = false;
    if (
      String(errMsg).includes('429') ||
      String(errMsg).includes('RESOURCE_EXHAUSTED') ||
      String(errMsg).includes('quota')
    ) {
      isQuota = true;
      errMsg =
        'Kuota Gemini API / Veo telah habis (RESOURCE_EXHAUSTED / 429). Pastikan API Key di Settings > Secrets memiliki akun penagihan (billing) aktif.';
    }
    return res.status(500).json({
      error: errMsg,
      isQuotaError: isQuota,
    });
  }
});

// Step 3: Download & Stream Video File
app.all('/api/video-download', async (req, res) => {
  try {
    const operationName =
      req.body?.operationName || req.query?.operationName || req.query?.op;

    if (!operationName || typeof operationName !== 'string') {
      return res.status(400).json({ error: 'operationName diperlukan.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' });
    }

    const op = { name: operationName } as any;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    if (!updated.done) {
      return res.status(202).json({
        error: 'Video masih dalam proses rendering. Silakan tunggu beberapa saat lagi.',
        done: false,
      });
    }

    const rawErr = (updated as any).error;
    if (rawErr) {
      return res.status(500).json({
        error: typeof rawErr === 'string' ? rawErr : rawErr.message || 'Pembuatan video gagal oleh model AI.',
      });
    }

    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      return res.status(404).json({
        error: 'File video tidak ditemukan dalam hasil respon operasi.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY!;
    const videoResponse = await fetch(videoUri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!videoResponse.ok) {
      return res.status(videoResponse.status).json({
        error: `Gagal mengunduh video dari server Google (Status: ${videoResponse.status})`,
      });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="finansialpro-veo-video.mp4"');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await videoResponse.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Error downloading video:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal mengunduh file video hasil generasi.',
    });
  }
});

// Check real email service status
app.get('/api/email-status', (req, res) => {
  const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  res.json({
    configured: hasSmtp || hasResend,
    provider: hasResend ? 'resend' : hasSmtp ? 'smtp' : 'none',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    sender: process.env.SMTP_FROM || process.env.SMTP_USER || 'auth@delpos.id',
  });
});

// Helper clean phone for WhatsApp
function cleanWhatsAppNumberServer(phone: string): string {
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

// WhatsApp OTP dispatch endpoint
app.post('/api/send-whatsapp-otp', async (req, res) => {
  try {
    const { phone, code, businessName, fullName } = req.body;
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Nomor WhatsApp dan kode OTP diperlukan.',
      });
    }

    const cleanPhone = cleanWhatsAppNumberServer(phone);
    const recipientName = fullName || businessName || 'Pemilik Usaha';
    const store = businessName ? ` (${businessName})` : '';
    const message = `*DELPOS - KODE VERIFIKASI RESMI (OTP)*\n\nHalo *${recipientName}*${store},\n\nBerikut adalah 6-digit kode OTP Anda untuk mengaktifkan akun kasir DelPOS:\n\n👉 *${code}* 👈\n\n⏳ *Masa Berlaku:* 10 Menit\n🔒 *Penting:* Jangan berikan kode ini kepada siapapun termasuk pihak yang mengaku sebagai DelPOS.\n\nTerima kasih,\n_Tim DelPOS UMKM System_`;
    const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    let dispatchedViaApi = false;
    let apiMessage = 'Tautan WhatsApp resmi siap dibuka.';

    // Check if Fonnte WhatsApp Gateway API is configured
    const fonnteToken = process.env.FONNTE_TOKEN;
    if (fonnteToken) {
      try {
        const fonnteRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: fonnteToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: cleanPhone,
            message,
            countryCode: '62',
          }),
        });
        const fonnteData = await fonnteRes.json();
        if (fonnteData.status) {
          dispatchedViaApi = true;
          apiMessage = 'Pesan WhatsApp berhasil dikirimkan via WhatsApp Gateway.';
        }
      } catch (fErr) {
        console.warn('[DelPOS WhatsApp] Fonnte gateway error:', fErr);
      }
    }

    console.log(`[DelPOS WhatsApp OTP] Target: ${cleanPhone}, Code: ${code}, Dispatched: ${dispatchedViaApi}`);

    return res.json({
      success: true,
      phone: cleanPhone,
      code,
      message,
      waLink,
      dispatchedViaApi,
      apiMessage,
    });
  } catch (err: any) {
    console.error('[DelPOS WhatsApp OTP] Error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Gagal menyiapkan pengiriman WhatsApp OTP.',
    });
  }
});

// Real email dispatch endpoint for registration OTP and password reset
app.post('/api/send-verification-email', async (req, res) => {
  try {
    const { email, code, businessName, fullName, type, resetLink } = req.body;

    if (!email || (!code && !resetLink)) {
      return res.status(400).json({
        success: false,
        error: 'Alamat email dan kode verifikasi/tautan reset diperlukan.',
      });
    }

    const isReset = type === 'reset_password';
    const recipientName = fullName || businessName || 'Pelaku Usaha UMKM';
    const storeName = businessName ? ` - ${businessName}` : '';
    const subject = isReset
      ? `[DelPOS] Atur Ulang Kata Sandi Akun${storeName}`
      : `[DelPOS] Kode Verifikasi Pendaftaran: ${code}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #0047cc 0%, #0055EE 60%, #0077FF 100%); padding: 32px 28px; text-align: center;">
              <div style="display: inline-block; background-color: #ffffff; color: #0055EE; font-weight: 900; font-size: 20px; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; text-align: center; margin-bottom: 12px;">DP</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">DelPOS</h1>
              <p style="margin: 4px 0 0; color: #bfdbfe; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Sistem Kasir & Pembukuan UMKM</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 28px;">
              <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">Halo, ${recipientName}</h2>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                ${isReset 
                  ? 'Kami menerima permintaan pengaturan ulang kata sandi untuk akun DelPOS Anda. Klik tombol di bawah ini untuk melanjutkan:' 
                  : 'Terima kasih telah mendaftar di <strong>DelPOS (microdata2r system)</strong>. Masukkan kode verifikasi 6-digit di bawah ini pada halaman pendaftaran untuk mengonfirmasi email dan mengaktifkan akun kasir Anda:'}
              </p>

              ${!isReset && code ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 2px dashed #0055EE; border-radius: 16px; padding: 24px 20px;">
                    <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">KODE VERIFIKASI RESMI (OTP)</span>
                    <div style="font-size: 36px; font-weight: 900; font-family: 'Courier New', Courier, monospace; letter-spacing: 8px; color: #0055EE; padding-left: 8px;">${code}</div>
                    <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 10px;">Berlaku selama 10 menit</span>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${isReset && resetLink ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #0055EE; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px;">Atur Ulang Kata Sandi</a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #64748b; word-break: break-all; margin-top: 16px;">
                Atau salin tautan ini di browser: <br><a href="${resetLink}" style="color: #0055EE;">${resetLink}</a>
              </p>
              ` : ''}

              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-top: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #92400e;">
                  <strong>Penting:</strong> Jangan berikan kode ini kepada siapapun termasuk pihak yang mengaku sebagai tim DelPOS. Jika Anda tidak merasa melakukan pendaftaran ini, abaikan email ini.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #64748b;">DelPOS - Point of Sale & Pembukuan UMKM</p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8;">Email dikirim otomatis oleh sistem DelPOS &bull; Mohon tidak membalas email ini</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || (smtpUser ? `"DelPOS Security" <${smtpUser}>` : '"DelPOS Security" <auth@delpos.id>');

    console.log(`[DelPOS Real Email] Preparing dispatch to ${email} (code: ${code || 'link'})...`);

    // 1. Resend API
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: smtpFrom.includes('<') ? smtpFrom : `DelPOS <${smtpFrom}>`,
            to: [email],
            subject,
            html: htmlContent,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log(`[DelPOS Real Email] Successfully dispatched via Resend to ${email}:`, data.id);
          return res.json({
            success: true,
            configured: true,
            method: 'resend',
            messageId: data.id,
            message: `Email verifikasi berhasil dikirim ke ${email}.`,
          });
        }
      } catch (resendErr) {
        console.error('[DelPOS Real Email] Resend API error:', resendErr);
      }
    }

    // 2. SMTP via nodemailer
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject,
        html: htmlContent,
      });

      console.log(`[DelPOS Real Email] Successfully dispatched via SMTP to ${email}:`, info.messageId);
      return res.json({
        success: true,
        configured: true,
        method: 'smtp',
        messageId: info.messageId,
        message: `Email verifikasi berhasil dikirim ke ${email}.`,
      });
    }

    // 3. Fallback when SMTP is not yet set in .env
    console.warn(`[DelPOS Real Email] SMTP_USER & SMTP_PASS not set in environment. Code for ${email} is ${code}`);
    return res.status(200).json({
      success: false,
      configured: false,
      error: 'SMTP_NOT_CONFIGURED',
      message: 'Kredensial email (SMTP_USER dan SMTP_PASS) belum diisi di Secrets/Settings server. Masukkan kredensial SMTP agar email langsung masuk ke inbox penerima.',
    });
  } catch (err: any) {
    console.error('[DelPOS Real Email] Error in /api/send-verification-email:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Gagal mengirim email verifikasi.',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DelPOS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

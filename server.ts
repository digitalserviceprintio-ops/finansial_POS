import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
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

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
    console.log(`FinansialPro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

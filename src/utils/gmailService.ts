import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { Transaction, StoreProfile } from '../types';

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

export interface GmailUserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

export interface GmailProfileStats {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  labels?: string[];
  isUnread?: boolean;
}

// In-memory token cache as strictly mandated by workspace-integration skill
let cachedGmailAccessToken: string | null = null;
let currentGmailUser: GmailUserProfile | null = null;

// Track auth listeners
type GmailAuthCallback = (user: GmailUserProfile | null, isConnected: boolean) => void;
const gmailAuthListeners: Set<GmailAuthCallback> = new Set();

function notifyGmailListeners() {
  const isConnected = !!(cachedGmailAccessToken && currentGmailUser);
  gmailAuthListeners.forEach((listener) => {
    try {
      listener(currentGmailUser, isConnected);
    } catch (e) {
      console.error('Gmail auth listener error:', e);
    }
  });
}

// Subscribe to auth state changes to clear memory cache if user logs out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedGmailAccessToken = null;
    currentGmailUser = null;
    notifyGmailListeners();
  } else if (!cachedGmailAccessToken) {
    if (currentGmailUser && currentGmailUser.uid !== user.uid) {
      cachedGmailAccessToken = null;
      currentGmailUser = null;
      notifyGmailListeners();
    }
  }
});

export function subscribeToGmailAuth(callback: GmailAuthCallback): () => void {
  gmailAuthListeners.add(callback);
  callback(currentGmailUser, !!(cachedGmailAccessToken && currentGmailUser));
  return () => {
    gmailAuthListeners.delete(callback);
  };
}

export function getCachedGmailAccessToken(): string | null {
  return cachedGmailAccessToken;
}

export function getCurrentGmailUser(): GmailUserProfile | null {
  return currentGmailUser;
}

export function isGmailConnected(): boolean {
  return !!(cachedGmailAccessToken && currentGmailUser);
}

/**
 * Connect to Gmail using Firebase Auth GoogleAuthProvider with all Gmail scopes
 */
export async function connectGmail(): Promise<{
  success: boolean;
  user?: GmailUserProfile;
  error?: string;
  cancelled?: boolean;
}> {
  try {
    const provider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));

    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline',
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Tidak dapat memperoleh access token Gmail dari Google Auth.');
    }

    cachedGmailAccessToken = credential.accessToken;
    currentGmailUser = {
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    };

    notifyGmailListeners();
    return { success: true, user: currentGmailUser };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    const errorCode = errorObj?.code || '';
    const errorMessage = errorObj?.message || '';

    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorMessage.includes('popup-closed-by-user') ||
      errorMessage.includes('cancelled-popup-request')
    ) {
      return {
        success: false,
        cancelled: true,
        error: 'Jendela login Google ditutup sebelum otorisasi selesai.',
      };
    }

    if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
      return {
        success: false,
        error: 'Jendela popup diblokir oleh browser. Harap izinkan popup untuk login dengan akun Google.',
      };
    }

    console.error('Error connecting to Gmail:', err);
    return {
      success: false,
      error: errorMessage || 'Gagal menghubungkan ke Gmail via Google Auth.',
    };
  }
}

/**
 * Disconnect Gmail session (clear in-memory access token)
 */
export async function disconnectGmail(): Promise<void> {
  cachedGmailAccessToken = null;
  currentGmailUser = null;
  notifyGmailListeners();
}

/**
 * Fetch Gmail user profile statistics
 */
export async function getGmailProfile(): Promise<GmailProfileStats | null> {
  const token = cachedGmailAccessToken;
  if (!token) {
    throw new Error('Token akses Gmail tidak ditemukan. Silakan hubungkan akun Google terlebih dahulu.');
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal mengambil profil Gmail (Status ${res.status})`);
  }

  return await res.json();
}

/**
 * List Gmail messages (Inbox / Sent / Trash / Custom Query)
 */
export async function listGmailMessages(options: {
  query?: string;
  maxResults?: number;
  labelIds?: string[];
  pageToken?: string;
} = {}): Promise<{
  messages: GmailMessageSummary[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}> {
  const token = cachedGmailAccessToken;
  if (!token) {
    throw new Error('Sesi Gmail belum terhubung.');
  }

  const params = new URLSearchParams();
  if (options.query) params.set('q', options.query);
  params.set('maxResults', String(options.maxResults || 15));
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (options.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach((lbl) => params.append('labelIds', lbl));
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal mengambil daftar email dari Gmail.');
  }

  const data = await res.json();
  const rawList: { id: string; threadId: string }[] = data.messages || [];

  // Fetch headers for each message concurrently (limited to maxResults)
  const messageDetails = await Promise.all(
    rawList.slice(0, 15).map(async (item) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );
        if (!detailRes.ok) return { id: item.id, threadId: item.threadId };
        const detail = await detailRes.json();

        const headers: { name: string; value: string }[] = detail.payload?.headers || [];
        const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '(Tanpa Subjek)';
        const from = headers.find((h) => h.name.toLowerCase() === 'from')?.value || '';
        const to = headers.find((h) => h.name.toLowerCase() === 'to')?.value || '';
        const date = headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';
        const isUnread = (detail.labelIds || []).includes('UNREAD');

        return {
          id: item.id,
          threadId: item.threadId,
          snippet: detail.snippet || '',
          subject,
          from,
          to,
          date,
          labels: detail.labelIds || [],
          isUnread,
        };
      } catch {
        return { id: item.id, threadId: item.threadId };
      }
    })
  );

  return {
    messages: messageDetails,
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate,
  };
}

/**
 * Encode raw RFC 2822 message to URL-safe Base64
 */
function encodeRFC2822Email(params: {
  to: string;
  fromName?: string;
  fromEmail: string;
  subject: string;
  htmlBody: string;
}): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`;
  const fromHeader = params.fromName
    ? `"${params.fromName}" <${params.fromEmail}>`
    : params.fromEmail;

  const emailLines = [
    `From: ${fromHeader}`,
    `To: ${params.to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.htmlBody,
  ];

  const rawMessage = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface SendGmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  fromName?: string;
}

/**
 * Send email via Gmail API
 * Note: Caller MUST display explicit confirmation dialog before invoking this function.
 */
export async function sendGmailMessage(params: SendGmailParams): Promise<{
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}> {
  const token = cachedGmailAccessToken;
  if (!token) {
    return {
      success: false,
      error: 'Akun Gmail belum terhubung. Silakan login ke Google terlebih dahulu.',
    };
  }

  const senderEmail = currentGmailUser?.email || 'me';
  const encodedRaw = encodeRFC2822Email({
    to: params.to,
    fromEmail: senderEmail,
    fromName: params.fromName || currentGmailUser?.displayName || 'DelPOS Kasir Pintar',
    subject: params.subject,
    htmlBody: params.htmlBody,
  });

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedRaw }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gagal mengirim email (Status ${res.status})`);
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.id,
      threadId: data.threadId,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error sending Gmail message:', err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Create a draft message in Gmail
 */
export async function createGmailDraft(params: SendGmailParams): Promise<{
  success: boolean;
  draftId?: string;
  error?: string;
}> {
  const token = cachedGmailAccessToken;
  if (!token) {
    return {
      success: false,
      error: 'Akun Gmail belum terhubung.',
    };
  }

  const senderEmail = currentGmailUser?.email || 'me';
  const encodedRaw = encodeRFC2822Email({
    to: params.to,
    fromEmail: senderEmail,
    fromName: params.fromName || currentGmailUser?.displayName || 'DelPOS',
    subject: params.subject,
    htmlBody: params.htmlBody,
  });

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: { raw: encodedRaw },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'Gagal menyimpan draf di Gmail.');
    }

    const data = await res.json();
    return {
      success: true,
      draftId: data.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Trash a Gmail message
 * Note: Caller MUST display explicit confirmation dialog before invoking this function.
 */
export async function trashGmailMessage(messageId: string): Promise<boolean> {
  const token = cachedGmailAccessToken;
  if (!token) return false;

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.ok;
}

/**
 * Generate a responsive HTML digital receipt for Gmail
 */
export function buildReceiptHtml(
  transaction: Transaction,
  store: StoreProfile,
  formatCurrency: (val: number) => string
): string {
  const itemsHtml = transaction.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 0; font-size: 14px; color: #1e293b;">
          <strong>${item.productName}</strong><br/>
          <span style="font-size: 12px; color: #64748b;">${item.quantity} x ${formatCurrency(item.price)}</span>
        </td>
        <td style="padding: 10px 0; font-size: 14px; color: #1e293b; text-align: right; font-weight: 600;">
          ${formatCurrency(item.quantity * item.price)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Struk Pembayaran - ${transaction.orderNumber || transaction.id}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${store.name || 'DelPOS Store'}</h1>
        ${store.address ? `<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">${store.address}</p>` : ''}
        ${store.phone ? `<p style="margin: 2px 0 0 0; font-size: 12px; opacity: 0.85;">Telp/WA: ${store.phone}</p>` : ''}
      </div>

      <!-- Receipt Meta -->
      <div style="padding: 20px 24px; background: #f1f5f9; border-bottom: 1px dashed #cbd5e1;">
        <table style="width: 100%; font-size: 13px;">
          <tr>
            <td style="color: #64748b;">No. Transaksi</td>
            <td style="text-align: right; font-weight: 700; color: #0f172a;">${transaction.orderNumber || transaction.id}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Waktu Transaksi</td>
            <td style="text-align: right; color: #0f172a;">${transaction.date ? `${transaction.date} ${transaction.time || ''}` : new Date(transaction.timestamp).toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Metode Pembayaran</td>
            <td style="text-align: right; font-weight: 600; color: #2563eb; text-transform: uppercase;">${transaction.paymentMethod}</td>
          </tr>
          ${
            transaction.customer?.name
              ? `<tr>
            <td style="color: #64748b;">Nama Pelanggan</td>
            <td style="text-align: right; font-weight: 600; color: #0f172a;">${transaction.customer.name}</td>
          </tr>`
              : ''
          }
        </table>
      </div>

      <!-- Item List -->
      <div style="padding: 20px 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0;">
              <th style="padding-bottom: 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Item Pesanan</th>
              <th style="padding-bottom: 8px; text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <table style="width: 100%; margin-top: 16px; font-size: 14px;">
          ${
            transaction.discount && transaction.discount > 0
              ? `<tr>
            <td style="padding: 4px 0; color: #64748b;">Diskon Promosi</td>
            <td style="padding: 4px 0; text-align: right; color: #dc2626; font-weight: 600;">-${formatCurrency(transaction.discount)}</td>
          </tr>`
              : ''
          }
          ${
            transaction.tax && transaction.tax > 0
              ? `<tr>
            <td style="padding: 4px 0; color: #64748b;">PPN / Pajak</td>
            <td style="padding: 4px 0; text-align: right; color: #0f172a;">+${formatCurrency(transaction.tax)}</td>
          </tr>`
              : ''
          }
          <tr style="border-top: 2px solid #e2e8f0;">
            <td style="padding: 12px 0; font-size: 16px; font-weight: 800; color: #0f172a;">Total Pembayaran</td>
            <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 800; color: #2563eb;">${formatCurrency(transaction.total)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Uang Diterima</td>
            <td style="padding: 4px 0; text-align: right; color: #0f172a;">${formatCurrency(transaction.cashGiven || transaction.total)}</td>
          </tr>
          ${
            (transaction.change || 0) > 0
              ? `<tr>
            <td style="padding: 4px 0; color: #64748b;">Kembalian</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #16a34a;">${formatCurrency(transaction.change || 0)}</td>
          </tr>`
              : ''
          }
        </table>
      </div>

      <!-- Footer Message -->
      <div style="background: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1e293b;">Terima kasih atas kunjungan dan kepercayaan Anda!</p>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">Struk digital resmi diterbitkan oleh DelPOS Kasir Pintar via Gmail</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

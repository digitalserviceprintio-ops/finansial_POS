/**
 * Real Email Dispatch Service for DelPOS
 * Sends real OTP verification codes and password reset links to actual recipient email inboxes.
 */

export interface SendVerificationEmailParams {
  email: string;
  code?: string;
  businessName?: string;
  fullName?: string;
  type: 'register' | 'reset_password';
  resetLink?: string;
}

export interface SendEmailResponse {
  success: boolean;
  configured?: boolean;
  method?: 'smtp' | 'resend' | 'gas';
  messageId?: string;
  message?: string;
  error?: string;
  devCode?: string;
}

export interface EmailServiceStatus {
  configured: boolean;
  provider: 'smtp' | 'resend' | 'gas' | 'none';
  smtpHost?: string;
  smtpPort?: number;
  sender?: string;
}

/**
 * Send real email to recipient inbox via backend API
 */
export async function sendRealVerificationEmail(
  params: SendVerificationEmailParams
): Promise<SendEmailResponse> {
  try {
    const res = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = (await res.json()) as SendEmailResponse;

    // If server SMTP is not configured, check if client has Google Apps Script webhook configured
    if (!data.success && data.configured === false && typeof window !== 'undefined') {
      try {
        const savedGasConfig = localStorage.getItem('delpos_google_sheets_config');
        if (savedGasConfig) {
          const parsed = JSON.parse(savedGasConfig);
          if (parsed.webAppUrl) {
            await fetch(parsed.webAppUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'SEND_EMAIL_OTP',
                data: {
                  email: params.email,
                  code: params.code,
                  businessName: params.businessName,
                  subject: `[DelPOS] Kode Verifikasi Pendaftaran: ${params.code}`,
                },
              }),
            });
            return {
              success: true,
              configured: true,
              method: 'gas',
              message: `Email verifikasi dikirim via Google Apps Script ke ${params.email}`,
            };
          }
        }
      } catch (gasErr) {
        console.warn('[DelPOS] GAS email fallback error:', gasErr);
      }
    }

    return data;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Koneksi ke server pengiriman email gagal';
    console.error('Error invoking /api/send-verification-email:', err);
    return {
      success: false,
      configured: false,
      error: errorMessage,
      message: 'Gagal menghubungi server untuk mengirimkan email.',
    };
  }
}

/**
 * Check if real email sending (SMTP or Resend) is configured on server
 */
export async function checkEmailServiceStatus(): Promise<EmailServiceStatus> {
  try {
    const res = await fetch('/api/email-status');
    if (!res.ok) {
      return { configured: false, provider: 'none' };
    }
    const data = (await res.json()) as EmailServiceStatus;
    return data;
  } catch {
    return { configured: false, provider: 'none' };
  }
}

/**
 * Test SMTP configuration and optionally send a test message
 */
export async function testSmtpConnection(targetEmail?: string): Promise<{
  success: boolean;
  configured: boolean;
  smtpHost?: string;
  smtpPort?: number;
  sender?: string;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail }),
    });
    return await res.json();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Koneksi ke endpoint test SMTP gagal';
    return {
      success: false,
      configured: false,
      error: errorMessage,
      message: 'Gagal menghubungi server pengujian SMTP.',
    };
  }
}

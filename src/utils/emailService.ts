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
  method?: 'smtp' | 'resend';
  messageId?: string;
  message?: string;
  error?: string;
}

export interface EmailServiceStatus {
  configured: boolean;
  provider: 'smtp' | 'resend' | 'none';
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

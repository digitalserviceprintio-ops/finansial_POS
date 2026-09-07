import { GoogleAuthProvider, signInWithPopup, User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { BackupData, AutoBackupSchedule, AutoBackupLog } from '../types';
import { doc, setDoc } from 'firebase/firestore';

export const GOOGLE_DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// In-memory token cache as mandated by workspace-integration skill
let cachedDriveAccessToken: string | null = null;
let currentGoogleDriveUser: {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
} | null = null;

// Track listeners
type AuthCallback = (user: typeof currentGoogleDriveUser, isConnected: boolean) => void;
const authListeners: Set<AuthCallback> = new Set();

function notifyListeners() {
  const isConnected = !!(cachedDriveAccessToken && currentGoogleDriveUser);
  authListeners.forEach((listener) => {
    try {
      listener(currentGoogleDriveUser, isConnected);
    } catch (e) {
      console.error('Google Drive auth listener error:', e);
    }
  });
}

// Subscribe to auth state changes to clear memory cache if user logs out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedDriveAccessToken = null;
    currentGoogleDriveUser = null;
    notifyListeners();
  } else if (!cachedDriveAccessToken) {
    // Firebase auth session exists, but access token must be acquired via interactive sign-in or cached session
    if (currentGoogleDriveUser && currentGoogleDriveUser.uid !== user.uid) {
      cachedDriveAccessToken = null;
      currentGoogleDriveUser = null;
      notifyListeners();
    }
  }
});

export function subscribeToGoogleDriveAuth(callback: AuthCallback): () => void {
  authListeners.add(callback);
  callback(currentGoogleDriveUser, !!(cachedDriveAccessToken && currentGoogleDriveUser));
  return () => {
    authListeners.delete(callback);
  };
}

export function getCachedDriveAccessToken(): string | null {
  return cachedDriveAccessToken;
}

export function getCurrentGoogleDriveUser() {
  return currentGoogleDriveUser;
}

/**
 * Connect to Google Drive using Firebase Auth GoogleAuthProvider with Drive scopes
 */
export async function connectGoogleDrive(): Promise<{
  success: boolean;
  user?: typeof currentGoogleDriveUser;
  error?: string;
  cancelled?: boolean;
}> {
  try {
    const provider = new GoogleAuthProvider();
    GOOGLE_DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
    // Prompt consent to ensure token with drive.file scope is provided
    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline',
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Tidak dapat memperoleh token akses Google Drive.');
    }

    cachedDriveAccessToken = credential.accessToken;
    currentGoogleDriveUser = {
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    };

    notifyListeners();
    return { success: true, user: currentGoogleDriveUser };
  } catch (err: any) {
    const errorCode = err?.code || '';
    const errorMessage = err?.message || '';

    // Handle user closing popup or cancelling without triggering severe console.error
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorMessage.includes('popup-closed-by-user') ||
      errorMessage.includes('cancelled-popup-request')
    ) {
      console.info('[DelPOS] Google Drive sign-in popup was closed or cancelled by the user.');
      return {
        success: false,
        cancelled: true,
        error: 'Jendela login Google ditutup sebelum otorisasi selesai. Silakan coba hubungkan kembali saat siap.',
      };
    }

    if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
      console.warn('[DelPOS] Google Drive sign-in popup was blocked by the browser.');
      return {
        success: false,
        error: 'Jendela pop-up login Google diblokir oleh browser. Harap izinkan pop-up untuk situs ini lalu coba lagi.',
      };
    }

    console.error('Failed to connect Google Drive:', err);
    return {
      success: false,
      error: errorMessage || 'Gagal menghubungkan Google Drive. Silakan coba lagi.',
    };
  }
}

/**
 * Disconnect Google Drive (clears in-memory token)
 */
export function disconnectGoogleDrive(): void {
  cachedDriveAccessToken = null;
  currentGoogleDriveUser = null;
  notifyListeners();
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Upload financial backup JSON to Google Drive
 */
export async function uploadBackupToGoogleDrive(
  backupData: BackupData,
  customFilename?: string
): Promise<{
  success: boolean;
  fileId?: string;
  filename?: string;
  sizeFormatted?: string;
  webViewLink?: string;
  error?: string;
}> {
  if (!cachedDriveAccessToken) {
    return {
      success: false,
      error: 'Google Drive belum terhubung. Silakan hubungkan akun Google Drive Anda terlebih dahulu.',
    };
  }

  try {
    const now = new Date();
    const timestampStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const cleanStoreName = (backupData.store?.name || 'Toko').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = customFilename || `DelPOS_Backup_${cleanStoreName}_${timestampStr}.json`;

    const jsonContent = JSON.stringify(backupData, null, 2);
    const sizeBytes = new Blob([jsonContent]).size;
    const sizeFormatted = formatBytes(sizeBytes);

    const boundary = '-------delpos_backup_boundary_' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: filename,
      mimeType: 'application/json',
      description: `Cadangan Keuangan Otomatis DelPOS - ${backupData.store?.name || 'UMKM'} (${backupData.summary?.totalTransactions || 0} Trx, ${backupData.summary?.totalExpenses || 0} Biaya)`,
      properties: {
        app: 'DelPOS',
        type: 'financial_backup',
        timestamp: String(Date.now()),
      },
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,createdTime,size',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedDriveAccessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      if (response.status === 401) {
        // Token expired
        cachedDriveAccessToken = null;
        notifyListeners();
        return {
          success: false,
          error: 'Sesi Google Drive telah berakhir. Silakan klik Hubungkan Google Drive kembali.',
        };
      }
      throw new Error(errJson?.error?.message || `Google Drive API error (${response.status})`);
    }

    const fileResult = await response.json();
    return {
      success: true,
      fileId: fileResult.id,
      filename: fileResult.name || filename,
      sizeFormatted,
      webViewLink: fileResult.webViewLink || `https://drive.google.com/file/d/${fileResult.id}/view`,
    };
  } catch (err: any) {
    console.error('Google Drive upload error:', err);
    return {
      success: false,
      error: err?.message || 'Gagal mengunggah file cadangan ke Google Drive.',
    };
  }
}

/**
 * Save snapshot of backup directly to Cloud Storage / Firestore for cloud persistence
 */
export async function uploadBackupToCloudStorage(
  tenantId: string,
  backupData: BackupData
): Promise<{
  success: boolean;
  filename: string;
  sizeFormatted: string;
  error?: string;
}> {
  const now = new Date();
  const timestampStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const cleanStoreName = (backupData.store?.name || 'Toko').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `DelPOS_CloudBackup_${cleanStoreName}_${timestampStr}.json`;

  const jsonStr = JSON.stringify(backupData);
  const sizeBytes = new Blob([jsonStr]).size;
  const sizeFormatted = formatBytes(sizeBytes);

  const docId = `${tenantId}_${Date.now()}`;
  const path = `scheduled_backups/${docId}`;

  try {
    await setDoc(doc(db, 'scheduled_backups', docId), {
      id: docId,
      tenantId,
      filename,
      timestamp: Date.now(),
      sizeFormatted,
      summary: backupData.summary,
      backupPayload: jsonStr,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      filename,
      sizeFormatted,
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return {
      success: false,
      filename,
      sizeFormatted,
      error: err?.message || 'Gagal menyimpan cadangan ke cloud Firestore.',
    };
  }
}

/**
 * Helper to check if a scheduled backup is due right now
 */
export function isScheduleDue(schedule: AutoBackupSchedule): boolean {
  if (!schedule.enabled) return false;

  const now = new Date();
  const [targetHour, targetMinute] = schedule.backupTime.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Has target time arrived today?
  const timeArrived =
    currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);

  const lastRun = schedule.lastRunTimestamp ? new Date(schedule.lastRunTimestamp) : null;

  if (schedule.frequency === 'daily') {
    if (!timeArrived) return false;
    if (!lastRun) return true;

    // Check if last run was today
    const isSameDay =
      lastRun.getFullYear() === now.getFullYear() &&
      lastRun.getMonth() === now.getMonth() &&
      lastRun.getDate() === now.getDate();

    return !isSameDay;
  }

  if (schedule.frequency === 'weekly') {
    // Check day of week (0 = Sunday, 1 = Monday, ...)
    const currentDayOfWeek = now.getDay();
    if (currentDayOfWeek !== schedule.backupDayOfWeek) return false;
    if (!timeArrived) return false;
    if (!lastRun) return true;

    // Check if last run was within the last 5 days
    const diffMs = now.getTime() - lastRun.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 5;
  }

  return false;
}

/**
 * Format next scheduled run string for UI
 */
export function getNextScheduledRunText(schedule: AutoBackupSchedule): string {
  if (!schedule.enabled) return 'Pencadangan otomatis nonaktif';

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const [hour, minute] = schedule.backupTime.split(':').map((s) => s.padStart(2, '0'));
  const timeStr = `${hour}:${minute}`;

  if (schedule.frequency === 'daily') {
    return `Setiap Hari pukul ${timeStr} WIB`;
  } else {
    const dayName = dayNames[schedule.backupDayOfWeek] || 'Minggu';
    return `Setiap ${dayName} pukul ${timeStr} WIB`;
  }
}

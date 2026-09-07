import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Play,
  Settings2,
  LogOut,
  Info,
  Check,
  FolderSync,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  subscribeToGoogleDriveAuth,
  getNextScheduledRunText,
  getCurrentGoogleDriveUser,
  getCachedDriveAccessToken,
} from '../utils/googleDriveBackup';

export const ScheduledBackupCard: React.FC = () => {
  const {
    autoBackupSchedule,
    updateAutoBackupSchedule,
    autoBackupLogs,
    runAutoBackupNow,
    deleteAutoBackupLog,
    clearAutoBackupLogs,
    isAutoBackupRunning,
    showToast,
  } = useApp();

  // Local Google Drive Auth State
  const [googleUser, setGoogleUser] = useState(getCurrentGoogleDriveUser());
  const [isDriveConnected, setIsDriveConnected] = useState(
    !!(getCachedDriveAccessToken() && getCurrentGoogleDriveUser())
  );
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);

  // Form states (synced with context)
  const [enabled, setEnabled] = useState(autoBackupSchedule.enabled);
  const [frequency, setFrequency] = useState(autoBackupSchedule.frequency);
  const [backupTime, setBackupTime] = useState(autoBackupSchedule.backupTime);
  const [backupDayOfWeek, setBackupDayOfWeek] = useState(autoBackupSchedule.backupDayOfWeek);
  const [target, setTarget] = useState(autoBackupSchedule.target);

  // Confirmation dialogs for destructive actions
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Subscribe to Google Drive auth changes
  useEffect(() => {
    const unsubscribe = subscribeToGoogleDriveAuth((user, connected) => {
      setGoogleUser(user);
      setIsDriveConnected(connected);
    });
    return () => unsubscribe();
  }, []);

  // Keep local form in sync if context changes
  useEffect(() => {
    setEnabled(autoBackupSchedule.enabled);
    setFrequency(autoBackupSchedule.frequency);
    setBackupTime(autoBackupSchedule.backupTime);
    setBackupDayOfWeek(autoBackupSchedule.backupDayOfWeek);
    setTarget(autoBackupSchedule.target);
  }, [autoBackupSchedule]);

  // Handle Google Drive Connection
  const handleConnectGoogleDrive = async () => {
    setIsConnectingDrive(true);
    try {
      const res = await connectGoogleDrive();
      if (res.success && res.user) {
        showToast(`✅ Google Drive terhubung sebagai ${res.user.email || 'Pengguna Google'}`, 'success');
      } else if (res.cancelled) {
        showToast(res.error || 'Login Google dibatalkan.', 'info');
      } else {
        showToast(res.error || 'Gagal menghubungkan Google Drive.', 'error');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
        showToast('Login Google dibatalkan.', 'info');
      } else {
        showToast(msg || 'Gagal menghubungkan Google Drive.', 'error');
      }
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleDisconnectGoogleDrive = () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin memutuskan sambungan akun Google Drive dari DelPOS?'
    );
    if (!confirmed) return;

    disconnectGoogleDrive();
    showToast('Koneksi Google Drive telah diputuskan.', 'info');
  };

  // Save Schedule settings
  const handleSaveSchedule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateAutoBackupSchedule({
      enabled,
      frequency,
      backupTime,
      backupDayOfWeek,
      target,
    });
  };

  const handleToggleEnabled = (newVal: boolean) => {
    setEnabled(newVal);
    updateAutoBackupSchedule({ enabled: newVal });
  };

  // Trigger manual backup
  const handleManualTrigger = async () => {
    if (target !== 'cloud_storage' && !isDriveConnected) {
      const wantConnect = window.confirm(
        'Google Drive belum terhubung. Apakah Anda ingin menghubungkan akun Google Drive sekarang sebelum mencadangkan?'
      );
      if (wantConnect) {
        setIsConnectingDrive(true);
        try {
          const res = await connectGoogleDrive();
          if (res.success && res.user) {
            showToast(`✅ Google Drive terhubung sebagai ${res.user.email || 'Pengguna Google'}`, 'success');
          } else if (res.cancelled) {
            showToast('Koneksi Google Drive dibatalkan.', 'info');
            if (target === 'google_drive') return;
          } else if (res.error) {
            showToast(res.error, 'error');
            if (target === 'google_drive') return;
          }
        } finally {
          setIsConnectingDrive(false);
        }
      } else if (target === 'google_drive') {
        return;
      }
    }
    await runAutoBackupNow();
  };

  // Confirm delete single log
  const handleConfirmDeleteLog = (id: string) => {
    deleteAutoBackupLog(id);
    setDeleteConfirmId(null);
  };

  // Confirm clear all logs
  const handleConfirmClearAll = () => {
    clearAutoBackupLogs();
    setIsClearAllConfirmOpen(false);
  };

  const dayNames = [
    { value: 0, label: 'Minggu' },
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* CARD 1: KONEKSI GOOGLE DRIVE & JADWAL OTOMATIS */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-[#e2e1ec] p-6 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4] shadow-2xs">
              <FolderSync className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#1b1b23]">
                  Jadwal Pencadangan Otomatis Cloud & Google Drive
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ebeaff] text-[#4648d4]">
                  Otomatis
                </span>
              </div>
              <p className="text-xs text-[#767680] mt-0.5">
                Amankan data keuangan, transaksi, dan katalog produk secara otomatis ke Google Drive & Cloud
              </p>
            </div>
          </div>

          {/* Direct Manual Backup Trigger */}
          <button
            id="btn-run-auto-backup-now"
            type="button"
            onClick={handleManualTrigger}
            disabled={isAutoBackupRunning}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4648d4] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3435ad] disabled:opacity-50 shadow-xs transition-all active:scale-98 shrink-0"
          >
            {isAutoBackupRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Mencadangkan...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Cadangkan Sekarang</span>
              </>
            )}
          </button>
        </div>

        {/* Section: Google Drive Account Integration */}
        <div className="rounded-2xl border border-[#e2e1ec] bg-[#fcf8ff] p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-[#e2e1ec] shadow-2xs shrink-0">
              {/* Google Drive Official Icon Colors */}
              <svg className="h-6 w-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h55.5c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1b1b23]">Integrasi Akun Google Drive</h3>
                {isDriveConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                    Belum Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs text-[#767680] mt-0.5">
                {isDriveConnected && googleUser?.email
                  ? `File cadangan akan disimpan ke akun: ${googleUser.email}`
                  : 'Hubungkan akun Google Drive untuk menyimpan salinan cadangan otomatis secara langsung'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isDriveConnected ? (
              <div className="flex items-center gap-2">
                {googleUser?.photoURL && (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google User'}
                    className="h-8 w-8 rounded-full border border-white shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                )}
                <button
                  type="button"
                  onClick={handleDisconnectGoogleDrive}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-all"
                  title="Putuskan sambungan Google Drive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>
            ) : (
              /* Compliant Google Sign In Button */
              <button
                id="btn-connect-google-drive"
                type="button"
                onClick={handleConnectGoogleDrive}
                disabled={isConnectingDrive}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#747775] bg-white hover:bg-[#f8fafd] text-[#1f1f1f] text-xs font-semibold shadow-2xs transition-all active:scale-98 disabled:opacity-50"
              >
                {isConnectingDrive ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-[#4648d4]" />
                    <span>Menghubungkan...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Hubungkan Akun Google Drive</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Schedule Configuration Form */}
        <form onSubmit={handleSaveSchedule} className="space-y-5">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[#e2e1ec] bg-white">
            <div className="space-y-0.5">
              <label htmlFor="auto-backup-toggle" className="text-sm font-bold text-[#1b1b23] cursor-pointer">
                Status Pencadangan Otomatis
              </label>
              <p className="text-xs text-[#767680]">
                {enabled
                  ? 'Sistem akan otomatis mengekspor dan mengamankan data sesuai jadwal di bawah ini'
                  : 'Pencadangan otomatis saat ini dinonaktifkan'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="auto-backup-toggle"
                type="checkbox"
                checked={enabled}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#e2e1ec] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#c4c7c5] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4648d4]"></div>
            </label>
          </div>

          {/* Form Fields: Frequency, Day, Time, Target */}
          <div className={`space-y-4 transition-opacity ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Frequency */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1b1b23]">
                  Frekuensi Pencadangan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFrequency('daily');
                      updateAutoBackupSchedule({ frequency: 'daily' });
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      frequency === 'daily'
                        ? 'border-[#4648d4] bg-[#ebeaff] text-[#4648d4]'
                        : 'border-[#e2e1ec] bg-white text-[#767680] hover:bg-[#f8fafd]'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Setiap Hari</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFrequency('weekly');
                      updateAutoBackupSchedule({ frequency: 'weekly' });
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      frequency === 'weekly'
                        ? 'border-[#4648d4] bg-[#ebeaff] text-[#4648d4]'
                        : 'border-[#e2e1ec] bg-white text-[#767680] hover:bg-[#f8fafd]'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Setiap Minggu</span>
                  </button>
                </div>
              </div>

              {/* Day of Week (if weekly) */}
              {frequency === 'weekly' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1b1b23]">
                    Hari Pencadangan
                  </label>
                  <select
                    value={backupDayOfWeek}
                    onChange={(e) => {
                      const dayVal = Number(e.target.value);
                      setBackupDayOfWeek(dayVal);
                      updateAutoBackupSchedule({ backupDayOfWeek: dayVal });
                    }}
                    className="w-full rounded-xl border border-[#e2e1ec] bg-white px-3 py-2 text-xs font-medium text-[#1b1b23] focus:border-[#4648d4] focus:outline-hidden"
                  >
                    {dayNames.map((d) => (
                      <option key={d.value} value={d.value}>
                        Setiap Hari {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1b1b23]">
                    Rentang Waktu
                  </label>
                  <div className="py-2 px-3 rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] text-xs text-[#767680] font-medium flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Otomatis setiap 24 jam</span>
                  </div>
                </div>
              )}

              {/* Backup Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1b1b23]">
                  Waktu Eksekusi (WIB)
                </label>
                <input
                  type="time"
                  value={backupTime}
                  onChange={(e) => {
                    setBackupTime(e.target.value);
                    updateAutoBackupSchedule({ backupTime: e.target.value });
                  }}
                  className="w-full rounded-xl border border-[#e2e1ec] bg-white px-3 py-2 text-xs font-medium text-[#1b1b23] focus:border-[#4648d4] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Target Destination Storage */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-[#1b1b23]">
                Target Penyimpanan Cadangan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option 1: Google Drive */}
                <label
                  onClick={() => {
                    setTarget('google_drive');
                    updateAutoBackupSchedule({ target: 'google_drive' });
                  }}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    target === 'google_drive'
                      ? 'border-[#4648d4] bg-[#ebeaff]/40 shadow-xs'
                      : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
                  }`}
                >
                  <input
                    type="radio"
                    name="backupTarget"
                    value="google_drive"
                    checked={target === 'google_drive'}
                    onChange={() => {}}
                    className="mt-0.5 text-[#4648d4] focus:ring-[#4648d4]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1b1b23]">Google Drive</p>
                    <p className="text-[11px] text-[#767680] mt-0.5">
                      Disimpan langsung ke Google Drive pribadi Anda sebagai file .json
                    </p>
                  </div>
                </label>

                {/* Option 2: Cloud Storage */}
                <label
                  onClick={() => {
                    setTarget('cloud_storage');
                    updateAutoBackupSchedule({ target: 'cloud_storage' });
                  }}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    target === 'cloud_storage'
                      ? 'border-[#4648d4] bg-[#ebeaff]/40 shadow-xs'
                      : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
                  }`}
                >
                  <input
                    type="radio"
                    name="backupTarget"
                    value="cloud_storage"
                    checked={target === 'cloud_storage'}
                    onChange={() => {}}
                    className="mt-0.5 text-[#4648d4] focus:ring-[#4648d4]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1b1b23]">Cloud Storage</p>
                    <p className="text-[11px] text-[#767680] mt-0.5">
                      Disimpan ke database cloud terenkripsi DelPOS yang siap dipulihkan kapan saja
                    </p>
                  </div>
                </label>

                {/* Option 3: Both (Recommended) */}
                <label
                  onClick={() => {
                    setTarget('both');
                    updateAutoBackupSchedule({ target: 'both' });
                  }}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    target === 'both'
                      ? 'border-[#4648d4] bg-[#ebeaff]/40 shadow-xs'
                      : 'border-[#e2e1ec] bg-white hover:bg-[#fcf8ff]'
                  }`}
                >
                  <input
                    type="radio"
                    name="backupTarget"
                    value="both"
                    checked={target === 'both'}
                    onChange={() => {}}
                    className="mt-0.5 text-[#4648d4] focus:ring-[#4648d4]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-[#1b1b23]">Keduanya (Rekomendasi)</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                        Paling Aman
                      </span>
                    </div>
                    <p className="text-[11px] text-[#767680] mt-0.5">
                      Ganda: Google Drive Anda + Cloud Storage DelPOS
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Next Scheduled Run Badge */}
            <div className="rounded-2xl bg-[#ebeaff]/50 border border-[#d8d6fc] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[#4648d4]" />
                <div>
                  <span className="text-xs font-bold text-[#1b1b23]">Jadwal Eksekusi: </span>
                  <span className="text-xs font-semibold text-[#4648d4]">
                    {getNextScheduledRunText({
                      enabled,
                      frequency,
                      backupTime,
                      backupDayOfWeek,
                      target,
                      lastRunTimestamp: autoBackupSchedule.lastRunTimestamp,
                      lastStatus: autoBackupSchedule.lastStatus,
                      lastMessage: autoBackupSchedule.lastMessage,
                    })}
                  </span>
                </div>
              </div>

              {autoBackupSchedule.lastRunTimestamp && (
                <span className="text-[11px] text-[#767680]">
                  Terakhir dijalankan:{' '}
                  <span className="font-semibold text-[#1b1b23]">
                    {new Date(autoBackupSchedule.lastRunTimestamp).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================= */}
      {/* CARD 2: RIWAYAT PENCADANGAN OTOMATIS (LOGS) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-[#e2e1ec] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1b1b23]">
                Riwayat Pencadangan Otomatis ({autoBackupLogs.length})
              </h3>
              <p className="text-[11px] text-[#767680]">
                Catatan salinan cadangan yang telah tersimpan di cloud atau Google Drive
              </p>
            </div>
          </div>

          {autoBackupLogs.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllConfirmOpen(true)}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bersihkan Riwayat</span>
            </button>
          )}
        </div>

        {autoBackupLogs.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-[#e2e1ec] bg-[#fcf8ff] space-y-2">
            <CloudUpload className="mx-auto h-8 w-8 text-[#767680]" />
            <p className="text-xs font-bold text-[#1b1b23]">Belum Ada Riwayat Pencadangan Otomatis</p>
            <p className="text-[11px] text-[#767680] max-w-sm mx-auto">
              Jadwal otomatis akan mencadangkan data kasir dan pembukuan Anda secara berkala, atau klik tombol{' '}
              <strong className="text-[#4648d4]">Cadangkan Sekarang</strong> untuk memulai pencadangan perdana.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f3f2fa] overflow-hidden rounded-2xl border border-[#e2e1ec]">
            {autoBackupLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-[#fcf8ff] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {log.status === 'success' ? 'Berhasil' : 'Gagal'}
                    </span>

                    <span className="text-xs font-bold text-[#1b1b23] truncate max-w-xs sm:max-w-md">
                      {log.filename}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#767680]">
                    <span>
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-[#1b1b23]">{log.sizeFormatted}</span>
                    <span>•</span>
                    <span>
                      {log.itemCount.transactions} Trx, {log.itemCount.expenses} Biaya, {log.itemCount.products} Produk
                    </span>
                    <span>•</span>
                    <span className="capitalize">
                      Tujuan:{' '}
                      {log.target === 'both'
                        ? 'Google Drive & Cloud'
                        : log.target === 'google_drive'
                        ? 'Google Drive'
                        : 'Cloud Storage'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {log.driveViewLink && (
                    <a
                      href={log.driveViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e2e1ec] bg-[#ebeaff] text-[#4648d4] hover:bg-[#d8d6fc] text-xs font-bold transition-colors"
                    >
                      <span>Buka di Drive</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(log.id)}
                    className="p-1.5 rounded-lg text-[#767680] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus riwayat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CONFIRMATION DIALOG: DELETE SINGLE LOG (Mandatory) */}
      {/* ========================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl space-y-4 border border-[#e2e1ec] animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50">
                <Trash2 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-[#1b1b23]">Hapus Catatan Riwayat?</h4>
            </div>

            <p className="text-xs text-[#46464f] leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan riwayat pencadangan ini dari daftar lokal? File yang telah
              terunggah ke Google Drive Anda tidak akan terhapus.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-[#e2e1ec] text-xs font-bold text-[#767680] hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteLog(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition-colors"
              >
                Ya, Hapus Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION DIALOG: CLEAR ALL LOGS (Mandatory) */}
      {/* ========================================================= */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl space-y-4 border border-[#e2e1ec] animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50">
                <Trash2 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-[#1b1b23]">Bersihkan Semua Riwayat Cadangan?</h4>
            </div>

            <p className="text-xs text-[#46464f] leading-relaxed">
              Tindakan ini akan menghapus seluruh catatan riwayat pencadangan otomatis dari aplikasi ini. File cadangan
              yang tersimpan di Google Drive atau Cloud Storage Anda tetap aman.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#e2e1ec] text-xs font-bold text-[#767680] hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition-colors"
              >
                Bersihkan Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

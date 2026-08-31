import { AuditLogEntry, AuditLogCategory, AuditLogAction } from '../types';

const AUDIT_LOG_STORAGE_KEY = 'fpro_admin_audit_logs';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-20260831-001',
    timestamp: Date.now() - 25 * 60 * 1000,
    formattedDate: new Date(Date.now() - 25 * 60 * 1000).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    category: 'AUTH',
    action: 'SUPERADMIN_LOGIN',
    actionLabel: 'Super Admin Berhasil Masuk',
    actor: 'Super Admin (PIN Session)',
    details: 'Autentikasi Master PIN berhasil diverifikasi dengan hak akses penuh.',
    ipAddress: '192.168.1.102 (Local Network)',
  },
  {
    id: 'AUD-20260831-002',
    timestamp: Date.now() - 20 * 60 * 1000,
    formattedDate: new Date(Date.now() - 20 * 60 * 1000).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    category: 'LICENSE',
    action: 'LICENSE_GENERATED',
    actionLabel: 'Penerbitan Lisensi Baru',
    actor: 'Super Admin',
    targetId: 'LIC-ENT-001',
    targetName: 'Kopi & Resto Nusantara',
    details: 'Menerbitkan lisensi baru: Paket ENTERPRISE Lifetime seharga Rp 1.500.000 untuk Budi Santoso.',
    metadata: {
      tier: 'ENTERPRISE',
      duration: 'Lifetime',
      price: 1500000,
      serial: 'FPRO-ENT-9824-7125-E8A1',
    },
  },
  {
    id: 'AUD-20260831-003',
    timestamp: Date.now() - 15 * 60 * 1000,
    formattedDate: new Date(Date.now() - 15 * 60 * 1000).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    category: 'PRICING',
    action: 'TIER_PRICE_UPDATED',
    actionLabel: 'Perubahan Harga Katalog',
    actor: 'Super Admin',
    targetId: 'TIER_PRO',
    targetName: 'Professional Edition',
    details: 'Memperbarui harga standar katalog paket PRO menjadi Rp 650.000 (1 Tahun).',
    metadata: {
      tier: 'PRO',
      newPrice: 650000,
    },
  },
  {
    id: 'AUD-20260831-004',
    timestamp: Date.now() - 10 * 60 * 1000,
    formattedDate: new Date(Date.now() - 10 * 60 * 1000).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    category: 'BACKUP',
    action: 'MASS_BACKUP_DOWNLOADED',
    actionLabel: 'Ekspor Master Backup Massal',
    actor: 'Super Admin',
    details: 'Mengunduh arsip data massal seluruh partisi tenant multi-toko (Master JSON).',
  },
  {
    id: 'AUD-20260831-005',
    timestamp: Date.now() - 5 * 60 * 1000,
    formattedDate: new Date(Date.now() - 5 * 60 * 1000).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    category: 'SECURITY',
    action: 'SECURITY_AUDIT_VERIFIED',
    actionLabel: 'Pemeriksaan Integritas Keamanan',
    actor: 'System Auto-Audit',
    details: 'Enkripsi SHA-256 dan isolasi partisi data tenant diverifikasi aman dan terenkripsi.',
  },
];

export const AuditLogger = {
  getLogs(): AuditLogEntry[] {
    try {
      const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback to initial
    }
    // Seed initial logs
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  },

  log(entry: {
    category: AuditLogCategory;
    action: AuditLogAction;
    actionLabel: string;
    actor?: string;
    targetId?: string;
    targetName?: string;
    details: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): AuditLogEntry {
    const logs = this.getLogs();
    const now = new Date();
    const timestamp = now.getTime();
    const formattedDate = now.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const id = `AUD-${dateStr}-${randomSuffix}`;

    const newEntry: AuditLogEntry = {
      id,
      timestamp,
      formattedDate,
      category: entry.category,
      action: entry.action,
      actionLabel: entry.actionLabel,
      actor: entry.actor || 'Super Admin',
      targetId: entry.targetId,
      targetName: entry.targetName,
      details: entry.details,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress || '127.0.0.1 (Authorized Console)',
    };

    const updated = [newEntry, ...logs].slice(0, 500); // retain up to 500 recent logs
    try {
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[AuditLogger] Failed to write audit log:', e);
    }
    return newEntry;
  },

  clearLogs(): void {
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify([]));
  },

  exportLogsJson(): void {
    const logs = this.getLogs();
    const exportData = {
      exportedAt: new Date().toISOString(),
      system: 'FinansialPro POS Super Admin Audit Vault',
      totalRecords: logs.length,
      logs,
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FINANSIALPRO_SUPERADMIN_AUDIT_LOG_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportLogsCsv(): void {
    const logs = this.getLogs();
    const headers = ['ID', 'Waktu', 'Kategori', 'Aksi', 'Aktor', 'Target ID', 'Target Nama', 'Keterangan'];
    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${l.formattedDate}"`,
      `"${l.category}"`,
      `"${l.actionLabel.replace(/"/g, '""')}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${(l.targetId || '').replace(/"/g, '""')}"`,
      `"${(l.targetName || '').replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FINANSIALPRO_SUPERADMIN_AUDIT_LOG_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

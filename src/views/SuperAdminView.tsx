import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlusCircle,
  Search,
  Filter,
  Copy,
  Send,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Building,
  HardDrive,
  RefreshCw,
  Clock,
  Sparkles,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Database,
  Trash2,
  Eye,
  LogOut,
  Sliders,
  Settings,
  ArrowUpDown,
  Check,
  Phone,
  Mail,
  Zap,
  Download,
  Upload,
  Pencil,
  FileText,
  AlertOctagon,
  KeyRound,
  Archive,
  Layers,
  Server,
  Activity,
  Shield,
  FileSpreadsheet,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppLicense, LicenseTier, LicenseStatus, AuditLogEntry, AuditLogCategory } from '../types';
import { LicenseManager, TIER_FEATURES, DEFAULT_TIER_PRICES } from '../utils/licenseManager';
import { SecureVault, MasterTenantBackupItem, MasterBackupPackage } from '../utils/security';
import { AuditLogger } from '../utils/auditLogger';

interface SuperAdminViewProps {
  onExitSuperAdmin: () => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onExitSuperAdmin }) => {
  const { formatCurrency, showToast } = useApp();

  // Super Admin Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('fpro_superadmin_session') === 'true';
  });
  const [masterPassword, setMasterPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [sessionTimeLeft, setSessionTimeLeft] = useState(1800); // 30 minutes timeout

  // Active Sub-Tab
  const [adminTab, setAdminTab] = useState<
    'overview' | 'licenses' | 'generator' | 'tenants' | 'mass_backup' | 'audit_logs' | 'security'
  >('overview');

  // Master Licenses State
  const [licenses, setLicenses] = useState<AppLicense[]>(() => {
    return LicenseManager.getAllMasterLicenses();
  });

  // Tier Pricing Catalog State
  const [tierPricing, setTierPricing] = useState<Record<LicenseTier, number>>(() => {
    return LicenseManager.getTierPricing();
  });
  const [editingTierModal, setEditingTierModal] = useState<{ tier: LicenseTier; price: number } | null>(null);

  // Edit Single License Price Modal State
  const [priceEditLicense, setPriceEditLicense] = useState<AppLicense | null>(null);
  const [newLicensePrice, setNewLicensePrice] = useState<number>(0);
  const [priceUpdateNote, setPriceUpdateNote] = useState<string>('');

  // Generator Form State
  const [genTier, setGenTier] = useState<LicenseTier>('PRO');
  const [genDuration, setGenDuration] = useState<number | null>(365); // days, null = lifetime
  const [genClientName, setGenClientName] = useState('');
  const [genBusinessName, setGenBusinessName] = useState('');
  const [genClientEmail, setGenClientEmail] = useState('');
  const [genClientPhone, setGenClientPhone] = useState('');
  const [genPrice, setGenPrice] = useState<number>(() => {
    return LicenseManager.getTierPricing().PRO || 650000;
  });
  const [genNotes, setGenNotes] = useState('');
  const [recentlyGenerated, setRecentlyGenerated] = useState<AppLicense | null>(null);

  // License Fleet Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Detail Modal & Copy State
  const [selectedLicense, setSelectedLicense] = useState<AppLicense | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Registered Client Users (with password sanitized)
  const [registeredClients, setRegisteredClients] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('finansialpro_registered_users');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'USR-001',
        fullName: 'Budi Santoso',
        email: 'budi.santoso@nusantara.id',
        phone: '081234567890',
        businessName: 'Kopi & Resto Nusantara',
        role: 'owner',
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      {
        id: 'USR-002',
        fullName: 'Siti Aisyah',
        email: 'siti.aisyah@nusantara.id',
        phone: '081298765432',
        businessName: 'Kopi & Resto Nusantara',
        role: 'cashier',
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      {
        id: 'USR-003',
        fullName: 'Haji Ahmad',
        email: 'berkahjaya@gmail.com',
        phone: '085712345678',
        businessName: 'Toko Berkah Jaya',
        role: 'owner',
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    ];
  });

  // Client Search Filter in Tenants View
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Mass Backup & Tenants Summary State
  const [tenantsSummary, setTenantsSummary] = useState<MasterTenantBackupItem[]>(() => {
    return SecureVault.getAllTenantsSummary();
  });
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreResultMsg, setRestoreResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client Temporary PIN Reset state
  const [resetPinModalUser, setResetPinModalUser] = useState<any | null>(null);
  const [generatedTempPin, setGeneratedTempPin] = useState<string>('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    return AuditLogger.getLogs();
  });
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);
  const [isConfirmClearAuditOpen, setIsConfirmClearAuditOpen] = useState<boolean>(false);

  // Auto-sync session timer
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          handleAdminLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Refresh tenants & audit logs on tab switch
  useEffect(() => {
    if (adminTab === 'tenants' || adminTab === 'mass_backup') {
      setTenantsSummary(SecureVault.getAllTenantsSummary());
    }
    if (adminTab === 'audit_logs') {
      setAuditLogs(AuditLogger.getLogs());
    }
  }, [adminTab]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: admin888 or finansialpro2026 or superadmin
    if (masterPassword === 'admin888' || masterPassword === 'finansialpro2026' || masterPassword === 'superadmin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('fpro_superadmin_session', 'true');
      setLoginError('');
      
      // Audit log
      AuditLogger.log({
        category: 'AUTH',
        action: 'SUPERADMIN_LOGIN',
        actionLabel: 'Super Admin Berhasil Masuk',
        actor: 'Super Admin Console',
        details: 'Autentikasi PIN Master diverifikasi. Sesi aktif selama 30 menit.',
      });
      setAuditLogs(AuditLogger.getLogs());

      showToast('Autentikasi Super Admin Berhasil! Sesi aktif 30 menit.', 'success');
    } else {
      setLoginError('PIN Kunci Master Super Admin tidak valid!');
      showToast('Gagal masuk: PIN Kunci Master salah.', 'error');
    }
  };

  const handleAdminLogout = () => {
    AuditLogger.log({
      category: 'AUTH',
      action: 'SUPERADMIN_LOGOUT',
      actionLabel: 'Super Admin Logout',
      actor: 'Super Admin Console',
      details: 'Sesi Super Admin diakhiri dengan aman.',
    });
    setAuditLogs(AuditLogger.getLogs());

    setIsAuthenticated(false);
    sessionStorage.removeItem('fpro_superadmin_session');
    setMasterPassword('');
    showToast('Sesi Super Admin telah ditutup dengan aman.', 'info');
  };

  const refreshAllLicenses = () => {
    const list = LicenseManager.getAllMasterLicenses();
    setLicenses(list);
    setTierPricing(LicenseManager.getTierPricing());
    setTenantsSummary(SecureVault.getAllTenantsSummary());
    setAuditLogs(AuditLogger.getLogs());
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showToast(`${label} berhasil disalin ke clipboard!`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // WhatsApp helper
  const handleSendWA = (lic: AppLicense) => {
    const isLifetime = lic.expiresAt === null;
    const expiryText = isLifetime
      ? 'SEUMUR HIDUP (Lifetime / Permanen)'
      : new Date(lic.expiresAt!).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    const msg = `*KONFIRMASI AKTIVASI SOFTWARE POS FINANSIALPRO* 🚀\n\n` +
      `Halo *${lic.clientName}* (${lic.businessName}),\n` +
      `Terima kasih telah mempercayakan operasional kasir bisnis Anda kepada FinansialPro POS.\n\n` +
      `Berikut adalah Kunci Serial Lisensi Resmi Anda:\n` +
      `🔑 *KUNCI SERIAL:* \`${lic.licenseKey}\`\n` +
      `📦 *Paket:* ${lic.tier} Edition\n` +
      `⏳ *Masa Berlaku:* ${expiryText}\n` +
      `💰 *Total Investasi:* ${formatCurrency(lic.price)}\n\n` +
      `*Cara Aktivasi di Aplikasi:* Buka Menu Pengaturan ➔ Lisensi Software ➔ Masukkan Kunci Serial di atas ➔ Klik Aktivasi.\n\n` +
      `_Salam Sukses,_\n` +
      `*FinansialPro Developer Team*`;

    const phoneClean = (lic.clientPhone || '').replace(/[^0-9]/g, '');
    const waUrl = phoneClean
      ? `https://wa.me/${phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  // WhatsApp Expiration Reminder
  const handleSendExpiryReminder = (lic: AppLicense, daysLeft: number) => {
    const isExpired = daysLeft <= 0;
    const expiryDateStr = lic.expiresAt
      ? new Date(lic.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Hari Ini';

    const msg = isExpired
      ? `*PEMBERITAHUAN MASA LISENSI FINANSIALPRO BERAKHIR* ⚠️\n\n` +
        `Yth. *${lic.clientName}* (${lic.businessName}),\n` +
        `Kami menginformasikan bahwa lisensi software kasir FinansialPro (${lic.tier} Edition) untuk toko Anda telah *kadaluarsa pada ${expiryDateStr}*.\n\n` +
        `Untuk memastikan transaksi kasir tetap berjalan tanpa kendala, silakan hubungi kami untuk perpanjangan lisensi.\n` +
        `🔑 Serial Terdaftar: \`${lic.licenseKey}\`\n\n` +
        `Terima kasih atas kerja samanya.`
      : `*PENGINGAT JATUH TEMPO LISENSI FINANSIALPRO* ⏳\n\n` +
        `Yth. *${lic.clientName}* (${lic.businessName}),\n` +
        `Lisensi software kasir FinansialPro (${lic.tier} Edition) untuk toko Anda akan *jatuh tempo dalam ${daysLeft} hari* (pada ${expiryDateStr}).\n\n` +
        `Dapatkan promo perpanjangan hemat sekarang agar operasional toko tetap lancar.\n` +
        `🔑 Serial: \`${lic.licenseKey}\`\n\n` +
        `Terima kasih.`;

    const phoneCleanVal = (lic.clientPhone || '').replace(/[^0-9]/g, '');
    const waUrl = phoneCleanVal
      ? `https://wa.me/${phoneCleanVal.startsWith('0') ? '62' + phoneCleanVal.slice(1) : phoneCleanVal}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  // Generate License Submit
  const handleGenerateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genClientName.trim() || !genBusinessName.trim()) {
      showToast('Harap isi Nama Klien dan Nama Toko/Usaha!', 'warning');
      return;
    }

    const newLic = LicenseManager.issueNewLicense({
      tier: genTier,
      durationDays: genDuration,
      clientName: genClientName.trim(),
      businessName: genBusinessName.trim(),
      clientEmail: genClientEmail.trim() || `${genClientName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      clientPhone: genClientPhone.trim() || '081234567890',
      price: genPrice,
      notes: genNotes.trim() || `Lisensi ${genTier} Resmi`,
    });

    // Log Audit Event
    AuditLogger.log({
      category: 'LICENSE',
      action: 'LICENSE_GENERATED',
      actionLabel: 'Penerbitan Lisensi Baru',
      actor: 'Super Admin',
      targetId: newLic.id,
      targetName: newLic.businessName,
      details: `Menerbitkan lisensi ${newLic.tier} (${newLic.licenseKey}) seharga ${formatCurrency(newLic.price)} untuk ${newLic.clientName}.`,
      metadata: {
        serial: newLic.licenseKey,
        tier: newLic.tier,
        price: newLic.price,
        duration: genDuration === null ? 'Lifetime' : `${genDuration} Hari`,
      },
    });

    setRecentlyGenerated(newLic);
    refreshAllLicenses();
    showToast(`🎉 Lisensi ${genTier} berhasil diterbitkan untuk ${genBusinessName}!`, 'success');

    // Reset fields except defaults
    setGenClientName('');
    setGenBusinessName('');
    setGenClientEmail('');
    setGenClientPhone('');
    setGenNotes('');
  };

  // Save Single License Price
  const handleSaveSingleLicensePrice = () => {
    if (!priceEditLicense) return;
    if (newLicensePrice < 0) {
      showToast('Harga lisensi tidak boleh negatif!', 'warning');
      return;
    }

    const oldPrice = priceEditLicense.price;
    const ok = LicenseManager.updateLicensePrice(
      priceEditLicense.id,
      newLicensePrice
    );

    if (ok) {
      AuditLogger.log({
        category: 'PRICING',
        action: 'LICENSE_PRICE_UPDATED',
        actionLabel: 'Pembaruan Harga Lisensi Klien',
        actor: 'Super Admin',
        targetId: priceEditLicense.id,
        targetName: priceEditLicense.businessName,
        details: `Mengubah harga lisensi ${priceEditLicense.licenseKey} (${priceEditLicense.businessName}) dari ${formatCurrency(oldPrice)} menjadi ${formatCurrency(newLicensePrice)}.`,
        metadata: {
          licenseId: priceEditLicense.id,
          oldPrice,
          newPrice: newLicensePrice,
          note: priceUpdateNote,
        },
      });

      refreshAllLicenses();
      showToast('Harga lisensi klien berhasil diperbarui!', 'success');
      setPriceEditLicense(null);
      setPriceUpdateNote('');
    } else {
      showToast('Gagal memperbarui harga lisensi!', 'error');
    }
  };

  // Save Tier Catalog Price
  const handleSaveTierPrice = () => {
    if (!editingTierModal) return;
    if (editingTierModal.price < 0) {
      showToast('Harga paket tidak boleh bernilai negatif!', 'warning');
      return;
    }

    const oldTierPrice = tierPricing[editingTierModal.tier] || 0;
    LicenseManager.updateTierPrice(editingTierModal.tier, editingTierModal.price);
    
    AuditLogger.log({
      category: 'PRICING',
      action: 'TIER_PRICE_UPDATED',
      actionLabel: 'Pembaruan Harga Standar Katalog Paket',
      actor: 'Super Admin',
      targetId: `TIER_${editingTierModal.tier}`,
      targetName: `Paket ${editingTierModal.tier}`,
      details: `Mengubah harga standar paket ${editingTierModal.tier} dari ${formatCurrency(oldTierPrice)} menjadi ${formatCurrency(editingTierModal.price)}.`,
      metadata: {
        tier: editingTierModal.tier,
        oldPrice: oldTierPrice,
        newPrice: editingTierModal.price,
      },
    });

    refreshAllLicenses();
    showToast(`Harga standar paket ${editingTierModal.tier} berhasil diperbarui!`, 'success');
    setEditingTierModal(null);
  };

  // Toggle License Status (Active / Suspended)
  const handleToggleLicenseStatus = (id: string, currentStatus: LicenseStatus) => {
    const targetLic = licenses.find((l) => l.id === id);
    const newStatus: LicenseStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    LicenseManager.updateMasterLicense(id, { status: newStatus });

    AuditLogger.log({
      category: 'LICENSE',
      action: 'LICENSE_STATUS_UPDATED',
      actionLabel: `Status Lisensi Diubah: ${newStatus}`,
      actor: 'Super Admin',
      targetId: id,
      targetName: targetLic?.businessName || id,
      details: `Mengubah status lisensi ${targetLic?.licenseKey || id} (${targetLic?.businessName}) menjadi ${newStatus}.`,
      metadata: {
        licenseId: id,
        previousStatus: currentStatus,
        newStatus,
      },
    });

    refreshAllLicenses();
    showToast(`Status lisensi diubah menjadi ${newStatus}`, 'info');
  };

  // Extend license duration
  const handleExtendLicense = (id: string, daysToAdd: number | null) => {
    const targetLic = licenses.find((l) => l.id === id);
    let newExpiresAt: number | null = null;
    if (daysToAdd !== null) {
      const baseTime = (targetLic && targetLic.expiresAt && targetLic.expiresAt > Date.now())
        ? targetLic.expiresAt
        : Date.now();
      newExpiresAt = baseTime + daysToAdd * 24 * 60 * 60 * 1000;
    }
    LicenseManager.updateMasterLicense(id, { expiresAt: newExpiresAt, status: 'ACTIVE' });

    AuditLogger.log({
      category: 'LICENSE',
      action: 'LICENSE_EXTENDED',
      actionLabel: daysToAdd === null ? 'Lisensi Diubah ke Lifetime' : `Perpanjangan Masa Aktif +${daysToAdd} Hari`,
      actor: 'Super Admin',
      targetId: id,
      targetName: targetLic?.businessName || id,
      details: `Memperpanjang masa aktif lisensi ${targetLic?.licenseKey || id} (${targetLic?.businessName}): ${daysToAdd === null ? 'Menjadi Seumur Hidup (Lifetime)' : `+${daysToAdd} Hari`}.`,
      metadata: {
        licenseId: id,
        daysAdded: daysToAdd,
      },
    });

    refreshAllLicenses();
    showToast(`Masa aktif lisensi berhasil diperpanjang!`, 'success');
  };

  // Download Mass Multi-Tenant Backup
  const handleDownloadMassBackup = () => {
    SecureVault.downloadMasterBackupFile();

    AuditLogger.log({
      category: 'BACKUP',
      action: 'MASS_BACKUP_DOWNLOADED',
      actionLabel: 'Ekspor Master Backup Massal Seluruh Tenant',
      actor: 'Super Admin',
      details: `Mengunduh berkas master JSON massal yang mencakup ${tenantsSummary.length} partisi data tenant dan registry lisensi.`,
      metadata: {
        tenantCount: tenantsSummary.length,
      },
    });
    setAuditLogs(AuditLogger.getLogs());

    showToast('📦 Master Backup Massal Seluruh Tenant berhasil diunduh!', 'success');
  };

  // Trigger file restore for Mass Backup
  const handleFileRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoringBackup(true);
    setRestoreResultMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        const parsedPkg = JSON.parse(rawContent);

        const result = SecureVault.restoreMasterMultiTenantBackup(parsedPkg);
        if (result.success) {
          setRestoreResultMsg({ type: 'success', text: result.message });
          refreshAllLicenses();

          AuditLogger.log({
            category: 'BACKUP',
            action: 'MASS_BACKUP_RESTORED',
            actionLabel: 'Pemulihan Master Backup Massal',
            actor: 'Super Admin',
            details: `Memulihkan ${result.restoredTenantsCount} partisi data tenant dari berkas cadangan massal JSON.`,
            metadata: {
              restoredTenantsCount: result.restoredTenantsCount,
              fileName: file.name,
            },
          });

          showToast('🎉 Pemulihan Data Massal Seluruh Tenant Berhasil!', 'success');
        } else {
          setRestoreResultMsg({ type: 'error', text: result.message });
          showToast(result.message, 'error');
        }
      } catch (err: any) {
        const errMsg = `Gagal memproses file backup: ${err.message || 'Format JSON tidak valid'}`;
        setRestoreResultMsg({ type: 'error', text: errMsg });
        showToast(errMsg, 'error');
      } finally {
        setIsRestoringBackup(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Generate Temporary Client PIN for Account Recovery
  const handleGenerateTempPin = (user: any) => {
    const tempPin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedTempPin(tempPin);
    setResetPinModalUser(user);

    AuditLogger.log({
      category: 'SECURITY',
      action: 'CLIENT_PIN_GENERATED',
      actionLabel: 'Pembuatan PIN Pemulihan Klien',
      actor: 'Super Admin',
      targetId: user.id,
      targetName: user.fullName,
      details: `Membuat PIN pemulihan sementara (${tempPin}) untuk klien ${user.fullName} (${user.email}).`,
      metadata: {
        userId: user.id,
        userEmail: user.email,
      },
    });
    setAuditLogs(AuditLogger.getLogs());

    showToast(`PIN Pemulihan Sementara untuk ${user.fullName} telah dibuat: ${tempPin}`, 'info');
  };

  // Clear Audit Logs
  const handleClearAuditLogs = () => {
    AuditLogger.clearLogs();
    setAuditLogs([]);
    setIsConfirmClearAuditOpen(false);
    showToast('Seluruh riwayat audit log telah dibersihkan.', 'info');
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const totalRev = licenses.reduce((acc, l) => acc + (l.price || 0), 0);
    const activeCount = licenses.filter((l) => l.status === 'ACTIVE').length;
    const expiredCount = licenses.filter((l) => l.status === 'EXPIRED').length;
    const suspendedCount = licenses.filter((l) => l.status === 'SUSPENDED').length;
    const enterpriseCount = licenses.filter((l) => l.tier === 'ENTERPRISE').length;
    const proCount = licenses.filter((l) => l.tier === 'PRO').length;
    const starterCount = licenses.filter((l) => l.tier === 'STARTER').length;
    const trialCount = licenses.filter((l) => l.tier === 'TRIAL').length;

    // Licenses expiring in <= 14 days or already expired
    const expiringSoon = licenses.filter((l) => {
      if (l.expiresAt === null) return false;
      const daysLeft = Math.ceil((l.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 14;
    });

    return {
      totalRev,
      activeCount,
      expiredCount,
      suspendedCount,
      enterpriseCount,
      proCount,
      starterCount,
      trialCount,
      expiringSoon,
    };
  }, [licenses]);

  // Filtered Licenses for Fleet View
  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      const matchQuery =
        lic.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lic.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lic.licenseKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lic.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lic.clientPhone.includes(searchQuery);

      const matchTier = filterTier === 'all' || lic.tier === filterTier;
      const matchStatus = filterStatus === 'all' || lic.status === filterStatus;

      return matchQuery && matchTier && matchStatus;
    });
  }, [licenses, searchQuery, filterTier, filterStatus]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchCat = auditCategoryFilter === 'ALL' || log.category === auditCategoryFilter;
      const query = auditSearchQuery.toLowerCase();
      const matchQuery =
        !query ||
        log.actionLabel.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.actor.toLowerCase().includes(query) ||
        (log.targetName && log.targetName.toLowerCase().includes(query)) ||
        (log.targetId && log.targetId.toLowerCase().includes(query)) ||
        log.id.toLowerCase().includes(query);

      return matchCat && matchQuery;
    });
  }, [auditLogs, auditCategoryFilter, auditSearchQuery]);

  // =========================================================================
  // GATEWAY: MASTER PIN LOGIN SCREEN (Clean Modern White UI)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-900">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-8">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs mb-4">
              <ShieldCheck className="h-9 w-9" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Super Admin Gateway
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              FinansialPro POS Master Licensing & Fleet Control
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Master Security PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Masukkan Master PIN (default: admin888)"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
                  autoFocus
                />
              </div>
              {loginError && (
                <p className="text-xs font-semibold text-rose-600 mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="h-4 w-4" />
              <span>Buka Portal Super Admin</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={onExitSuperAdmin}
              className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Kembali ke Aplikasi Kasir
            </button>
            <span className="font-mono text-[11px] text-slate-400">v3.0.0-PRO</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED CONSOLE (Clean Crisp White Modern Layout)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Top Super Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                Super Admin Center
              </h1>
              <span className="bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                FLEET & AUDIT PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Manajemen Lisensi, Audit Trail, Backup Massal & Harga Multi-Tenant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/90 text-slate-700 text-xs px-3 py-1.5 rounded-full border border-slate-200 font-medium">
            <Clock className="h-3.5 w-3.5 text-indigo-600" />
            <span>Sesi: {Math.floor(sessionTimeLeft / 60)}m {sessionTimeLeft % 60}s</span>
          </div>

          <button
            onClick={onExitSuperAdmin}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span>Buka Kasir POS</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <button
            onClick={handleAdminLogout}
            className="rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Keluar dari Super Admin"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kunci Portal</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sub-Tabs Navigation */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Ringkasan Fleet', icon: TrendingUp },
            { id: 'licenses', label: 'Daftar Lisensi', icon: Key, badge: licenses.length },
            { id: 'generator', label: 'Terbitkan Lisensi', icon: PlusCircle },
            { id: 'mass_backup', label: 'Master Backup Massal', icon: Database, highlight: true },
            { id: 'tenants', label: 'Kelola Klien Toko', icon: Building, badge: registeredClients.length },
            { id: 'audit_logs', label: 'Audit Log & Keamanan', icon: Activity, badge: auditLogs.length },
            { id: 'security', label: 'Protokol Sandi', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : tab.highlight ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            SUB-TAB: OVERVIEW (Clean White SaaS Metric Cards)
        ========================================================================= */}
        {adminTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Expiry Warning Banner if Any */}
            {metrics.expiringSoon.length > 0 && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-900">
                    Peringatan: {metrics.expiringSoon.length} Lisensi Segera Jatuh Tempo / Kadaluarsa
                  </h3>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Kirim pengingat perpanjangan via WhatsApp resmi agar operasional kasir klien tetap berjalan tanpa interupsi.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {metrics.expiringSoon.map((lic) => {
                      const days = lic.expiresAt
                        ? Math.ceil((lic.expiresAt - Date.now()) / 86400000)
                        : 0;
                      return (
                        <div
                          key={lic.id}
                          className="bg-white border border-amber-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-800 shadow-2xs"
                        >
                          <span className="font-bold">{lic.businessName}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${days <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                            {days <= 0 ? 'Kadaluarsa' : `${days} hari lagi`}
                          </span>
                          <button
                            onClick={() => handleSendExpiryReminder(lic, days)}
                            className="text-emerald-600 hover:text-emerald-800 font-bold ml-1 flex items-center gap-1"
                          >
                            <Send className="h-3 w-3" />
                            <span>WA</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Core Stats Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pendapatan</span>
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(metrics.totalRev)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Dari {licenses.length} lisensi terbit</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lisensi Aktif</span>
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Key className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-indigo-600 tracking-tight">
                  {metrics.activeCount}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{licenses.length - metrics.activeCount} non-aktif / expired</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Multi-Toko</span>
                  <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Building className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-700 tracking-tight">
                  {tenantsSummary.length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{registeredClients.length} akun pengguna terdaftar</p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Security Log</span>
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-700 tracking-tight">
                  {auditLogs.length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Peristiwa keamanan & transaksi tercatat</p>
              </div>
            </div>

            {/* Quick Actions and Tier Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Tier Pricing Overview with Edit action */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Katalog Harga Standar Lisensi</h3>
                    <p className="text-xs text-slate-500">Sesuaikan harga default paket yang digunakan saat penerbitan lisensi baru</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['TRIAL', 'STARTER', 'PRO', 'ENTERPRISE'] as LicenseTier[]).map((tier) => {
                    const price = tierPricing[tier] ?? DEFAULT_TIER_PRICES[tier];
                    return (
                      <div
                        key={tier}
                        className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{tier} Edition</span>
                            {tier === 'ENTERPRISE' && (
                              <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">LIFETIME</span>
                            )}
                          </div>
                          <p className="text-sm font-black text-indigo-700 mt-1">
                            {price === 0 ? 'Gratis (Trial)' : formatCurrency(price)}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingTierModal({ tier, price })}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center gap-1"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Ubah</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Col: Quick Super Admin Actions */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Aksi Cepat Super Admin
                </h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => setAdminTab('generator')}
                    className="w-full p-3 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100 rounded-xl text-left flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <PlusCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Terbitkan Lisensi Baru</p>
                        <p className="text-[10px] text-slate-500">Generate serial key & kirim ke WA klien</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => setAdminTab('mass_backup')}
                    className="w-full p-3 bg-purple-50/70 hover:bg-purple-50 border border-purple-100 rounded-xl text-left flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Ekspor Backup Massal</p>
                        <p className="text-[10px] text-slate-500">Download data seluruh partisi tenant</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => setAdminTab('audit_logs')}
                    className="w-full p-3 bg-blue-50/70 hover:bg-blue-50 border border-blue-100 rounded-xl text-left flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Inspeksi Audit Trail</p>
                        <p className="text-[10px] text-slate-500">Periksa log aktivitas & aksi sensitif</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB: LICENSES FLEET (Clean Modern White Table with Edit Price)
        ========================================================================= */}
        {adminTab === 'licenses' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari toko, nama klien, serial key..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">Semua Paket</option>
                  <option value="TRIAL">Trial</option>
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">Semua Status</option>
                  <option value="ACTIVE">Aktif</option>
                  <option value="SUSPENDED">Ditangguhkan</option>
                  <option value="EXPIRED">Kadaluarsa</option>
                </select>

                <button
                  onClick={refreshAllLicenses}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                  title="Segarkan data"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Toko / Bisnis Klien</th>
                      <th className="py-3.5 px-4">Kunci Serial & Paket</th>
                      <th className="py-3.5 px-4">Harga Terdaftar</th>
                      <th className="py-3.5 px-4">Status & Masa Berlaku</th>
                      <th className="py-3.5 px-4 text-right">Aksi Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLicenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          Tidak ditemukan data lisensi yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLicenses.map((lic) => {
                        const isLifetime = lic.expiresAt === null;
                        const isExpired = !isLifetime && lic.expiresAt! < Date.now();
                        const daysRemaining = lic.expiresAt
                          ? Math.ceil((lic.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
                          : null;

                        return (
                          <tr key={lic.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 text-sm">{lic.businessName}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                                <span>{lic.clientName}</span>
                                <span>•</span>
                                <span>{lic.clientPhone}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                                  {lic.licenseKey}
                                </span>
                                <button
                                  onClick={() => handleCopy(lic.licenseKey, 'Kunci Serial')}
                                  className="text-slate-400 hover:text-slate-700 p-1"
                                  title="Salin Serial Key"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {lic.tier}
                                </span>
                                <span className="text-[10px] text-slate-400">ID: {lic.id}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{formatCurrency(lic.price)}</span>
                                <button
                                  onClick={() => {
                                    setPriceEditLicense(lic);
                                    setNewLicensePrice(lic.price);
                                    setPriceUpdateNote('');
                                  }}
                                  className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                                  title="Edit / Update Harga Lisensi Klien Ini"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-400">Perjanjian Khusus</span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    lic.status === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : lic.status === 'SUSPENDED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${lic.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                  {lic.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                                {isLifetime ? (
                                  <span className="text-purple-700 font-bold">Permanen (Lifetime)</span>
                                ) : isExpired ? (
                                  <span className="text-rose-600 font-bold">Kadaluarsa</span>
                                ) : (
                                  `Sisa ${daysRemaining} hari`
                                )}
                              </p>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSendWA(lic)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-colors"
                                  title="Kirim Konfirmasi Lisensi via WhatsApp"
                                >
                                  <Send className="h-3 w-3" />
                                  <span>WA</span>
                                </button>

                                <button
                                  onClick={() => handleToggleLicenseStatus(lic.id, lic.status)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                    lic.status === 'ACTIVE'
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                  title={lic.status === 'ACTIVE' ? 'Tangguhkan Lisensi' : 'Aktifkan Lisensi'}
                                >
                                  {lic.status === 'ACTIVE' ? 'Suspend' : 'Aktifkan'}
                                </button>

                                <button
                                  onClick={() => setSelectedLicense(lic)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                  title="Lihat Detail Lisensi"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB: GENERATOR (Terbitkan Lisensi Baru)
        ========================================================================= */}
        {adminTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Penerbitan Kunci Serial Lisensi Resmi</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate serial baru, sesuaikan nominal kesepakatan harga, dan kirimkan format aktivasi ke WhatsApp mitra.
                </p>
              </div>

              <form onSubmit={handleGenerateLicense} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Pilihan Paket Lisensi
                    </label>
                    <select
                      value={genTier}
                      onChange={(e) => {
                        const t = e.target.value as LicenseTier;
                        setGenTier(t);
                        setGenPrice(tierPricing[t] ?? DEFAULT_TIER_PRICES[t]);
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                    >
                      <option value="TRIAL">TRIAL (Uji Coba 14 Hari)</option>
                      <option value="STARTER">STARTER (Bisnis Pemula)</option>
                      <option value="PRO">PRO (Multi-User & Analitik Lengkap)</option>
                      <option value="ENTERPRISE">ENTERPRISE (Fitur Penuh + Tanpa Batas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Masa Berlaku Lisensi
                    </label>
                    <select
                      value={genDuration === null ? 'lifetime' : genDuration.toString()}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGenDuration(v === 'lifetime' ? null : parseInt(v, 10));
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                    >
                      <option value="14">14 Hari (Uji Coba)</option>
                      <option value="30">30 Hari (1 Bulan)</option>
                      <option value="90">90 Hari (3 Bulan)</option>
                      <option value="180">180 Hari (6 Bulan)</option>
                      <option value="365">365 Hari (1 Tahun)</option>
                      <option value="lifetime">Seumur Hidup (Lifetime / Permanen)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nama Pemilik / Klien *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={genClientName}
                      onChange={(e) => setGenClientName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nama Usaha / Toko *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kopi & Resto Nusantara"
                      value={genBusinessName}
                      onChange={(e) => setGenBusinessName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nomor WhatsApp Klien
                    </label>
                    <input
                      type="text"
                      placeholder="081234567890"
                      value={genClientPhone}
                      onChange={(e) => setGenClientPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Klien
                    </label>
                    <input
                      type="email"
                      placeholder="klien@gmail.com"
                      value={genClientEmail}
                      onChange={(e) => setGenClientEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Harga Kesepakatan (IDR)
                    </label>
                    <input
                      type="number"
                      value={genPrice}
                      onChange={(e) => setGenPrice(Number(e.target.value))}
                      min="0"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm font-bold text-indigo-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Catatan Internal Penerbitan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Promo kemerdekaan 20% / Diskon mitra franchise"
                    value={genNotes}
                    onChange={(e) => setGenNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  <span>Terbitkan Lisensi & Buat Kunci Serial</span>
                </button>
              </form>
            </div>

            {/* Generated Output Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Kunci Serial Terbaru
                </h3>

                {recentlyGenerated ? (
                  <div className="mt-4 space-y-4 animate-in zoom-in-95 duration-150">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Lisensi Berhasil Dibuat</span>
                      </div>
                      <p className="text-xs text-emerald-700">
                        {recentlyGenerated.businessName} ({recentlyGenerated.clientName})
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Serial Key Resmi</label>
                      <div className="mt-1 p-3 bg-slate-900 text-indigo-300 rounded-xl font-mono text-sm font-bold flex items-center justify-between">
                        <span>{recentlyGenerated.licenseKey}</span>
                        <button
                          onClick={() => handleCopy(recentlyGenerated.licenseKey, 'Kunci Serial')}
                          className="text-slate-400 hover:text-white p-1"
                          title="Salin"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500">Paket:</span>
                        <p className="font-bold text-slate-900">{recentlyGenerated.tier}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Masa Berlaku:</span>
                        <p className="font-bold text-slate-900">
                          {recentlyGenerated.expiresAt ? new Date(recentlyGenerated.expiresAt).toLocaleDateString('id-ID') : 'Lifetime'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Nominal:</span>
                        <p className="font-bold text-indigo-700">{formatCurrency(recentlyGenerated.price)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <p className="font-bold text-emerald-600">{recentlyGenerated.status}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendWA(recentlyGenerated)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>Kirim ke WhatsApp Klien</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400">
                    <Key className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">Belum ada lisensi yang baru diterbitkan.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Isi formulir di sebelah kiri untuk membuat serial.</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                🔒 Kunci lisensi diverifikasi dengan algoritma checksum SHA-256 internal sistem.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB: MASS MULTI-TENANT BACKUP (Layanan Pemeliharaan Massal)
        ========================================================================= */}
        {adminTab === 'mass_backup' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Description */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Layanan Pemeliharaan: Master Backup Massal</h3>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    DISASTER RECOVERY
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Ekspor dan pulihkan seluruh partisi database merchant, riwayat transaksi, master produk, profil toko, dan registry lisensi dalam satu berkas terenkripsi JSON.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={handleDownloadMassBackup}
                  className="w-full md:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Master Backup JSON</span>
                </button>

                <label className="w-full md:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:border-purple-600 hover:text-purple-700 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Restore File Massal</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileRestoreChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Restore Notification Result if Any */}
            {restoreResultMsg && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  restoreResultMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {restoreResultMsg.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <p className="font-bold">{restoreResultMsg.type === 'success' ? 'Operasi Berhasil' : 'Operasi Gagal'}</p>
                  <p className="mt-0.5 leading-relaxed">{restoreResultMsg.text}</p>
                </div>
              </div>
            )}

            {/* Tenant Partitions Grid Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  Partisi Data Tenant yang Terdeteksi ({tenantsSummary.length} Bisnis Mitra)
                </h4>
                <span className="text-xs text-slate-400">Total Transaksi: {tenantsSummary.reduce((s, t) => s + (t.transactions?.length || 0), 0)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenantsSummary.map((tenant) => {
                  return (
                    <div
                      key={tenant.tenantId}
                      className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-2.5 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 truncate">{tenant.businessName}</span>
                        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                          {tenant.tenantId.slice(-8)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400">Produk:</span>
                          <p className="font-bold text-slate-800">{tenant.products?.length || 0}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Transaksi:</span>
                          <p className="font-bold text-slate-800">{tenant.transactions?.length || 0}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Pelanggan:</span>
                          <p className="font-bold text-slate-800">{tenant.customers?.length || 0}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Ukuran partisi: ~{Math.round(tenant.sizeBytes / 1024)} KB</span>
                        <span className="text-emerald-600 font-bold">Terisolasi Aman</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB: TENANTS (Kelola Klien & Password Sanitized / Reset PIN)
        ========================================================================= */}
        {adminTab === 'tenants' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama pengguna, email, atau bisnis..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Total Pengguna: <strong>{registeredClients.length}</strong></span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Nama Pengguna</th>
                      <th className="py-3.5 px-4">Email & No. HP</th>
                      <th className="py-3.5 px-4">Nama Usaha / Toko</th>
                      <th className="py-3.5 px-4">Status Keamanan Sandi</th>
                      <th className="py-3.5 px-4 text-right">Aksi Bantuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {registeredClients
                      .filter((c) => {
                        const q = clientSearchQuery.toLowerCase();
                        return (
                          !q ||
                          c.fullName?.toLowerCase().includes(q) ||
                          c.email?.toLowerCase().includes(q) ||
                          c.businessName?.toLowerCase().includes(q)
                        );
                      })
                      .map((client) => {
                        return (
                          <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 text-sm">{client.fullName}</p>
                              <span className="text-[10px] font-mono text-slate-400">{client.id}</span>
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="font-medium text-slate-800">{client.email}</p>
                              <p className="text-[11px] text-slate-500">{client.phone || '-'}</p>
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="font-bold text-indigo-700">{client.businessName || 'Toko Mitra'}</p>
                              <span className="text-[10px] text-slate-400 capitalize">{client.role || 'owner'}</span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-semibold w-fit">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>Tersanitasi (SHA-256 Terenkripsi)</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">Password dilindungi & tidak ditampilkan</p>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleGenerateTempPin(client)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-2xs transition-all inline-flex items-center gap-1"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                <span>Buat PIN Darurat</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB: AUDIT LOG & KEAMANAN (Super Admin Audit Trail Center)
        ========================================================================= */}
        {adminTab === 'audit_logs' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header Card with Stats */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Pusat Audit Log & Keamanan Sistem</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Pencatatan real-time terhadap seluruh aktivitas administratif, perubahan harga, penerbitan lisensi, login, dan operasi backup massal.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => AuditLogger.exportLogsJson()}
                  className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
                  title="Ekspor format JSON"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>JSON</span>
                </button>

                <button
                  onClick={() => AuditLogger.exportLogsCsv()}
                  className="px-3 py-2 bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
                  title="Ekspor spreadsheet CSV"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={() => setIsConfirmClearAuditOpen(true)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Bersihkan log"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Bersihkan</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                {(['ALL', 'AUTH', 'LICENSE', 'PRICING', 'BACKUP', 'SECURITY'] as const).map((cat) => {
                  const isActive = auditCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setAuditCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'ALL' ? 'Semua Log' : cat}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari aksi, detail, aktor..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-1.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                />
              </div>
            </div>

            {/* Audit Logs List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredAuditLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Activity className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Tidak ada entri audit log</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Semua aktivitas baru akan otomatis tercatat di sini.</p>
                  </div>
                ) : (
                  filteredAuditLogs.map((log) => {
                    const isAuth = log.category === 'AUTH';
                    const isLic = log.category === 'LICENSE';
                    const isPrice = log.category === 'PRICING';
                    const isBackup = log.category === 'BACKUP';
                    const isSec = log.category === 'SECURITY';

                    return (
                      <div
                        key={log.id}
                        className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          {/* Badge Icon */}
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                              isAuth
                                ? 'bg-indigo-100 text-indigo-700'
                                : isLic
                                ? 'bg-blue-100 text-blue-700'
                                : isPrice
                                ? 'bg-emerald-100 text-emerald-700'
                                : isBackup
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isAuth ? (
                              <Lock className="h-4 w-4" />
                            ) : isLic ? (
                              <Key className="h-4 w-4" />
                            ) : isPrice ? (
                              <DollarSign className="h-4 w-4" />
                            ) : isBackup ? (
                              <Database className="h-4 w-4" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                  isAuth
                                    ? 'bg-indigo-600 text-white'
                                    : isLic
                                    ? 'bg-blue-600 text-white'
                                    : isPrice
                                    ? 'bg-emerald-600 text-white'
                                    : isBackup
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-white'
                                }`}
                              >
                                {log.category}
                              </span>

                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                {log.actionLabel}
                              </h4>

                              <span className="text-[11px] font-mono text-slate-400">
                                [{log.id}]
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {log.details}
                            </p>

                            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                              <span>Aktor: <strong className="text-slate-700">{log.actor}</strong></span>
                              {log.targetName && (
                                <>
                                  <span>•</span>
                                  <span>Target: <strong className="text-indigo-700">{log.targetName}</strong></span>
                                </>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {log.formattedDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedAuditLog(log)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors shrink-0"
                        >
                          Detail
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB: SECURITY & PROTOCOLS (Protokol Sandi & Keamanan)
        ========================================================================= */}
        {adminTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sanitasi Data & Perlindungan Sandi</h3>
                  <p className="text-xs text-slate-500">Standar keamanan data privasi pengguna</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Password Hashing Web Crypto (SHA-256 + Salt)</p>
                    <p className="text-slate-500 mt-0.5">Semua kata sandi dienkripsi satu arah dan tidak pernah disimpan secara plain text.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Privasi Super Admin UI</p>
                    <p className="text-slate-500 mt-0.5">Laporan kelola klien hanya menampilkan identitas toko tanpa menampilkan string password pengguna.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">Isolasi Partisi Tenant</p>
                    <p className="text-slate-500 mt-0.5">Tiap tenant memiliki key namespace terisolasi tanpa risiko kebocoran silang data.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pemulihan Akun Klien (Temporary PIN)</h3>
                  <p className="text-xs text-slate-500">Bantuan bagi klien yang lupa kredensial</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Super Admin dapat membuat PIN pemulihan sementara (OTP Darurat) dari tab <strong>Kelola Klien Toko</strong>. PIN ini bersifat satu kali pakai dan diverifikasi langsung ke sesi akun klien.
              </p>

              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  <span>Protokol Keamanan Master PIN Super Admin</span>
                </p>
                <p className="text-indigo-800/80 text-[11px] leading-relaxed">
                  PIN Master default: <code className="font-mono bg-white px-1.5 py-0.5 rounded text-indigo-700 font-bold border border-indigo-200">admin888</code>. Sesi aktif dilindungi dengan auto-logout timeout 30 menit.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: EDIT HARGA STANDAR PAKET KATALOG
      ========================================================================= */}
      {editingTierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Ubah Harga Katalog: Paket {editingTierModal.tier}
              </h3>
              <button
                onClick={() => setEditingTierModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Harga Baru Standar (IDR)
              </label>
              <input
                type="number"
                value={editingTierModal.price}
                onChange={(e) =>
                  setEditingTierModal({ ...editingTierModal, price: Number(e.target.value) })
                }
                min="0"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-base font-bold text-indigo-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Format: {formatCurrency(editingTierModal.price)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTierModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTierPrice}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Simpan Harga Katalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT HARGA SATUAN LISENSI KLIEN
      ========================================================================= */}
      {priceEditLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Perbarui Harga Lisensi Klien</h3>
                <p className="text-xs text-slate-500">{priceEditLicense.businessName} ({priceEditLicense.clientName})</p>
              </div>
              <button
                onClick={() => setPriceEditLicense(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Harga Kesepakatan Baru (IDR)
                </label>
                <input
                  type="number"
                  value={newLicensePrice}
                  onChange={(e) => setNewLicensePrice(Number(e.target.value))}
                  min="0"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-base font-bold text-indigo-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Format: {formatCurrency(newLicensePrice)} (Sebelumnya: {formatCurrency(priceEditLicense.price)})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alasan / Catatan Perubahan Harga
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Diskon perpanjangan tahun kedua / Penyesuaian paket"
                  value={priceUpdateNote}
                  onChange={(e) => setPriceUpdateNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPriceEditLicense(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSingleLicensePrice}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Simpan Perubahan Harga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DETAIL LISENSI LENGKAP
      ========================================================================= */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rincian Lengkap Lisensi</h3>
                <p className="text-xs text-slate-500">{selectedLicense.businessName}</p>
              </div>
              <button
                onClick={() => setSelectedLicense(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900 text-indigo-300 rounded-xl font-mono text-xs font-bold flex items-center justify-between">
                <span>{selectedLicense.licenseKey}</span>
                <button
                  onClick={() => handleCopy(selectedLicense.licenseKey, 'Kunci Serial')}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Nama Klien:</span>
                  <p className="font-bold text-slate-900">{selectedLicense.clientName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Nomor Telepon:</span>
                  <p className="font-bold text-slate-900">{selectedLicense.clientPhone}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="font-bold text-slate-900">{selectedLicense.clientEmail}</p>
                </div>
                <div>
                  <span className="text-slate-500">Paket Edition:</span>
                  <p className="font-bold text-indigo-700">{selectedLicense.tier}</p>
                </div>
                <div>
                  <span className="text-slate-500">Investasi / Harga:</span>
                  <p className="font-bold text-emerald-700">{formatCurrency(selectedLicense.price)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Masa Berlaku:</span>
                  <p className="font-bold text-slate-900">
                    {selectedLicense.expiresAt ? new Date(selectedLicense.expiresAt).toLocaleDateString('id-ID') : 'Lifetime (Permanen)'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <span className="font-bold text-indigo-900">Fitur yang Aktif:</span>
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px] text-slate-700">
                  <span>✓ Cetak Thermal Bluetooth</span>
                  <span>✓ {selectedLicense.features.multiUser ? 'Multi Kasir & Shift' : 'Single User'}</span>
                  <span>✓ Ekspor Laporan CSV</span>
                  <span>✓ {selectedLicense.features.advancedReports ? 'Analisis Arus Kas & Laba' : 'Laporan Standar'}</span>
                  <span>✓ Backup & Restore Data</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleExtendLicense(selectedLicense.id, 365)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors"
                >
                  +1 Tahun
                </button>
                <button
                  onClick={() => handleExtendLicense(selectedLicense.id, null)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Set Lifetime
                </button>
              </div>

              <button
                onClick={() => handleSendWA(selectedLicense)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Kirim WA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DETAIL AUDIT LOG ENTRY
      ========================================================================= */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Detail Catatan Audit Log</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedAuditLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Kategori:</span>
                  <p className="font-bold text-slate-900">{selectedAuditLog.category}</p>
                </div>
                <div>
                  <span className="text-slate-500">Aksi Sistem:</span>
                  <p className="font-bold text-indigo-700">{selectedAuditLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-500">Aktor / Pengguna:</span>
                  <p className="font-bold text-slate-900">{selectedAuditLog.actor}</p>
                </div>
                <div>
                  <span className="text-slate-500">Waktu Pencatatan:</span>
                  <p className="font-bold text-slate-900">{selectedAuditLog.formattedDate}</p>
                </div>
                {selectedAuditLog.targetName && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Target / Klien:</span>
                    <p className="font-bold text-slate-900">{selectedAuditLog.targetName} ({selectedAuditLog.targetId || '-'})</p>
                  </div>
                )}
              </div>

              <div>
                <span className="font-bold text-slate-700">Keterangan Aktivitas:</span>
                <p className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
                  {selectedAuditLog.details}
                </p>
              </div>

              {selectedAuditLog.metadata && (
                <div>
                  <span className="font-bold text-slate-700">Metadata Transaksi:</span>
                  <pre className="mt-1 p-3 bg-slate-900 text-indigo-300 rounded-xl text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(selectedAuditLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: KONFIRMASI CLEAR AUDIT LOGS
      ========================================================================= */}
      {isConfirmClearAuditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="h-12 w-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Bersihkan Seluruh Audit Log?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tindakan ini akan mengosongkan seluruh riwayat log aktivitas Super Admin dari penyimpanan lokal browser.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsConfirmClearAuditOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleClearAuditLogs}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Ya, Bersihkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RESULT GENERATE TEMPORARY CLIENT PIN
      ========================================================================= */}
      {resetPinModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">PIN Pemulihan Klien Berhasil Dibuat</h3>
              <button
                onClick={() => setResetPinModalUser(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center space-y-2">
              <span className="text-xs font-bold text-indigo-900">PIN Pemulihan Sementara untuk:</span>
              <p className="text-sm font-black text-slate-900">{resetPinModalUser.fullName} ({resetPinModalUser.email})</p>
              <div className="py-3 px-6 bg-white rounded-xl border border-indigo-200 inline-block font-mono text-2xl font-black text-indigo-700 tracking-widest shadow-xs">
                {generatedTempPin}
              </div>
              <p className="text-[11px] text-slate-500">Berikan PIN 6-digit ini kepada klien untuk masuk darurat ke sistem POS.</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleCopy(generatedTempPin, 'PIN Pemulihan')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Salin PIN</span>
              </button>

              <button
                onClick={() => {
                  const msg = `*PIN PEMULIHAN AKUN FINANSIALPRO POS*\n\nHalo ${resetPinModalUser.fullName},\nPIN Masuk Sementara akun Anda adalah: *${generatedTempPin}*.\nSilakan gunakan PIN ini untuk masuk ke aplikasi kasir.`;
                  const phoneClean = (resetPinModalUser.phone || '').replace(/[^0-9]/g, '');
                  const waUrl = phoneClean
                    ? `https://wa.me/${phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean}?text=${encodeURIComponent(msg)}`
                    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                  window.open(waUrl, '_blank');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Kirim via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

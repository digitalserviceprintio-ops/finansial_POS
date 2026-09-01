import { AppLicense, LicenseTier, LicenseStatus, LicenseFeatureSet } from '../types';

const MASTER_REGISTRY_KEY = 'fpro_master_license_registry';
const ACTIVE_TENANT_LICENSE_KEY_PREFIX = 'fpro_license_';
const TIER_PRICING_STORAGE_KEY = 'fpro_tier_pricing_catalog';

export const DEFAULT_TIER_PRICES: Record<LicenseTier, number> = {
  TRIAL: 0,
  STARTER: 350000,
  PRO: 650000,
  ENTERPRISE: 1500000,
};

// Default Feature Matrix by Tier
export const TIER_FEATURES: Record<LicenseTier, LicenseFeatureSet> = {
  TRIAL: {
    bluetoothPrint: true,
    multiUser: false,
    exportCsv: true,
    advancedReports: false,
    cloudBackup: true,
    customBranding: false,
  },
  STARTER: {
    bluetoothPrint: true,
    multiUser: false,
    exportCsv: true,
    advancedReports: true,
    cloudBackup: true,
    customBranding: false,
  },
  PRO: {
    bluetoothPrint: true,
    multiUser: true,
    exportCsv: true,
    advancedReports: true,
    cloudBackup: true,
    customBranding: true,
  },
  ENTERPRISE: {
    bluetoothPrint: true,
    multiUser: true,
    exportCsv: true,
    advancedReports: true,
    cloudBackup: true,
    customBranding: true,
  },
};

// Initial Pre-seeded Master Licenses for Demonstration & Testing
const INITIAL_MASTER_LICENSES: AppLicense[] = [
  {
    id: 'LIC-ENT-001',
    licenseKey: 'FPRO-ENT-9824-7125-E8A1',
    tenantId: 'tenant_kopi_resto_nu_001',
    businessName: 'Kopi & Resto Nusantara',
    clientName: 'Budi Santoso',
    clientEmail: 'budi.santoso@nusantara.id',
    clientPhone: '081234567890',
    tier: 'ENTERPRISE',
    status: 'ACTIVE',
    issuedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    activatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    expiresAt: null, // Lifetime
    maxCashiers: 999,
    maxProducts: 99999,
    features: TIER_FEATURES.ENTERPRISE,
    price: 1500000,
    notes: 'Lisensi Enterprise Lifetime Resmi POS Resto',
  },
  {
    id: 'LIC-PRO-002',
    licenseKey: 'FPRO-PRO-4381-9921-A7C3',
    tenantId: '',
    businessName: 'Toko Berkah Jaya',
    clientName: 'Haji Ahmad',
    clientEmail: 'berkahjaya@gmail.com',
    clientPhone: '085712345678',
    tier: 'PRO',
    status: 'ACTIVE',
    issuedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    activatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 355 * 24 * 60 * 60 * 1000, // 1 Year
    maxCashiers: 5,
    maxProducts: 5000,
    features: TIER_FEATURES.PRO,
    price: 650000,
    notes: 'Lisensi Pro Tahunan Mini Market',
  },
  {
    id: 'LIC-STA-003',
    licenseKey: 'FPRO-STA-1192-8821-B2D9',
    tenantId: '',
    businessName: 'Apotek Sehat Prima',
    clientName: 'Dr. Hendra',
    clientEmail: 'apoteksehat@yahoo.com',
    clientPhone: '082199887766',
    tier: 'STARTER',
    status: 'ACTIVE',
    issuedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    activatedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000, // 6 Months
    maxCashiers: 2,
    maxProducts: 1000,
    features: TIER_FEATURES.STARTER,
    price: 350000,
    notes: 'Paket Starter 6 Bulan',
  },
  {
    id: 'LIC-EXP-004',
    licenseKey: 'FPRO-PRO-3301-4412-C9F2',
    tenantId: '',
    businessName: 'Kafe Kopi Kenangan Indah',
    clientName: 'Rian Pratama',
    clientEmail: 'rian.kafe@gmail.com',
    clientPhone: '081377889900',
    tier: 'PRO',
    status: 'EXPIRED',
    issuedAt: Date.now() - 370 * 24 * 60 * 60 * 1000,
    activatedAt: Date.now() - 370 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // Expired 5 days ago
    maxCashiers: 5,
    maxProducts: 5000,
    features: TIER_FEATURES.PRO,
    price: 650000,
    notes: 'Langganan Tahunan telah jatuh tempo',
  },
];

// Helper: Calculate simple checksum for serial verification
function generateChecksum(prefix: string, part1: string, part2: string): string {
  const combined = `${prefix}-${part1}-${part2}-FINPRO_SECURE`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0');
  return hex.slice(0, 4);
}

export const LicenseManager = {
  // Get all master licenses (Super Admin view)
  getAllMasterLicenses(): AppLicense[] {
    try {
      const raw = localStorage.getItem(MASTER_REGISTRY_KEY);
      if (!raw) {
        localStorage.setItem(MASTER_REGISTRY_KEY, JSON.stringify(INITIAL_MASTER_LICENSES));
        return INITIAL_MASTER_LICENSES;
      }
      return JSON.parse(raw) as AppLicense[];
    } catch {
      return INITIAL_MASTER_LICENSES;
    }
  },

  // Save all master licenses
  saveAllMasterLicenses(licenses: AppLicense[]): void {
    try {
      localStorage.setItem(MASTER_REGISTRY_KEY, JSON.stringify(licenses));
    } catch (err) {
      console.error('[LicenseManager] Save failed:', err);
    }
  },

  // Generate a brand new cryptographically valid License Key
  generateLicenseKey(tier: LicenseTier): string {
    const tierCode = tier === 'ENTERPRISE' ? 'ENT' : tier === 'PRO' ? 'PRO' : tier === 'STARTER' ? 'STA' : 'TRL';
    const randPart1 = Math.floor(1000 + Math.random() * 9000).toString();
    const randPart2 = Math.floor(1000 + Math.random() * 9000).toString();
    const checksum = generateChecksum(`FPRO-${tierCode}`, randPart1, randPart2);
    return `FPRO-${tierCode}-${randPart1}-${randPart2}-${checksum}`;
  },

  // Create and register a new license in master repository
  issueNewLicense(payload: {
    clientName: string;
    businessName: string;
    clientEmail: string;
    clientPhone: string;
    tier: LicenseTier;
    durationDays: number | null; // null = Lifetime
    price: number;
    notes?: string;
  }): AppLicense {
    const licenses = this.getAllMasterLicenses();
    const licenseKey = this.generateLicenseKey(payload.tier);
    const now = Date.now();

    let expiresAt: number | null = null;
    if (payload.durationDays !== null && payload.durationDays > 0) {
      expiresAt = now + payload.durationDays * 24 * 60 * 60 * 1000;
    }

    const newLicense: AppLicense = {
      id: `LIC-${payload.tier.slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      licenseKey,
      tenantId: '',
      businessName: payload.businessName,
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
      clientPhone: payload.clientPhone,
      tier: payload.tier,
      status: 'ACTIVE',
      issuedAt: now,
      activatedAt: null,
      expiresAt,
      maxCashiers: payload.tier === 'ENTERPRISE' ? 999 : payload.tier === 'PRO' ? 10 : 2,
      maxProducts: payload.tier === 'ENTERPRISE' ? 99999 : payload.tier === 'PRO' ? 10000 : 1000,
      features: TIER_FEATURES[payload.tier],
      price: payload.price,
      notes: payload.notes || '',
    };

    licenses.unshift(newLicense);
    this.saveAllMasterLicenses(licenses);
    return newLicense;
  },

  // Get active license for a specific tenant
  getTenantLicense(tenantId: string, defaultBusinessName?: string): AppLicense {
    try {
      const stored = localStorage.getItem(`${ACTIVE_TENANT_LICENSE_KEY_PREFIX}${tenantId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as AppLicense;
        // Check if expired
        if (parsed.expiresAt && Date.now() > parsed.expiresAt && parsed.status === 'ACTIVE') {
          parsed.status = 'EXPIRED';
        }
        return parsed;
      }
    } catch (err) {
      console.error('[LicenseManager] Get tenant license err:', err);
    }

    // Default: Check if pre-seeded in master for this tenant or generate a 14-day Trial License
    const masterList = this.getAllMasterLicenses();
    const matched = masterList.find((l) => l.tenantId === tenantId);
    if (matched) {
      localStorage.setItem(`${ACTIVE_TENANT_LICENSE_KEY_PREFIX}${tenantId}`, JSON.stringify(matched));
      return matched;
    }

    // Generate Standard 14-Day Free Trial for fresh tenants
    const trialLicense: AppLicense = {
      id: `LIC-TRL-${tenantId.slice(-6)}`,
      licenseKey: `DELPOS-TRL-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-TRIAL`,
      tenantId,
      businessName: defaultBusinessName || 'Bisnis Anda',
      clientName: 'Pengguna DelPOS',
      clientEmail: '',
      clientPhone: '',
      tier: 'TRIAL',
      status: 'ACTIVE',
      issuedAt: Date.now(),
      activatedAt: Date.now(),
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 Days Free Trial
      maxCashiers: 2,
      maxProducts: 200,
      features: TIER_FEATURES.TRIAL,
      price: 0,
      notes: 'Lisensi Uji Coba Gratis 14 Hari DelPOS (powered by AkuPos)',
    };

    localStorage.setItem(`${ACTIVE_TENANT_LICENSE_KEY_PREFIX}${tenantId}`, JSON.stringify(trialLicense));
    return trialLicense;
  },

  // Activate license using Serial Key for a tenant
  activateLicense(tenantId: string, serialKey: string, tenantBusinessName?: string): { success: boolean; message: string; license?: AppLicense } {
    const cleanKey = serialKey.trim().toUpperCase();
    if (!cleanKey.startsWith('FPRO-')) {
      return { success: false, message: 'Format nomor lisensi tidak valid! Harus diawali dengan "FPRO-"' };
    }

    const masterList = this.getAllMasterLicenses();
    const licenseIndex = masterList.findIndex((l) => l.licenseKey.toUpperCase() === cleanKey);

    if (licenseIndex === -1) {
      // Allow custom emergency algorithmic license validation
      const parts = cleanKey.split('-');
      if (parts.length >= 5) {
        const tier = (parts[1] === 'ENT' ? 'ENTERPRISE' : parts[1] === 'PRO' ? 'PRO' : parts[1] === 'STA' ? 'STARTER' : 'TRIAL') as LicenseTier;
        const validChecksum = generateChecksum(`FPRO-${parts[1]}`, parts[2], parts[3]);
        if (parts[4] === validChecksum) {
          // Valid algorithmic key
          const customLic: AppLicense = {
            id: `LIC-${parts[1]}-${Date.now().toString().slice(-6)}`,
            licenseKey: cleanKey,
            tenantId,
            businessName: tenantBusinessName || 'Bisnis Mitra',
            clientName: 'Mitra DelPOS',
            clientEmail: '',
            clientPhone: '',
            tier,
            status: 'ACTIVE',
            issuedAt: Date.now(),
            activatedAt: Date.now(),
            expiresAt: tier === 'ENTERPRISE' ? null : Date.now() + 365 * 24 * 60 * 60 * 1000,
            maxCashiers: tier === 'ENTERPRISE' ? 999 : 5,
            maxProducts: tier === 'ENTERPRISE' ? 99999 : 5000,
            features: TIER_FEATURES[tier],
            price: 0,
            notes: 'Aktivasi Serial Kunci Algoritmik',
          };
          masterList.unshift(customLic);
          this.saveAllMasterLicenses(masterList);
          localStorage.setItem(`${ACTIVE_TENANT_LICENSE_KEY_PREFIX}${tenantId}`, JSON.stringify(customLic));
          return { success: true, message: `Selamat! Lisensi ${tier} berhasil diaktivasi secara permanen/aktif.`, license: customLic };
        }
      }
      return { success: false, message: 'Nomor Serial Lisensi tidak ditemukan di server registrasi atau tidak valid!' };
    }

    const targetLicense = masterList[licenseIndex];

    if (targetLicense.status === 'SUSPENDED') {
      return { success: false, message: 'Lisensi ini telah dinonaktifkan / ditangguhkan oleh Super Admin.' };
    }

    // Bind license to tenant
    targetLicense.tenantId = tenantId;
    targetLicense.activatedAt = Date.now();
    targetLicense.status = 'ACTIVE';
    if (tenantBusinessName) targetLicense.businessName = tenantBusinessName;

    masterList[licenseIndex] = targetLicense;
    this.saveAllMasterLicenses(masterList);

    // Save locally for tenant
    localStorage.setItem(`${ACTIVE_TENANT_LICENSE_KEY_PREFIX}${tenantId}`, JSON.stringify(targetLicense));

    return {
      success: true,
      message: `Aktivasi Lisensi ${targetLicense.tier} Sukses! Aplikasi kini berstatus berlisensi resmi.`,
      license: targetLicense,
    };
  },

  // Update a master license status/expiry (Super Admin action)
  updateMasterLicense(licenseId: string, updates: Partial<AppLicense>): boolean {
    const list = this.getAllMasterLicenses();
    const idx = list.findIndex((l) => l.id === licenseId);
    if (idx === -1) return false;

    list[idx] = { ...list[idx], ...updates };
    this.saveAllMasterLicenses(list);

    // If attached to a tenant, sync local copy
    if (list[idx].tenantId) {
      localStorage.setItem(`${ACTIVE_TENANT_LICENSE_KEY_PREFIX}${list[idx].tenantId}`, JSON.stringify(list[idx]));
    }
    return true;
  },

  // Update specific license price directly
  updateLicensePrice(licenseId: string, newPrice: number): boolean {
    return this.updateMasterLicense(licenseId, { price: Math.max(0, newPrice) });
  },

  // Get master catalog pricing for tiers
  getTierPricing(): Record<LicenseTier, number> {
    try {
      const raw = localStorage.getItem(TIER_PRICING_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_TIER_PRICES };
      const parsed = JSON.parse(raw);
      return {
        TRIAL: 0,
        STARTER: typeof parsed.STARTER === 'number' ? parsed.STARTER : DEFAULT_TIER_PRICES.STARTER,
        PRO: typeof parsed.PRO === 'number' ? parsed.PRO : DEFAULT_TIER_PRICES.PRO,
        ENTERPRISE: typeof parsed.ENTERPRISE === 'number' ? parsed.ENTERPRISE : DEFAULT_TIER_PRICES.ENTERPRISE,
      };
    } catch {
      return { ...DEFAULT_TIER_PRICES };
    }
  },

  // Update master catalog pricing for a specific tier
  updateTierPrice(tier: LicenseTier, newPrice: number): void {
    try {
      const current = this.getTierPricing();
      current[tier] = Math.max(0, newPrice);
      localStorage.setItem(TIER_PRICING_STORAGE_KEY, JSON.stringify(current));
    } catch (err) {
      console.error('[LicenseManager] Update tier pricing err:', err);
    }
  },

  // Delete license from master
  deleteMasterLicense(licenseId: string): boolean {
    const list = this.getAllMasterLicenses();
    const target = list.find((l) => l.id === licenseId);
    if (target && target.tenantId) {
      localStorage.removeItem(`${ACTIVE_TENANT_LICENSE_KEY_PREFIX}${target.tenantId}`);
    }
    const filtered = list.filter((l) => l.id !== licenseId);
    this.saveAllMasterLicenses(filtered);
    return true;
  },
};

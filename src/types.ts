export type ProductCategory = string;

export type CustomerTier = 'Reguler' | 'Silver' | 'Gold' | 'VIP';

export type MainTab =
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'transactions'
  | 'products'
  | 'categories'
  | 'customers'
  | 'cashflow'
  | 'reports'
  | 'google_apps_script'
  | 'backup'
  | 'settings'
  | 'about'
  | 'customer_catalog'
  | 'login';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  role: 'owner' | 'admin' | 'cashier';
  isEmailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface BackupData {
  app: string;
  version: string;
  exportedAt: string;
  exportedTimestamp: number;
  exportedBy?: string;
  store: StoreProfile;
  summary: {
    totalProducts: number;
    totalCategories: number;
    totalTransactions: number;
    totalExpenses: number;
    totalCustomers: number;
    totalRevenue: number;
    totalExpenseAmount: number;
  };
  data: {
    products: Product[];
    categories: CategoryItem[];
    transactions: Transaction[];
    expenses: ExpenseRecord[];
    customers: Customer[];
    customerOrders?: CustomerOrder[];
  };
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  color?: string;
  bannerImage?: string;
  displayOrder?: number;
}

export type ReportSubTab = 'cashflow' | 'profit_loss' | 'product_sales';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  unit?: string;
  minStockAlert?: number;
  image: string;
  isAvailable: boolean;
  soldCount?: number;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface CartDiscount {
  type: 'percentage' | 'nominal';
  value: number;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  tier?: CustomerTier;
  totalOrders?: number;
  totalSpent?: number;
  points?: number;
  debt?: number; // Piutang belum lunas
  avatarUrl?: string;
  createdAt?: string;
  lastOrderDate?: string;
}

// Payment method without QRIS
export type PaymentMethod = 'Tunai' | 'Transfer Bank' | 'Kartu Debit';

export interface Transaction {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  timestamp: number;
  customer?: Customer;
  cashierName: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  change?: number;
  bankName?: string;
  bankRefNumber?: string;
  cardLastDigits?: string;
  status: 'Selesai' | 'Dibatalkan' | 'Tertunda';
  type: 'Penjualan' | 'Penjualan B2B';
  queueNumber?: string;
  tableOrRoom?: string;
}

// Customer Self-Ordering & Queue System Types
export type CustomerOrderStatus = 'MENUNGGU' | 'DIPROSES' | 'SIAP' | 'SELESAI' | 'DIBATALKAN';

export interface CustomerOrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  notes?: string;
}

export interface CustomerOrder {
  id: string;
  queueNumber: string; // e.g. "ANT-001", "ANT-002"
  customerName: string;
  customerPhone?: string;
  tableOrRoom?: string; // e.g. "Meja 03", "Bungkus / Takeaway", "Delivery"
  notes?: string;
  orderTime: string;
  orderTimestamp: number;
  items: CustomerOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'Bayar di Kasir (Tunai)' | 'Transfer Bank' | 'Kartu Debit';
  status: CustomerOrderStatus;
  isPaid: boolean;
  source: 'QR_CATALOG' | 'POS_MANUAL';
}

export interface ExpenseRecord {
  id: string;
  date: string;
  time: string;
  timestamp: number;
  description: string;
  refNumber: string;
  category: 'Bahan Baku' | 'Gaji Karyawan' | 'Utilitas' | 'Pemasaran' | 'Operasional' | 'Sewa Tempat' | 'Lainnya';
  amount: number;
  recipient?: string;
}

export interface StoreProfile {
  name: string;
  branch: string;
  owner: string;
  phone: string;
  address: string;
  taxRate: number; // 0.1 for 10%
  currencySymbol: string;
  avatarUrl: string;
  bankAccounts?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }[];
  catalogHeadline?: string;
  catalogAnnouncement?: string;
}

// Software Licensing Types
export type LicenseTier = 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'UNACTIVATED';

export interface LicenseFeatureSet {
  bluetoothPrint: boolean;
  multiUser: boolean;
  exportCsv: boolean;
  advancedReports: boolean;
  cloudBackup: boolean;
  customBranding: boolean;
}

export interface AppLicense {
  id: string;
  licenseKey: string;
  tenantId: string;
  businessName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  tier: LicenseTier;
  status: LicenseStatus;
  issuedAt: number; // Timestamp
  activatedAt: number | null;
  expiresAt: number | null; // null = Lifetime (Permanen)
  maxCashiers: number;
  maxProducts: number;
  features: LicenseFeatureSet;
  price: number; // IDR
  notes?: string;
  hardwareFingerprint?: string;
}

export interface SuperAdminSession {
  isAuthenticated: boolean;
  adminName: string;
  loginTimestamp: number;
}

// In-App Notification System Types
export type NotificationType = 'stock_low' | 'stock_empty' | 'system' | 'license' | 'backup' | 'new_order';

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  actionTab?: MainTab;
  productId?: string;
  productName?: string;
  currentStock?: number;
  minStockAlert?: number;
  orderId?: string;
  queueNumber?: string;
  urgency: 'critical' | 'warning' | 'info';
}

// Super Admin Audit Log System Types
export type AuditLogCategory = 'AUTH' | 'LICENSE' | 'PRICING' | 'BACKUP' | 'SECURITY' | 'TENANT';

export type AuditLogAction =
  | 'SUPERADMIN_LOGIN'
  | 'SUPERADMIN_LOGOUT'
  | 'LICENSE_GENERATED'
  | 'LICENSE_STATUS_UPDATED'
  | 'LICENSE_EXTENDED'
  | 'LICENSE_PRICE_UPDATED'
  | 'TIER_PRICE_UPDATED'
  | 'MASS_BACKUP_DOWNLOADED'
  | 'MASS_BACKUP_RESTORED'
  | 'TENANT_PURGED'
  | 'CLIENT_PIN_GENERATED'
  | 'SECURITY_AUDIT_VERIFIED';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  formattedDate: string;
  category: AuditLogCategory;
  action: AuditLogAction;
  actionLabel: string;
  actor: string;
  targetId?: string;
  targetName?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

// Google Apps Script & Google Sheets Integration Types
export interface GoogleSheetsConfig {
  enabled: boolean;
  webAppUrl: string;
  sheetNamePrefix?: string;
  autoSyncTransactions: boolean;
  autoSyncProducts: boolean;
  autoSyncExpenses: boolean;
  autoSyncOrders: boolean;
  lastSyncTimestamp?: number;
  lastSyncStatus?: 'success' | 'error' | 'idle';
  lastSyncMessage?: string;
}

export interface GoogleSheetsSyncLog {
  id: string;
  timestamp: number;
  action: 'TRANSACTION' | 'PRODUCT' | 'EXPENSE' | 'ORDER' | 'FULL_SYNC' | 'TEST_PING';
  status: 'SUCCESS' | 'FAILED';
  summary: string;
  details?: string;
  itemsCount?: number;
}


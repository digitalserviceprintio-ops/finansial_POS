import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Transaction,
  ExpenseRecord,
  Customer,
  StoreProfile,
  MainTab,
  ReportSubTab,
  PaymentMethod,
  CategoryItem,
  AuthUser,
  BackupData,
  AppLicense,
  InAppNotification,
} from '../types';
import {
  initialProducts,
  initialTransactions,
  initialExpenses,
  initialCustomers,
  initialStoreProfile,
  initialCategories,
} from '../data/mockData';
import { SecureVault, generateTenantId } from '../utils/security';
import { LicenseManager } from '../utils/licenseManager';

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface SimulatedEmail {
  to: string;
  subject: string;
  code: string;
  sentAt: string;
  previewText: string;
}

interface AppContextType {
  // Navigation & View
  currentTab: MainTab;
  setCurrentTab: (tab: MainTab) => void;
  reportSubTab: ReportSubTab;
  setReportSubTab: (subTab: ReportSubTab) => void;
  isMobileSimulation: boolean;
  setIsMobileSimulation: (val: boolean) => void;
  searchGlobalQuery: string;
  setSearchGlobalQuery: (query: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;

  // Authentication & Users
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  registeredUsers: AuthUser[];
  sendVerificationEmail: (
    email: string,
    fullName: string,
    businessName: string,
    phone: string,
    password?: string
  ) => Promise<{ success: boolean; code: string }>;
  verifyEmailCode: (email: string, code: string) => { success: boolean; message: string };
  resendVerificationCode: (email: string) => string;
  loginWithCredentials: (email: string, passwordOrPin?: string) => { success: boolean; message: string };
  loginAsDemoUser: (userType: 'owner' | 'cashier' | 'budi' | 'siti') => void;
  logoutUser: () => void;

  // Simulated Email Modal
  isEmailModalOpen: boolean;
  setIsEmailModalOpen: (open: boolean) => void;
  latestSimulatedEmail: SimulatedEmail | null;

  // Store & Profile
  storeProfile: StoreProfile;
  updateStoreProfile: (profile: Partial<StoreProfile>) => void;
  cashierName: string;
  setCashierName: (name: string) => void;

  // Categories
  categories: CategoryItem[];
  addCategory: (cat: Omit<CategoryItem, 'id' | 'slug'>) => void;
  updateCategory: (id: string, updated: Partial<CategoryItem>) => void;
  deleteCategory: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, amount: number) => void;

  // Cart (POS)
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (cust: Customer | null) => void;

  // Transactions & Checkout
  transactions: Transaction[];
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'timestamp'>) => void;
  deleteExpense: (id: string) => void;
  deleteTransaction: (id: string) => void;
  updateTransactionStatus: (id: string, status: 'Selesai' | 'Dibatalkan' | 'Tertunda') => void;
  reprintReceipt: (trx: Transaction) => void;
  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, updated: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  recordCustomerDebtPayment: (customerId: string, amount: number) => void;
  adjustCustomerPoints: (customerId: string, pointsDelta: number) => void;

  // Checkout modal flow
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  pendingPaymentMethod: PaymentMethod;
  setPendingPaymentMethod: (method: PaymentMethod) => void;
  completedTransaction: Transaction | null;
  setCompletedTransaction: (trx: Transaction | null) => void;
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (open: boolean) => void;
  processPayment: (method: PaymentMethod, cashGiven?: number) => Transaction;

  // Backup & Restore
  exportBackupJson: () => BackupData;
  restoreBackupJson: (backupData: BackupData, mode: 'replace' | 'merge') => { success: boolean; message: string };

  // Notification Toast
  toasts: ToastNotification[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;

  // In-App Notification Center
  notifications: InAppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  deleteNotification: (id: string) => void;
  addCustomNotification: (notif: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => void;

  // Licensing & Software Monetization
  currentLicense: AppLicense;
  activateLicenseKey: (serialKey: string) => { success: boolean; message: string; license?: AppLicense };
  refreshLicense: () => void;
  isSuperAdminOpen: boolean;
  setIsSuperAdminOpen: (open: boolean) => void;
  openSuperAdminPortal: () => void;

  // Utilities
  formatCurrency: (amount: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialAuthUsers: AuthUser[] = [
  {
    id: 'USR-001',
    fullName: 'Budi Santoso',
    email: 'budi.santoso@tokokita.id',
    phone: '081234567890',
    businessName: 'Kopi & Resto Nusantara',
    role: 'owner',
    isEmailVerified: true,
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ_UeVtMqix0sJCZHs2TtKM5-d72Pea84EAktZj50a8963OhMvLReqs1NHQ5_GHU31yQIOvnrJgSfVJ_GeiKlPatJEFijCOybVvFFiMGK5NOxgk9QrAVW_iXOt0iW_JoPaZYQPCnyP7yXiRGmSsKfKm7wGSICkKlm5wlq8E4GuzgUAsgAUa1swPQ-m8CDYgnJ9jjXFUt_9CTSEQH_yEVGaOFNO6eA39ylX7lz2CTC7oAh5YPsc0Mc',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'USR-002',
    fullName: 'Siti Aisyah',
    email: 'siti.aisyah@tokokita.id',
    phone: '081298765432',
    businessName: 'Kopi & Resto Nusantara',
    role: 'cashier',
    isEmailVerified: true,
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCoLtV3Bv2OBXPlq_WrGjzOKb2hx7Pr3DOTjypa8dkEKduOjjWvN91FeXpeuVJDGRacnpFhqLouF2glsjyg154-ONwKg9-AXq2ylnHCQIAwb0pQ9662t3tt1reJkfrz46PuKvm9rTpygmqRrJUs0iC2FvO13DZ8nlMx-0eSm-8yba6zLFIndlcCVnmVfynCOWQHJRodfFxaOXcZ1AmWZ9mFAugAFABkMmuQ6rlyglKy280HkFHaQKc',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & UI States
  const [currentTab, setCurrentTab] = useState<MainTab>('dashboard');
  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>('cashflow');
  const [isMobileSimulation, setIsMobileSimulation] = useState<boolean>(false);
  const [searchGlobalQuery, setSearchGlobalQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Auth & User Management
  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>(() => {
    const saved = localStorage.getItem('finansialpro_registered_users');
    return saved ? JSON.parse(saved) : initialAuthUsers;
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('finansialpro_current_user');
    return saved ? JSON.parse(saved) : initialAuthUsers[0];
  });

  // Active Tenant Partition Key
  const currentTenantId = currentUser
    ? generateTenantId(currentUser.id, currentUser.businessName)
    : 'tenant_kopi_resto_nu_001';

  // Super Admin Portal Mode
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState<boolean>(() => {
    return window.location.hash === '#superadmin' || new URLSearchParams(window.location.search).get('portal') === 'superadmin';
  });

  // Active Software License State
  const [currentLicense, setCurrentLicense] = useState<AppLicense>(() => {
    return LicenseManager.getTenantLicense(currentTenantId, currentUser?.businessName || 'Kopi & Resto Nusantara');
  });

  // Pending OTP verification cache (in-memory, sanitized)
  const [pendingVerifications, setPendingVerifications] = useState<{
    [email: string]: { code: string; expiresAt: number; userData: Partial<AuthUser> };
  }>({});

  // Simulated Email State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [latestSimulatedEmail, setLatestSimulatedEmail] = useState<SimulatedEmail | null>(null);

  // Store & Settings (Isolated per Tenant Vault)
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    return SecureVault.getTenantItem<StoreProfile>(currentTenantId, 'store', initialStoreProfile);
  });

  const [cashierName, setCashierName] = useState<string>(() => {
    return currentUser?.fullName || 'Siti Aisyah';
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    return SecureVault.getTenantItem<CategoryItem[]>(currentTenantId, 'categories', initialCategories);
  });

  const [products, setProducts] = useState<Product[]>(() => {
    return SecureVault.getTenantItem<Product[]>(currentTenantId, 'products', initialProducts);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return SecureVault.getTenantItem<Transaction[]>(currentTenantId, 'transactions', initialTransactions);
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    return SecureVault.getTenantItem<ExpenseRecord[]>(currentTenantId, 'expenses', initialExpenses);
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    return SecureVault.getTenantItem<Customer[]>(currentTenantId, 'customers', initialCustomers);
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomers[0]);

  // Payment flow
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // In-App Notification Center
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    return SecureVault.getTenantItem<InAppNotification[]>(currentTenantId, 'notifications', []);
  });

  // Save notifications to tenant vault
  useEffect(() => {
    SecureVault.setTenantItem(currentTenantId, 'notifications', notifications);
  }, [currentTenantId, notifications]);

  // Automatic Low-Stock & Out-of-Stock Notification Engine
  useEffect(() => {
    if (!products || products.length === 0) return;

    setNotifications((prev) => {
      // Keep existing non-stock notifications or preserved read state
      const readIds = new Set(prev.filter((n) => n.isRead).map((n) => n.id));
      const existingMap = new Map<string, InAppNotification>(prev.map((n) => [n.id, n]));

      const generatedStockNotifs: InAppNotification[] = [];

      products.forEach((p) => {
        const threshold = p.minStockAlert ?? 5;
        if (p.stock <= 0) {
          const id = `notif-stock-empty-${p.id}`;
          const existing = existingMap.get(id);
          generatedStockNotifs.push({
            id,
            type: 'stock_empty',
            title: `Stok Habis: ${p.name}`,
            message: `Stok produk "${p.name}" telah habis (0 unit). Segera lakukan restok agar penjualan tidak terganggu.`,
            timestamp: existing?.timestamp || Date.now(),
            isRead: readIds.has(id),
            actionTab: 'products',
            productId: p.id,
            productName: p.name,
            currentStock: p.stock,
            minStockAlert: threshold,
            urgency: 'critical',
          });
        } else if (p.stock <= threshold) {
          const id = `notif-stock-low-${p.id}`;
          const existing = existingMap.get(id);
          generatedStockNotifs.push({
            id,
            type: 'stock_low',
            title: `Stok Menipis: ${p.name}`,
            message: `Tersisa ${p.stock} unit (Batas minimum: ${threshold} unit). Pertimbangkan untuk memesan kembali.`,
            timestamp: existing?.timestamp || Date.now(),
            isRead: readIds.has(id),
            actionTab: 'products',
            productId: p.id,
            productName: p.name,
            currentStock: p.stock,
            minStockAlert: threshold,
            urgency: 'warning',
          });
        }
      });

      // Keep non-stock notifications (e.g. system, backup, license)
      const nonStockNotifs = prev.filter((n) => n.type !== 'stock_low' && n.type !== 'stock_empty');

      // Combine and sort: critical unread first, then by timestamp descending
      const combined = [...generatedStockNotifs, ...nonStockNotifs].sort((a, b) => b.timestamp - a.timestamp);
      return combined;
    });
  }, [products]);

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Semua notifikasi ditandai telah dibaca', 'info');
  };

  const clearNotifications = () => {
    setNotifications([]);
    showToast('Daftar notifikasi telah dibersihkan', 'info');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addCustomNotification = (notif: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const id = `notif-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newNotif: InAppNotification = {
      ...notif,
      id,
      timestamp: Date.now(),
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Startup Security Sanitization
  useEffect(() => {
    SecureVault.sanitizeLegacyGlobalCache();
  }, []);

  // Sync current license when tenant changes
  useEffect(() => {
    const lic = LicenseManager.getTenantLicense(currentTenantId, currentUser?.businessName || storeProfile.name);
    setCurrentLicense(lic);
  }, [currentTenantId, currentUser]);

  // Synchronize Tenant Data Isolation Vaults
  useEffect(() => {
    localStorage.setItem('finansialpro_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('finansialpro_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('finansialpro_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    SecureVault.setTenantItem(currentTenantId, 'store', storeProfile);
  }, [currentTenantId, storeProfile]);

  useEffect(() => {
    SecureVault.setTenantItem(currentTenantId, 'categories', categories);
  }, [currentTenantId, categories]);

  useEffect(() => {
    SecureVault.setTenantItem(currentTenantId, 'products', products);
  }, [currentTenantId, products]);

  useEffect(() => {
    SecureVault.setTenantItem(currentTenantId, 'transactions', transactions);
  }, [currentTenantId, transactions]);

  useEffect(() => {
    SecureVault.setTenantItem(currentTenantId, 'expenses', expenses);
  }, [currentTenantId, expenses]);

  useEffect(() => {
    SecureVault.setTenantItem(currentTenantId, 'customers', customers);
  }, [currentTenantId, customers]);

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace('IDR', 'Rp');
  };

  // =========================================================
  // AUTHENTICATION & EMAIL VERIFICATION FLOW
  // =========================================================
  const generateOtpCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerificationEmail = async (
    email: string,
    fullName: string,
    businessName: string,
    phone: string,
    password?: string
  ): Promise<{ success: boolean; code: string }> => {
    const code = generateOtpCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    const newPending = {
      ...pendingVerifications,
      [email.toLowerCase()]: {
        code,
        expiresAt,
        userData: {
          fullName,
          businessName,
          email: email.toLowerCase(),
          phone,
          role: 'owner' as const,
        },
      },
    };
    setPendingVerifications(newPending);

    const now = new Date();
    const simulated: SimulatedEmail = {
      to: email,
      subject: `Kode Verifikasi Akun FinansialPro UMKM: ${code}`,
      code,
      sentAt: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`,
      previewText: `Gunakan kode OTP ${code} untuk memverifikasi akun usaha ${businessName}.`,
    };

    setLatestSimulatedEmail(simulated);
    setIsEmailModalOpen(true);
    showToast(`📧 Kode OTP ${code} terkirim ke email ${email}!`, 'info');

    return { success: true, code };
  };

  const resendVerificationCode = (email: string): string => {
    const code = generateOtpCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const existing = pendingVerifications[email.toLowerCase()];

    setPendingVerifications((prev) => ({
      ...prev,
      [email.toLowerCase()]: {
        code,
        expiresAt,
        userData: existing?.userData || { email: email.toLowerCase() },
      },
    }));

    const now = new Date();
    const simulated: SimulatedEmail = {
      to: email,
      subject: `Kode Verifikasi Baru FinansialPro UMKM: ${code}`,
      code,
      sentAt: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`,
      previewText: `Kode OTP baru Anda adalah ${code}.`,
    };

    setLatestSimulatedEmail(simulated);
    setIsEmailModalOpen(true);
    return code;
  };

  const verifyEmailCode = (
    email: string,
    code: string
  ): { success: boolean; message: string } => {
    const emailKey = email.toLowerCase();
    const pending = pendingVerifications[emailKey];

    // Check code matches
    if (!pending || pending.code !== code.trim()) {
      return { success: false, message: 'Kode verifikasi tidak cocok. Silakan periksa kembali email Anda.' };
    }

    if (Date.now() > pending.expiresAt) {
      return { success: false, message: 'Kode verifikasi telah kadaluarsa. Silakan kirim ulang kode baru.' };
    }

    // Create & register user
    const newUserId = `USR-${String(registeredUsers.length + 1).padStart(3, '0')}`;
    const newUser: AuthUser = {
      id: newUserId,
      fullName: pending.userData.fullName || 'Pemilik Usaha',
      email: emailKey,
      phone: pending.userData.phone || '081234567890',
      businessName: pending.userData.businessName || 'Toko UMKM',
      role: 'owner',
      isEmailVerified: true,
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ_UeVtMqix0sJCZHs2TtKM5-d72Pea84EAktZj50a8963OhMvLReqs1NHQ5_GHU31yQIOvnrJgSfVJ_GeiKlPatJEFijCOybVvFFiMGK5NOxgk9QrAVW_iXOt0iW_JoPaZYQPCnyP7yXiRGmSsKfKm7wGSICkKlm5wlq8E4GuzgUAsgAUa1swPQ-m8CDYgnJ9jjXFUt_9CTSEQH_yEVGaOFNO6eA39ylX7lz2CTC7oAh5YPsc0Mc',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Update store profile with business name and owner
    setStoreProfile((prev) => ({
      ...prev,
      name: pending.userData.businessName || prev.name,
      owner: pending.userData.fullName || prev.owner,
      phone: pending.userData.phone || prev.phone,
    }));

    setCashierName(newUser.fullName);
    setRegisteredUsers((prev) => [newUser, ...prev.filter((u) => u.email !== emailKey)]);
    setCurrentUser(newUser);
    setCurrentTab('dashboard');

    // Clean pending
    const updatedPending = { ...pendingVerifications };
    delete updatedPending[emailKey];
    setPendingVerifications(updatedPending);

    return { success: true, message: 'Verifikasi berhasil!' };
  };

  const loginWithCredentials = (
    email: string,
    passwordOrPin?: string
  ): { success: boolean; message: string } => {
    const emailKey = email.toLowerCase().trim();
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === emailKey);

    if (existing) {
      const updatedUser: AuthUser = {
        ...existing,
        lastLoginAt: new Date().toISOString(),
      };
      setCurrentUser(updatedUser);
      setCashierName(updatedUser.fullName);
      setCurrentTab('dashboard');
      return { success: true, message: 'Masuk berhasil!' };
    }

    return {
      success: false,
      message: 'Email belum terdaftar. Silakan lakukan pendaftaran terlebih dahulu.',
    };
  };

  const loginAsDemoUser = (userType: 'owner' | 'cashier' | 'budi' | 'siti') => {
    const target =
      userType === 'owner' || userType === 'budi'
        ? initialAuthUsers[0]
        : initialAuthUsers[1];

    setCurrentUser(target);
    setCashierName(target.fullName);
    setCurrentTab('dashboard');
    showToast(`Masuk sebagai ${target.fullName} (${target.role === 'owner' ? 'Pemilik' : 'Kasir'})`, 'success');
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setCurrentTab('login');
    showToast('Anda telah keluar dari sesi kasir.', 'info');
  };

  // =========================================================
  // SOFTWARE LICENSING & ACTIVATION FLOW
  // =========================================================
  const activateLicenseKey = (
    serialKey: string
  ): { success: boolean; message: string; license?: AppLicense } => {
    const res = LicenseManager.activateLicense(
      currentTenantId,
      serialKey,
      currentUser?.businessName || storeProfile.name
    );
    if (res.success && res.license) {
      setCurrentLicense(res.license);
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
    return res;
  };

  const refreshLicense = () => {
    const lic = LicenseManager.getTenantLicense(
      currentTenantId,
      currentUser?.businessName || storeProfile.name
    );
    setCurrentLicense(lic);
  };

  const openSuperAdminPortal = () => {
    setIsSuperAdminOpen(true);
    window.location.hash = '#superadmin';
  };

  // =========================================================
  // BACKUP & RESTORE JSON ENGINE
  // =========================================================
  const exportBackupJson = (): BackupData => {
    const totalRev = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const backupObj: BackupData = {
      app: 'FinansialPro UMKM',
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      exportedTimestamp: Date.now(),
      exportedBy: currentUser?.fullName || storeProfile.owner,
      store: storeProfile,
      summary: {
        totalProducts: products.length,
        totalCategories: categories.length,
        totalTransactions: transactions.length,
        totalExpenses: expenses.length,
        totalCustomers: customers.length,
        totalRevenue: totalRev,
        totalExpenseAmount: totalExp,
      },
      data: {
        products,
        categories,
        transactions,
        expenses,
        customers,
      },
    };

    return backupObj;
  };

  const restoreBackupJson = (
    backupData: BackupData,
    mode: 'replace' | 'merge' = 'replace'
  ): { success: boolean; message: string } => {
    try {
      if (!backupData || !backupData.data) {
        return { success: false, message: 'Format data cadangan tidak valid.' };
      }

      if (mode === 'replace') {
        if (backupData.data.products) setProducts(backupData.data.products);
        if (backupData.data.categories) setCategories(backupData.data.categories);
        if (backupData.data.transactions) setTransactions(backupData.data.transactions);
        if (backupData.data.expenses) setExpenses(backupData.data.expenses);
        if (backupData.data.customers) setCustomers(backupData.data.customers);
        if (backupData.store) setStoreProfile(backupData.store);
      } else {
        // Merge mode
        if (backupData.data.products) {
          const existingIds = new Set(products.map((p) => p.id));
          const newProds = backupData.data.products.filter((p) => !existingIds.has(p.id));
          setProducts((prev) => [...newProds, ...prev]);
        }
        if (backupData.data.categories) {
          const existingIds = new Set(categories.map((c) => c.id));
          const newCats = backupData.data.categories.filter((c) => !existingIds.has(c.id));
          setCategories((prev) => [...prev, ...newCats]);
        }
        if (backupData.data.transactions) {
          const existingIds = new Set(transactions.map((t) => t.id));
          const newTrxs = backupData.data.transactions.filter((t) => !existingIds.has(t.id));
          setTransactions((prev) => [...newTrxs, ...prev]);
        }
        if (backupData.data.expenses) {
          const existingIds = new Set(expenses.map((e) => e.id));
          const newExps = backupData.data.expenses.filter((e) => !existingIds.has(e.id));
          setExpenses((prev) => [...newExps, ...prev]);
        }
        if (backupData.data.customers) {
          const existingIds = new Set(customers.map((c) => c.id));
          const newCusts = backupData.data.customers.filter((c) => !existingIds.has(c.id));
          setCustomers((prev) => [...prev, ...newCusts]);
        }
      }

      showToast('🎉 Pemulihan data cadangan berhasil!', 'success');
      return { success: true, message: 'Pemulihan data berhasil' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal memulihkan cadangan data.' };
    }
  };

  // =========================================================
  // STORE PROFILE & MASTER DATA ACTIONS
  // =========================================================
  const updateStoreProfile = (newProfile: Partial<StoreProfile>) => {
    setStoreProfile((prev) => ({ ...prev, ...newProfile }));
    showToast('Profil toko berhasil diperbarui', 'success');
  };

  const addCategory = (catData: Omit<CategoryItem, 'id' | 'slug'>) => {
    const slug = catData.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const newId = `CAT-${String(categories.length + 1).padStart(3, '0')}`;
    const newCategory: CategoryItem = {
      ...catData,
      id: newId,
      slug,
      displayOrder: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCategory]);
    showToast(`Kategori "${catData.name}" berhasil ditambahkan`, 'success');
  };

  const updateCategory = (id: string, updated: Partial<CategoryItem>) => {
    const prevCat = categories.find((c) => c.id === id);
    if (prevCat && updated.name && updated.name !== prevCat.name) {
      setProducts((prev) =>
        prev.map((p) =>
          p.category === prevCat.name ? { ...p, category: updated.name! } : p
        )
      );
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    showToast('Kategori berhasil diperbarui', 'success');
  };

  const deleteCategory = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast(`Kategori "${target.name}" telah dihapus`, 'info');
  };

  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newId = `PROD-${String(products.length + 1).padStart(3, '0')}`;
    const newProduct: Product = {
      ...prodData,
      id: newId,
      soldCount: 0,
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Produk "${newProduct.name}" berhasil ditambahkan`, 'success');
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    showToast('Produk berhasil diperbarui', 'success');
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((c) => c.product.id !== id));
    showToast(`Produk "${prod?.name || id}" telah dihapus`, 'info');
  };

  const restockProduct = (id: string, amount: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStock = Math.max(0, p.stock + amount);
          return {
            ...p,
            stock: newStock,
            isAvailable: newStock > 0,
          };
        }
        return p;
      })
    );
    showToast('Stok berhasil diperbarui', 'success');
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0 || !product.isAvailable) {
      showToast(`Stok ${product.name} habis!`, 'warning');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Jumlah pesanan mencapai batas stok (${product.stock})`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product && quantity > product.stock) {
      showToast(`Maksimal stok tersedia adalah ${product.stock}`, 'warning');
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const addExpense = (expData: Omit<ExpenseRecord, 'id' | 'timestamp'>) => {
    const newId = `EXP-${String(expenses.length + 1).padStart(3, '0')}`;
    const newExpense: ExpenseRecord = {
      ...expData,
      id: newId,
      timestamp: Date.now(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    showToast(`Pengeluaran Rp ${expData.amount.toLocaleString()} berhasil dicatat`, 'success');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Catatan pengeluaran berhasil dihapus', 'info');
  };

  const addCustomer = (custData: Omit<Customer, 'id'>): Customer => {
    const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const newCustomer: Customer = {
      ...custData,
      id: newId,
      tier: custData.tier || 'Reguler',
      totalOrders: custData.totalOrders || 0,
      totalSpent: custData.totalSpent || 0,
      points: custData.points || 0,
      debt: custData.debt || 0,
      createdAt: custData.createdAt || new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    showToast(`Pelanggan "${newCustomer.name}" berhasil ditambahkan`, 'success');
    return newCustomer;
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    if (selectedCustomer?.id === id) {
      setSelectedCustomer((prev) => (prev ? { ...prev, ...updated } : null));
    }
    showToast('Data pelanggan berhasil diperbarui', 'success');
  };

  const deleteCustomer = (id: string) => {
    const target = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
    }
    showToast(`Pelanggan "${target?.name || id}" telah dihapus`, 'info');
  };

  const recordCustomerDebtPayment = (customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const currentDebt = c.debt || 0;
          const newDebt = Math.max(0, currentDebt - amount);
          return { ...c, debt: newDebt };
        }
        return c;
      })
    );
    showToast(`Pembayaran piutang Rp ${amount.toLocaleString()} dicatat`, 'success');
  };

  const adjustCustomerPoints = (customerId: string, pointsDelta: number) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const currentPoints = c.points || 0;
          const newPoints = Math.max(0, currentPoints + pointsDelta);
          return { ...c, points: newPoints };
        }
        return c;
      })
    );
    showToast(
      pointsDelta > 0
        ? `+${pointsDelta} Poin ditambahkan ke pelanggan`
        : `${pointsDelta} Poin disesuaikan`,
      'info'
    );
  };

  const processPayment = (method: PaymentMethod, cashGiven?: number): Transaction => {
    const subtotal = cart.reduce(
      (acc, item) => acc + item.product.sellingPrice * item.quantity,
      0
    );
    const tax = Math.round(subtotal * storeProfile.taxRate);
    const discount = 0;
    const total = subtotal + tax - discount;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')} WIB`;
    const orderNum = `#ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(now.getDate()).padStart(2, '0')}-${String(transactions.length + 1).padStart(
      3,
      '0'
    )}`;

    const newTransaction: Transaction = {
      id: `TRX-${String(1000 + transactions.length + 1)}`,
      orderNumber: orderNum,
      date: dateFormatted,
      time: timeFormatted,
      timestamp: Date.now(),
      customer: selectedCustomer || undefined,
      cashierName: cashierName,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.sellingPrice,
        quantity: item.quantity,
        image: item.product.image,
      })),
      subtotal,
      tax,
      discount,
      total,
      paymentMethod: method,
      cashGiven: method === 'Tunai' ? cashGiven || total : undefined,
      change: method === 'Tunai' && cashGiven ? Math.max(0, cashGiven - total) : 0,
      status: 'Selesai',
      type: 'Penjualan',
    };

    // Deduct stock and increment sold count
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((item) => item.product.id === p.id);
        if (cartItem) {
          const newStock = Math.max(0, p.stock - cartItem.quantity);
          return {
            ...p,
            stock: newStock,
            isAvailable: newStock > 0,
            soldCount: (p.soldCount || 0) + cartItem.quantity,
          };
        }
        return p;
      })
    );

    // Update customer spending, loyalty points & order count
    if (selectedCustomer) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === selectedCustomer.id) {
            const newOrders = (c.totalOrders || 0) + 1;
            const newSpent = (c.totalSpent || 0) + total;
            const earnedPoints = Math.floor(total / 10000);
            const newPoints = (c.points || 0) + earnedPoints;

            let updatedTier = c.tier || 'Reguler';
            if (newSpent >= 2500000) {
              updatedTier = 'VIP';
            } else if (newSpent >= 1000000) {
              updatedTier = 'Gold';
            } else if (newSpent >= 350000) {
              updatedTier = 'Silver';
            }

            return {
              ...c,
              totalOrders: newOrders,
              totalSpent: newSpent,
              points: newPoints,
              tier: updatedTier,
              lastOrderDate: dateFormatted,
            };
          }
          return c;
        })
      );
    }

    // Save transaction
    setTransactions((prev) => [newTransaction, ...prev]);

    // Clear cart and prepare receipt
    setCompletedTransaction(newTransaction);
    clearCart();
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
    showToast(`Transaksi ${orderNum} berhasil!`, 'success');

    return newTransaction;
  };

  const reprintReceipt = (trx: Transaction) => {
    setCompletedTransaction(trx);
    setIsReceiptModalOpen(true);
    showToast(`Membuka struk pesanan ${trx.orderNumber} untuk dicetak ulang`, 'info');
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast(`Transaksi ${target?.orderNumber || id} telah dihapus dari riwayat`, 'info');
  };

  const updateTransactionStatus = (
    id: string,
    status: 'Selesai' | 'Dibatalkan' | 'Tertunda'
  ) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    showToast(`Status transaksi diperbarui menjadi "${status}"`, 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        reportSubTab,
        setReportSubTab,
        isMobileSimulation,
        setIsMobileSimulation,
        searchGlobalQuery,
        setSearchGlobalQuery,
        isSidebarOpen,
        setIsSidebarOpen,
        currentUser,
        isAuthenticated: !!currentUser,
        registeredUsers,
        sendVerificationEmail,
        verifyEmailCode,
        resendVerificationCode,
        loginWithCredentials,
        loginAsDemoUser,
        logoutUser,
        isEmailModalOpen,
        setIsEmailModalOpen,
        latestSimulatedEmail,
        storeProfile,
        updateStoreProfile,
        cashierName,
        setCashierName,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        selectedCustomer,
        setSelectedCustomer,
        transactions,
        expenses,
        addExpense,
        deleteExpense,
        deleteTransaction,
        updateTransactionStatus,
        reprintReceipt,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordCustomerDebtPayment,
        adjustCustomerPoints,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        pendingPaymentMethod,
        setPendingPaymentMethod,
        completedTransaction,
        setCompletedTransaction,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        processPayment,
        exportBackupJson,
        restoreBackupJson,
        toasts,
        showToast,
        dismissToast,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        deleteNotification,
        addCustomNotification,
        formatCurrency,
        currentLicense,
        activateLicenseKey,
        refreshLicense,
        isSuperAdminOpen,
        setIsSuperAdminOpen,
        openSuperAdminPortal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

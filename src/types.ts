export type ProductCategory = string;

export type MainTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'categories'
  | 'cashflow'
  | 'reports'
  | 'backup'
  | 'settings'
  | 'about'
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
  minStockAlert?: number;
  image: string;
  isAvailable: boolean;
  soldCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalOrders?: number;
}

export type PaymentMethod = 'QRIS' | 'Tunai' | 'Transfer Bank' | 'Kartu Debit';

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
  status: 'Selesai' | 'Dibatalkan' | 'Tertunda';
  type: 'Penjualan' | 'Penjualan B2B';
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
}

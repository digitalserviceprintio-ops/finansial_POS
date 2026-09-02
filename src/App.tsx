import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { TopHeader } from './components/TopHeader';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';

// Views
import { DashboardView } from './views/DashboardView';
import { POSView } from './views/POSView';
import { TransactionsView } from './views/TransactionsView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { CashflowView } from './views/CashflowView';
import { FinanceReportView } from './views/FinanceReportView';
import { CustomersView } from './views/CustomersView';
import { AboutView } from './views/AboutView';
import { SettingsView } from './views/SettingsView';
import { BackupView } from './views/BackupView';
import { AuthView } from './views/AuthView';
import { SuperAdminView } from './views/SuperAdminView';
import { OrdersQueueView } from './views/OrdersQueueView';
import { CustomerCatalogView } from './views/CustomerCatalogView';
import { GoogleAppsScriptView } from './views/GoogleAppsScriptView';

// Modals
import { PaymentModal } from './components/modals/PaymentModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { EmailInboxSimulationModal } from './components/modals/EmailInboxSimulationModal';
import { CustomerCatalogQRModal } from './components/modals/CustomerCatalogQRModal';
import { PwaInstallModal } from './components/modals/PwaInstallModal';
import { AppLockModal } from './components/modals/AppLockModal';
import { NotificationPopupManager } from './components/NotificationPopupManager';
import { LicenseExpirationAlert } from './components/LicenseExpirationAlert';
import { Footer } from './components/Footer';
import { Product } from './types';

const MainAppContent: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    isMobileSimulation,
    currentUser,
    isSuperAdminOpen,
    setIsSuperAdminOpen,
    isCatalogQRModalOpen,
    setIsCatalogQRModalOpen,
    isPwaInstallModalOpen,
    setIsPwaInstallModalOpen,
    currentLicense,
  } = useApp();

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Secret shortcut for Super Admin (Ctrl+Shift+S or Cmd+Shift+S or hash #superadmin)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsSuperAdminOpen(true);
        window.location.hash = '#superadmin';
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === '#superadmin') {
        setIsSuperAdminOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [setIsSuperAdminOpen]);

  // If Super Admin portal is triggered, show dedicated Super Admin Suite
  if (isSuperAdminOpen) {
    return (
      <div className="min-h-screen bg-[#0f0f14] p-3 sm:p-6 md:p-8 text-[#e2e1ec]">
        <div className="max-w-7xl mx-auto">
          <SuperAdminView
            onExitSuperAdmin={() => {
              setIsSuperAdminOpen(false);
              window.location.hash = '';
            }}
          />
        </div>
        <ToastContainer />
      </div>
    );
  }

  // Direct customer catalog mode (when scanning QR with ?mode=katalog or #katalog)
  const isDirectCatalogMode =
    currentTab === 'customer_catalog' ||
    (typeof window !== 'undefined' &&
      (window.location.hash === '#katalog' ||
        new URLSearchParams(window.location.search).get('mode') === 'katalog'));

  if (isDirectCatalogMode) {
    return (
      <div className="min-h-screen bg-[#f8f9fe]">
        <CustomerCatalogView
          onBackToApp={
            currentUser
              ? () => {
                  setCurrentTab('pos');
                  if (window.location.hash === '#katalog') {
                    window.location.hash = '';
                  }
                }
              : undefined
          }
        />
        <ToastContainer />
      </div>
    );
  }

  // If user is not logged in or in login tab, show full Auth gateway
  if (!currentUser || currentTab === 'login') {
    return (
      <>
        <AuthView />
        <EmailInboxSimulationModal />
        <ToastContainer />
      </>
    );
  }

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsAddProductOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddProductOpen(true);
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <POSView />;
      case 'orders':
        return (
          <OrdersQueueView
            onOpenQRModal={() => setIsCatalogQRModalOpen(true)}
          />
        );
      case 'customer_catalog':
        return (
          <CustomerCatalogView
            onBackToApp={() => setCurrentTab('pos')}
          />
        );
      case 'transactions':
        return <TransactionsView />;
      case 'products':
        return (
          <ProductsView
            onOpenAddModal={handleOpenAddProduct}
            onOpenEditModal={handleOpenEditProduct}
          />
        );
      case 'categories':
        return (
          <CategoriesView
            onOpenAddProductModal={handleOpenAddProduct}
            onOpenEditProductModal={handleOpenEditProduct}
          />
        );
      case 'customers':
        return <CustomersView />;
      case 'cashflow':
        return <CashflowView onOpenAddExpenseModal={() => setIsAddExpenseOpen(true)} />;
      case 'reports':
        return <FinanceReportView onOpenAddExpenseModal={() => setIsAddExpenseOpen(true)} />;
      case 'backup':
        return <BackupView />;
      case 'google_apps_script':
        return <GoogleAppsScriptView />;
      case 'about':
        return <AboutView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf8ff] text-[#1b1b23] font-sans antialiased">
      {/* Top Header */}
      <TopHeader />

      {/* Main Workspace Frame - Responsive Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />

        <main className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-4 md:p-6 lg:p-8 pb-28 lg:pb-8 max-w-7xl mx-auto w-full flex flex-col justify-between">
          <div>
            <LicenseExpirationAlert />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-full"
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Clean Plain Footer */}
          <Footer />
        </main>

        <BottomNav />
      </div>

      {/* Global Modals */}
      <PaymentModal />
      <ReceiptModal />
      <EmailInboxSimulationModal />
      <CustomerCatalogQRModal
        isOpen={isCatalogQRModalOpen}
        onClose={() => setIsCatalogQRModalOpen(false)}
      />
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
      />
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
      <PwaInstallModal
        isOpen={isPwaInstallModalOpen}
        onClose={() => setIsPwaInstallModalOpen(false)}
      />

      {/* Auto-Lock Inactivity Security Pop-up Modal (10 Menit) */}
      <AppLockModal />

      {/* Interactive Global Pop-up Notification Engine */}
      <NotificationPopupManager />

      {/* Global Notifications Toast */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

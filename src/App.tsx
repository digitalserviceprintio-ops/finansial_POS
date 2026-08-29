import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopHeader } from './components/TopHeader';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';

// Views
import { DashboardView } from './views/DashboardView';
import { POSView } from './views/POSView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { CashflowView } from './views/CashflowView';
import { FinanceReportView } from './views/FinanceReportView';
import { AboutView } from './views/AboutView';
import { SettingsView } from './views/SettingsView';
import { BackupView } from './views/BackupView';
import { AuthView } from './views/AuthView';

// Modals
import { PaymentModal } from './components/modals/PaymentModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { EmailInboxSimulationModal } from './components/modals/EmailInboxSimulationModal';
import { Product } from './types';

const MainAppContent: React.FC = () => {
  const { currentTab, isMobileSimulation, currentUser } = useApp();

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

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
      case 'cashflow':
        return <CashflowView onOpenAddExpenseModal={() => setIsAddExpenseOpen(true)} />;
      case 'reports':
        return <FinanceReportView onOpenAddExpenseModal={() => setIsAddExpenseOpen(true)} />;
      case 'backup':
        return <BackupView />;
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

      {/* Main Workspace Frame */}
      {isMobileSimulation ? (
        // Mobile Simulator Frame Mode
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#f0eff8]">
          <div className="relative w-full max-w-[420px] h-[850px] max-h-[92vh] rounded-[42px] border-[10px] border-[#1b1b23] bg-[#fcf8ff] shadow-2xl overflow-hidden flex flex-col">
            {/* Phone Notch / Dynamic Island */}
            <div className="h-6 w-full bg-[#1b1b23] flex items-center justify-center">
              <div className="h-3.5 w-24 rounded-full bg-[#35353f]"></div>
            </div>

            {/* Simulated Content Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {renderActiveView()}
            </div>

            {/* Phone Bottom Navigation */}
            <BottomNav />
          </div>
        </div>
      ) : (
        // Desktop Standard Layout
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </main>

          <BottomNav />
        </div>
      )}

      {/* Global Modals */}
      <PaymentModal />
      <ReceiptModal />
      <EmailInboxSimulationModal />
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

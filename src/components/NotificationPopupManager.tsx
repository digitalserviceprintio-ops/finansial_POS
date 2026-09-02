import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { InteractiveNotificationModal, InteractivePopupData } from './modals/InteractiveNotificationModal';
import { soundManager, sendBrowserNotification } from '../utils/soundAlert';

export const NotificationPopupManager: React.FC = () => {
  const {
    completedTransaction,
    setCompletedTransaction,
    setIsReceiptModalOpen,
    customerOrders,
    products,
    setCurrentTab,
    formatCurrency,
  } = useApp();

  const [activePopup, setActivePopup] = useState<InteractivePopupData | null>(null);

  // Keep track of processed transaction & order IDs to avoid duplicate popups
  const lastProcessedTrxId = useRef<string | null>(null);
  const lastProcessedOrderId = useRef<string | null>(null);
  const lastStockAlertTime = useRef<number>(0);

  // 1. Listen for new completed transaction
  useEffect(() => {
    if (completedTransaction && completedTransaction.id !== lastProcessedTrxId.current) {
      lastProcessedTrxId.current = completedTransaction.id;

      // Play success audio chime
      soundManager.playSuccessChime();

      // Trigger Browser Web Notification
      sendBrowserNotification('Transaksi Kasir Berhasil!', {
        body: `No: ${completedTransaction.invoiceNumber} • Total: ${formatCurrency(completedTransaction.total)} • ${completedTransaction.paymentMethod}`,
      });

      // Show interactive modal popup
      setActivePopup({
        id: completedTransaction.id,
        type: 'success',
        title: 'Transaksi Kasir Berhasil Disimpan!',
        message: `Faktur #${completedTransaction.invoiceNumber} senilai ${formatCurrency(completedTransaction.total)} telah tercatat ke dalam laporan pembukuan.`,
        subMessage: `Kasir: ${completedTransaction.cashierName} • Metode: ${completedTransaction.paymentMethod} • Item: ${completedTransaction.items.length} jenis barang.`,
        actionLabel: 'Cetak Struk Transaksi',
        onAction: () => {
          setIsReceiptModalOpen(true);
        },
        secondaryActionLabel: 'Transaksi Baru',
        onSecondaryAction: () => {
          setCompletedTransaction(null);
        },
      });
    }
  }, [completedTransaction, formatCurrency, setIsReceiptModalOpen, setCompletedTransaction]);

  // 2. Listen for new incoming customer orders (from Catalog QR)
  useEffect(() => {
    const pendingOrders = customerOrders.filter((o) => o.status === 'Menunggu');
    if (pendingOrders.length > 0) {
      const latestOrder = pendingOrders[pendingOrders.length - 1];
      if (latestOrder && latestOrder.id !== lastProcessedOrderId.current) {
        lastProcessedOrderId.current = latestOrder.id;

        // Play alert audio chime
        soundManager.playAlertChime();

        // Browser Web Notification
        sendBrowserNotification('Pesanan Pelanggan Baru Masuk!', {
          body: `Antrian #${latestOrder.queueNumber} oleh ${latestOrder.customerName} (${latestOrder.orderType})`,
        });

        // Show interactive popup
        setActivePopup({
          id: latestOrder.id,
          type: 'order',
          title: `Pesanan Baru Masuk: Antrian #${latestOrder.queueNumber}`,
          message: `Pelanggan ${latestOrder.customerName} baru saja memesan ${latestOrder.items.length} item melalui Menu QR Mandiri.`,
          subMessage: `Tipe: ${latestOrder.orderType} ${latestOrder.tableNumber ? `(Meja ${latestOrder.tableNumber})` : ''} • Total: ${formatCurrency(latestOrder.totalAmount)}`,
          actionLabel: 'Lihat Antrian Pesanan',
          onAction: () => {
            setCurrentTab('pos');
          },
          secondaryActionLabel: 'Tutup',
        });
      }
    }
  }, [customerOrders, formatCurrency, setCurrentTab]);

  return (
    <InteractiveNotificationModal
      data={activePopup}
      onClose={() => setActivePopup(null)}
    />
  );
};

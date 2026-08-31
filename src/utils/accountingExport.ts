import { Transaction, ExpenseRecord, Product, Customer, StoreProfile } from '../types';

export type AccountingReportType =
  | 'sales_journal' // Jurnal Penjualan Lengkap
  | 'profit_loss' // Laporan Laba Rugi Standar Akuntansi
  | 'cashflow_ledger' // Buku Besar Arus Kas & Pengeluaran
  | 'product_sales' // Rekap Penjualan per Produk & Kategori
  | 'all_in_one'; // Master Laporan Akuntansi Lengkap

export type ExportDelimiter = ';' | ',' | '\t';

export interface ExportAccountingOptions {
  reportType: AccountingReportType;
  delimiter: ExportDelimiter;
  startDate?: string;
  endDate?: string;
  dateFilterName?: string;
  storeProfile: StoreProfile;
  transactions: Transaction[];
  expenses: ExpenseRecord[];
  products: Product[];
  customers: Customer[];
  cashierName?: string;
}

/**
 * Escapes a field for standard CSV RFC 4180
 */
function escapeCSVField(val: string | number | undefined | null, delimiter: ExportDelimiter): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  // If delimiter is tab, clean up any internal tabs or newlines
  if (delimiter === '\t') {
    return str.replace(/[\t\r\n]/g, ' ');
  }
  // Check if quoting is needed
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a single CSV row from an array of values
 */
function buildRow(cells: (string | number | undefined | null)[], delimiter: ExportDelimiter): string {
  return cells.map((c) => escapeCSVField(c, delimiter)).join(delimiter);
}

/**
 * Formats a clean date string for filenames
 */
export function getReportDateSuffix(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${mins}`;
}

/**
 * Generates structured accounting CSV string with UTF-8 BOM
 */
export function generateAccountingCSV(options: ExportAccountingOptions): { csvContent: string; filename: string; title: string } {
  const {
    reportType,
    delimiter,
    startDate,
    endDate,
    dateFilterName = 'Semua Periode',
    storeProfile,
    transactions,
    expenses,
    products,
    customers,
    cashierName = 'Admin',
  } = options;

  // Filter transactions and expenses by date if specified
  const filteredTrx = transactions.filter((t) => {
    if (t.status === 'Dibatalkan') return false;
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  const rows: string[] = [];
  const generatedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Calculate global summary values
  const totalSalesRevenue = filteredTrx.reduce((acc, t) => acc + t.total, 0);
  const totalSubtotal = filteredTrx.reduce((acc, t) => acc + t.subtotal, 0);
  const totalTax = filteredTrx.reduce((acc, t) => acc + t.tax, 0);
  const totalDiscount = filteredTrx.reduce((acc, t) => acc + t.discount, 0);
  const totalExpensesAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Estimate total COGS / HPP
  const totalHPP = filteredTrx.reduce((acc, t) => {
    return (
      acc +
      t.items.reduce((itemAcc, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const buyPrice = prod ? prod.purchasePrice : Math.round(item.price * 0.65);
        return itemAcc + buyPrice * item.quantity;
      }, 0)
    );
  }, 0);

  const grossProfit = totalSalesRevenue - totalHPP;
  const netProfit = grossProfit - totalExpensesAmount;
  const grossMarginPct = totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(2) : '0.00';
  const netMarginPct = totalSalesRevenue > 0 ? ((netProfit / totalSalesRevenue) * 100).toFixed(2) : '0.00';

  // Header helper function
  const addReportHeader = (reportTitle: string) => {
    rows.push(buildRow(['LAPORAN KEUANGAN & AKUNTANSI', storeProfile.name.toUpperCase()], delimiter));
    rows.push(buildRow(['Cabang / Alamat', `${storeProfile.branch || 'Pusat'} - ${storeProfile.address || ''}`], delimiter));
    rows.push(buildRow(['Jenis Laporan', reportTitle], delimiter));
    rows.push(buildRow(['Periode', dateFilterName], delimiter));
    rows.push(buildRow(['Tanggal Cetak', generatedAt], delimiter));
    rows.push(buildRow(['Dicetak Oleh', cashierName], delimiter));
    rows.push(buildRow(['Mata Uang', 'IDR (Rupiah)'], delimiter));
    rows.push(''); // Empty line before table
  };

  let filename = '';
  let title = '';

  // -------------------------------------------------------------
  // 1. JURNAL PENJUALAN LENGKAP (SALES JOURNAL)
  // -------------------------------------------------------------
  if (reportType === 'sales_journal') {
    title = 'Buku Jurnal Penjualan & Pendapatan';
    filename = `Jurnal_Penjualan_${storeProfile.name.replace(/\s+/g, '_')}_${getReportDateSuffix()}.csv`;
    addReportHeader(title);

    // Table Header
    const headers = [
      'No',
      'Tanggal',
      'Waktu',
      'No. Invoice / Pesanan',
      'Kasir',
      'Pelanggan',
      'No. Kontak',
      'Tier Member',
      'Metode Pembayaran',
      'Daftar Produk / Menu Dibeli',
      'Total Qty',
      'Subtotal (Rp)',
      'Diskon (Rp)',
      'Pajak (Rp)',
      'Total Omzet (Rp)',
      'Estimasi HPP (Rp)',
      'Laba Kotor (Rp)',
      'Margin Laba (%)',
      'Status',
    ];
    rows.push(buildRow(headers, delimiter));

    // Data Rows
    filteredTrx.forEach((trx, idx) => {
      const itemsDetail = trx.items
        .map((i) => `${i.productName} (${i.quantity}x @${i.price})`)
        .join('; ');
      const totalQty = trx.items.reduce((q, i) => q + i.quantity, 0);

      const trxHPP = trx.items.reduce((acc, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const buyPrice = prod ? prod.purchasePrice : Math.round(item.price * 0.65);
        return acc + buyPrice * item.quantity;
      }, 0);

      const trxGrossProfit = trx.total - trxHPP;
      const marginPct = trx.total > 0 ? ((trxGrossProfit / trx.total) * 100).toFixed(1) : '0.0';

      rows.push(
        buildRow(
          [
            idx + 1,
            trx.date,
            trx.time,
            trx.orderNumber,
            trx.cashierName || 'Kasir',
            trx.customer?.name || 'Pelanggan Umum',
            trx.customer?.phone || '-',
            trx.customer?.tier || 'Reguler',
            trx.paymentMethod,
            itemsDetail,
            totalQty,
            trx.subtotal,
            trx.discount,
            trx.tax,
            trx.total,
            trxHPP,
            trxGrossProfit,
            `${marginPct}%`,
            trx.status,
          ],
          delimiter
        )
      );
    });

    // Grand Total Row
    rows.push('');
    rows.push(
      buildRow(
        [
          'TOTAL',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          `${filteredTrx.length} Transaksi`,
          filteredTrx.reduce((acc, t) => acc + t.items.reduce((q, i) => q + i.quantity, 0), 0),
          totalSubtotal,
          totalDiscount,
          totalTax,
          totalSalesRevenue,
          totalHPP,
          grossProfit,
          `${grossMarginPct}%`,
          'SELESAI',
        ],
        delimiter
      )
    );
  }

  // -------------------------------------------------------------
  // 2. LAPORAN LABA RUGI STANDAR AKUNTANSI (PROFIT & LOSS / P&L)
  // -------------------------------------------------------------
  else if (reportType === 'profit_loss') {
    title = 'Laporan Laba Rugi Komprehensif';
    filename = `Laporan_Laba_Rugi_${storeProfile.name.replace(/\s+/g, '_')}_${getReportDateSuffix()}.csv`;
    addReportHeader(title);

    rows.push(buildRow(['KODE AKUN', 'KOMPONEN AKUNTANSI / POS KEUANGAN', 'NOMINAL (RP)', 'PERSENTASE (%)'], delimiter));
    rows.push(buildRow(['---', '--- PENDAPATAN USAHA (REVENUE) ---', '---', '---'], delimiter));
    rows.push(buildRow(['4-1000', 'Pendapatan Penjualan Bersih (Sales)', totalSalesRevenue, '100.00%'], delimiter));
    if (totalDiscount > 0) {
      rows.push(buildRow(['4-1010', 'Potongan / Diskon Penjualan', -totalDiscount, `${((totalDiscount / (totalSalesRevenue || 1)) * 100).toFixed(2)}%`], delimiter));
    }
    if (totalTax > 0) {
      rows.push(buildRow(['2-2000', 'Pajak Pertambahan Nilai (PPN Terkumpul)', totalTax, `${((totalTax / (totalSalesRevenue || 1)) * 100).toFixed(2)}%`], delimiter));
    }
    rows.push(buildRow(['TOTAL PENDAPATAN', 'Total Penerimaan Kas Penjualan', totalSalesRevenue, '100.00%'], delimiter));

    rows.push('');
    rows.push(buildRow(['---', '--- HARGA POKOK PENJUALAN (COGS / HPP) ---', '---', '---'], delimiter));
    rows.push(buildRow(['5-1000', 'Harga Pokok Penjualan (HPP Bahan & Produk)', -totalHPP, `${((totalHPP / (totalSalesRevenue || 1)) * 100).toFixed(2)}%`], delimiter));
    rows.push(buildRow(['LABA KOTOR', 'LABA KOTOR OPERASIONAL (GROSS PROFIT)', grossProfit, `${grossMarginPct}%`], delimiter));

    rows.push('');
    rows.push(buildRow(['---', '--- BEBAN OPERASIONAL & BIAYA USAHA ---', '---', '---'], delimiter));

    const expenseCategories = [
      { code: '6-1000', name: 'Bahan Baku' },
      { code: '6-2000', name: 'Gaji Karyawan' },
      { code: '6-3000', name: 'Sewa Tempat' },
      { code: '6-4000', name: 'Utilitas (Listrik, Air, Internet)' },
      { code: '6-5000', name: 'Pemasaran & Iklan' },
      { code: '6-6000', name: 'Operasional' },
      { code: '6-9000', name: 'Lainnya' },
    ];

    expenseCategories.forEach((cat) => {
      const catAmount = filteredExpenses
        .filter((e) => e.category === cat.name || (cat.name.startsWith('Utilitas') && e.category === 'Utilitas'))
        .reduce((sum, e) => sum + e.amount, 0);

      const catPct = totalSalesRevenue > 0 ? ((catAmount / totalSalesRevenue) * 100).toFixed(2) : '0.00';
      rows.push(buildRow([cat.code, `Beban ${cat.name}`, -catAmount, `${catPct}%`], delimiter));
    });

    rows.push(buildRow(['TOTAL BEBAN', 'TOTAL BEBAN OPERASIONAL', -totalExpensesAmount, `${((totalExpensesAmount / (totalSalesRevenue || 1)) * 100).toFixed(2)}%`], delimiter));

    rows.push('');
    rows.push(buildRow(['====================', '========================================', '====================', '=========='], delimiter));
    rows.push(
      buildRow(
        [
          netProfit >= 0 ? 'LABA BERSIH (NET)' : 'RUGI BERSIH',
          netProfit >= 0 ? 'LABA BERSIH USAHA (NET PROFIT)' : 'DEFISIT RUGI BERSIH',
          netProfit,
          `${netMarginPct}%`,
        ],
        delimiter
      )
    );
    rows.push(buildRow(['====================', '========================================', '====================', '=========='], delimiter));
  }

  // -------------------------------------------------------------
  // 3. BUKU BESAR ARUS KAS & PENGELUARAN (CASHFLOW LEDGER)
  // -------------------------------------------------------------
  else if (reportType === 'cashflow_ledger') {
    title = 'Buku Besar Arus Kas & Jurnal Mutasi';
    filename = `Buku_Kas_${storeProfile.name.replace(/\s+/g, '_')}_${getReportDateSuffix()}.csv`;
    addReportHeader(title);

    const headers = [
      'No',
      'Tanggal',
      'Waktu',
      'No. Referensi / Bukti',
      'Jenis Mutasi',
      'Kategori Akun',
      'Keterangan / Uraian',
      'Pihak Terkait (Customer/Vendor)',
      'Metode Pembayaran / Kas',
      'Kas Masuk / Debit (Rp)',
      'Kas Keluar / Kredit (Rp)',
      'Saldo Kumulatif (Rp)',
    ];
    rows.push(buildRow(headers, delimiter));

    // Combine into chronological events
    const inEvents = filteredTrx.map((t) => ({
      date: t.date,
      time: t.time,
      timestamp: t.timestamp,
      ref: t.orderNumber,
      type: 'Kas Masuk (Debit)',
      category: 'Penjualan Kasir POS',
      desc: `Penjualan ${t.items.length} macam item (${t.paymentMethod})`,
      party: t.customer?.name || 'Pelanggan Umum',
      method: t.paymentMethod,
      debit: t.total,
      credit: 0,
    }));

    const outEvents = filteredExpenses.map((e) => ({
      date: e.date,
      time: e.time,
      timestamp: e.timestamp,
      ref: e.refNumber || `EXP-${e.id.slice(0, 6)}`,
      type: 'Kas Keluar (Kredit)',
      category: `Beban ${e.category}`,
      desc: e.description,
      party: e.recipient || 'Operasional Toko',
      method: 'Kas Tunai / Bank',
      debit: 0,
      credit: e.amount,
    }));

    const sortedEvents = [...inEvents, ...outEvents].sort((a, b) => a.timestamp - b.timestamp);

    let runningBalance = 0;
    sortedEvents.forEach((ev, idx) => {
      runningBalance += ev.debit - ev.credit;
      rows.push(
        buildRow(
          [
            idx + 1,
            ev.date,
            ev.time,
            ev.ref,
            ev.type,
            ev.category,
            ev.desc,
            ev.party,
            ev.method,
            ev.debit,
            ev.credit,
            runningBalance,
          ],
          delimiter
        )
      );
    });

    rows.push('');
    rows.push(
      buildRow(
        [
          'TOTAL MUTASI',
          '',
          '',
          '',
          '',
          '',
          `${sortedEvents.length} Catatan Mutasi`,
          '',
          '',
          totalSalesRevenue,
          totalExpensesAmount,
          runningBalance,
        ],
        delimiter
      )
    );
  }

  // -------------------------------------------------------------
  // 4. REKAP PENJUALAN PER PRODUK & KATEGORI (PRODUCT SALES SUMMARY)
  // -------------------------------------------------------------
  else if (reportType === 'product_sales') {
    title = 'Rekapitulasi Kinerja Penjualan Produk & Profit Margin';
    filename = `Rekap_Produk_${storeProfile.name.replace(/\s+/g, '_')}_${getReportDateSuffix()}.csv`;
    addReportHeader(title);

    const headers = [
      'Peringkat',
      'Kode SKU',
      'Nama Produk / Menu',
      'Kategori',
      'Harga Beli / HPP Satuan (Rp)',
      'Harga Jual Satuan (Rp)',
      'Margin Satuan (Rp)',
      'Total Terjual (Qty)',
      'Total Omzet Penjualan (Rp)',
      'Total HPP Produk (Rp)',
      'Total Laba Kotor (Rp)',
      'Margin Keuntungan (%)',
      'Sisa Stok Fisik',
    ];
    rows.push(buildRow(headers, delimiter));

    // Calculate actual sales per product from transactions
    const productSalesMap = new Map<string, { qty: number; revenue: number }>();
    filteredTrx.forEach((trx) => {
      trx.items.forEach((item) => {
        const existing = productSalesMap.get(item.productId) || { qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.price * item.quantity;
        productSalesMap.set(item.productId, existing);
      });
    });

    const sortedProducts = [...products].sort((a, b) => {
      const salesA = productSalesMap.get(a.id)?.revenue || (a.soldCount || 0) * a.sellingPrice;
      const salesB = productSalesMap.get(b.id)?.revenue || (b.soldCount || 0) * b.sellingPrice;
      return salesB - salesA;
    });

    let grandQty = 0;
    let grandRevenue = 0;
    let grandHPP = 0;
    let grandGross = 0;

    sortedProducts.forEach((p, idx) => {
      const salesData = productSalesMap.get(p.id);
      const qtySold = salesData ? salesData.qty : p.soldCount || 0;
      const revenue = salesData ? salesData.revenue : qtySold * p.sellingPrice;
      const totalItemHPP = qtySold * p.purchasePrice;
      const totalItemGross = revenue - totalItemHPP;
      const unitMargin = p.sellingPrice - p.purchasePrice;
      const marginPct = revenue > 0 ? ((totalItemGross / revenue) * 100).toFixed(1) : '0.0';

      grandQty += qtySold;
      grandRevenue += revenue;
      grandHPP += totalItemHPP;
      grandGross += totalItemGross;

      rows.push(
        buildRow(
          [
            idx + 1,
            p.sku,
            p.name,
            p.category,
            p.purchasePrice,
            p.sellingPrice,
            unitMargin,
            qtySold,
            revenue,
            totalItemHPP,
            totalItemGross,
            `${marginPct}%`,
            p.stock,
          ],
          delimiter
        )
      );
    });

    const grandMarginPct = grandRevenue > 0 ? ((grandGross / grandRevenue) * 100).toFixed(1) : '0.0';
    rows.push('');
    rows.push(
      buildRow(
        [
          'TOTAL',
          '',
          `${sortedProducts.length} Macam Produk`,
          '',
          '',
          '',
          '',
          grandQty,
          grandRevenue,
          grandHPP,
          grandGross,
          `${grandMarginPct}%`,
          products.reduce((acc, p) => acc + p.stock, 0),
        ],
        delimiter
      )
    );
  }

  // -------------------------------------------------------------
  // 5. MASTER LAPORAN LENGKAP AKUNTANSI (ALL IN ONE)
  // -------------------------------------------------------------
  else {
    title = 'Master Laporan Akuntansi Terpadu (All-in-One)';
    filename = `Master_Akuntansi_${storeProfile.name.replace(/\s+/g, '_')}_${getReportDateSuffix()}.csv`;
    addReportHeader(title);

    // Section 1: Executive Summary
    rows.push(buildRow(['=== RINGKASAN EKSEKUTIF KEUANGAN ===', '', '', ''], delimiter));
    rows.push(buildRow(['Total Omzet Penjualan (Gross Sales)', totalSalesRevenue, 'IDR', ''], delimiter));
    rows.push(buildRow(['Total Potongan Diskon', totalDiscount, 'IDR', ''], delimiter));
    rows.push(buildRow(['Total PPN Terkumpul', totalTax, 'IDR', ''], delimiter));
    rows.push(buildRow(['Total Harga Pokok Penjualan (HPP)', totalHPP, 'IDR', ''], delimiter));
    rows.push(buildRow(['Laba Kotor Usaha (Gross Profit)', grossProfit, 'IDR', `${grossMarginPct}% Margin`], delimiter));
    rows.push(buildRow(['Total Beban Operasional', totalExpensesAmount, 'IDR', ''], delimiter));
    rows.push(buildRow(['Laba Bersih Usaha (Net Profit)', netProfit, 'IDR', `${netMarginPct}% Net Margin`], delimiter));
    rows.push('');

    // Section 2: Profit & Loss Table
    rows.push(buildRow(['=== LAPORAN LABA RUGI ===', '', '', ''], delimiter));
    rows.push(buildRow(['KODE', 'POS AKUN', 'NOMINAL (RP)', 'PERSENTASE (%)'], delimiter));
    rows.push(buildRow(['4-1000', 'Pendapatan Penjualan Bersih', totalSalesRevenue, '100.00%'], delimiter));
    rows.push(buildRow(['5-1000', 'Harga Pokok Penjualan (HPP)', -totalHPP, `${((totalHPP / (totalSalesRevenue || 1)) * 100).toFixed(2)}%`], delimiter));
    rows.push(buildRow(['GROSS', 'LABA KOTOR', grossProfit, `${grossMarginPct}%`], delimiter));
    rows.push(buildRow(['6-0000', 'Beban Operasional Total', -totalExpensesAmount, `${((totalExpensesAmount / (totalSalesRevenue || 1)) * 100).toFixed(2)}%`], delimiter));
    rows.push(buildRow(['NET', 'LABA BERSIH AKHIR', netProfit, `${netMarginPct}%`], delimiter));
    rows.push('');

    // Section 3: Sales Table Brief
    rows.push(buildRow(['=== JURNAL TRANSAKSI PENJUALAN ===', '', '', '', '', '', '', '', ''], delimiter));
    rows.push(
      buildRow(
        ['No', 'Tanggal', 'No. Invoice', 'Pelanggan', 'Metode Bayar', 'Subtotal', 'Diskon', 'Pajak', 'Total (Rp)'],
        delimiter
      )
    );
    filteredTrx.slice(0, 100).forEach((trx, i) => {
      rows.push(
        buildRow(
          [
            i + 1,
            `${trx.date} ${trx.time}`,
            trx.orderNumber,
            trx.customer?.name || 'Umum',
            trx.paymentMethod,
            trx.subtotal,
            trx.discount,
            trx.tax,
            trx.total,
          ],
          delimiter
        )
      );
    });
  }

  // Prepend UTF-8 BOM (\uFEFF) to ensure Microsoft Excel and spreadsheet tools open seamlessly with correct column division and encoding
  const csvContent = '\uFEFF' + rows.join('\r\n');

  return {
    csvContent,
    filename,
    title,
  };
}

/**
 * Initiates direct browser download of the CSV blob
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

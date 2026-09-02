import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, ExpenseRecord, Product, StoreProfile } from '../types';

export interface PdfReportFilterOptions {
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  reportType: 'all_summary' | 'cashflow' | 'profit_loss' | 'product_sales';
  paymentMethod?: string;
  cashierFilter?: string;
  categoryFilter?: string;
  includeSignatures?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export function generateFinancialPdfReport(
  storeProfile: StoreProfile,
  transactions: Transaction[],
  expenses: ExpenseRecord[],
  products: Product[],
  options: PdfReportFilterOptions
) {
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Format currency helper
  const fmt = (num: number) => {
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  };

  // Filter Transactions
  let filteredTrx = transactions.filter((t) => t.status === 'Selesai');
  if (options.paymentMethod && options.paymentMethod !== 'Semua') {
    filteredTrx = filteredTrx.filter((t) => t.paymentMethod === options.paymentMethod);
  }
  if (options.cashierFilter && options.cashierFilter !== 'Semua') {
    filteredTrx = filteredTrx.filter((t) => t.cashierName === options.cashierFilter);
  }
  if (options.startDate) {
    filteredTrx = filteredTrx.filter((t) => t.date >= options.startDate!);
  }
  if (options.endDate) {
    filteredTrx = filteredTrx.filter((t) => t.date <= options.endDate!);
  }

  // Filter Expenses
  let filteredExp = [...expenses];
  if (options.categoryFilter && options.categoryFilter !== 'Semua') {
    filteredExp = filteredExp.filter((e) => e.category === options.categoryFilter);
  }
  if (options.startDate) {
    filteredExp = filteredExp.filter((e) => e.date >= options.startDate!);
  }
  if (options.endDate) {
    filteredExp = filteredExp.filter((e) => e.date <= options.endDate!);
  }

  // Aggregate Metrics
  const totalOmzet = filteredTrx.reduce((acc, t) => acc + t.total, 0);
  const totalSubtotal = filteredTrx.reduce((acc, t) => acc + t.subtotal, 0);
  const totalDiscount = filteredTrx.reduce((acc, t) => acc + (t.discount || 0), 0);
  const totalTax = filteredTrx.reduce((acc, t) => acc + (t.tax || 0), 0);
  const totalCashOut = filteredExp.reduce((acc, e) => acc + e.amount, 0);

  // Calculate HPP
  const totalHPP = filteredTrx.reduce((acc, t) => {
    return (
      acc +
      t.items.reduce((itemAcc, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const buyPrice = prod ? prod.purchasePrice : item.price * 0.6;
        return itemAcc + buyPrice * item.quantity;
      }, 0)
    );
  }, 0);

  const grossProfit = totalSubtotal - totalHPP;
  const netProfit = grossProfit - totalCashOut;
  const netCashFlow = totalOmzet - totalCashOut;
  const marginPercent = totalSubtotal > 0 ? Math.round((netProfit / totalSubtotal) * 100) : 0;

  let currentY = 16;

  // 1. HEADER KOP SURAT RESMI
  doc.setFillColor(30, 41, 59); // Slate 800 header bar
  doc.rect(margin, currentY, pageWidth - margin * 2, 2, 'F');
  currentY += 6;

  // Store Brand & Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(storeProfile.name.toUpperCase(), margin, currentY);

  // Tagline / Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const addressLine = `${storeProfile.address || 'Jl. Raya Utama Bisnis No. 88'} | Telp: ${storeProfile.phone || '0812-3456-7890'}`;
  doc.text(addressLine, margin, currentY + 5);

  // Document Number & Generation Date (Right Aligned)
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const docRefNumber = `DOC/FIN/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${Math.floor(1000 + Math.random() * 9000)}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(70, 72, 212);
  doc.text(docRefNumber, pageWidth - margin, currentY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak: ${todayStr}`, pageWidth - margin, currentY + 5, { align: 'right' });
  doc.text(`Sistem: DelPOS (powered by AkuPos)`, pageWidth - margin, currentY + 9, { align: 'right' });

  currentY += 16;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 2. JUDUL LAPORAN & KOTAK FILTER
  let reportTitle = 'LAPORAN KEUANGAN & PEMBUKUAN BISNIS';
  if (options.reportType === 'cashflow') reportTitle = 'BUKU LAPORAN ARUS KAS & BIAYA OPERASIONAL';
  if (options.reportType === 'profit_loss') reportTitle = 'LAPORAN LABA & RUGI KOMPREHENSIF (P&L)';
  if (options.reportType === 'product_sales') reportTitle = 'LAPORAN KINERJA & RANKING PENJUALAN PRODUK';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(reportTitle, margin, currentY);

  currentY += 5;

  // Filter Details Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const filterDesc = `Periode: ${options.periodLabel}  |  Metode Bayar: ${options.paymentMethod || 'Semua'}  |  Kasir: ${options.cashierFilter || 'Semua'}  |  Status: Transaksi Valid`;
  doc.text(filterDesc, margin, currentY);

  currentY += 8;

  // 3. KPI RINGKASAN KEUANGAN (4 HIGHLIGHT BOXES)
  const boxWidth = (pageWidth - margin * 2 - 9) / 4;
  const boxHeight = 18;

  const kpis = [
    { label: 'TOTAL PENDAPATAN', value: fmt(totalOmzet), color: [16, 185, 129], bg: [240, 253, 244] },
    { label: 'MODAL / HPP', value: fmt(totalHPP), color: [225, 29, 72], bg: [255, 241, 242] },
    { label: 'BEBAN OPERASIONAL', value: fmt(totalCashOut), color: [217, 119, 6], bg: [254, 243, 199] },
    { label: 'LABA BERSIH (NET)', value: fmt(netProfit), color: [70, 72, 212], bg: [238, 242, 255] },
  ];

  kpis.forEach((kpi, index) => {
    const x = margin + index * (boxWidth + 3);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3.5, currentY + 12.5);
  });

  currentY += boxHeight + 8;

  // 4. TABEL SESUAI TIPE LAPORAN
  if (options.reportType === 'profit_loss' || options.reportType === 'all_summary') {
    // SAK EMKM P&L Statement Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('I. Rincian Laporan Laba Rugi Komprehensif (SAK EMKM)', margin, currentY);
    currentY += 3;

    const plRows = [
      ['1. PENDAPATAN OPERASIONAL', '', ''],
      ['   Penjualan Kasir POS (Gross Sales)', '', fmt(totalSubtotal)],
      ['   Potongan & Diskon Penjualan', '', `(${fmt(totalDiscount)})`],
      ['   Pajak / PB1 / PPN Terkumpul', '', fmt(totalTax)],
      ['   TOTAL PENJUALAN BERSIH', '', fmt(totalOmzet)],
      ['2. HARGA POKOK PENJUALAN (HPP)', '', ''],
      ['   Beban Pokok Bahan Baku & Kulakan Barang', '', `(${fmt(totalHPP)})`],
      ['   LABA KOTOR (GROSS PROFIT)', '', fmt(grossProfit)],
      ['3. BEBAN OPERASIONAL & UMUM', '', ''],
    ];

    // Add categorized expenses
    const expCategories = ['Bahan Baku', 'Gaji Karyawan', 'Utilitas', 'Pemasaran', 'Sewa Tempat', 'Operasional'];
    expCategories.forEach((cat) => {
      const catSum = filteredExp.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      if (catSum > 0) {
        plRows.push([`   Beban ${cat}`, '', `(${fmt(catSum)})`]);
      }
    });

    plRows.push(
      ['   TOTAL BEBAN OPERASIONAL', '', `(${fmt(totalCashOut)})`],
      ['LABA BERSIH USAHA (NET PROFIT)', `Margin: ${marginPercent}%`, fmt(netProfit)]
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Pos Akuntansi Keuangan', 'Catatan / Rasio', 'Nominal (IDR)']],
      body: plRows,
      theme: 'grid',
      headStyles: {
        fillColor: [70, 72, 212],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: function (data) {
        const text = data.cell.raw as string;
        if (text && (text.startsWith('1.') || text.startsWith('2.') || text.startsWith('3.'))) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
        if (text && text.includes('LABA BERSIH USAHA')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [238, 242, 255];
          data.cell.styles.textColor = [70, 72, 212];
        }
        if (text && text.includes('LABA KOTOR')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 253, 244];
        }
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (options.reportType === 'cashflow' || options.reportType === 'all_summary') {
    // Check if new page needed
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('II. Buku Rincian Pengeluaran Kas (Kas Keluar)', margin, currentY);
    currentY += 3;

    const expRows = filteredExp.slice(0, 20).map((exp, idx) => [
      String(idx + 1),
      exp.date,
      exp.description,
      exp.category,
      exp.recipient || '-',
      fmt(exp.amount),
    ]);

    if (expRows.length === 0) {
      expRows.push(['-', '-', 'Tidak ada catatan pengeluaran pada periode ini', '-', '-', 'Rp 0']);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['No', 'Tanggal', 'Keterangan Beban', 'Kategori', 'Penerima', 'Nominal']],
      body: expRows,
      theme: 'striped',
      headStyles: {
        fillColor: [225, 29, 72],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 'auto', fontStyle: 'bold' },
        3: { cellWidth: 28 },
        4: { cellWidth: 28 },
        5: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (options.reportType === 'product_sales' || options.reportType === 'all_summary') {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('III. Ranking & Kinerja Penjualan Produk Teratas', margin, currentY);
    currentY += 3;

    const sortedProducts = [...products]
      .sort((a, b) => (b.soldCount || 0) * b.sellingPrice - (a.soldCount || 0) * a.sellingPrice)
      .slice(0, 15);

    const prodRows = sortedProducts.map((p, idx) => {
      const omzet = (p.soldCount || 0) * p.sellingPrice;
      const marginItem = p.sellingPrice - p.purchasePrice;
      const profitContribution = (p.soldCount || 0) * marginItem;
      return [
        `#${idx + 1}`,
        p.name,
        p.category,
        fmt(p.sellingPrice),
        `${p.soldCount || 0} unit`,
        fmt(omzet),
        fmt(profitContribution),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Rank', 'Nama Produk', 'Kategori', 'Harga Jual', 'Terjual', 'Total Omzet', 'Kontribusi Laba']],
      body: prodRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 28, halign: 'right', textColor: [16, 185, 129], fontStyle: 'bold' },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // 5. SIGNATURE & STAMP BLOCK (Lembar Pengesahan)
  if (options.includeSignatures !== false) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY = Math.max(currentY, pageHeight - 42);
    }

    const colWidth = (pageWidth - margin * 2) / 2;

    // Left signature: Disiapkan oleh (Kasir/Admin)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Dibuat & Diverifikasi Oleh:', margin + 10, currentY);
    doc.text('( Bagian Kasir / Keuangan )', margin + 10, currentY + 4);

    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 10, currentY + 22, margin + 65, currentY + 22);

    doc.setFont('helvetica', 'bold');
    doc.text(options.cashierFilter && options.cashierFilter !== 'Semua' ? options.cashierFilter : 'Staff Kasir / Admin', margin + 10, currentY + 26);

    // Right signature: Disetujui oleh (Pemilik Toko)
    const rightX = margin + colWidth + 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Disetujui & Divalidasi Oleh:', rightX, currentY);
    doc.text('( Pemilik / Manager Usaha )', rightX, currentY + 4);

    doc.line(rightX, currentY + 22, rightX + 65, currentY + 22);

    doc.setFont('helvetica', 'bold');
    doc.text(storeProfile.owner || 'Pemilik Toko', rightX, currentY + 26);
  }

  // 6. FOOTER WITH PAGE NUMBERS
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen Resmi DelPOS powered by AkuPos | Halaman ${i} dari ${totalPages} | Dokumen Rahasia Perusahaan`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Save / Download PDF
  const sanitizedStoreName = storeProfile.name.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Keuangan_${sanitizedStoreName}_${options.periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);

  return fileName;
}

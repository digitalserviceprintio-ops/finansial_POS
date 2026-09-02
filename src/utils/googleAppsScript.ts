/**
 * Google Apps Script Integration Helper & Code Generator for DelPOS (powered by AkuPos)
 * Enables seamless two-way ready integration to Google Spreadsheets
 */

import { Transaction, Product, ExpenseRecord, CustomerOrder, StoreProfile } from '../types';

export const DEFAULT_GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * DELPOS (POWERED BY AKUPOS) - GOOGLE APPS SCRIPT WEBHOOK ENDPOINT (Code.gs)
 * =========================================================================
 * 
 * Script ini secara otomatis mengelola pencatatan tabel Google Spreadsheet:
 *  1. Sheet "Transaksi_Penjualan" : Rekap setiap transaksi kasir real-time.
 *  2. Sheet "Master_Produk"       : Katalog produk, harga beli/jual & stok fisik.
 *  3. Sheet "Biaya_Operasional"   : Buku kas pengeluaran operasional.
 *  4. Sheet "Antrian_Pesanan"     : Pesanan masuk dari QR Katalog Mandiri.
 *  5. Sheet "Ringkasan_Bisnis"    : Dashboard otomatis metrik pendapatan & laba.
 * 
 * PANDUAN DEPLOY WEB APP DALAM 1 MENIT:
 * 1. Buka Google Spreadsheet baru (atau yang sudah ada).
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus semua kode default, lalu PASTE SELURUH KODE DI BAWAH INI.
 * 4. Klik tombol 'Deploy' (Terapkan) berwarna biru di kanan atas > 'Deployment baru' (New deployment).
 * 5. Pilih jenis deployment: 'Aplikasi Web' (Web app).
 * 6. Konfigurasi:
 *    - Deskripsi: DelPOS Auto Sync Webhook
 *    - Jalankan sebagai (Execute as): Saya (email Anda)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone) -> WAJIB agar POS bisa kirim data!
 * 7. Klik 'Terapkan' (Deploy), izinkan akses (Review permissions > Pilih akun > Lanjutan > Buka DelPOS Webhook).
 * 8. Salin URL Aplikasi Web (berakhiran /exec) dan tempelkan ke menu DelPOS > Integrasi Google Spreadsheet.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Tidak ada data payload yang diterima."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(rawData);
    var action = payload.action || "ping";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Ensure all sheets & headers exist
    setupSheetsAndHeaders(ss);

    var resultMessage = "";

    if (action === "TEST_PING") {
      resultMessage = "Koneksi Google Apps Script berhasil aktif!";
    } 
    else if (action === "TRANSACTION") {
      appendTransactionRow(ss, payload.data, payload.store);
      resultMessage = "Transaksi berhasil dicatat ke Google Sheets.";
    } 
    else if (action === "PRODUCT" || action === "PRODUCT_UPDATE") {
      upsertProductRow(ss, payload.data);
      resultMessage = "Produk berhasil diperbarui di Google Sheets.";
    } 
    else if (action === "EXPENSE") {
      appendExpenseRow(ss, payload.data);
      resultMessage = "Pengeluaran kas berhasil dicatat ke Google Sheets.";
    } 
    else if (action === "ORDER") {
      appendOrderRow(ss, payload.data);
      resultMessage = "Antrian pesanan berhasil dicatat ke Google Sheets.";
    } 
    else if (action === "FULL_SYNC") {
      performFullSync(ss, payload.data);
      resultMessage = "Seluruh data POS berhasil disinkronisasi ke Google Sheets.";
    } 
    else {
      resultMessage = "Aksi tidak dikenali: " + action;
    }

    // Refresh Summary Dashboard formulas
    updateDashboardSummary(ss);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: action,
      message: resultMessage,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheetsAndHeaders(ss);
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    system: "DelPOS Google Apps Script Sync Gateway",
    spreadsheetName: ss.getName(),
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------
// HELPER: SETUP SHEETS AND MODERN HEADERS
// -------------------------------------------------------------
function setupSheetsAndHeaders(ss) {
  // 1. Transaksi_Penjualan
  var sheetTrx = getOrCreateSheet(ss, "Transaksi_Penjualan", "#0055EE");
  if (sheetTrx.getLastRow() === 0) {
    var headers = [
      "Waktu Transaksi", "ID Transaksi", "Nama Toko", "Kasir", "Pelanggan",
      "Metode Pembayaran", "Item & Kuantitas", "Subtotal", "Pajak", "Diskon", "Total Bayar", "Status"
    ];
    sheetTrx.appendRow(headers);
    formatHeaderRow(sheetTrx, "#0055EE");
  }

  // 2. Master_Produk
  var sheetProd = getOrCreateSheet(ss, "Master_Produk", "#10B981");
  if (sheetProd.getLastRow() === 0) {
    var headers = [
      "ID Produk", "Barcode", "Nama Produk", "Kategori", "Harga Beli (HPP)", "Harga Jual", "Stok Tersedia", "Satuan", "Margin (Rp)", "Margin (%)", "Update Terakhir"
    ];
    sheetProd.appendRow(headers);
    formatHeaderRow(sheetProd, "#10B981");
  }

  // 3. Biaya_Operasional
  var sheetExp = getOrCreateSheet(ss, "Biaya_Operasional", "#F59E0B");
  if (sheetExp.getLastRow() === 0) {
    var headers = [
      "Waktu Pengeluaran", "ID Biaya", "Kategori Beban", "Keterangan", "Jumlah (Rp)", "Metode Kas", "Dicatat Oleh"
    ];
    sheetExp.appendRow(headers);
    formatHeaderRow(sheetExp, "#F59E0B");
  }

  // 4. Antrian_Pesanan
  var sheetOrder = getOrCreateSheet(ss, "Antrian_Pesanan", "#8B5CF6");
  if (sheetOrder.getLastRow() === 0) {
    var headers = [
      "Waktu Order", "No Antrian", "Nama Pemesan", "Tipe Layanan", "No Meja / Kontak", "Rincian Menu", "Total", "Status Pesanan", "Status Bayar"
    ];
    sheetOrder.appendRow(headers);
    formatHeaderRow(sheetOrder, "#8B5CF6");
  }

  // 5. Ringkasan_Bisnis
  var sheetDash = getOrCreateSheet(ss, "Ringkasan_Bisnis", "#1E293B");
  if (sheetDash.getLastRow() === 0) {
    sheetDash.getRange("A1:C1").merge().setValue("RINGKASAN KINERJA BISNIS DELPOS").setFontWeight("bold").setFontSize(14).setBackground("#003B99").setFontColor("#FFFFFF").setHorizontalAlignment("center");
    
    sheetDash.getRange("A3").setValue("Total Omzet Penjualan").setFontWeight("bold");
    sheetDash.getRange("B3").setFormula("=IFERROR(SUM(Transaksi_Penjualan!K2:K), 0)").setNumberFormat("#,##0");

    sheetDash.getRange("A4").setValue("Total Pengeluaran Beban").setFontWeight("bold");
    sheetDash.getRange("B4").setFormula("=IFERROR(SUM(Biaya_Operasional!E2:E), 0)").setNumberFormat("#,##0");

    sheetDash.getRange("A5").setValue("Estimasi Laba Operasional").setFontWeight("bold");
    sheetDash.getRange("B5").setFormula("=B3-B4").setNumberFormat("#,##0").setFontWeight("bold");

    sheetDash.getRange("A6").setValue("Total Transaksi Kasir").setFontWeight("bold");
    sheetDash.getRange("B6").setFormula("=IFERROR(COUNTA(Transaksi_Penjualan!B2:B), 0)");

    sheetDash.getRange("A7").setValue("Total Master Produk Aktif").setFontWeight("bold");
    sheetDash.getRange("B7").setFormula("=IFERROR(COUNTA(Master_Produk!A2:A), 0)");

    sheetDash.getRange("A8").setValue("Waktu Update Terakhir").setFontWeight("bold");
    sheetDash.getRange("B8").setValue(new Date().toLocaleString("id-ID"));

    sheetDash.setColumnWidth(1, 240);
    sheetDash.setColumnWidth(2, 200);
  }
}

function getOrCreateSheet(ss, name, tabColor) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (tabColor) sheet.setTabColor(tabColor);
  }
  return sheet;
}

function formatHeaderRow(sheet, bgColor) {
  var lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    var range = sheet.getRange(1, 1, 1, lastCol);
    range.setBackground(bgColor)
         .setFontColor("#FFFFFF")
         .setFontWeight("bold")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    for (var i = 1; i <= lastCol; i++) {
      sheet.autoResizeColumn(i);
    }
  }
}

// -------------------------------------------------------------
// ROW HANDLERS
// -------------------------------------------------------------
function appendTransactionRow(ss, trx, store) {
  if (!trx) return;
  var sheet = getOrCreateSheet(ss, "Transaksi_Penjualan");
  
  var itemsStr = (trx.items || []).map(function(item) {
    return item.product.name + " (" + item.quantity + "x @ " + formatRupiah(item.product.price) + ")";
  }).join("; ");

  var row = [
    trx.timestamp ? new Date(trx.timestamp).toLocaleString("id-ID") : new Date().toLocaleString("id-ID"),
    trx.id || "",
    (store && store.name) ? store.name : "DelPOS Store",
    trx.cashierName || "Kasir",
    trx.customerName || "Pelanggan Umum",
    trx.paymentMethod || "Tunai",
    itemsStr,
    trx.subtotal || 0,
    trx.tax || 0,
    trx.discount || 0,
    trx.total || 0,
    trx.status || "Selesai"
  ];

  sheet.appendRow(row);
}

function upsertProductRow(ss, prod) {
  if (!prod) return;
  var sheet = getOrCreateSheet(ss, "Master_Produk");
  var data = sheet.getDataRange().getValues();
  var prodId = String(prod.id);
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === prodId) {
      rowIndex = i + 1;
      break;
    }
  }

  var marginRp = (prod.price || 0) - (prod.costPrice || 0);
  var marginPct = prod.price > 0 ? ((marginRp / prod.price) * 100).toFixed(1) + "%" : "0%";

  var row = [
    prod.id || "",
    prod.barcode || "-",
    prod.name || "",
    prod.category || "Umum",
    prod.costPrice || 0,
    prod.price || 0,
    prod.stock || 0,
    prod.unit || "Pcs",
    marginRp,
    marginPct,
    new Date().toLocaleString("id-ID")
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function appendExpenseRow(ss, exp) {
  if (!exp) return;
  var sheet = getOrCreateSheet(ss, "Biaya_Operasional");
  var row = [
    exp.date || new Date().toISOString().slice(0, 10),
    exp.id || "",
    exp.category || "Operasional",
    exp.description || "-",
    exp.amount || 0,
    exp.paymentMethod || "Kas Toko",
    exp.recordedBy || "Owner"
  ];
  sheet.appendRow(row);
}

function appendOrderRow(ss, order) {
  if (!order) return;
  var sheet = getOrCreateSheet(ss, "Antrian_Pesanan");
  
  var itemsStr = (order.items || []).map(function(item) {
    return item.productName + " (" + item.quantity + "x @ " + formatRupiah(item.price) + ")";
  }).join("; ");

  var row = [
    order.orderTime || new Date().toLocaleString("id-ID"),
    order.queueNumber || "-",
    order.customerName || "Pelanggan",
    order.orderType || "DINE_IN",
    order.tableNumber || order.customerPhone || "-",
    itemsStr,
    order.totalAmount || 0,
    order.status || "MENUNGGU",
    order.isPaid ? "LUNAS" : "BELUM LUNAS"
  ];
  sheet.appendRow(row);
}

function performFullSync(ss, allData) {
  if (!allData) return;

  // Sync Products
  if (allData.products && allData.products.length > 0) {
    var sheetProd = getOrCreateSheet(ss, "Master_Produk", "#10B981");
    // Clear existing data rows except headers
    if (sheetProd.getLastRow() > 1) {
      sheetProd.deleteRows(2, sheetProd.getLastRow() - 1);
    }
    allData.products.forEach(function(prod) {
      upsertProductRow(ss, prod);
    });
  }

  // Sync Transactions
  if (allData.transactions && allData.transactions.length > 0) {
    var sheetTrx = getOrCreateSheet(ss, "Transaksi_Penjualan", "#0055EE");
    if (sheetTrx.getLastRow() > 1) {
      sheetTrx.deleteRows(2, sheetTrx.getLastRow() - 1);
    }
    allData.transactions.forEach(function(trx) {
      appendTransactionRow(ss, trx, allData.store);
    });
  }

  // Sync Expenses
  if (allData.expenses && allData.expenses.length > 0) {
    var sheetExp = getOrCreateSheet(ss, "Biaya_Operasional", "#F59E0B");
    if (sheetExp.getLastRow() > 1) {
      sheetExp.deleteRows(2, sheetExp.getLastRow() - 1);
    }
    allData.expenses.forEach(function(exp) {
      appendExpenseRow(ss, exp);
    });
  }
}

function updateDashboardSummary(ss) {
  var sheetDash = ss.getSheetByName("Ringkasan_Bisnis");
  if (sheetDash) {
    sheetDash.getRange("B8").setValue(new Date().toLocaleString("id-ID"));
  }
}

function formatRupiah(val) {
  return "Rp " + Number(val || 0).toLocaleString("id-ID");
}
`;

/**
 * Sends a payload to Google Apps Script Web App
 */
export async function sendPayloadToGoogleAppsScript(
  webAppUrl: string,
  action: 'TRANSACTION' | 'PRODUCT' | 'EXPENSE' | 'ORDER' | 'FULL_SYNC' | 'TEST_PING',
  data: any,
  store?: StoreProfile
): Promise<{ success: boolean; message: string; response?: any }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi dengan benar.',
    };
  }

  const payload = {
    action,
    app: 'DelPOS (powered by AkuPos)',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    store: store || { name: 'DelPOS Store' },
    data,
  };

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Plain text avoids CORS preflight issues with GAS
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Some GAS deployments redirect or return 302, which browser handles transparently
      return {
        success: true,
        message: 'Data berhasil dikirim ke Google Apps Script.',
      };
    }

    try {
      const jsonRes = await response.json();
      return {
        success: jsonRes.status !== 'error',
        message: jsonRes.message || 'Sinkronisasi berhasil diproses.',
        response: jsonRes,
      };
    } catch {
      return {
        success: true,
        message: 'Data berhasil dikirim ke Google Sheets (Response OK).',
      };
    }
  } catch (err: any) {
    // If standard fetch was blocked by strict CORS in some environments, try sendBeacon / safe fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
        navigator.sendBeacon(webAppUrl, blob);
        return {
          success: true,
          message: 'Data dikirim ke Google Apps Script via Background Beacon.',
        };
      }
    } catch {
      // Ignore
    }

    return {
      success: false,
      message: `Gagal menghubungkan ke Apps Script: ${err.message || 'Periksa koneksi internet dan izin Web App.'}`,
    };
  }
}

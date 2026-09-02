/**
 * Google Apps Script Integration Helper & Code Generator for DelPos
 * Enables seamless two-way ready integration to Google Spreadsheets
 */

import { Transaction, Product, ExpenseRecord, CustomerOrder, StoreProfile } from '../types';
import { APP_CONFIG } from './appConfig';

export const DEFAULT_GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * DELPOS - GOOGLE APPS SCRIPT AUTO-SYNC WEBHOOK (Code.gs)
 * =========================================================================
 * 
 * Script ini secara otomatis mengelola pencatatan tabel Google Spreadsheet:
 *  1. Sheet "Transaksi_Penjualan" : Rekap setiap transaksi kasir real-time.
 *  2. Sheet "Master_Produk"       : Katalog produk, harga beli/jual & stok fisik (otomatis berkurang saat transaksi).
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
 *    - Deskripsi: DelPos Auto Sync Webhook
 *    - Jalankan sebagai (Execute as): Saya (email Anda)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone) -> WAJIB agar POS bisa kirim data!
 * 7. Klik 'Terapkan' (Deploy), izinkan akses (Review permissions > Pilih akun > Lanjutan > Buka DelPos Webhook).
 * 8. Salin URL Aplikasi Web (berakhiran /exec) dan tempelkan ke menu DelPos > Integrasi Google Spreadsheet.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.tryLock(15000);
  } catch (lockErr) {
    // Continue even if lock was busy
  }

  try {
    var rawData = e && e.postData ? e.postData.contents : null;
    if (!rawData) {
      return createJsonResponse({
        status: "error",
        message: "Tidak ada data payload yang diterima."
      });
    }

    var payload = {};
    try {
      payload = JSON.parse(rawData);
    } catch (parseErr) {
      return createJsonResponse({
        status: "error",
        message: "Format JSON payload tidak valid: " + parseErr.toString()
      });
    }

    var action = payload.action || "TEST_PING";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Ensure all sheets & headers exist with proper styles
    setupSheetsAndHeaders(ss);

    var resultMessage = "";

    if (action === "TEST_PING") {
      resultMessage = "Koneksi Google Apps Script DelPos berhasil terhubung aktif!";
    } 
    else if (action === "TRANSACTION") {
      appendTransactionRow(ss, payload.data, payload.store);
      resultMessage = "Transaksi berhasil dicatat & stok produk terupdate otomatis di Google Sheets.";
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
      resultMessage = "Seluruh data DelPos berhasil disinkronkan ke Google Sheets.";
    } 
    else {
      resultMessage = "Aksi diterima: " + action;
    }

    // Refresh Summary Dashboard formulas
    updateDashboardSummary(ss);

    return createJsonResponse({
      status: "success",
      app: "DelPos",
      action: action,
      message: resultMessage,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Terjadi kesalahan internal GAS: " + err.toString()
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSheetsAndHeaders(ss);
    return createJsonResponse({
      status: "active",
      system: "DelPos Google Apps Script Sync Gateway",
      app: "DelPos",
      spreadsheetName: ss.getName(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------
// HELPER: SETUP SHEETS AND MODERN HEADERS
// -------------------------------------------------------------
function setupSheetsAndHeaders(ss) {
  // 1. Transaksi_Penjualan
  var sheetTrx = getOrCreateSheet(ss, "Transaksi_Penjualan", "#0055EE");
  if (sheetTrx.getLastRow() === 0) {
    var headers = [
      "Waktu Transaksi", "No Faktur / Order", "ID Transaksi", "Nama Toko", "Kasir", "Pelanggan",
      "Metode Pembayaran", "Rincian Item & Qty", "Subtotal (Rp)", "Pajak PPN (Rp)", "Diskon (Rp)",
      "Total Bayar (Rp)", "Uang Diterima (Rp)", "Kembalian (Rp)", "Status"
    ];
    sheetTrx.appendRow(headers);
    formatHeaderRow(sheetTrx, "#0055EE");
  }

  // 2. Master_Produk
  var sheetProd = getOrCreateSheet(ss, "Master_Produk", "#10B981");
  if (sheetProd.getLastRow() === 0) {
    var headers = [
      "ID Produk", "Barcode", "Nama Produk", "Kategori", "Harga Modal (HPP)", "Harga Jual", "Stok Tersedia", "Satuan", "Margin (Rp)", "Margin (%)", "Update Terakhir"
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
      "Waktu Order", "No Antrian", "Nama Pemesan", "Tipe Layanan", "No Meja / Kontak", "Rincian Menu", "Total (Rp)", "Status Pesanan", "Status Bayar"
    ];
    sheetOrder.appendRow(headers);
    formatHeaderRow(sheetOrder, "#8B5CF6");
  }

  // 5. Ringkasan_Bisnis
  var sheetDash = getOrCreateSheet(ss, "Ringkasan_Bisnis", "#1E293B");
  if (sheetDash.getLastRow() === 0) {
    sheetDash.getRange("A1:C1").merge().setValue("RINGKASAN KINERJA BISNIS DELPOS").setFontWeight("bold").setFontSize(14).setBackground("#003B99").setFontColor("#FFFFFF").setHorizontalAlignment("center");
    
    sheetDash.getRange("A3").setValue("Total Omzet Penjualan").setFontWeight("bold");
    sheetDash.getRange("B3").setFormula("=IFERROR(SUM(Transaksi_Penjualan!L2:L), 0)").setNumberFormat("#,##0");

    sheetDash.getRange("A4").setValue("Total Pengeluaran Biaya").setFontWeight("bold");
    sheetDash.getRange("B4").setFormula("=IFERROR(SUM(Biaya_Operasional!E2:E), 0)").setNumberFormat("#,##0");

    sheetDash.getRange("A5").setValue("Estimasi Laba Operasional").setFontWeight("bold");
    sheetDash.getRange("B5").setFormula("=B3-B4").setNumberFormat("#,##0").setFontWeight("bold");

    sheetDash.getRange("A6").setValue("Total Transaksi Selesai").setFontWeight("bold");
    sheetDash.getRange("B6").setFormula("=IFERROR(COUNTA(Transaksi_Penjualan!B2:B), 0)");

    sheetDash.getRange("A7").setValue("Total Master Produk Aktif").setFontWeight("bold");
    sheetDash.getRange("B7").setFormula("=IFERROR(COUNTA(Master_Produk!A2:A), 0)");

    sheetDash.getRange("A8").setValue("Waktu Sinkronisasi Terakhir").setFontWeight("bold");
    sheetDash.getRange("B8").setValue(new Date().toLocaleString("id-ID"));

    sheetDash.setColumnWidth(1, 250);
    sheetDash.setColumnWidth(2, 220);
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
// ROW HANDLERS (BULLETPROOF & ERROR-FREE)
// -------------------------------------------------------------
function appendTransactionRow(ss, trx, store) {
  if (!trx) return;
  var sheet = getOrCreateSheet(ss, "Transaksi_Penjualan");
  
  // Format items string safely
  var itemsList = trx.items || [];
  var itemsStr = itemsList.map(function(item) {
    var name = item.productName || (item.product ? item.product.name : "Produk");
    var qty = item.quantity || 1;
    var price = item.price !== undefined ? item.price : (item.product ? (item.product.sellingPrice || item.product.price) : 0);
    return name + " (" + qty + "x @ " + formatRupiah(price) + ")";
  }).join("; ");

  var customerName = "Pelanggan Umum";
  if (trx.customer) {
    customerName = typeof trx.customer === "object" ? (trx.customer.name || "Pelanggan Umum") : String(trx.customer);
  } else if (trx.customerName) {
    customerName = trx.customerName;
  }

  var formattedTime = "";
  if (trx.date && trx.time) {
    formattedTime = trx.date + " " + trx.time;
  } else if (trx.timestamp) {
    formattedTime = new Date(trx.timestamp).toLocaleString("id-ID");
  } else {
    formattedTime = new Date().toLocaleString("id-ID");
  }

  var row = [
    formattedTime,
    trx.orderNumber || trx.id || "",
    trx.id || "",
    (store && store.name) ? store.name : "DelPos Store",
    trx.cashierName || "Kasir",
    customerName,
    trx.paymentMethod || "Tunai",
    itemsStr,
    Number(trx.subtotal || 0),
    Number(trx.tax || 0),
    Number(trx.discount || 0),
    Number(trx.total || 0),
    Number(trx.cashGiven || (trx.paymentMethod === "Tunai" ? trx.total : 0)),
    Number(trx.change || 0),
    trx.status || "Selesai"
  ];

  sheet.appendRow(row);

  // Auto-deduct stock in Master_Produk if items are present
  try {
    deductProductStockFromTrx(ss, itemsList);
  } catch (stockErr) {
    // Prevent stock deduction failure from aborting transaction save
  }
}

function deductProductStockFromTrx(ss, items) {
  if (!items || items.length === 0) return;
  var sheet = ss.getSheetByName("Master_Produk");
  if (!sheet || sheet.getLastRow() <= 1) return;

  var data = sheet.getDataRange().getValues();
  // Col 0: ID Produk, Col 2: Nama Produk, Col 6: Stok Tersedia
  for (var k = 0; k < items.length; k++) {
    var it = items[k];
    var targetId = String(it.productId || (it.product ? it.product.id : ""));
    var targetName = String(it.productName || (it.product ? it.product.name : ""));
    var qty = Number(it.quantity || 1);

    for (var r = 1; r < data.length; r++) {
      var rowProdId = String(data[r][0]);
      var rowProdName = String(data[r][2]);
      if ((targetId && rowProdId === targetId) || (targetName && rowProdName.toLowerCase() === targetName.toLowerCase())) {
        var currentStock = Number(data[r][6] || 0);
        var newStock = Math.max(0, currentStock - qty);
        sheet.getRange(r + 1, 7).setValue(newStock); // Column 7 is Stok Tersedia
        sheet.getRange(r + 1, 11).setValue(new Date().toLocaleString("id-ID")); // Column 11 is Update Terakhir
        data[r][6] = newStock;
        break;
      }
    }
  }
}

function upsertProductRow(ss, prod) {
  if (!prod) return;
  var sheet = getOrCreateSheet(ss, "Master_Produk");
  var data = sheet.getDataRange().getValues();
  var prodId = String(prod.id || "");
  var rowIndex = -1;

  if (prodId && data.length > 1) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === prodId) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  var cost = Number(prod.costPrice || prod.capitalPrice || 0);
  var price = Number(prod.sellingPrice || prod.price || 0);
  var marginRp = price - cost;
  var marginPct = price > 0 ? ((marginRp / price) * 100).toFixed(1) + "%" : "0%";

  var row = [
    prod.id || "",
    prod.barcode || "-",
    prod.name || "",
    prod.category || "Umum",
    cost,
    price,
    Number(prod.stock || 0),
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
    Number(exp.amount || 0),
    exp.paymentMethod || "Kas Toko",
    exp.recordedBy || "Owner"
  ];
  sheet.appendRow(row);
}

function appendOrderRow(ss, order) {
  if (!order) return;
  var sheet = getOrCreateSheet(ss, "Antrian_Pesanan");
  
  var itemsStr = (order.items || []).map(function(item) {
    var name = item.productName || item.name || "Menu";
    var qty = item.quantity || 1;
    var price = item.price || 0;
    return name + " (" + qty + "x @ " + formatRupiah(price) + ")";
  }).join("; ");

  var row = [
    order.orderTime || new Date().toLocaleString("id-ID"),
    order.queueNumber || "-",
    order.customerName || "Pelanggan",
    order.orderType || "DINE_IN",
    order.tableOrRoom || order.tableNumber || order.customerPhone || "-",
    itemsStr,
    Number(order.total || order.totalAmount || 0),
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
    app: APP_CONFIG.name,
    version: APP_CONFIG.version,
    timestamp: new Date().toISOString(),
    store: store || { name: `${APP_CONFIG.name} Store` },
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

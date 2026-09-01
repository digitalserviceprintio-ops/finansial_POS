import { Transaction, StoreProfile, CustomerOrder } from '../types';

export type PaperWidth = '58mm' | '80mm';

export class EscPosEncoder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  // Initialize printer
  init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  // Text Alignment: 0: Left, 1: Center, 2: Right
  align(alignment: 'left' | 'center' | 'right'): this {
    const val = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, val); // ESC a n
    return this;
  }

  // Bold toggle
  bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0); // ESC E n
    return this;
  }

  // Underline
  underline(enable: boolean): this {
    this.buffer.push(0x1b, 0x2d, enable ? 1 : 0); // ESC - n
    return this;
  }

  // Character Size: width (1-8), height (1-8)
  size(width: 1 | 2 = 1, height: 1 | 2 = 1): this {
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(0x1d, 0x21, n); // GS ! n
    return this;
  }

  // Inverted text (white on black)
  invert(enable: boolean): this {
    this.buffer.push(0x1d, 0x42, enable ? 1 : 0); // GS B n
    return this;
  }

  // Append raw text string with UTF-8 / ASCII fallback
  text(str: string): this {
    const encoded = this.encodeString(str);
    for (let i = 0; i < encoded.length; i++) {
      this.buffer.push(encoded[i]);
    }
    return this;
  }

  // Append text followed by newline
  line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  // Add multiple empty lines
  feed(lines: number = 1): this {
    this.buffer.push(0x1b, 0x64, lines); // ESC d n
    return this;
  }

  // Cut paper (Partial cut)
  cut(): this {
    this.buffer.push(0x1d, 0x56, 0x42, 0x00); // GS V B 0
    return this;
  }

  // Open Cash Drawer (Kick drawer pulse)
  openCashDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
    return this;
  }

  // Format a two-column line (Left text and Right text padded to max cols)
  row(left: string, right: string, maxCols: number): this {
    const cleanLeft = left.trim();
    const cleanRight = right.trim();
    const spaceNeeded = maxCols - (cleanLeft.length + cleanRight.length);

    if (spaceNeeded >= 1) {
      this.line(cleanLeft + ' '.repeat(spaceNeeded) + cleanRight);
    } else {
      // Left text is long: print left text on first line, right aligned on second line
      this.line(cleanLeft);
      const padding = Math.max(0, maxCols - cleanRight.length);
      this.line(' '.repeat(padding) + cleanRight);
    }
    return this;
  }

  // Draw separator line
  divider(char: string = '-', maxCols: number): this {
    this.line(char.repeat(maxCols));
    return this;
  }

  // Helper string encoder
  private encodeString(str: string): Uint8Array {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(str);
    }
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i) & 0xff;
    }
    return arr;
  }

  // Get raw binary buffer
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Format currency helper for ESC/POS receipt
 */
export const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

/**
 * Builds binary ESC/POS payload for a Transaction
 */
export function buildReceiptEscPos(
  trx: Transaction,
  store: StoreProfile,
  paperWidth: PaperWidth = '58mm'
): Uint8Array {
  const maxCols = paperWidth === '58mm' ? 32 : 48;
  const encoder = new EscPosEncoder();

  // Header / Branding (Centered)
  encoder
    .init()
    .align('center')
    .bold(true)
    .size(2, 2)
    .line(store.name.toUpperCase())
    .size(1, 1)
    .bold(false)
    .line(store.branch ? `(${store.branch})` : '')
    .line(store.address || 'Indonesia')
    .line(`Telp: ${store.phone || '-'}`)
    .divider('=', maxCols);

  // Metadata
  encoder
    .align('left')
    .row('No. Order', trx.orderNumber, maxCols)
    .row('Waktu', `${trx.date} ${trx.time}`, maxCols)
    .row('Kasir', trx.cashierName || 'Kasir 01', maxCols)
    .row('Pelanggan', trx.customer ? trx.customer.name : 'Pelanggan Umum', maxCols)
    .divider('-', maxCols);

  // Items List
  encoder.bold(true).line('RINCIAN PESANAN:').bold(false);

  trx.items.forEach((item) => {
    // Line 1: Product name
    encoder.line(item.productName);
    // Line 2: Qty x Unit Price = Subtotal
    const qtyPrice = `  ${item.quantity} x ${formatRupiah(item.price)}`;
    const lineTotal = formatRupiah(item.price * item.quantity);
    encoder.row(qtyPrice, lineTotal, maxCols);
  });

  encoder.divider('-', maxCols);

  // Totals
  encoder
    .row('Subtotal', formatRupiah(trx.subtotal), maxCols)
    .row(`Pajak (${Math.round((store.taxRate || 0.1) * 100)}%)`, formatRupiah(trx.tax), maxCols);

  if (trx.discount && trx.discount > 0) {
    encoder.row('Diskon', `-${formatRupiah(trx.discount)}`, maxCols);
  }

  // Grand Total in Bold
  encoder
    .bold(true)
    .size(1, 2)
    .row('TOTAL', formatRupiah(trx.total), maxCols)
    .size(1, 1)
    .bold(false);

  encoder.divider('-', maxCols);

  // Payment Details
  encoder.row('Metode Bayar', trx.paymentMethod.toUpperCase(), maxCols);

  if (trx.paymentMethod === 'Tunai' && trx.cashGiven) {
    encoder
      .row('Tunai Diterima', formatRupiah(trx.cashGiven), maxCols)
      .bold(true)
      .row('Kembalian', formatRupiah(trx.change || 0), maxCols)
      .bold(false);
  } else if (trx.paymentMethod === 'Transfer Bank') {
    encoder
      .row('Jenis Transaksi', 'Transfer Bank', maxCols)
      .row('Status Bayar', 'LUNAS (TERVERIFIKASI)', maxCols);
  } else if (trx.paymentMethod === 'Kartu Debit') {
    encoder
      .row('Jenis Transaksi', 'Kartu Debit / EDC', maxCols)
      .row('Status Bayar', 'LUNAS (EDC SETTLED)', maxCols);
  }

  encoder.divider('=', maxCols);

  // Footer Message (Centered)
  encoder
    .align('center')
    .bold(true)
    .line('TERIMA KASIH ATAS KUNJUNGAN ANDA!')
    .bold(false)
    .line('Barang yang dibeli tidak dapat ditukar.')
    .line('DelPOS (powered by AkuPos)')
    .feed(3)
    .cut();

  return encoder.encode();
}

/**
 * Builds a Test Print receipt payload
 */
export function buildTestPrintEscPos(
  store: StoreProfile,
  paperWidth: PaperWidth = '58mm'
): Uint8Array {
  const maxCols = paperWidth === '58mm' ? 32 : 48;
  const encoder = new EscPosEncoder();
  const now = new Date();

  encoder
    .init()
    .align('center')
    .bold(true)
    .size(2, 2)
    .line('TEST CETAK BLUETOOTH')
    .size(1, 1)
    .bold(false)
    .line(store.name)
    .line('Printer Thermal ESC/POS')
    .divider('=', maxCols)
    .align('left')
    .row('Status', 'BERHASIL TERHUBUNG', maxCols)
    .row('Lebar Kertas', paperWidth, maxCols)
    .row('Waktu Test', now.toLocaleTimeString('id-ID'), maxCols)
    .row('Tanggal', now.toLocaleDateString('id-ID'), maxCols)
    .divider('-', maxCols)
    .align('center')
    .line('Koneksi Bluetooth Berfungsi Optimal!')
    .line('DelPOS Siap Mencetak Struk.')
    .feed(3)
    .cut();

  return encoder.encode();
}

/**
 * Builds ESC/POS thermal payload for Order Queue Receipt (Struk Antrian Pesanan Ritel)
 */
export function buildQueueOrderTicketEscPos(
  order: CustomerOrder,
  store: StoreProfile,
  paperWidth: PaperWidth = '58mm'
): Uint8Array {
  const maxCols = paperWidth === '58mm' ? 32 : 48;
  const encoder = new EscPosEncoder();
  const dateStr = new Date(order.orderTimestamp).toLocaleDateString('id-ID');

  // Header
  encoder
    .init()
    .align('center')
    .bold(true)
    .size(2, 2)
    .line(store.name.toUpperCase())
    .size(1, 1)
    .bold(false)
    .line(store.branch ? `(${store.branch})` : 'STRUK ANTRIAN PESANAN')
    .line(store.address || 'Indonesia')
    .line(`Telp: ${store.phone || '-'}`)
    .divider('=', maxCols);

  // Big Queue Number
  encoder
    .align('center')
    .line('*** NOMOR ANTRIAN ***')
    .bold(true)
    .size(2, 2)
    .line(`[ #${order.queueNumber} ]`)
    .size(1, 1)
    .bold(false)
    .line(order.tableOrRoom ? order.tableOrRoom.toUpperCase() : 'DINE IN')
    .divider('=', maxCols);

  // Metadata
  encoder
    .align('left')
    .row('No. Order', order.id, maxCols)
    .row('Tanggal', dateStr, maxCols)
    .row('Waktu', order.orderTime, maxCols)
    .row('Pelanggan', order.customerName, maxCols);

  if (order.customerPhone) {
    encoder.row('No. HP', order.customerPhone, maxCols);
  }

  encoder
    .row('Layanan', order.source === 'QR_CATALOG' ? 'Self-Order QR' : 'Kasir POS', maxCols)
    .divider('-', maxCols);

  // Items List
  encoder.bold(true).line('DAFTAR PESANAN:').bold(false);

  order.items.forEach((item) => {
    // Line 1: Product name
    encoder.line(item.productName);
    // Line 2: Qty x Unit Price = Subtotal
    const qtyPrice = `  ${item.quantity} x ${formatRupiah(item.price)}`;
    const lineTotal = formatRupiah(item.price * item.quantity);
    encoder.row(qtyPrice, lineTotal, maxCols);

    // Notes if any
    if (item.notes && item.notes.trim()) {
      encoder.line(`  * Note: ${item.notes.trim()}`);
    }
  });

  encoder.divider('-', maxCols);

  // Totals
  encoder
    .row('Subtotal', formatRupiah(order.subtotal), maxCols)
    .row(`Pajak (${Math.round((store.taxRate || 0.1) * 100)}%)`, formatRupiah(order.tax), maxCols);

  // Grand Total in Bold Large
  encoder
    .bold(true)
    .size(1, 2)
    .row('TOTAL', formatRupiah(order.total), maxCols)
    .size(1, 1)
    .bold(false);

  encoder.divider('-', maxCols);

  // Payment Status
  encoder
    .row('Metode Bayar', order.paymentMethod.toUpperCase(), maxCols)
    .row('Status Bayar', order.isPaid ? 'LUNAS' : 'BELUM LUNAS (KASIR)', maxCols);

  encoder.divider('=', maxCols);

  // Footer Instructions
  encoder
    .align('center')
    .bold(true)
    .line('*** SIMPAN STRUK INI ***')
    .line('NOMOR ANDA AKAN DIPANGGIL')
    .bold(false)
    .line('Terima kasih telah berkunjung!')
    .line('DelPOS • powered by AkuPos')
    .feed(3)
    .cut();

  return encoder.encode();
}

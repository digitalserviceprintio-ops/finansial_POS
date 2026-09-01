import QRCode from 'qrcode';

/**
 * CRC16-CCITT (False / 0xFFFF) Calculation for QRIS Standard Specification
 */
export function calculateCRC16(str: string): string {
  let crc = 0xffff;
  const strlen = str.length;

  for (let c = 0; c < strlen; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }

  let hex = crc.toString(16).toUpperCase();
  while (hex.length < 4) {
    hex = '0' + hex;
  }
  return hex;
}

/**
 * Format a single EMVCo Tag-Length-Value (TLV) block
 */
function formatTLV(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export interface QRISPayloadOptions {
  danaNumber?: string;
  merchantName?: string;
  merchantCity?: string;
  amount?: number;
  nmid?: string;
  postalCode?: string;
}

/**
 * Generates an ASPI / Bank Indonesia Compliant QRIS Dynamic or Static String
 * Custom-tailored for DANA E-Wallet & Inter-Bank National QRIS (GPN)
 */
export function generateQRISString(options: QRISPayloadOptions = {}): string {
  const danaPhone = (options.danaNumber || '082186371356').replace(/\D/g, '');
  const merchantName = (options.merchantName || 'SOLUSI UMKM / FINANSIALPRO')
    .toUpperCase()
    .slice(0, 25);
  const merchantCity = (options.merchantCity || 'JAKARTA').toUpperCase().slice(0, 15);
  const nmid = options.nmid || 'ID1020021863713';
  const postalCode = options.postalCode || '12000';
  const hasAmount = options.amount && options.amount > 0;

  // Tag 00: Payload Format Indicator (01)
  let raw = formatTLV('00', '01');

  // Tag 01: Point of Initiation (11 = Static, 12 = Dynamic with Amount)
  raw += formatTLV('01', hasAmount ? '12' : '11');

  // Tag 26: Merchant Account Information (DANA & National Switch)
  const sub26_00 = formatTLV('00', 'ID.CO.DANA.WWW');
  const sub26_01 = formatTLV('01', danaPhone);
  const sub26_02 = formatTLV('02', nmid);
  const sub26_03 = formatTLV('03', 'UMI'); // Usaha Mikro
  const tag26Val = sub26_00 + sub26_01 + sub26_02 + sub26_03;
  raw += formatTLV('26', tag26Val);

  // Tag 51: National E-Money Switch Identification
  const sub51_00 = formatTLV('00', 'ID.OR.GPN.WWW');
  const sub51_01 = formatTLV('01', nmid);
  raw += formatTLV('51', sub51_00 + sub51_01);

  // Tag 52: Merchant Category Code (5812: Restoran/UMKM Ritel)
  raw += formatTLV('52', '5812');

  // Tag 53: Transaction Currency (360 = IDR)
  raw += formatTLV('53', '360');

  // Tag 54: Transaction Amount (if Dynamic)
  if (hasAmount && options.amount) {
    const amountStr = Math.round(options.amount).toString();
    raw += formatTLV('54', amountStr);
  }

  // Tag 58: Country Code (ID)
  raw += formatTLV('58', 'ID');

  // Tag 59: Merchant Name
  raw += formatTLV('59', merchantName);

  // Tag 60: Merchant City
  raw += formatTLV('60', merchantCity);

  // Tag 61: Postal Code
  raw += formatTLV('61', postalCode);

  // Tag 63: CRC16 Checksum
  const toChecksum = raw + '6304';
  const checksum = calculateCRC16(toChecksum);
  const finalQRIS = toChecksum + checksum;

  return finalQRIS;
}

/**
 * Generate a QR Code Data URL (Base64 PNG) from QRIS string or custom payload
 */
export async function generateQRCodeDataURL(
  payload: string,
  options: {
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
  } = {}
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      width: options.width || 320,
      margin: options.margin !== undefined ? options.margin : 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: options.color?.dark || '#111827',
        light: options.color?.light || '#ffffff',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR Code Data URL:', error);
    return '';
  }
}

/**
 * DelPOS Financial & POS Date Utility
 * Provides robust timezone-safe date formatting and ISO normalization
 * for financial statements, PDF reports, and CSV exports.
 */

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDONESIAN_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const ID_MONTH_LOOKUP: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  mei: '05',
  may: '05',
  jun: '06',
  jul: '07',
  agu: '08',
  ags: '08',
  aug: '08',
  sep: '09',
  okt: '10',
  oct: '10',
  nov: '11',
  des: '12',
  dec: '12',
};

/**
 * Format a Date object to YYYY-MM-DD string in local timezone (avoids UTC offset shifts)
 */
export function formatLocalDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Normalizes any date string or numeric timestamp to standard YYYY-MM-DD format
 * Supports:
 * - Numeric timestamp (e.g. 1789724123456)
 * - ISO string (e.g. "2026-09-18")
 * - Indonesian text date (e.g. "18 Sep 2026", "24 Oktober 2023", "01-Mei-2024")
 * - Slashing date (e.g. "18/09/2026" or "2026/09/18")
 */
export function normalizeDateToISO(dateStr?: string, timestamp?: number): string {
  if (timestamp && typeof timestamp === 'number' && !isNaN(timestamp) && timestamp > 0) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return formatLocalDateToISO(d);
    }
  }

  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();

  // Already standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Indonesian / European textual format: DD [Month] YYYY
  const parts = trimmed.split(/[\s,/-]+/);
  if (parts.length >= 3) {
    // DD Month YYYY (e.g. "18 Sep 2026" or "18-09-2026")
    if (/^\d{1,2}$/.test(parts[0]) && /^\d{4}$/.test(parts[2])) {
      const day = parts[0].padStart(2, '0');
      const mKey = parts[1].toLowerCase().slice(0, 3);
      const m =
        ID_MONTH_LOOKUP[mKey] ||
        (Number(parts[1]) > 0 && Number(parts[1]) <= 12 ? String(parts[1]).padStart(2, '0') : null);
      if (m) {
        return `${parts[2]}-${m}-${day}`;
      }
    }
    // YYYY Month DD (e.g. "2026 Sep 18" or "2026-09-18")
    if (/^\d{4}$/.test(parts[0]) && /^\d{1,2}$/.test(parts[2])) {
      const y = parts[0];
      const mKey = parts[1].toLowerCase().slice(0, 3);
      const m =
        ID_MONTH_LOOKUP[mKey] ||
        (Number(parts[1]) > 0 && Number(parts[1]) <= 12 ? String(parts[1]).padStart(2, '0') : null);
      const day = parts[2].padStart(2, '0');
      if (m) {
        return `${y}-${m}-${day}`;
      }
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return formatLocalDateToISO(parsed);
  }

  return '';
}

/**
 * Checks if a transaction or expense item falls within [startDate, endDate]
 * Both bounds are optional and expected in YYYY-MM-DD.
 */
export function isDateInRange(
  dateStr?: string,
  timestamp?: number,
  startDate?: string,
  endDate?: string
): boolean {
  if (!startDate && !endDate) return true;

  const iso = normalizeDateToISO(dateStr, timestamp);
  // If parsing fails completely, don't drop the item to avoid silent data loss
  if (!iso) return true;

  if (startDate && iso < startDate) return false;
  if (endDate && iso > endDate) return false;

  return true;
}

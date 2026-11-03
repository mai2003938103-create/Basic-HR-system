import { formatInTimeZone } from 'date-fns-tz';

export const TZ = 'Asia/Vientiane';

export interface Currency {
  code: string;
  symbol: string;
}

export function formatMoney(n: number | string | null | undefined, c: Currency): string {
  if (n === null || n === undefined || n === '') return '';
  const v = Math.round(Number(n));
  return `${v.toLocaleString('en-US')} ${c.symbol}`;
}

/** YYYY-MM-DD or a Date/ISO instant → DD/MM/YYYY (instants in Vientiane time). */
export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }
  return formatInTimeZone(d, TZ, 'dd/MM/yyyy');
}

export const formatTime = (d: string | Date | null | undefined) => (d ? formatInTimeZone(d, TZ, 'HH:mm') : '');
export const formatDateTime = (d: string | Date | null | undefined) => (d ? formatInTimeZone(d, TZ, 'dd/MM/yyyy HH:mm') : '');

export function formatMinutes(m: number, lang: string): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return lang === 'lo' ? `${h} ຊມ ${mm} ນທ` : `${h}h ${mm}m`;
}

/** Today's date in Vientiane as YYYY-MM-DD. */
export const todayLocal = () => formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');

export const fullName = (e: { firstName: string; lastName: string } | null | undefined) => (e ? `${e.firstName} ${e.lastName}` : '');

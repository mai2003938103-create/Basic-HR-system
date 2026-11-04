import { formatDate, formatMinutes, formatMoney, formatTime } from './format';

describe('format', () => {
  it('formats money with thousands separators and the symbol after', () => {
    expect(formatMoney(8500000, { code: 'LAK', symbol: '₭' })).toBe('8,500,000 ₭');
    expect(formatMoney('12000000.00', { code: 'LAK', symbol: '₭' })).toBe('12,000,000 ₭');
  });
  it('formats dates as DD/MM/YYYY', () => {
    expect(formatDate('2026-11-03')).toBe('03/11/2026');
    expect(formatDate(null)).toBe('');
  });
  it('formats times in Vientiane', () => {
    expect(formatTime('2026-11-03T01:05:00Z')).toBe('08:05');
  });
  it('formats minutes per language', () => {
    expect(formatMinutes(510, 'en')).toBe('8h 30m');
    expect(formatMinutes(510, 'lo')).toBe('8 ຊມ 30 ນທ');
  });
});

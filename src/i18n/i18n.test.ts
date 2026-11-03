import i18n, { setLanguage } from './index';
import lo from './lo.json';
import en from './en.json';

const keys = (o: object, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

describe('i18n', () => {
  it('defaults to Lao', () => {
    expect(i18n.language).toBe('lo');
  });
  it('has the same keys in Lao and English', () => {
    expect(keys(lo).sort()).toEqual(keys(en).sort());
  });
  it('switches language and remembers it', async () => {
    await setLanguage('en');
    expect(i18n.t('common.save')).toBe('Save');
    expect(localStorage.getItem('hrms_lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    await setLanguage('lo');
    expect(i18n.t('common.save')).toBe('ບັນທຶກ');
  });
});

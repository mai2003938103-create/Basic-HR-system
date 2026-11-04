import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import lo from './lo.json';
import en from './en.json';

export type Lang = 'lo' | 'en';
const KEY = 'hrms_lang';

function stored(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'en' ? 'en' : 'lo';
  } catch {
    return 'lo';
  }
}

void i18n.use(initReactI18next).init({
  resources: { lo: { translation: lo }, en: { translation: en } },
  lng: stored(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});
if (typeof document !== 'undefined') document.documentElement.lang = i18n.language;

export async function setLanguage(lang: Lang) {
  await i18n.changeLanguage(lang);
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage unavailable */
  }
  document.documentElement.lang = lang;
}

/** Picks the Lao or English name of a record according to the current language. */
export const localName = (r: { nameLo: string; nameEn: string } | null | undefined) => (r ? (i18n.language === 'lo' ? r.nameLo : r.nameEn) : '');

export default i18n;

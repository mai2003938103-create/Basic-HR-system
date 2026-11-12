import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface PublicSettings {
  companyNameLo: string;
  companyNameEn: string;
  logoUrl: string | null;
  currencyCode: string;
  currencySymbol: string;
  workingDays: number[];
  workStart: string;
  workEnd: string;
  breakStart?: string;
  breakEnd?: string;
}

let cache: PublicSettings | null = null;
let inflight: Promise<PublicSettings> | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<PublicSettings | null>(cache);
  useEffect(() => {
    if (cache) return;
    inflight ??= api.get('/settings/public').then((r) => (cache = r.data.data as PublicSettings));
    inflight.then(setSettings).catch(() => {
      inflight = null;
    });
  }, []);
  return settings;
}

/** Drops the cached public settings after an admin changes them. */
export const clearSettingsCache = () => {
  cache = null;
  inflight = null;
};

export const currencyOf = (s: PublicSettings | null) => ({ code: s?.currencyCode ?? 'LAK', symbol: s?.currencySymbol ?? '₭' });

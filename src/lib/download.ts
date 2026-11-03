import { toast } from 'sonner';
import i18n from '../i18n';
import { api } from './api';

/** The hosted prototype's sandbox blocks file downloads, so it explains instead of saving. */
const PROTOTYPE = import.meta.env.VITE_PROTOTYPE === '1';
const prototypeNotice = (filename: string) => toast.info(i18n.t('prototype.downloadBlocked', { file: filename }));

/** Downloads an authenticated file (e.g. CSV export) and saves it with `filename`. */
export async function downloadFile(path: string, params: Record<string, unknown>, filename: string) {
  const r = await api.get(path, { params, responseType: 'blob' });
  if (PROTOTYPE) return void prototypeNotice(filename);
  const url = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Saves rows built in the browser as a UTF-8 CSV that Excel opens with Lao text intact. */
export function saveCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  if (PROTOTYPE) return prototypeNotice(filename);
  const text = '﻿' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

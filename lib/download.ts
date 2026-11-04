import { api } from './api';

/** Downloads an authenticated file (e.g. CSV export) and saves it with `filename`. */
export async function downloadFile(path: string, params: Record<string, unknown>, filename: string) {
  const r = await api.get(path, { params, responseType: 'blob' });
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

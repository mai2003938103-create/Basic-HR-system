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

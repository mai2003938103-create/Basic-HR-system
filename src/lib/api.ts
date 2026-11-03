import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

export const api = axios.create({ baseURL: '/api', withCredentials: true });

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};

type Listener = (payload: { accessToken: string; user: unknown } | null) => void;
let sessionListener: Listener = () => {};
/** AuthProvider subscribes to refresh results (new token + user, or null when the session ended). */
export const onSession = (fn: Listener) => {
  sessionListener = fn;
};

let refreshing: Promise<string | null> | null = null;
export function refreshSession(): Promise<string | null> {
  refreshing ??= axios
    .post('/api/auth/refresh', null, { withCredentials: true })
    .then((r) => {
      setAccessToken(r.data.data.accessToken);
      sessionListener(r.data.data);
      return r.data.data.accessToken as string;
    })
    .catch(() => {
      setAccessToken(null);
      sessionListener(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const cfg = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
  if (error.response?.status === 401 && cfg && !cfg._retried && !cfg.url?.startsWith('/auth/')) {
    cfg._retried = true;
    const token = await refreshSession();
    if (token) {
      cfg.headers = { ...(cfg.headers ?? {}), Authorization: `Bearer ${token}` };
      return api.request(cfg);
    }
  }
  throw error;
});

export interface ApiErrorInfo {
  code: string;
  messageKey: string;
  fieldErrors: Record<string, string>;
}

export function apiError(e: unknown): ApiErrorInfo {
  const ax = e as AxiosError<{ error?: { code: string; message: string; details?: { field: string; message: string }[] } }>;
  const err = ax?.response?.data?.error;
  if (!err) return { code: 'NETWORK', messageKey: ax?.response ? 'errors.common.internal' : 'errors.common.network', fieldErrors: {} };
  return {
    code: err.code,
    messageKey: err.message,
    fieldErrors: Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message])),
  };
}

export interface Page<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}

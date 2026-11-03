// Routes every axios call to the in-browser prototype API instead of the network.
import axios, { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { api } from '../lib/api';
import { handle } from './server';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const base = (config.baseURL ?? '').replace(/\/$/, '');
  let url = config.url ?? '';
  if (!/^https?:/.test(url) && !url.startsWith('/api') && base) url = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  const u = new URL(url, 'http://proto.local');
  const query: Record<string, string> = {};
  u.searchParams.forEach((v, k) => (query[k] = v));
  for (const [k, v] of Object.entries((config.params ?? {}) as Record<string, unknown>)) if (v !== undefined && v !== null && v !== '') query[k] = String(v);
  let body = config.data;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { /* keep */ } }
  const path = u.pathname.replace(/^\/api/, '');
  await wait(120 + Math.random() * 180);
  const res = await handle({ method: (config.method ?? 'get').toUpperCase(), path, query, body, responseType: config.responseType });
  const response = { data: res.data, status: res.status, statusText: String(res.status), headers: new AxiosHeaders(res.headers ?? {}), config, request: {} };
  if (res.status >= 400) throw new AxiosError(`Request failed with status code ${res.status}`, res.status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, {}, response);
  return response;
};

export function installPrototype() {
  axios.defaults.adapter = adapter;
  api.defaults.adapter = adapter;
}

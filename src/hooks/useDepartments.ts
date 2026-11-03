import { useQuery } from './useQuery';
import { api, type Page } from '../lib/api';
import type { Department } from '../lib/types';

/** All departments (for selects and filters). */
export function useDepartments(enabled = true) {
  return useQuery(() => api.get<Page<Department>>('/departments', { params: { pageSize: 100, sort: 'code:asc' } }).then((r) => r.data.data), [], enabled);
}

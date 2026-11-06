import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/lib/router';
import { useDebounce } from './useDebounce';

export interface ListParams {
  page: number;
  pageSize: number;
  sort: string;
  search?: string;
  [filter: string]: string | number | undefined;
}

/** List state (page, size, sort, search, filters) kept in the URL so it survives reloads and back/forward. */
export function useListQuery(defaults: { sort: string; pageSize?: number; filters?: string[] }) {
  const [sp, setSp] = useSearchParams();
  const [searchInput, setSearchInput] = useState(sp.get('search') ?? '');
  const debounced = useDebounce(searchInput, 300);

  const update = useCallback(
    (changes: Record<string, string | number | undefined>, resetPage = true) => {
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            if (v === undefined || v === '') next.delete(k);
            else next.set(k, String(v));
          }
          if (resetPage && !('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSp],
  );

  useEffect(() => {
    if ((sp.get('search') ?? '') !== debounced) update({ search: debounced || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const params = useMemo<ListParams>(() => {
    const p: ListParams = {
      page: Math.max(1, Number(sp.get('page') ?? 1) || 1),
      pageSize: Number(sp.get('pageSize') ?? defaults.pageSize ?? 20) || 20,
      sort: sp.get('sort') ?? defaults.sort,
    };
    const search = sp.get('search');
    if (search) p.search = search;
    for (const f of defaults.filters ?? []) {
      const v = sp.get(f);
      if (v) p[f] = v;
    }
    return p;
  }, [sp, defaults.sort, defaults.pageSize, defaults.filters]);

  return {
    params,
    searchInput,
    setSearch: setSearchInput,
    setPage: (page: number) => update({ page: page > 1 ? page : undefined }, false),
    setPageSize: (pageSize: number) => update({ pageSize }),
    setSort: (sort: string) => update({ sort }),
    setFilter: (key: string, value: string | undefined) => update({ [key]: value }),
  };
}

/** Removes empty values so they are not sent as query parameters. */
export const cleanParams = (p: Record<string, unknown>) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== ''));

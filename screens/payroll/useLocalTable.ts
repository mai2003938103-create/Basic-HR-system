import { useMemo, useState } from 'react';

/** Sorting and paging for rows already loaded in full (DataTable params on the client). */
export function useLocalTable<T>(rows: T[], defaultSort: string, keys: Record<string, (r: T) => string | number>, pageSize = 20) {
  const [sort, setSortState] = useState(defaultSort);
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => {
    const [field, dir] = sort.split(':');
    const get = keys[field];
    if (!get) return rows;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return dir === 'desc' ? -r : r;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);
  const safePage = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)));
  return {
    rows: sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    all: sorted,
    total: sorted.length,
    params: { page: safePage, pageSize, sort },
    setSort: (s: string) => { setSortState(s); setPage(1); },
    setPage,
  };
}

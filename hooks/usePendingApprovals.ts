import { useEffect, useState } from 'react';
import { api, type Page } from '../lib/api';

/** Number of leave requests waiting for this user's decision; refetched when `key` changes and every minute. */
export function usePendingApprovals(enabled: boolean, key: unknown = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = () =>
      api.get<Page<unknown>>('/leave-requests', { params: { toApprove: 'true', pageSize: 1 } })
        .then((r) => alive && setCount(r.data.meta.total))
        .catch(() => undefined);
    void load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [enabled, key]);
  return enabled ? count : 0;
}

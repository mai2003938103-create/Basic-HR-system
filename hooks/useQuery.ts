import { useCallback, useEffect, useRef, useState } from 'react';

/** Minimal data loader: re-runs when `key` changes; ignores stale responses. */
export function useQuery<T>(fn: () => Promise<T>, key: unknown[], enabled = true) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);
  const [loading, setLoading] = useState(enabled);
  const seq = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    setError(undefined);
    try {
      const r = await fnRef.current();
      if (my === seq.current) setData(r);
    } catch (e) {
      if (my === seq.current) setError(e);
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(key)]);

  return { data, error, loading, reload: run, setData };
}

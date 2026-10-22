import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

/** Fetches `path` on mount and whenever it changes. Pass null to skip. */
export function useApi(path, { auth = false } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api(path, { auth })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [path, auth, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

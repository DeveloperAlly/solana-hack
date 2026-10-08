import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api';
import type { BrandState } from '../screens/build/Build';

/** Loads the signed-in owner's first brand and its full state (GET /api/me, GET /api/brands/:id). */
export function useBrand() {
  const [state, setState] = useState<BrandState | null>(null);
  const [noBrand, setNoBrand] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const reload = useCallback(async () => {
    try {
      const me = await api<{ user: { email: string }; brands: { id: string }[] }>('/me');
      setEmail(me.user.email);
      if (!me.brands.length) return setNoBrand(true);
      setState(await api<BrandState>(`/brands/${me.brands[0].id}`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your brand.');
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { state, noBrand, error, email, reload };
}

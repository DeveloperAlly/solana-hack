import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';
import { useAuth } from './auth';
import { useLiveBrands } from './liveBrands';
import type { BrandState } from '../screens/build/Build';

/** Selected live brand; older responses cannot replace a newly selected brand (delivery #114). */
export function useBrand() {
  const catalog = useLiveBrands();
  const { session } = useAuth();
  const [state, setState] = useState<BrandState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const reload = useCallback(async (preferred?: string) => {
    const id = preferred ?? catalog.id;
    if (!id) { await catalog.refresh(preferred); return; }
    const n = ++generation.current;
    try {
      const fresh = await api<BrandState>(`/brands/${id}`);
      if (n !== generation.current) return;
      setState(fresh); setError(null);
      if (preferred) await catalog.refresh(preferred);
    } catch (e) {
      if (n === generation.current) { setState(null); setError(e instanceof ApiError ? e.message : 'Could not load your brand.'); }
    }
  }, [catalog.id, catalog.refresh]);
  useEffect(() => { setState(null); setError(null); if (catalog.id) void reload(); return () => { generation.current++; }; }, [catalog.id, reload]);
  return { state: state?.brand.id === catalog.id ? state : null, noBrand: !catalog.loading && !catalog.error && catalog.brands.length === 0, error: catalog.error ?? error, email: session?.user.email ?? '', reload };
}

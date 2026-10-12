// Live account selection, separate from sample brands (delivery #114).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, ApiError } from './api';
import { useAuth } from './auth';
import { useLocation } from 'react-router';

export interface LiveBrand { id: string; name: string }
interface Catalog { brands: LiveBrand[]; id: string | null; loading: boolean; error: string | null; select: (id: string) => void; refresh: (preferred?: string) => Promise<void> }
const Context = createContext<Catalog | null>(null);

function useCatalog(scope: string | null, enabled: boolean, persist: boolean): Catalog {
  const [value, setValue] = useState<{ scope: string | null; brands: LiveBrand[]; id: string | null; loading: boolean; error: string | null }>({ scope, brands: [], id: null, loading: enabled, error: null });
  const generation = useRef(0);
  const current = useRef(value);
  current.current = value;
  const key = `jamjam:brand:${scope}`;
  const refresh = useCallback(async (preferred?: string) => {
    const n = ++generation.current;
    if (!enabled) { setValue({ scope, brands: [], id: null, loading: false, error: null }); return; }
    try {
      const me = await api<{ brands: LiveBrand[] }>('/me');
      if (n !== generation.current) return;
      let stored: string | null = null;
      if (persist) { try { stored = sessionStorage.getItem(key); } catch { /* optional storage */ } }
      const wanted = preferred ?? (current.current.scope === scope ? current.current.id : null) ?? stored;
      const id = me.brands.find((b) => b.id === wanted)?.id ?? me.brands[0]?.id ?? null;
      setValue({ scope, brands: me.brands, id, loading: false, error: null });
      if (persist && id) { try { sessionStorage.setItem(key, id); } catch { /* optional */ } }
    } catch (e) {
      if (n === generation.current) setValue({ scope, brands: [], id: null, loading: false, error: e instanceof ApiError ? e.message : 'Could not load your brands.' });
    }
  }, [enabled, scope, persist, key]);
  useEffect(() => { void refresh(); return () => { generation.current++; }; }, [refresh]);
  const select = useCallback((id: string) => {
    if (!current.current.brands.some((b) => b.id === id)) return;
    generation.current++;
    setValue((v) => ({ ...v, id }));
    if (persist) { try { sessionStorage.setItem(key, id); } catch { /* optional */ } }
  }, [persist, key]);
  const visible = value.scope === scope ? value : { brands: [], id: null, loading: enabled, error: null };
  return { ...visible, select, refresh };
}

export function LiveBrandProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const { pathname } = useLocation();
  const liveAccount = ['home', 'brand', 'build', 'create', 'settings', 'journey'].includes(pathname.split('/')[1]);
  const catalog = useCatalog(session?.user.id ?? null, !loading && !!session && liveAccount, true);
  return <Context.Provider value={catalog}>{children}</Context.Provider>;
}

/** Standalone screens/tests use the same loader; the application shares one account-scoped provider. */
export function useLiveBrands(): Catalog {
  const shared = useContext(Context);
  const local = useCatalog('standalone', !shared, false);
  return shared ?? local;
}

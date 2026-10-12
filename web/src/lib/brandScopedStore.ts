// A store kept per brand, so a draft started for one brand never shows under another (Codex review on PR #79).
// Built on the one store primitive, lib/createStore.ts. Browser session only: nothing persisted, no network.
import { createStore, type Store } from './createStore';

export type { Store };

/** Where the active brand comes from: read it now, or subscribe to it inside a component. */
export interface BrandSource {
  read: () => string;
  use: () => string;
}

/**
 * A store with one state per brand. `read`, `set` and `use` act on the active brand from `brand`. A brand reads as
 * `defaults` merged with what was set for it; without defaults an untouched brand reads as `{}`, so callers fall back
 * to their fixture defaults.
 */
export function createBrandScopedStore<T extends object>(brand: BrandSource): Store<Partial<T>>;
export function createBrandScopedStore<T extends object>(brand: BrandSource, defaults: T): Store<T>;
export function createBrandScopedStore<T extends object>(brand: BrandSource, defaults: Partial<T> = {}): Store<Partial<T>> {
  const byBrand = createStore<Record<string, Partial<T>>>({});
  // One merged object per stored state, so `use` hands React a stable snapshot.
  const merged = new WeakMap<Partial<T>, Partial<T>>();
  const empty: Partial<T> = {};
  const view = (own: Partial<T> | undefined) => {
    const key = own ?? empty;
    if (!merged.has(key)) merged.set(key, { ...defaults, ...key });
    return merged.get(key)!;
  };
  const read = () => view(byBrand.read()[brand.read()]);
  const set = (patch: Partial<T>) => {
    const id = brand.read();
    byBrand.set({ [id]: { ...byBrand.read()[id], ...patch } });
  };
  return {
    read,
    set,
    reset: byBrand.reset,
    subscribe: byBrand.subscribe,
    use: () => {
      const [all] = byBrand.use();
      return [view(all[brand.use()]), set];
    },
  };
}

// A store kept per brand, so a draft started for one brand never shows under another (Codex review on PR #79).
// Built on the one store primitive, lib/createStore.ts. Browser session only: nothing persisted, no network.
import { createStore, type Store } from './createStore';

export type { Store };

/** Where the active brand comes from: read it now, or subscribe to it inside a component. */
export interface BrandSource {
  read: () => string;
  use: () => string;
}

/** A brand-scoped store, plus the same states bound to one named brand (a public page opened for that brand). */
export interface BrandScopedStore<T> extends Store<T> {
  /** The store for brand `id`, whatever the active brand is; the same state the active-brand store shows for `id`. */
  forBrand: (id: string) => Store<T>;
}

/**
 * A store with one state per brand. `read`, `set` and `use` act on the active brand from `brand`; `forBrand(id)` acts
 * on one named brand. A brand reads as `defaults` merged with what was set for it; without defaults an untouched brand
 * reads as `{}`, so callers fall back to their fixture defaults.
 */
export function createBrandScopedStore<T extends object>(brand: BrandSource): BrandScopedStore<Partial<T>>;
export function createBrandScopedStore<T extends object>(brand: BrandSource, defaults: T): BrandScopedStore<T>;
export function createBrandScopedStore<T extends object>(brand: BrandSource, defaults: Partial<T> = {}): BrandScopedStore<Partial<T>> {
  const byBrand = createStore<Record<string, Partial<T>>>({});
  // One merged object per stored state, so `use` hands React a stable snapshot.
  const merged = new WeakMap<Partial<T>, Partial<T>>();
  const empty: Partial<T> = {};
  const view = (own: Partial<T> | undefined) => {
    const key = own ?? empty;
    if (!merged.has(key)) merged.set(key, { ...defaults, ...key });
    return merged.get(key)!;
  };
  // One setter per brand id, so the setter `use` returns keeps its identity across renders.
  const setters = new Map<string, (patch: Partial<T>) => void>();
  const setFor = (id: string) => {
    if (!setters.has(id)) setters.set(id, (patch) => byBrand.set({ [id]: { ...byBrand.read()[id], ...patch } }));
    return setters.get(id)!;
  };
  // One bound store per brand id, so a component that reads `forBrand(id)` gets the same object every render.
  const bound = new Map<string, Store<Partial<T>>>();
  const forBrand = (id: string): Store<Partial<T>> => {
    if (!bound.has(id)) {
      bound.set(id, {
        read: () => view(byBrand.read()[id]),
        set: setFor(id),
        reset: byBrand.reset,
        subscribe: byBrand.subscribe,
        use: () => {
          const [all] = byBrand.use();
          return [view(all[id]), setFor(id)];
        },
      });
    }
    return bound.get(id)!;
  };
  return {
    read: () => view(byBrand.read()[brand.read()]),
    set: (patch) => setFor(brand.read())(patch),
    reset: byBrand.reset,
    subscribe: byBrand.subscribe,
    use: () => {
      const [all] = byBrand.use();
      const id = brand.use();
      return [view(all[id]), setFor(id)];
    },
    forBrand,
  };
}

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
 * A store with one state per brand. `read`, `set` and `use` act on the active brand from `brand`; an untouched
 * brand reads as `{}`, so callers fall back to their fixture defaults.
 */
export function createBrandScopedStore<T extends object>(brand: BrandSource, initial: Partial<T> = {}): Store<Partial<T>> {
  const byBrand = createStore<Record<string, Partial<T>>>({});
  const read = () => ({ ...initial, ...byBrand.read()[brand.read()] });
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
      return [{ ...initial, ...all[brand.use()] }, set];
    },
  };
}

// In-memory stores for gallery flows (issue #51, shared for Superhub): a plain store, and a store kept per brand so
// a draft started for one brand never shows under another (Codex review on PR #79). They live for the browser
// session only: nothing is persisted and nothing calls the network.
import { useSyncExternalStore } from 'react';

export interface Store<T> {
  read: () => T;
  /** Merges a patch into the state. */
  set: (patch: Partial<T>) => void;
  /** Back to the initial state (tests, and starting over). */
  reset: () => void;
  /** The current state (re-renders on change) and the setter. */
  use: () => [T, (patch: Partial<T>) => void];
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };
  const read = () => state;
  const set = (patch: Partial<T>) => {
    state = { ...state, ...patch };
    emit();
  };
  return {
    read,
    set,
    reset: () => {
      state = initial;
      emit();
    },
    use: () => [useSyncExternalStore(subscribe, read, read), set],
  };
}

/** Where the active brand comes from: read it now, or subscribe to it inside a component. */
export interface BrandSource {
  read: () => string;
  use: () => string;
}

/**
 * A store with one state per brand. `read`, `set` and `use` act on the active brand from `brand`; an untouched
 * brand reads as `{}`, so callers fall back to their fixture defaults.
 */
export function createBrandScopedStore<T extends object>(brand: BrandSource): Store<Partial<T>> {
  const byBrand = createStore<Record<string, Partial<T>>>({});
  const read = () => byBrand.read()[brand.read()] ?? {};
  const set = (patch: Partial<T>) => {
    const id = brand.read();
    byBrand.set({ [id]: { ...byBrand.read()[id], ...patch } });
  };
  return {
    read,
    set,
    reset: byBrand.reset,
    use: () => {
      const [all] = byBrand.use();
      return [all[brand.use()] ?? {}, set];
    },
  };
}

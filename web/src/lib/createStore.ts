// The one in-memory store primitive every page flow uses (issues #51, #82; the README rule "nothing is repeated").
// It lives for the browser session only: nothing is persisted and nothing calls the network. Brand-scoped stores
// (lib/brandScopedStore.ts) and every page session build on it.
import { useSyncExternalStore } from 'react';

export interface Store<T> {
  read: () => T;
  /** Merges a patch into the state. */
  set: (patch: Partial<T>) => void;
  /** Back to the initial state (tests, and starting over). */
  reset: () => void;
  /** Subscribes to changes; returns the unsubscribe. */
  subscribe: (listener: () => void) => () => void;
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
    subscribe,
    use: () => [useSyncExternalStore(subscribe, read, read), set],
  };
}

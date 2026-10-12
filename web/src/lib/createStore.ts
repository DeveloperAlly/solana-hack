// A small in-memory store a page's flows share (session state for the browser tab). Nothing is persisted and nothing
// calls the network. Same body as ui/51-coming-soon's page-local createStore.ts, lifted here so pages share one copy
// (issue #82; the README rule "nothing is repeated").
import { useSyncExternalStore } from 'react';

export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const read = () => state;
  const set = (patch: Partial<T>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };
  return {
    read,
    set,
    /** Back to the initial state (tests, and starting over). */
    reset: () => {
      state = initial;
      listeners.forEach((l) => l());
    },
    /** The current state and a stable setter that merges a patch. */
    use: (): [T, (patch: Partial<T>) => void] => [useSyncExternalStore(subscribe, read, read), set],
  };
}

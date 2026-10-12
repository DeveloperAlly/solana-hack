// Unique ids for client-side items (an added link, brand or row) before the server gives them one. Never derive an
// id from a list's length: after a removal, `length + 1` repeats an id still in use (Codex review on PR #79).
let counter = 0;

/**
 * Returns an id that is unique in this page session: `crypto.randomUUID()` where the browser has it, otherwise a
 * monotonic counter plus a timestamp. `prefix` makes ids readable in fixtures and the DOM, e.g. newId('link').
 */
export function newId(prefix?: string): string {
  counter += 1;
  const core = typeof globalThis.crypto?.randomUUID === 'function' ? globalThis.crypto.randomUUID() : `${Date.now().toString(36)}-${counter.toString(36)}`;
  return prefix ? `${prefix}-${core}` : core;
}

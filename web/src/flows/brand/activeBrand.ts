// The active brand for every new-flow screen (issue #45): one account-level choice that every brand switcher (D48)
// reads and writes, and that every brand-scoped store keys by (lib/brandScopedStore.ts). Before this, Coming soon,
// Superhub and Brand Builder each kept their own, so a campaign started under one brand on Superhub continued under
// another on Coming soon (Codex review on PR #79). Session only. INTEGRATION: the brands on GET /api/me.
import { createStore } from '../../lib/createStore';
import type { BrandSource } from '../../lib/brandScopedStore';

/** The demo brand selected before anyone chooses one: aDNA, the case brand with full sample data (issue #45). */
export const defaultBrandId = 'adna';

const store = createStore<{ id: string }>({ id: defaultBrandId });

/** The active brand id: read it now, or subscribe to it in a component. */
export const activeBrand: BrandSource = {
  read: () => store.read().id,
  use: () => store.use()[0].id,
};

/** Makes `id` the active brand for every screen. */
export const selectBrand = (id: string) => {
  if (id !== store.read().id) store.set({ id });
};

/** Back to the default brand (tests; a sign-out in the real app). */
export const resetActiveBrand = store.reset;

/** The active brand id and the setter, for brand switchers. */
export function useActiveBrandId(): [string, (id: string) => void] {
  return [activeBrand.use(), selectBrand];
}

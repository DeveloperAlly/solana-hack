// The brand catalog (issue #45): the demo brands plus brands added this session on Brand-Switcher. Every switcher and
// the active brand read it, so a brand added on one page is a real brand on every page, never shown as another one
// (Codex review on PR #103). Session only. INTEGRATION: GET /api/me brands; POST /api/brands adds one.
import { useMemo } from 'react';
import { createStore } from '../../lib/createStore';
import { uniqueId } from '../../lib/id';
import { demoBrands } from '../../ui/domain/demoBrands';
import type { BrandOption } from '../../ui/domain/BrandSwitcher';

/** A catalog brand; one added this session also carries the domain it was added with (self-declared until verified). */
export interface CatalogBrand extends BrandOption {
  domain?: string;
}

const store = createStore<{ added: CatalogBrand[] }>({ added: [] });

/** Clears the brands added this session (tests; a sign-out in the real app). */
export const resetBrandCatalog = store.reset;

/** Adds a brand to the catalog and returns it. */
export function addBrand(entry: { name: string; domain: string }): CatalogBrand {
  const brand: CatalogBrand = { id: uniqueId('brand'), name: entry.name, domain: entry.domain };
  store.set({ added: [...store.read().added, brand] });
  return brand;
}

/** Every brand: the demo brands, then the ones added this session. */
export function useBrandCatalog(): { brands: CatalogBrand[]; added: CatalogBrand[] } {
  const [{ added }] = store.use();
  return useMemo(() => ({ brands: [...demoBrands, ...added], added }), [added]);
}

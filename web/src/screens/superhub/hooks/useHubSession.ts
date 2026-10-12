import { useCallback, useMemo } from 'react';
import { createBrandScopedStore } from '../../../lib/brandScopedStore';
import { activeBrand, resetActiveBrand, useActiveBrandId } from '../../../flows/brand/activeBrand';
import type { DraftRecord } from './draftStatus';
import type { DraftContent, DraftSummary } from '../types';

/** What a person changes on one Superhub screen that later screens must show, for one brand. */
export interface BrandScoped {
  /** Inbox threads that were replied to, snoozed or marked done, by thread id. */
  inbox: Record<string, 'sent' | 'snoozed' | 'done'>;
  /** Decisions taken in Draft-Review, by draft id; their status comes from draftStatusOf. */
  drafts: Record<string, DraftRecord>;
  /** Engagement rules switched off (their items leave the reply queue). */
  rulesOff: string[];
  /**
   * Drafts created on other screens (Leads' Draft outreach), by id: the dashboard row and the content Draft-Review
   * shows. They join the one approval queue with the fixture drafts. `lead` is the lead an outreach draft was for.
   */
  created: Record<string, { summary: DraftSummary; content: DraftContent; lead?: string }>;
  /** The persona created in Influencer-Setup. */
  persona?: { name: string; line: string; voice: string };
}

/** The active brand plus that brand's state: what every screen reads. Fixtures are only the defaults. */
export interface HubSession extends BrandScoped {
  /** Brand chosen in the switcher (D48 BrandSwitcher ids); account-level. */
  brand: string;
}

const emptyBrand: BrandScoped = { inbox: {}, drafts: {}, rulesOff: [], created: {} };
/** Everything but the brand choice, kept per brand (lib/brandScopedStore keyed by the app-wide active brand). */
const byBrand = createBrandScopedStore<BrandScoped>(activeBrand);

/** Starts a fresh session (tests; a sign-out in the real app). */
export function resetHubSession() {
  byBrand.reset();
  resetActiveBrand();
}

/**
 * The Superhub's in-memory session, shared by every screen in the tab. Everything except the brand choice is kept per
 * brand, so switching brand never shows another brand's drafts, inbox, rules or persona (Codex review on PR #81).
 * Each screen reads the part it shows and writes what the person changed, so a later screen reflects it.
 * INTEGRATION: these are server state once the screens are wired (brands, inbox_threads, drafts, rules, personas).
 */
export function useHubSession(): [HubSession, (change: (s: HubSession) => HubSession) => void] {
  const [brand] = useActiveBrandId();
  const [scoped] = byBrand.use();
  const state = useMemo(() => ({ ...emptyBrand, ...scoped, brand }), [scoped, brand]);
  const update = useCallback((change: (s: HubSession) => HubSession) => {
    const { brand: _brand, ...next } = change({ ...emptyBrand, ...byBrand.read(), brand: activeBrand.read() });
    byBrand.set(next);
  }, []);
  return [state, update];
}


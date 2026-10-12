import { useCallback, useSyncExternalStore } from 'react';
import { demoBrands } from '../../../ui/domain/demoBrands';
import { campaignStore } from '../../../flows/campaign/draft';
import type { DraftStatus } from '../types';

/** What a person changes on one Superhub screen that later screens must show, for one brand. */
export interface BrandScoped {
  /** Inbox threads that were replied to, snoozed or marked done, by thread id. */
  inbox: Record<string, 'sent' | 'snoozed' | 'done'>;
  /** Drafts moved by a decision in Draft-Review, by draft id. */
  drafts: Record<string, DraftStatus>;
  /** Engagement rules switched off (their items leave the reply queue). */
  rulesOff: string[];
  /** The persona created in Influencer-Setup. */
  persona?: { name: string; line: string; voice: string };
}

/** The active brand plus that brand's state: what every screen reads. Fixtures are only the defaults. */
export interface HubSession extends BrandScoped {
  /** Brand chosen in the switcher (D48 BrandSwitcher ids); account-level. */
  brand: string;
}

const emptyBrand: BrandScoped = { inbox: {}, drafts: {}, rulesOff: [] };
interface Store { brand: string; byBrand: Record<string, BrandScoped> }

const initial: Store = { brand: 'adna', byBrand: {} };
let store = initial;
const viewOf = (s: Store): HubSession => ({ ...emptyBrand, ...s.byBrand[s.brand], brand: s.brand });
let view = viewOf(store);
const listeners = new Set<() => void>();

function write(next: Store) {
  store = next;
  view = viewOf(store);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Starts a fresh session (tests; a sign-out in the real app). */
export function resetHubSession() {
  write(initial);
}

/**
 * The Superhub's in-memory session, shared by every screen in the tab. Everything except the brand choice is kept per
 * brand, so switching brand never shows another brand's drafts, inbox, rules or persona (Codex review on PR #81).
 * Each screen reads the part it shows and writes what the person changed, so a later screen reflects it.
 * INTEGRATION: these are server state once the screens are wired (brands, inbox_threads, drafts, rules, personas).
 */
export function useHubSession(): [HubSession, (change: (s: HubSession) => HubSession) => void] {
  const state = useSyncExternalStore(subscribe, () => view, () => view);
  const update = useCallback((change: (s: HubSession) => HubSession) => {
    const { brand, ...scoped } = change(view);
    write({ brand, byBrand: { ...store.byBrand, [store.brand]: scoped } });
  }, []);
  return [state, update];
}

/** The brand chosen in the switcher, with its name, for every screen that names the brand. */
export function useActiveBrand() {
  const [s] = useHubSession();
  const brand = demoBrands.find((b) => b.id === s.brand) ?? demoBrands[0];
  return {
    id: brand.id,
    name: brand.name,
    select: (id: string) => {
      if (id === store.brand) return;
      write({ ...store, brand: id });
      // The shared campaign draft (flows/campaign) belongs to one brand: switching brand starts a new campaign.
      campaignStore.reset();
    },
  };
}

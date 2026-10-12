import { useCallback, useSyncExternalStore } from 'react';
import { demoBrands } from '../../../ui/domain/demoBrands';
import type { CampaignValues, DraftStatus } from '../types';

/** What a person changes on one Superhub screen that later screens must show (fixtures are only the defaults). */
export interface HubSession {
  /** Brand chosen in the switcher (D48 BrandSwitcher ids). */
  brand: string;
  /** Inbox threads that were replied to, snoozed or marked done, by thread id. */
  inbox: Record<string, 'sent' | 'snoozed' | 'done'>;
  /** Drafts moved by a decision in Draft-Review, by draft id. */
  drafts: Record<string, DraftStatus>;
  /** Engagement rules switched off (their items leave the reply queue). */
  rulesOff: string[];
  /** The campaign being set up, all wizard fields in one object (kept when moving Back and Next). */
  campaign: CampaignValues;
  /** The persona created in Influencer-Setup. */
  persona?: { name: string; line: string; voice: string };
}

/** A new campaign: nothing chosen for the person. */
export const blankCampaign: CampaignValues = { name: '', dates: '', purpose: '', customPurpose: '', platforms: [], poster: '', mainMetric: '', supporting: [], targets: {} };

const initial: HubSession = { brand: 'adna', inbox: {}, drafts: {}, rulesOff: [], campaign: blankCampaign };
let session = initial;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Starts a fresh session (tests; a sign-out in the real app). */
export function resetHubSession() {
  session = initial;
  listeners.forEach((l) => l());
}

/**
 * The Superhub's in-memory session, shared by every screen in the tab. Each screen reads the part it shows and writes
 * what the person changed, so a later screen reflects it (e.g. a rule switched off removes its replies from the queue).
 * INTEGRATION: these are server state once the screens are wired (brands, inbox_threads, drafts, rules, personas).
 */
export function useHubSession(): [HubSession, (change: (s: HubSession) => HubSession) => void] {
  const state = useSyncExternalStore(subscribe, () => session, () => session);
  const update = useCallback((change: (s: HubSession) => HubSession) => {
    session = change(session);
    listeners.forEach((l) => l());
  }, []);
  return [state, update];
}

/** The brand chosen in the switcher, with its name, for every screen that names the brand. */
export function useActiveBrand() {
  const [s, update] = useHubSession();
  const brand = demoBrands.find((b) => b.id === s.brand) ?? demoBrands[0];
  return { id: brand.id, name: brand.name, select: (id: string) => update((x) => ({ ...x, brand: id })) };
}

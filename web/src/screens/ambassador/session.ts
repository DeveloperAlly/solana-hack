import { useSyncExternalStore } from 'react';
import type { CampaignRef, DraftReview, PieceFormat, PublishRouteId } from './types';

/**
 * What the ambassador chose so far in this tab: the joined campaign, the piece and its draft, the publish route and
 * the link they submitted. Each gallery screen is its own route, so this store is how a choice made on one screen
 * reaches every later one, on desktop and mobile alike. Fixtures are only the defaults for what is not chosen yet.
 * INTEGRATION: these come from memberships, drafts and submissions rows once the API is wired.
 */
export interface AmbSession {
  campaign?: CampaignRef;
  piece?: PieceFormat;
  draft?: string;
  review?: DraftReview;
  route?: PublishRouteId;
  submittedUrl?: string;
}

let current: AmbSession = {};
const listeners = new Set<() => void>();

export const ambSession = {
  get: (): AmbSession => current,
  update(patch: AmbSession) {
    current = { ...current, ...patch };
    listeners.forEach((l) => l());
  },
  /** Back to the fixture defaults (tests, and a fresh demo run). */
  reset() {
    current = {};
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** The session, re-rendering when it changes. */
export function useAmbSession(): AmbSession {
  return useSyncExternalStore(ambSession.subscribe, ambSession.get, ambSession.get);
}

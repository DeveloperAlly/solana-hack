import { createStore } from '../../lib/createStore';
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
  /** The ambassador's angle, kept with the draft (Regenerate keeps it, canvas note n-a3). */
  angle?: string;
  review?: DraftReview;
  route?: PublishRouteId;
  submittedUrl?: string;
}

/** The session store (lib/createStore); `reset` goes back to the fixture defaults (tests, and a fresh demo run). */
export const ambSession = createStore<AmbSession>({});

/** The session, re-rendering when it changes. */
export function useAmbSession(): AmbSession {
  return ambSession.use()[0];
}

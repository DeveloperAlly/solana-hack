// Session state for the "Coming soon" page (issue #51): what the person changed on one screen that later screens show.
// Fixtures are only the defaults; an unset field means "use the screen's fixture".
// INTEGRATION: each field is server state once its endpoint exists (named on each field).
import { createStore } from './createStore';
import type { SoonStatusId } from './status';
import type { CalendarSlot, Claim, PaidPlan, StatusRowItem } from './types';

export interface SoonSession {
  /** Active brand (D48), shared by the hub frame's switcher and Brand-Switcher. Session, no endpoint yet. */
  brandId?: string;
  /** Brands added on Brand-Switcher (POST /api/brands). */
  addedBrands?: StatusRowItem[];
  /** Stored AI key, last 4 characters only; null after Remove (PUT …/ai-settings). */
  aiKey?: { last4: string } | null;
  /** OpenRouter connect status from Settings-GetKey (PUT …/ai-settings). */
  openRouter?: SoonStatusId;
  /** OpenAI-compatible endpoint added on Settings-AI (PUT …/ai-settings). */
  endpoint?: string;
  /** Publishing connection and payout wallet status by row id (connections, brands.payout_wallet). */
  connections?: Record<string, SoonStatusId>;
  /** Plan chosen on Pricing, and whether Upgrade took payment (G-BILLING). */
  plan?: PaidPlan;
  paid?: boolean;
  /** Claim edits by claim id, from Claims and from Media-Review "Add a source" (PATCH …/claims/:id). */
  claims?: Record<string, Partial<Claim>>;
  /** Calendar after scheduling or retrying (PATCH /api/drafts/:id). */
  slots?: CalendarSlot[];
}

export const soonSession = createStore<SoonSession>({});

/** The session and a setter that merges a patch. */
export const useSoonSession = soonSession.use;

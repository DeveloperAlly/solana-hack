// Session state for the "Coming soon" page (issue #51): what the person changed on one screen that later screens show.
// Fixtures are only the defaults; an unset field means "use the screen's fixture".
// Everything except the brand choice is scoped to the active brand, so switching brand never shows another brand's
// keys, connections, plan, claims or schedule (Codex review on PR #79).
// INTEGRATION: each field is server state once its endpoint exists (named on each field).
import { createStore } from '../../lib/createStore';
import { createBrandScopedStore } from '../../lib/brandScopedStore';
import { activeBrand } from '../../flows/brand/activeBrand';
import type { SoonStatusId } from './status';
import type { Claim, PaidPlan, StatusRowItem } from './types';

export type AiSource = { source: 'default' } | { source: 'openrouter'; key: { last4: string } };

/** Account-level state, shared by every brand. The active brand itself is flows/brand/activeBrand. */
interface AccountState {
  /** Brands added on Brand-Switcher (POST /api/brands). */
  addedBrands?: StatusRowItem[];
}

/** Per-brand state. */
export interface BrandState {
  /**
   * Which model source writes, as one object so the key and the connection can never disagree (Codex review on
   * PR #79): JamJam's default, or OpenRouter with the stored key (last 4 characters only). PUT …/ai-settings.
   */
  ai?: AiSource;
  /** OpenAI-compatible endpoint added on Settings-AI (PUT …/ai-settings). */
  endpoint?: string;
  /** Publishing connection and payout wallet status by row id (connections, brands.payout_wallet). */
  connections?: Record<string, SoonStatusId>;
  /** Plan chosen on Pricing, and whether Upgrade took payment (G-BILLING). */
  plan?: PaidPlan;
  paid?: boolean;
  /** Claim edits by claim id, from Claims and from Media-Review "Add a source" (PATCH …/claims/:id). */
  claims?: Record<string, Partial<Claim>>;
  /** Posts scheduled in this session, slot id -> post id (PATCH /api/drafts/:id { scheduled_at }). */
  schedule?: Record<string, string>;
  /** Failed slots retried after a reconnect (POST /api/drafts/:id/publish). */
  retried?: string[];
}

export type SoonSession = AccountState & BrandState;

const account = createStore<AccountState>({});
const byBrand = createBrandScopedStore<BrandState>(activeBrand);

/** Clears the session (tests). */
export function resetSoonSession() {
  account.reset();
  byBrand.reset();
}

function setSession(patch: Partial<SoonSession>) {
  const { addedBrands, ...scoped } = patch;
  if ('addedBrands' in patch) account.set({ addedBrands });
  if (Object.keys(scoped).length) byBrand.set(scoped);
}

/** The session for the active brand, and a setter that merges a patch (brand fields go to the active brand). */
export function useSoonSession(): [SoonSession, (patch: Partial<SoonSession>) => void] {
  const [acc] = account.use();
  const [scoped] = byBrand.use();
  return [{ ...acc, ...scoped }, setSession];
}

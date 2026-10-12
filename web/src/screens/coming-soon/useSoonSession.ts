// Session state for the "Coming soon" page (issue #51): what the person changed on one screen that later screens show.
// Fixtures are only the defaults; an unset field means "use the screen's fixture".
// Everything except the brand choice is scoped to the active brand, so switching brand never shows another brand's
// keys, connections, plan, claims or schedule (Codex review on PR #79).
// INTEGRATION: each field is server state once its endpoint exists (named on each field).
import { createStore } from './createStore';
import type { SoonStatusId } from './status';
import type { Claim, PaidPlan, StatusRowItem } from './types';

/** The brand selected when none was chosen in this session (demo fixture id). */
export const defaultBrandId = 'jamjam';

/** Account-level state, shared by every brand. */
interface AccountState {
  /** Active brand (D48), shared by the hub frame's switcher and Brand-Switcher. Session, no endpoint yet. */
  brandId?: string;
  /** Brands added on Brand-Switcher (POST /api/brands). */
  addedBrands?: StatusRowItem[];
}

/** Per-brand state. */
export interface BrandState {
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
  /** Posts scheduled in this session, slot id -> post id (PATCH /api/drafts/:id { scheduled_at }). */
  schedule?: Record<string, string>;
  /** Failed slots retried after a reconnect (POST /api/drafts/:id/publish). */
  retried?: string[];
}

export type SoonSession = AccountState & BrandState;

const store = createStore<AccountState & { byBrand: Record<string, BrandState> }>({ byBrand: {} });

/** Clears the session (tests). */
export const resetSoonSession = store.reset;

function setSession(patch: Partial<SoonSession>) {
  const { brandId, addedBrands, ...scoped } = patch;
  const current = store.read();
  const brand = current.brandId ?? defaultBrandId;
  store.set({
    ...('brandId' in patch ? { brandId } : {}),
    ...('addedBrands' in patch ? { addedBrands } : {}),
    byBrand: { ...current.byBrand, [brand]: { ...current.byBrand[brand], ...scoped } },
  });
}

/** The session for the active brand, and a setter that merges a patch (brand fields go to the active brand). */
export function useSoonSession(): [SoonSession, (patch: Partial<SoonSession>) => void] {
  const [state] = store.use();
  const brand = state.brandId ?? defaultBrandId;
  return [{ brandId: state.brandId, addedBrands: state.addedBrands, ...state.byBrand[brand] }, setSession];
}

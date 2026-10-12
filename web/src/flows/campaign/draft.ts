// The campaign draft every step reads and writes, and its fixture defaults (issue #46). Kept per brand: each brand has
// its own draft, and switching back restores it (Codex review on PR #79). In memory for the browser session only: no
// network, nothing persisted (INTEGRATION: POST /api/campaigns, then PATCH /api/campaigns/:id per step; backend map
// rows "Campaign-v2-1" to "Campaign-v2-6").
import { useMemo } from 'react';
import { createBrandScopedStore } from '../../lib/brandScopedStore';
import { activeBrand } from '../brand/activeBrand';
import { approve, isCurrent, type Approval } from '../../lib/approval';
import { stepIndex, type CampaignStepId } from './steps';

export interface CampaignDraft {
  /** `customPurpose` describes a Custom purpose (Superhub step 1, issue #52). */
  goal: { purpose: string; customPurpose?: string; name: string; dates: string; platforms: string[]; poster: string };
  /** Audience segment ids from the kit. */
  audience: string[];
  success: { mainMetric: string; supporting: string[]; targets: Record<string, string> };
  /** Content plan item ids the person removed. */
  plan: { removed: string[] };
  /** Payout per format, and the spending cap. */
  budget: { payouts: Record<string, string>; cap: string };
  /** The review step's approval of the spending cap, bound to the cap value it approved (lib/approval). */
  approval: { cap: Approval | null };
}

/**
 * Fixture defaults. Bracketed values are placeholders, not a real brand's campaign. Choices a person must make
 * (purpose, platforms, who posts, main metric, cap approval) start empty, so nothing is chosen for them.
 */
export const campaignDraftFixture: CampaignDraft = {
  goal: { purpose: '', name: '', dates: '', platforms: [], poster: '' },
  audience: [],
  success: { mainMetric: '', supporting: [], targets: {} },
  plan: { removed: [] },
  budget: { payouts: { linkedin: '10', tutorial: '40' }, cap: '500' },
  approval: { cap: null },
};

interface FlowState {
  draft: CampaignDraft;
  /** Steps whose Continue passed in this session. */
  completed: Partial<Record<CampaignStepId, true>>;
}

/** The step that owns each draft section. */
const sectionStep: Record<keyof CampaignDraft, CampaignStepId> = {
  goal: 'goal',
  audience: 'audience',
  success: 'success',
  plan: 'plan',
  budget: 'budget',
  approval: 'launch',
};

/** The completion marks of the steps before `step` only. */
function completedBefore(completed: FlowState['completed'], step: CampaignStepId): FlowState['completed'] {
  const cut = stepIndex(step);
  return Object.fromEntries(Object.entries(completed).filter(([id]) => stepIndex(id as CampaignStepId) < cut));
}

/** A brand with no campaign yet starts here; never mutated, so it is safe to share. */
const initialState: FlowState = { draft: campaignDraftFixture, completed: {} };
/** One draft per brand, keyed by the app-wide active brand (flows/brand/activeBrand). */
const byBrand = createBrandScopedStore<FlowState>(activeBrand);
const read = (): FlowState => ({ ...initialState, ...byBrand.read() });
const write = (next: FlowState) => byBrand.set(next);

export const campaignStore = {
  read,
  /**
   * Replaces one section of the draft, e.g. set('audience', ['devs']) or set('goal', { ...draft.goal, name }).
   * Changing a section un-completes the step that owns it and every later step (they were completed on the old
   * data), so an edited earlier step can never be skipped past (Codex review on PR #80).
   */
  set<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) {
    const state = read();
    write({ draft: { ...state.draft, [key]: value }, completed: completedBefore(state.completed, sectionStep[key]) });
  },
  /** Un-completes this step and every later one (its input became incomplete). */
  invalidate(step: CampaignStepId) {
    const state = read();
    const completed = completedBefore(state.completed, step);
    if (Object.keys(completed).length === Object.keys(state.completed).length) return;
    write({ ...state, completed });
  },
  complete(step: CampaignStepId) {
    const state = read();
    write({ ...state, completed: { ...state.completed, [step]: true } });
  },
  /** Clears every brand's campaign (between tests). */
  reset: byBrand.reset,
  /** The active brand's campaign; re-renders when it or the active brand changes. */
  use: (): FlowState => {
    const [scoped] = byBrand.use();
    return useMemo(() => ({ ...initialState, ...scoped }), [scoped]);
  },
};

/** Whether the draft's spending cap is approved: an approval of a different cap is stale (Codex review on PR #103). */
export const capApproved = (draft: CampaignDraft): boolean => isCurrent(draft.approval.cap, draft.budget.cap);

/** The cap approval for the draft's current cap, or none. */
export const capApproval = (draft: CampaignDraft, approved: boolean): CampaignDraft['approval'] => ({ cap: approved ? approve(draft.budget.cap) : null });

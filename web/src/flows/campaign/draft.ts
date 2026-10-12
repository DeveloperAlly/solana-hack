// The campaign draft every step reads and writes, and its fixture defaults (issue #46). In memory for the browser
// session only: no network, nothing persisted (INTEGRATION: POST /api/campaigns, then PATCH /api/campaigns/:id per
// step; backend map rows "Campaign-v2-1" to "Campaign-v2-6").
import { useSyncExternalStore } from 'react';
import type { CampaignStepId } from './steps';

export interface CampaignDraft {
  goal: { purpose: string; name: string; dates: string; platforms: string[]; poster: string };
  /** Audience segment ids from the kit. */
  audience: string[];
  success: { mainMetric: string; supporting: string[]; targets: Record<string, string> };
  /** Content plan item ids the person removed. */
  plan: { removed: string[] };
  /** Payout per format, and the spending cap. */
  budget: { payouts: Record<string, string>; cap: string };
  /** The review step's approval of the spending cap. */
  approval: { capApproved: boolean };
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
  approval: { capApproved: false },
};

interface FlowState {
  draft: CampaignDraft;
  /** Steps whose Continue passed in this session. */
  completed: Partial<Record<CampaignStepId, true>>;
}

const initialState = (): FlowState => ({ draft: structuredClone(campaignDraftFixture), completed: {} });
let state = initialState();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const read = () => state;

export const campaignStore = {
  read,
  /** Replaces one section of the draft, e.g. set('audience', ['devs']) or set('goal', { ...draft.goal, name }). */
  set<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) {
    state = { ...state, draft: { ...state.draft, [key]: value } };
    emit();
  },
  complete(step: CampaignStepId) {
    state = { ...state, completed: { ...state.completed, [step]: true } };
    emit();
  },
  /** Starts a new campaign (and resets between tests). */
  reset() {
    state = initialState();
    emit();
  },
  use: (): FlowState => useSyncExternalStore(subscribe, read, read),
};

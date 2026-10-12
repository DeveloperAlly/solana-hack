// Campaign v2 flow state (issue #51): step order, back and next, and the draft the steps share.
// Steps follow the canvas stepper on every Campaign v2 board: 1 Goal, 2 Audience, 3 Measure, 4 Content plan,
// 5 People and budget, 6 Review and launch. Goal and Measure are Superhub screens (issue #52); the rest are here.
// The draft lives in memory for the session only: no network, nothing persisted (INTEGRATION: PATCH /api/campaigns/:id).
import { useCallback, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import { soonRoutes } from './routes';

// `external`: built on Superhub (issue #52); this page cannot see whether it finished, so the campaign record
// (fixtures in the gallery) stands for it.
export const campaignSteps = [
  { id: 'goal', label: 'Goal', href: soonRoutes.campaignGoal, external: true },
  { id: 'audience', label: 'Audience', href: soonRoutes.campaignAudience, external: false },
  { id: 'measure', label: 'Measure', href: soonRoutes.campaignMeasure, external: true },
  { id: 'plan', label: 'Content plan', href: soonRoutes.campaignPlan, external: false },
  { id: 'budget', label: 'People and budget', href: soonRoutes.campaignBudget, external: false },
  { id: 'launch', label: 'Review and launch', href: soonRoutes.campaignLaunch, external: false },
] as const;

export type CampaignStepId = (typeof campaignSteps)[number]['id'];

/** What the person chose on earlier steps; unset fields fall back to the screen's fixture data. */
export interface CampaignDraft {
  audience?: string[];
  removedPlanItems?: string[];
  payouts?: Record<string, string>;
  cap?: string;
  /** Steps on this page whose Continue passed validation in this session (the state machine's finished steps). */
  completed?: CampaignStepId[];
}

let draft: CampaignDraft = {};
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const read = () => draft;

/** Clears the shared draft (tests, and starting a new campaign). */
export function resetCampaignDraft() {
  draft = {};
  listeners.forEach((l) => l());
}

export function useCampaignFlow(step: CampaignStepId) {
  const navigate = useNavigate();
  const current = campaignSteps.findIndex((s) => s.id === step);
  const state = useSyncExternalStore(subscribe, read, read);
  const update = useCallback((patch: Partial<CampaignDraft>) => {
    draft = { ...draft, ...patch };
    listeners.forEach((l) => l());
  }, []);
  const nextHref = campaignSteps[current + 1]?.href;
  const finished = (i: number) => campaignSteps[i]?.external || (state.completed ?? []).includes(campaignSteps[i]?.id);
  return {
    steps: campaignSteps.map((s) => ({ label: s.label })),
    current,
    backHref: campaignSteps[current - 1]?.href,
    nextHref,
    /** Only finished steps link back to their screen. */
    hrefFor: (i: number) => (finished(i) ? campaignSteps[i]?.href : undefined),
    /** Marks this step finished, then moves to the next one. Call only after the step validated. */
    next: () => {
      draft = { ...draft, completed: [...new Set([...(draft.completed ?? []), step])] };
      listeners.forEach((l) => l());
      if (nextHref) navigate(nextHref);
    },
    draft: state,
    update,
  };
}

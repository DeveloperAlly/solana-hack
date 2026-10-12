// Campaign v2 flow state (issue #51): step order, back and next, and the draft the steps share.
// Steps follow the canvas stepper on every Campaign v2 board: 1 Goal, 2 Audience, 3 Measure, 4 Content plan,
// 5 People and budget, 6 Review and launch. Goal and Measure are Superhub screens (issue #52); the rest are here.
// The draft lives in memory for the session only: no network, nothing persisted (INTEGRATION: PATCH /api/campaigns/:id).
import { useCallback, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import { soonRoutes } from './routes';

export const campaignSteps = [
  { id: 'goal', label: 'Goal', href: soonRoutes.campaignGoal },
  { id: 'audience', label: 'Audience', href: soonRoutes.campaignAudience },
  { id: 'measure', label: 'Measure', href: soonRoutes.campaignMeasure },
  { id: 'plan', label: 'Content plan', href: soonRoutes.campaignPlan },
  { id: 'budget', label: 'People and budget', href: soonRoutes.campaignBudget },
  { id: 'launch', label: 'Review and launch', href: soonRoutes.campaignLaunch },
] as const;

export type CampaignStepId = (typeof campaignSteps)[number]['id'];

/** What the person chose on earlier steps; unset fields fall back to the screen's fixture data. */
export interface CampaignDraft {
  audience?: string[];
  removedPlanItems?: string[];
  payouts?: Record<string, string>;
  cap?: string;
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
  return {
    steps: campaignSteps.map((s) => ({ label: s.label })),
    current,
    backHref: campaignSteps[current - 1]?.href,
    nextHref,
    /** Completed steps link back to their screen. */
    hrefFor: (i: number) => campaignSteps[i]?.href,
    next: () => nextHref && navigate(nextHref),
    draft: state,
    update,
  };
}

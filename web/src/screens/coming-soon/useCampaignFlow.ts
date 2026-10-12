// Campaign v2 flow state (issue #51): step order, back and next, and the draft the steps share.
// Steps follow the canvas stepper on every Campaign v2 board: 1 Goal, 2 Audience, 3 Measure, 4 Content plan,
// 5 People and budget, 6 Review and launch. Goal and Measure are Superhub screens (issue #52); the rest are here.
// The draft lives in memory for the session only: no network, nothing persisted (INTEGRATION: PATCH /api/campaigns/:id).
import { useNavigate } from 'react-router';
import { useSoonRoutes } from './routes';
import { createBrandScopedStore } from './useSoonSession';

// `external`: built on Superhub (issue #52); this page cannot see whether it finished, so the campaign record
// (fixtures in the gallery) stands for it.
export const campaignSteps = [
  { id: 'goal', label: 'Goal', route: 'campaignGoal', external: true },
  { id: 'audience', label: 'Audience', route: 'campaignAudience', external: false },
  { id: 'measure', label: 'Measure', route: 'campaignMeasure', external: true },
  { id: 'plan', label: 'Content plan', route: 'campaignPlan', external: false },
  { id: 'budget', label: 'People and budget', route: 'campaignBudget', external: false },
  { id: 'launch', label: 'Review and launch', route: 'campaignLaunch', external: false },
] as const;

export type CampaignStepId = (typeof campaignSteps)[number]['id'];

/** What the person chose on earlier steps; unset fields fall back to the screen's fixture data. */
export interface CampaignDraft {
  audience?: string[];
  /** Labels of the chosen segments, for the review step. */
  audienceNames?: string[];
  removedPlanItems?: string[];
  /** Days kept in the content plan, for the review step. */
  planDays?: string[];
  payouts?: Record<string, string>;
  cap?: string;
  /** Steps on this page whose Continue passed validation in this session (the state machine's finished steps). */
  completed?: CampaignStepId[];
}

// Kept per brand (Codex review on PR #79): another brand's campaign choices never show here.
const campaignDraft = createBrandScopedStore<CampaignDraft>();

/** Clears the shared draft (tests, and starting a new campaign). */
export const resetCampaignDraft = campaignDraft.reset;

export function useCampaignFlow(step: CampaignStepId) {
  const navigate = useNavigate();
  const routes = useSoonRoutes();
  const hrefAt = (i: number) => (campaignSteps[i] ? routes[campaignSteps[i].route] : undefined);
  const current = campaignSteps.findIndex((s) => s.id === step);
  const [state, update] = campaignDraft.use();
  const nextHref = hrefAt(current + 1);
  const finished = (i: number) => campaignSteps[i]?.external || (state.completed ?? []).includes(campaignSteps[i]?.id);
  return {
    steps: campaignSteps.map((s) => ({ label: s.label })),
    current,
    backHref: hrefAt(current - 1),
    nextHref,
    /** Only finished steps link back to their screen. */
    hrefFor: (i: number) => (finished(i) ? hrefAt(i) : undefined),
    /** Marks this step finished, then moves to the next one. Call only after the step validated. */
    next: () => {
      update({ completed: [...new Set([...(campaignDraft.read().completed ?? []), step])] });
      if (nextHref) navigate(nextHref);
    },
    draft: state,
    update,
  };
}

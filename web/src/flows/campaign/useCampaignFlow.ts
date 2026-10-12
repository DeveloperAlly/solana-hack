import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useScreenHref } from '../../gallery/screenPath';
import type { ArtboardName } from '../../config/artboards';
import { campaignStore } from './draft';
import { campaignSteps, stepIndex, type CampaignStepId } from './steps';

export interface CampaignFlowOptions {
  /**
   * Whether this step's own input is complete (the screen's validation). Next stays disabled until it is, and until
   * every earlier step is complete too.
   */
  stepComplete: boolean;
  /** Where Back goes from step 1 (default: no Back on step 1). */
  cancelHref?: string;
  /** Maps an artboard to its link. Default: the gallery screen path, keeping the theme. */
  hrefOf?: (artboard: ArtboardName) => string;
}

/**
 * Campaign v2 flow state from the one step table (issue #46): current, back, next and the stepper's done marks, the
 * shared draft and per-step completion. Next is enabled only when this step and every earlier step are complete;
 * otherwise `blocker` names the first step still missing and links to it. Next marks the step complete and moves on.
 */
export function useCampaignFlow(step: CampaignStepId, { stepComplete, cancelHref, hrefOf }: CampaignFlowOptions) {
  const navigate = useNavigate();
  const screenHref = useScreenHref();
  const href = hrefOf ?? ((a: ArtboardName) => screenHref(a));
  const { draft, completed } = campaignStore.use();
  const current = stepIndex(step);
  const done = campaignSteps.map((s) => Boolean(completed[s.id]));
  const firstMissingEarlier = campaignSteps.findIndex((s, i) => i < current && !completed[s.id]);
  const canAdvance = firstMissingEarlier === -1 && stepComplete;
  // A completed step whose input became incomplete is no longer complete, and neither is anything after it.
  const stale = Boolean(completed[step]) && !stepComplete;
  useEffect(() => {
    if (stale) campaignStore.invalidate(step);
  }, [stale, step]);
  const nextStep = campaignSteps[current + 1];
  const backStep = campaignSteps[current - 1];
  const isLast = current === campaignSteps.length - 1;

  // The first step still missing: an earlier one (linked) or this one.
  const blockerIndex = firstMissingEarlier !== -1 ? firstMissingEarlier : stepComplete ? -1 : current;
  const blocker =
    blockerIndex === -1
      ? null
      : { index: blockerIndex, label: campaignSteps[blockerIndex].label, earlier: blockerIndex < current, href: href(campaignSteps[blockerIndex].artboard) };

  function next() {
    if (!canAdvance) return;
    campaignStore.complete(step);
    // INTEGRATION: PATCH /api/campaigns/:id with this step's section (POST on step 1, launch on step 6).
    if (nextStep) navigate(href(nextStep.artboard));
  }

  return {
    steps: campaignSteps.map((s) => ({ label: s.label })),
    current,
    done,
    /** Done steps link back to their screen; the rest do not. */
    hrefFor: (i: number) => (done[i] ? href(campaignSteps[i].artboard) : undefined),
    backHref: backStep ? href(backStep.artboard) : cancelHref,
    backLabel: backStep ? 'Back' : 'Cancel',
    nextLabel: campaignSteps[current].nextLabel,
    isLast,
    canAdvance,
    blocker,
    next,
    /** Launched: the last step was completed. */
    launched: Boolean(completed.launch),
    draft,
    set: campaignStore.set,
  };
}

export type CampaignFlow = ReturnType<typeof useCampaignFlow>;

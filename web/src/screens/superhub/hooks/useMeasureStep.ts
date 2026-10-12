import { useState } from 'react';
import { useCampaignFlow } from '../../../flows/campaign/useCampaignFlow';
import { campaignStore } from '../../../flows/campaign/draft';

/** Most supporting metrics allowed (n-c2 1). */
export const MAX_SUPPORTING = 3;

/**
 * Campaign step 3, Success (n-c2), on the shared campaign flow (flows/campaign): one main goal with a target and up to
 * three supporting numbers, over the shared draft. Next waits for this step and every earlier step.
 */
export function useMeasureStep() {
  const success = campaignStore.use().draft.success;
  const [limitError, setLimitError] = useState<string | null>(null);
  const missing = [
    !success.mainMetric && 'choose the main goal',
    success.mainMetric && !success.targets[success.mainMetric]?.trim() && 'set a target for the main goal',
  ].filter(Boolean) as string[];
  const flow = useCampaignFlow('success', { stepComplete: missing.length === 0 });
  const set = (change: Partial<typeof success>) => flow.set('success', { ...flow.draft.success, ...change });

  function toggleSupporting(id: string) {
    if (success.supporting.includes(id)) return set({ supporting: success.supporting.filter((x) => x !== id) });
    if (success.supporting.length >= MAX_SUPPORTING) return setLimitError(`Pick up to ${MAX_SUPPORTING} supporting numbers.`);
    setLimitError(null);
    set({ supporting: [...success.supporting, id] });
  }

  return {
    flow, missing, limitError, toggleSupporting,
    campaignName: flow.draft.goal.name.trim() || undefined,
    mainMetric: success.mainMetric,
    setMainMetric: (id: string) => set({ mainMetric: id, supporting: success.supporting.filter((x) => x !== id) }),
    supporting: success.supporting,
    targetOf: (id: string) => success.targets[id] ?? '',
    setTarget: (id: string, t: string) => set({ targets: { ...success.targets, [id]: t } }),
  };
}

export type MeasureStep = ReturnType<typeof useMeasureStep>;

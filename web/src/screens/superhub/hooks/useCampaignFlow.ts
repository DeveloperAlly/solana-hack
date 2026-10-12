import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useHubLinks, type HubLink } from '../paths';
import type { CampaignData } from '../types';

export type CampaignStep = 'goal' | 'measure';

/**
 * Step order of the Campaign v2 wizard in this build: Goal (artboard v2-1) → Measure (v2-2) → Audience (v2-3, page #51,
 * per the coordinator's routing for issue #52). `current` is the stepper position each artboard draws.
 */
const flow: Record<CampaignStep, { current: number; back: HubLink; next: HubLink; nextLabel: string; backLabel: string }> = {
  goal: { current: 0, back: 'content', backLabel: 'Cancel', next: 'campaignMeasure', nextLabel: 'Next: success metrics' },
  measure: { current: 2, back: 'campaignGoal', backLabel: 'Back', next: 'campaignAudience', nextLabel: 'Next: audience' },
};

/** Completed steps link back: step 1 to Goal, step 2 to Audience. */
const stepLink: Record<number, HubLink> = { 0: 'campaignGoal', 1: 'campaignAudience' };

/** Most supporting metrics allowed (n-c2 1). */
export const MAX_SUPPORTING = 3;

/** What step 1 hands to the next step through router state; a step is reached only after the one before finished. */
export interface CampaignHandoff {
  campaignName: string;
}

/**
 * Campaign v2 flow state (n-c1, n-c2). Nothing is chosen for the person: purpose, platforms, who posts and the main
 * metric start empty (the canvas values are placeholders). Next stays disabled, with the reason shown, until the step
 * is complete; it then moves on and hands the campaign name to the next step.
 */
export function useCampaignFlow(step: CampaignStep, data: CampaignData) {
  const navigate = useNavigate();
  const links = useHubLinks();
  const handoff = useLocation().state as CampaignHandoff | null;
  const [name, setName] = useState('');
  const [dates, setDates] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [poster, setPoster] = useState('');
  const [mainMetric, setMainMetric] = useState('');
  const [supporting, setSupporting] = useState<string[]>([]);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [limitError, setLimitError] = useState<string | null>(null);

  const missing = (step === 'goal'
    ? [
        !purpose && 'choose a purpose',
        purpose === 'custom' && !customPurpose.trim() && 'describe the purpose',
        !name.trim() && 'name the campaign',
        !dates.trim() && 'add the dates',
        platforms.length === 0 && 'pick at least one platform',
        !poster && 'choose who posts',
      ]
    : [!mainMetric && 'choose the main goal', mainMetric && !targets[mainMetric]?.trim() && 'set a target for the main goal']
  ).filter(Boolean) as string[];

  function next() {
    if (missing.length) return;
    // INTEGRATION: POST …/campaigns (step 1) or PATCH /api/campaigns/:id (step 3), backend map row "Campaign-v2-1, Campaign-v2-2".
    navigate(links[flow[step].next], { state: { campaignName: name.trim() || handoff?.campaignName } satisfies Partial<CampaignHandoff> });
  }

  function toggleSupporting(id: string) {
    if (supporting.includes(id)) return setSupporting((s) => s.filter((x) => x !== id));
    if (supporting.length >= MAX_SUPPORTING) return setLimitError(`Pick up to ${MAX_SUPPORTING} supporting numbers.`);
    setLimitError(null);
    setSupporting((s) => [...s, id]);
  }

  return {
    ...flow[step], back: links[flow[step].back], hrefFor: (i: number) => (stepLink[i] ? links[stepLink[i]] : undefined), missing, next, campaignName: handoff?.campaignName,
    name, setName, dates, setDates, purpose, setPurpose, customPurpose, setCustomPurpose,
    platforms, togglePlatform: (id: string) => setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    poster, setPoster,
    // X is for the brand's own posts only; it is never a paid ambassador format (n-c1 4, ADR-002).
    xWarning: poster !== '' && poster !== 'brand' && platforms.includes('x'),
    mainMetric, setMainMetric: (id: string) => { setMainMetric(id); setSupporting((s) => s.filter((x) => x !== id)); },
    supporting, toggleSupporting, limitError,
    targetOf: (id: string) => targets[id] ?? '', setTarget: (id: string, v: string) => setTargets((t) => ({ ...t, [id]: v })),
    examples: { name: data.name, dates: data.dates },
  };
}

export type CampaignFlow = ReturnType<typeof useCampaignFlow>;

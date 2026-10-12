import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useHubLinks, type HubLink } from '../paths';
import type { CampaignData } from '../types';

/**
 * The Campaign v2 wizard, in the one order the canvas stepper draws (boards Campaign-v2-1-Goal and -2-Measure):
 * Goal and platforms → Audience → Success → Content plan → People and budget → Review. The stepper, Next and Back are
 * all derived from this array, so they cannot disagree. Audience, Content plan, People and budget, and Review are
 * built on page #51 (artboards Campaign-v2-3 to v2-6).
 */
export const campaignSteps = [
  { id: 'goal', label: 'Goal and platforms', link: 'campaignGoal', next: 'Next: audience' },
  { id: 'audience', label: 'Audience', link: 'campaignAudience', next: 'Next: success metrics' },
  { id: 'measure', label: 'Success', link: 'campaignMeasure', next: 'Next: content plan' },
  { id: 'plan', label: 'Content plan', link: 'campaignPlan', next: 'Next: people and budget' },
  { id: 'budget', label: 'People and budget', link: 'campaignBudget', next: 'Next: review' },
  { id: 'launch', label: 'Review', link: 'campaignLaunch', next: 'Launch' },
] as const satisfies readonly { id: string; label: string; link: HubLink; next: string }[];

export type CampaignStep = (typeof campaignSteps)[number]['id'];

/** Position, Next and Back for one step, from the ordered steps. Cancel on the first step returns to Content. */
export function stepNav(step: CampaignStep) {
  const current = campaignSteps.findIndex((s) => s.id === step);
  const prev = campaignSteps[current - 1];
  const next = campaignSteps[current + 1];
  return {
    current,
    back: (prev?.link ?? 'content') as HubLink,
    backLabel: prev ? 'Back' : 'Cancel',
    next: (next?.link ?? 'content') as HubLink,
    nextLabel: campaignSteps[current].next,
  };
}

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
  const nav = stepNav(step);
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
    navigate(links[nav.next], { state: { campaignName: name.trim() || handoff?.campaignName } satisfies Partial<CampaignHandoff> });
  }

  function toggleSupporting(id: string) {
    if (supporting.includes(id)) return setSupporting((s) => s.filter((x) => x !== id));
    if (supporting.length >= MAX_SUPPORTING) return setLimitError(`Pick up to ${MAX_SUPPORTING} supporting numbers.`);
    setLimitError(null);
    setSupporting((s) => [...s, id]);
  }

  return {
    ...nav, back: links[nav.back], steps: campaignSteps.map((s) => ({ label: s.label })),
    hrefFor: (i: number) => (i < nav.current ? links[campaignSteps[i].link] : undefined), missing, next, campaignName: handoff?.campaignName,
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

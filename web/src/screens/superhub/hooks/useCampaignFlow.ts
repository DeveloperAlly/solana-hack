import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useHubLinks, type HubLink } from '../paths';
import type { CampaignData, CampaignValues } from '../types';
import { useHubSession } from './useHubSession';

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

/**
 * Campaign v2 flow state (n-c1, n-c2): every wizard field in one object in the hub session, so Back and Next keep what
 * was entered. Nothing is chosen for the person: the canvas values are placeholders. Next stays disabled, with the
 * reason shown, until the step is complete.
 */
export function useCampaignFlow(step: CampaignStep, data: CampaignData) {
  const nav = stepNav(step);
  const navigate = useNavigate();
  const links = useHubLinks();
  const [{ campaign: v }, update] = useHubSession();
  const [limitError, setLimitError] = useState<string | null>(null);
  const set = (change: Partial<CampaignValues>) => update((s) => ({ ...s, campaign: { ...s.campaign, ...change } }));
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const missing = (step === 'goal'
    ? [
        !v.purpose && 'choose a purpose',
        v.purpose === 'custom' && !v.customPurpose.trim() && 'describe the purpose',
        !v.name.trim() && 'name the campaign',
        !v.dates.trim() && 'add the dates',
        v.platforms.length === 0 && 'pick at least one platform',
        !v.poster && 'choose who posts',
      ]
    : [!v.mainMetric && 'choose the main goal', v.mainMetric && !v.targets[v.mainMetric]?.trim() && 'set a target for the main goal']
  ).filter(Boolean) as string[];

  function next() {
    if (missing.length) return;
    // INTEGRATION: POST …/campaigns (step 1) or PATCH /api/campaigns/:id (step 3), backend map row "Campaign-v2-1, Campaign-v2-2".
    navigate(links[nav.next]);
  }

  function toggleSupporting(id: string) {
    if (v.supporting.includes(id)) return set({ supporting: v.supporting.filter((x) => x !== id) });
    if (v.supporting.length >= MAX_SUPPORTING) return setLimitError(`Pick up to ${MAX_SUPPORTING} supporting numbers.`);
    setLimitError(null);
    set({ supporting: [...v.supporting, id] });
  }

  return {
    ...nav, back: links[nav.back], steps: campaignSteps.map((s) => ({ label: s.label })),
    hrefFor: (i: number) => (i < nav.current ? links[campaignSteps[i].link] : undefined), missing, next,
    campaignName: v.name.trim() || undefined,
    name: v.name, setName: (name: string) => set({ name }), dates: v.dates, setDates: (dates: string) => set({ dates }),
    purpose: v.purpose, setPurpose: (purpose: string) => set({ purpose }),
    customPurpose: v.customPurpose, setCustomPurpose: (customPurpose: string) => set({ customPurpose }),
    platforms: v.platforms, togglePlatform: (id: string) => set({ platforms: toggle(v.platforms, id) }),
    poster: v.poster, setPoster: (poster: string) => set({ poster }),
    // X is for the brand's own posts only; it is never a paid ambassador format (n-c1 4, ADR-002).
    xWarning: v.poster !== '' && v.poster !== 'brand' && v.platforms.includes('x'),
    mainMetric: v.mainMetric, setMainMetric: (id: string) => set({ mainMetric: id, supporting: v.supporting.filter((x) => x !== id) }),
    supporting: v.supporting, toggleSupporting, limitError,
    targetOf: (id: string) => v.targets[id] ?? '', setTarget: (id: string, t: string) => set({ targets: { ...v.targets, [id]: t } }),
    examples: { name: data.name, dates: data.dates },
  };
}

export type CampaignFlow = ReturnType<typeof useCampaignFlow>;

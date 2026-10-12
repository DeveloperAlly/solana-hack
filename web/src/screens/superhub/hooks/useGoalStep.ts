import { useCampaignFlow } from '../../../flows/campaign/useCampaignFlow';
import { campaignStore } from '../../../flows/campaign/draft';
import { useHubLinks } from '../paths';

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/**
 * Campaign step 1, Goal and platforms (n-c1), on the shared campaign flow (flows/campaign): this step's validation and
 * field setters over the shared draft. Nothing is chosen for the person; Next waits until the step is complete.
 */
export function useGoalStep() {
  const links = useHubLinks();
  const goal = campaignStore.use().draft.goal;
  const missing = [
    !goal.purpose && 'choose a purpose',
    goal.purpose === 'custom' && !goal.customPurpose?.trim() && 'describe the purpose',
    !goal.name.trim() && 'name the campaign',
    !goal.dates.trim() && 'add the dates',
    goal.platforms.length === 0 && 'pick at least one platform',
    !goal.poster && 'choose who posts',
  ].filter(Boolean) as string[];
  const flow = useCampaignFlow('goal', { stepComplete: missing.length === 0, cancelHref: links.content });
  const set = (change: Partial<typeof goal>) => flow.set('goal', { ...flow.draft.goal, ...change });
  return {
    flow, missing, goal,
    setName: (name: string) => set({ name }),
    setDates: (dates: string) => set({ dates }),
    setPurpose: (purpose: string) => set({ purpose }),
    setCustomPurpose: (customPurpose: string) => set({ customPurpose }),
    togglePlatform: (id: string) => set({ platforms: toggle(goal.platforms, id) }),
    setPoster: (poster: string) => set({ poster }),
    // X is for the brand's own posts only; it is never a paid ambassador format (n-c1 4, ADR-002).
    xWarning: goal.poster !== '' && goal.poster !== 'brand' && goal.platforms.includes('x'),
  };
}

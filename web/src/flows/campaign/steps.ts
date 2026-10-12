// The one ordered step table of the Campaign v2 wizard (issue #46). Superhub builds steps 1 and 3, Coming soon builds
// 2, 4, 5 and 6; both read this table, so back, next and the stepper agree on every screen. The order is the canvas
// stepper drawn on every Campaign v2 board (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). The artboard numbers
// are only names: Campaign-v2-2-Measure is step 3 and Campaign-v2-3-Audience is step 2.
import type { ArtboardName } from '../../config/artboards';

export const campaignSteps = [
  { id: 'goal', label: 'Goal and platforms', artboard: 'Campaign-v2-1-Goal', nextLabel: 'Next: audience' },
  { id: 'audience', label: 'Audience', artboard: 'Campaign-v2-3-Audience', nextLabel: 'Next: success' },
  { id: 'success', label: 'Success', artboard: 'Campaign-v2-2-Measure', nextLabel: 'Next: content plan' },
  { id: 'plan', label: 'Content plan', artboard: 'Campaign-v2-4-Plan', nextLabel: 'Next: people and budget' },
  { id: 'budget', label: 'People and budget', artboard: 'Campaign-v2-5-Budget', nextLabel: 'Next: review' },
  { id: 'launch', label: 'Review', artboard: 'Campaign-v2-6-Launch', nextLabel: 'Launch campaign' },
] as const satisfies readonly { id: string; label: string; artboard: ArtboardName; nextLabel: string }[];

export type CampaignStepId = (typeof campaignSteps)[number]['id'];

export function stepIndex(id: CampaignStepId): number {
  return campaignSteps.findIndex((s) => s.id === id);
}

/*
 * Data contract: Campaign-v2-3-Audience (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * Campaign-v2-3-Audience, titled "Campaign v2 step 2: audience"; issue #51)
 * Backend map §4 row "Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing)": PATCH /api/campaigns/:id, table campaigns;
 * segments read from the kit's audience section (kit_sections, row "Brand-Build"). Shape: CampaignAudienceData.
 *
 * | Field            | Source                                                       | Empty when                   |
 * |------------------|--------------------------------------------------------------|------------------------------|
 * | source           | Static copy (canvas)                                         | never                        |
 * | segments[].label | kit_sections audience: persona names (D16 PersonaCard)       | the kit has no audience yet  |
 * | segments[].tag   | "Assumption" until validated (D16)                           | validated                    |
 *
 * Flow: useCampaignFlow (step 2 of 6). Back goes to Campaign-v2-1-Goal, Continue to Campaign-v2-2-Measure.
 * States: success, empty (no audience in the kit).
 */
import { Button, Stack } from '../../ui/primitives';
import { CheckboxRow } from '../../ui/composites/CheckboxRow';
import { EmptyState } from '../../ui/composites/EmptyState';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { CampaignStep } from './CampaignStep';
import { useCampaignFlow } from './useCampaignFlow';
import { soonRoutes } from './routes';
import type { CampaignAudienceData } from './types';

export function CampaignAudience({ data, state = 'success' }: { data: CampaignAudienceData; state?: ScreenState }) {
  const { draft, update } = useCampaignFlow('audience');
  // Nothing is pre-checked: Continue stays disabled until the person picks a segment (review finding).
  const chosen = draft.audience ?? [];
  const toggle = (id: string, on: boolean) => {
    update({ audience: on ? [...chosen, id] : chosen.filter((x) => x !== id) });
  };
  const isEmpty = state === 'empty' || data.segments.length === 0;
  return (
    <CampaignStep
      step="audience"
      pageTitle="New campaign: audience"
      title="Who is this campaign for?"
      intro={data.source}
      definedIn="component inventory screen map, Campaign v2 step 2 (C7, D16)"
      continueDisabled={isEmpty || chosen.length === 0}
    >
      {isEmpty ? (
        <EmptyState title="Your kit has no audience yet" body="Add the audience section to your kit, then come back." actions={<Button href={soonRoutes.brandBuild}>Open your kit</Button>} />
      ) : (
        <Stack as="fieldset" gap={2} aria-label="Audience segments">
          {data.segments.map((s) => (
            <CheckboxRow key={s.id} label={s.label} description={s.tag} checked={chosen.includes(s.id)} onChange={(e) => toggle(s.id, e.target.checked)} />
          ))}
        </Stack>
      )}
    </CampaignStep>
  );
}

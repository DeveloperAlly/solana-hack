/*
 * Data contract: Campaign-v2-1-Goal (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * Campaign-v2-1-Goal, note n-c1). Shape: CampaignData in ./types.ts. Backend map §4 Create, row "Campaign-v2-1,
 * Campaign-v2-2 (steps 4–6 missing)": `POST …/campaigns`, `PATCH /api/campaigns/:id` (tables campaigns, drafts);
 * the API rejects a paid X format.
 *
 * | Field             | Source                                                                                    |
 * |-------------------|-------------------------------------------------------------------------------------------|
 * | steps             | The six wizard steps as drawn                                                             |
 * | purposes          | Campaign purposes (n-c1 1: purpose sets the default success metric on the next step)      |
 * | platforms         | Channel registry (M2); image and video formats produce scripts and briefs (n-c1 2)        |
 * | posterOptions     | Who posts; choosing ambassadors adds the payout step (n-c1 3)                             |
 * | name, dates       | Canvas examples, shown as placeholders; the person's values go to campaigns              |
 *
 * Empty: a new campaign starts with nothing chosen; Next stays disabled until the step is complete. States drawn: success.
 */
import { Alert } from '../../ui/primitives/Alert';
import { Box, Choice, Field, Grid, Stack, Text } from '../../ui/primitives';
import { CheckboxRow } from '../../ui/composites/CheckboxRow';
import { CampaignStepFrame } from './parts/CampaignStepFrame';
import { PurposeOptions } from './parts/PurposeOptions';
import { useCampaignFlow } from './hooks/useCampaignFlow';
import type { CampaignData } from './types';

export function CampaignGoal({ data }: { data: CampaignData }) {
  const flow = useCampaignFlow('goal', data);
  return (
    <CampaignStepFrame flow={flow} steps={data.steps} title="What's this campaign for?">
      <Stack gap={5}>
        <PurposeOptions options={data.purposes} value={flow.purpose} onChange={flow.setPurpose} />
        {flow.purpose === 'custom' && <Field label="Describe it" value={flow.customPurpose} onChange={(e) => flow.setCustomPurpose(e.target.value)} />}
        <Grid min="sm" gap={4}>
          <Field label="Campaign name" value={flow.name} placeholder={flow.examples.name} onChange={(e) => flow.setName(e.target.value)} />
          <Field label="Dates" value={flow.dates} placeholder={flow.examples.dates} onChange={(e) => flow.setDates(e.target.value)} />
        </Grid>
        <Box as="fieldset" padding={5} border="default" radius="box">
          <Text as="legend" variant="label">Platforms</Text>
          <Grid min="sm" gap={2}>
            {data.platforms.map((p) => (
              <CheckboxRow key={p.id} label={p.detail ? `${p.label} · ${p.detail}` : p.label} checked={flow.platforms.includes(p.id)} onChange={() => flow.togglePlatform(p.id)} />
            ))}
          </Grid>
          <Text variant="small" tone="secondary">{data.mediaNote}</Text>
        </Box>
        <Choice legend="Who posts" options={data.posterOptions} value={flow.poster} onChange={flow.setPoster} />
        {flow.xWarning && <Alert tone="info">X is for your brand's own posts only; it is never a paid ambassador format.</Alert>}
      </Stack>
    </CampaignStepFrame>
  );
}

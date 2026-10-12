/*
 * Data contract: Campaign-v2-1-Goal (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * Campaign-v2-1-Goal, note n-c1). Shape: CampaignData in ./types.ts. Backend map §4 Create, row "Campaign-v2-1,
 * Campaign-v2-2 (steps 4–6 missing)": `POST …/campaigns`, `PATCH /api/campaigns/:id` (tables campaigns, drafts);
 * the API rejects a paid X format.
 *
 * | Field             | Source                                                                                    |
 * |-------------------|-------------------------------------------------------------------------------------------|
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
import { CampaignStepFrame } from '../../flows/campaign/CampaignStepFrame';
import { HubPage } from './parts/HubPage';
import { PurposeOptions } from './parts/PurposeOptions';
import { useGoalStep } from './hooks/useGoalStep';
import type { CampaignData } from './types';

export function CampaignGoal({ data }: { data: CampaignData }) {
  const step = useGoalStep();
  const { goal } = step;
  return (
    <HubPage section="create" sub="campaigns" width="wizard">
    <CampaignStepFrame flow={step.flow} title="What's this campaign for?" missing={step.missing}>
      <Stack gap={5}>
        <PurposeOptions options={data.purposes} value={goal.purpose} onChange={step.setPurpose} />
        {goal.purpose === 'custom' && <Field label="Describe it" value={goal.customPurpose ?? ''} onChange={(e) => step.setCustomPurpose(e.target.value)} />}
        <Grid min="sm" gap={4}>
          <Field label="Campaign name" value={goal.name} placeholder={data.name} onChange={(e) => step.setName(e.target.value)} />
          <Field label="Dates" value={goal.dates} placeholder={data.dates} onChange={(e) => step.setDates(e.target.value)} />
        </Grid>
        <Box as="fieldset" padding={5} border="default" radius="box">
          <Text as="legend" variant="label">Platforms</Text>
          <Grid min="sm" gap={2}>
            {data.platforms.map((p) => (
              <CheckboxRow key={p.id} label={p.detail ? `${p.label} · ${p.detail}` : p.label} checked={goal.platforms.includes(p.id)} onChange={() => step.togglePlatform(p.id)} />
            ))}
          </Grid>
          <Text variant="small" tone="secondary">{data.mediaNote}</Text>
        </Box>
        <Choice legend="Who posts" options={data.posterOptions} value={goal.poster} onChange={step.setPoster} />
        {step.xWarning && <Alert tone="info">X is for your brand's own posts only; it is never a paid ambassador format.</Alert>}
      </Stack>
    </CampaignStepFrame>
    </HubPage>
  );
}

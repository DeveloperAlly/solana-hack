/*
 * Data contract: Campaign-v2-2-Measure (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * Campaign-v2-2-Measure, note n-c2). Shape: CampaignData in ./types.ts. Backend map §4 Create, row "Campaign-v2-1,
 * Campaign-v2-2 (steps 4–6 missing)": `PATCH /api/campaigns/:id`, `POST …/plan` (tables campaigns, drafts; OpenRouter).
 *
 * | Field           | Source                                                                                      |
 * |-----------------|---------------------------------------------------------------------------------------------|
 * | metrics[]       | Metric catalogue with data source; default main metric from step 1's purpose (n-c1 1)       |
 * | metrics[].measurable | False when a platform does not share the number: shown "not available" (n-c2 2)        |
 * | (chosen here)   | campaigns success metrics: one main + up to 3 supporting, each with a target (n-c2 1)        |
 * | campaign name   | From step 1, through the hub session (every wizard field is kept across Back and Next)       |
 * | plan[]          | `POST …/plan` draft content plan, day × brand / ambassadors (generated next, n-c2 3)        |
 * | budget          | Preview of step 5: spending cap, slots (campaigns; payouts in USDC)                         |
 *
 * States drawn: success only. Steps run in canvas order (useCampaignFlow campaignSteps): Back goes to Audience and Next to
 * the content plan (Campaign-v2-3 and -v2-4, page #51).
 */
import { Badge } from '../../ui/primitives/Badge';
import { Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DataTable } from '../../ui/composites/DataTable';
import { CampaignStepFrame } from './parts/CampaignStepFrame';
import { MetricPicker } from './parts/MetricPicker';
import { useCampaignFlow } from './hooks/useCampaignFlow';
import type { CampaignData } from './types';

export function CampaignMeasure({ data }: { data: CampaignData }) {
  const flow = useCampaignFlow('measure', data);
  return (
    <CampaignStepFrame flow={flow} title="How will you know it worked?" intro={`${flow.campaignName ? `${flow.campaignName}: ` : ''}Pick one main goal and up to three supporting numbers. Each shows where the number comes from.`}>
      <Stack gap={5}>
        <Card as="div">
          <MetricPicker metrics={data.metrics} flow={flow} />
          <Text variant="small" tone="secondary">{data.unavailableNote}</Text>
        </Card>
        <Card labelledBy="plan-draft" header={<><Heading level={2} size="lg" id="plan-draft">Draft content plan</Heading><Badge>Generated · next step</Badge></>}>
          <DataTable
            caption="Draft content plan by day"
            hideCaption
            rows={data.plan}
            rowKey={(r) => r.day}
            columns={[{ key: 'day', header: 'Day', rowHeader: true }, { key: 'brand', header: 'Brand accounts' }, { key: 'ambassadors', header: 'Ambassadors' }]}
          />
        </Card>
        <Card variant="subtle" labelledBy="plan-budget" header={<Heading level={2} size="lg" id="plan-budget">People and budget (preview of step 5)</Heading>}>
          <Text variant="small">{data.budget.line}</Text>
          <Text variant="small" tone="secondary">{data.budget.note}</Text>
        </Card>
      </Stack>
    </CampaignStepFrame>
  );
}

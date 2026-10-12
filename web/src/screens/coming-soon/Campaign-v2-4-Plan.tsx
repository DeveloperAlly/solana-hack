/*
 * Data contract: Campaign-v2-4-Plan (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Campaign-v2-4-Plan;
 * issue #51). Backend map §4 row "Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing)": POST …/plan (OpenRouter writes the
 * plan), tables campaigns, drafts. Inventory D28 ContentPlanTable, D8 SchedulePicker. Shape: CampaignPlanData.
 *
 * | Field                     | Source                                              | Empty when               |
 * |---------------------------|-----------------------------------------------------|--------------------------|
 * | items[].day               | POST …/plan -> day of the campaign week             | the plan is generating   |
 * | items[].brandPosts        | POST …/plan -> brand posts that day (drafts)        | none that day            |
 * | items[].ambassadorPieces  | POST …/plan -> ambassador pieces (no X, ADR-002)    | none that day            |
 * | items[].slot              | D8 suggested slot (static default until analytics)  | never                    |
 * | rule                      | Static copy (canvas)                                | never                    |
 *
 * Flow: flows/campaign (step 4 of 6, draft.plan.removed). Back goes to Campaign-v2-2-Measure, Next to
 * Campaign-v2-5-Budget; Next waits for steps 1 to 3 and at least one plan item.
 * States: success, loading (generating the plan), error (the plan could not be written).
 */
import { Button, Stack, Text } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { CampaignStepFrame } from '../../flows/campaign/CampaignStepFrame';
import { campaignStore } from '../../flows/campaign/draft';
import { useCampaignFlow } from '../../flows/campaign/useCampaignFlow';
import { SoonPage } from './SoonPage';
import { tableState } from './tableState';
import type { CampaignPlanData, PlanItem } from './types';

export function CampaignPlan({ data, state = 'success' }: { data: CampaignPlanData; state?: ScreenState }) {
  const { removed } = campaignStore.use().draft.plan;
  const rows = data.items.filter((i) => !removed.includes(i.id));
  const flow = useCampaignFlow('plan', { stepComplete: state === 'success' && rows.length > 0 });
  const setRemoved = (ids: string[]) => flow.set('plan', { removed: ids });
  return (
    <SoonPage artboard="Campaign-v2-4-Plan" header={{ title: 'New campaign: content plan', definedIn: 'component inventory, Campaign v2 step 4 (D28, D8)' }}>
      <CampaignStepFrame flow={flow} title="Content plan" titleLevel={2} missing={['keep at least one item in the plan']}>
        <Stack gap={3}>
          <DataTable<PlanItem>
            caption="Campaign content plan"
            hideCaption
            columns={[
              { key: 'day', header: 'Day', rowHeader: true },
              { key: 'brandPosts', header: 'Brand posts' },
              { key: 'ambassadorPieces', header: 'Ambassador pieces' },
              { key: 'slot', header: 'Slot' },
            ]}
            rows={rows}
            rowKey={(r) => r.id}
            state={tableState[state]}
            empty={<Text tone="secondary">Every item is removed. Restore the plan to continue.</Text>}
            error={<Text tone="danger">The plan could not be written. Nothing was saved; go back and try again.</Text>}
            actions={(r) => <Button variant="secondary" aria-label={`Remove ${r.day}`} onClick={() => setRemoved([...removed, r.id])}>Remove</Button>}
          />
          {removed.length > 0 && <Button variant="secondary" onClick={() => setRemoved([])}>Restore removed items</Button>}
          <Text variant="small" tone="secondary">{data.rule}</Text>
        </Stack>
      </CampaignStepFrame>
    </SoonPage>
  );
}

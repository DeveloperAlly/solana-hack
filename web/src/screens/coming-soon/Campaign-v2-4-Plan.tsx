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
 * Flow: useCampaignFlow (step 4 of 6). Back goes to Campaign-v2-2-Measure, Continue to Campaign-v2-5-Budget.
 * States: success, loading (generating the plan), error (the plan could not be written).
 */
import { useState } from 'react';
import { Alert, Button, Stack, Text } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { CampaignStep } from './CampaignStep';
import { useCampaignFlow } from './useCampaignFlow';
import { tableState } from './tableState';
import type { CampaignPlanData, PlanItem } from './types';

export function CampaignPlan({ data, state = 'success' }: { data: CampaignPlanData; state?: ScreenState }) {
  const { draft, update } = useCampaignFlow('plan');
  const [error, setError] = useState(false);
  const removed = draft.removedPlanItems ?? [];
  const rows = data.items.filter((i) => !removed.includes(i.id));
  const remove = (id: string) => update({ removedPlanItems: [...removed, id] });
  const canContinue = () => {
    setError(rows.length === 0);
    return rows.length > 0;
  };
  return (
    <CampaignStep
      step="plan"
      pageTitle="New campaign: content plan"
      title="Content plan"
      definedIn="component inventory, Campaign v2 step 4 (D28, D8)"
      onContinue={canContinue}
      continueDisabled={state !== 'success'}
      error={error && <Alert tone="danger" title="Keep at least one item in the plan." />}
    >
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
          actions={(r) => <Button variant="secondary" onClick={() => remove(r.id)}>Remove<span className="wl-visually-hidden"> {r.day}</span></Button>}
        />
        {removed.length > 0 && <Button variant="secondary" onClick={() => update({ removedPlanItems: [] })}>Restore removed items</Button>}
        <Text variant="small" tone="secondary">{data.rule}</Text>
      </Stack>
    </CampaignStep>
  );
}

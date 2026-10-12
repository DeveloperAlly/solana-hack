/*
 * Data contract: Campaign-v2-6-Launch (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Campaign-v2-6-Launch;
 * issue #51). Backend map §4 row "Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing)": POST …/launch, tables campaigns,
 * drafts. Inventory C11 KeyValueList, D25 BudgetBar, C17 Dialog (approve cap). Shape: CampaignLaunchData.
 *
 * | Field        | Source                                                    | Empty when            |
 * |--------------|-----------------------------------------------------------|-----------------------|
 * | goal         | campaigns.goal (step 1, Superhub)                         | never at this step    |
 * | audience     | campaigns audience segments (step 2)                      | never at this step    |
 * | metric       | campaigns main metric (step 3, Superhub)                  | never at this step    |
 * | plan         | counts from POST …/plan (step 4)                          | never at this step    |
 * | cap          | campaigns spending cap (step 5)                           | never at this step    |
 * | balance      | RPC USDC balance of brands.payout_wallet                  | no wallet: "[n]"      |
 * | balanceCheck | Server check of a cap against the balance; blocks launch at that cap or above | none, or within balance |
 *
 * Flow: flows/campaign (step 6 of 6): the summary reads the shared draft (goal, audience, metric, plan, cap), with
 * the fixtures only as defaults. Launch waits for steps 1 to 5 and the cap approval (draft.approval).
 * segments and planItems: the audience and plan fixtures, to name what was chosen.
 * States: success (approve, then launched), error (blocked: cap above the wallet balance).
 */
import { Alert, Button } from '../../ui/primitives';
import { CheckboxRow } from '../../ui/composites/CheckboxRow';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import { StatePanel } from '../../ui/composites/StatePanel';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { CampaignStepFrame } from '../../flows/campaign/CampaignStepFrame';
import { campaignStore } from '../../flows/campaign/draft';
import { isOverBalance } from '../../flows/campaign/balanceCheck';
import { useCampaignFlow } from '../../flows/campaign/useCampaignFlow';
import { SoonPage } from './SoonPage';
import { useSoonRoutes } from './routes';
import type { CampaignLaunchData } from './types';

export function CampaignLaunch({ data }: { data: CampaignLaunchData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const { draft } = campaignStore.use();
  const blocked = isOverBalance(draft.budget.cap, data.balanceCheck);
  // INTEGRATION: POST …/launch; the server re-checks the cap against the wallet balance.
  const flow = useCampaignFlow('launch', { stepComplete: draft.approval.capApproved && !blocked });
  const cap = `${draft.budget.cap} USDC`;
  const names = data.segments.filter((s) => draft.audience.includes(s.id)).map((s) => s.label);
  const kept = data.planItems.filter((i) => !draft.plan.removed.includes(i.id)).map((i) => i.day);
  const summary = [
    { label: 'Goal', value: draft.goal.name || data.goal },
    { label: 'Audience', value: names.join(', ') || data.audience },
    { label: 'Main metric', value: draft.success.mainMetric || data.metric },
    { label: 'Content plan', value: `${data.plan} · days: ${kept.join(', ')}` },
    { label: 'Spending cap', value: cap },
  ];
  return (
    <SoonPage artboard="Campaign-v2-6-Launch" header={{ title: 'New campaign: review and launch', definedIn: 'component inventory, Campaign v2 step 6 (C11, D25, C17)' }}>
      <CampaignStepFrame
        flow={flow}
        title="Review and launch"
        titleLevel={2}
        missing={['approve the spending cap']}
        error={blocked && <Alert tone="danger" title={`Blocked: the cap is above your wallet balance (${data.balance} USDC). Lower it or top up.`} />}
      >
        {flow.launched ? (
          <StatePanel kind="success" title="Campaign launched" body="Every item still goes to approval before it is published or paid." actions={<Button href={routes.contentDashboard}>Go to your posts</Button>} />
        ) : (
          <>
            <KeyValueList label="Campaign summary" items={summary} />
            <CheckboxRow label={`I approve a spending cap of ${cap} for this campaign.`} checked={draft.approval.capApproved} onChange={(e) => flow.set('approval', { capApproved: e.target.checked })} />
          </>
        )}
      </CampaignStepFrame>
    </SoonPage>
  );
}

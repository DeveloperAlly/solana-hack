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
 * | overBalance  | Server check: cap > balance; blocks launch                | within balance        |
 *
 * Flow: useCampaignFlow (step 6 of 6): values chosen on earlier steps in this session replace the fixtures.
 * States: success (approve, then launched), error (blocked: cap above the wallet balance).
 */
import { useState } from 'react';
import { Alert, Button } from '../../ui/primitives';
import { CheckboxRow } from '../../ui/composites/CheckboxRow';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import { StatePanel } from '../../ui/composites/StatePanel';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { CampaignStep } from './CampaignStep';
import { useCampaignFlow } from './useCampaignFlow';
import { useSoonRoutes } from './routes';
import type { CampaignLaunchData } from './types';

export function CampaignLaunch({ data, state = 'success' }: { data: CampaignLaunchData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const { draft } = useCampaignFlow('launch');
  const [approved, setApproved] = useState(false);
  const [launched, setLaunched] = useState(false);
  const blocked = state === 'error' || data.overBalance;
  const cap = `${draft.cap ?? data.cap} USDC`;
  // What was chosen on earlier steps (useCampaignFlow) replaces the fixture values.
  const audience = draft.audienceNames?.join(', ') || data.audience;
  const plan = draft.planDays ? `${data.plan} · days: ${draft.planDays.join(', ')}` : data.plan;
  // INTEGRATION: POST …/launch; the server re-checks the cap against the wallet balance.
  const launch = () => {
    setLaunched(true);
    return false;
  };
  return (
    <CampaignStep
      step="launch"
      pageTitle="New campaign: review and launch"
      title="Review and launch"
      definedIn="component inventory, Campaign v2 step 6 (C11, D25, C17)"
      continueLabel="Launch campaign"
      continueDisabled={!approved || blocked || launched}
      onContinue={launch}
      error={blocked && <Alert tone="danger" title={`Blocked: the cap is above your wallet balance (${data.balance} USDC). Lower it or top up.`} />}
    >
      {launched ? (
        <StatePanel kind="success" title="Campaign launched" body="Every item still goes to approval before it is published or paid." actions={<Button href={routes.contentDashboard}>Go to your posts</Button>} />
      ) : (
        <>
          <KeyValueList
            label="Campaign summary"
            items={[
              { label: 'Goal', value: data.goal },
              { label: 'Audience', value: audience },
              { label: 'Main metric', value: data.metric },
              { label: 'Content plan', value: plan },
              { label: 'Spending cap', value: cap },
            ]}
          />
          <CheckboxRow label={`I approve a spending cap of ${cap} for this campaign.`} checked={approved} onChange={(e) => setApproved(e.target.checked)} />
        </>
      )}
    </CampaignStep>
  );
}

/*
 * Data contract: Campaign-v2-5-Budget (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Campaign-v2-5-Budget;
 * issue #51). Backend map §4 row "Campaign-v2-1, Campaign-v2-2 (steps 4–6 missing)": PATCH /api/campaigns/:id (the API
 * rejects a paid X format); balance is an RPC USDC balance of the brand payout wallet (row "Dashboard"; ADR-006).
 * Inventory D26 PayoutTable, D31 SpendingCapField, D25 BudgetBar. Shape: CampaignBudgetData.
 *
 * | Field            | Source                                                         | Empty when           |
 * |------------------|----------------------------------------------------------------|----------------------|
 * | payouts[]        | campaigns: payout per approved piece and format (no X formats) | never (defaults)     |
 * | noXNote          | Static copy (canvas)                                           | never                |
 * | cap              | campaigns: spending cap in USDC                                | never (default)      |
 * | balance          | RPC USDC balance of brands.payout_wallet                       | no wallet: "[n]"     |
 * | balanceCheck     | Server check of a cap against the balance; holds for that cap and above | none, or within balance |
 *
 * Flow: flows/campaign (step 5 of 6, draft.budget). Back goes to Campaign-v2-4-Plan, Next to Campaign-v2-6-Launch;
 * Next waits for steps 1 to 4, valid payouts and cap, and a cap within the balance.
 * States: success, error (the cap is above the wallet balance).
 */
import { Stack, Text } from '../../ui/primitives';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { SoonPayoutTable, payoutError } from '../../ui/domain/SoonPayoutTable';
import { SoonSpendingCapField, capError } from '../../ui/domain/SoonSpendingCapField';
import { CampaignStepFrame } from '../../flows/campaign/CampaignStepFrame';
import { campaignStore } from '../../flows/campaign/draft';
import { isOverBalance } from '../../flows/campaign/balanceCheck';
import { useCampaignFlow } from '../../flows/campaign/useCampaignFlow';
import { SoonPage } from './SoonPage';
import type { CampaignBudgetData } from './types';

export function CampaignBudget({ data }: { data: CampaignBudgetData; state?: ScreenState }) {
  const budget = campaignStore.use().draft.budget;
  // The draft's values win; the fixture fills formats the draft has no value for.
  const payouts = data.payouts.map((p) => ({ ...p, payout: budget.payouts[p.id] ?? p.payout }));
  const overBalance = isOverBalance(budget.cap, data.balanceCheck);
  const valid = payouts.every((p) => !payoutError(p.payout)) && !capError(budget.cap) && !overBalance;
  // INTEGRATION: PATCH /api/campaigns/:id { payouts, cap }; the server re-checks the cap against the wallet balance.
  const flow = useCampaignFlow('budget', { stepComplete: valid });
  const setPayout = (id: string, v: string) => flow.set('budget', { ...budget, payouts: { ...budget.payouts, [id]: v } });
  return (
    <SoonPage header={{ title: 'New campaign: people and budget', definedIn: 'component inventory, Campaign v2 step 5 (D26, D31, D25); ADR-006' }}>
      <CampaignStepFrame flow={flow} title="Payout per approved piece" titleLevel={2} missing={['fix the payouts and the spending cap']}>
        <Stack gap={5}>
          <SoonPayoutTable caption="Payout per approved piece" rows={payouts} onChange={setPayout} />
          <Text variant="small" tone="secondary">{data.noXNote}</Text>
          <SoonSpendingCapField value={budget.cap} onChange={(cap) => flow.set('budget', { ...budget, cap })} balance={data.balance} overBalance={overBalance} />
        </Stack>
      </CampaignStepFrame>
    </SoonPage>
  );
}

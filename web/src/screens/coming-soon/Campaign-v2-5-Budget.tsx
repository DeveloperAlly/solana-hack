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
 * | overBalance      | Server check: cap > balance                                    | within balance       |
 *
 * Flow: useCampaignFlow (step 5 of 6). Back goes to Campaign-v2-4-Plan, Continue to Campaign-v2-6-Launch.
 * States: success, error (the cap is above the wallet balance).
 */
import { useState } from 'react';
import { Alert, Stack, Text } from '../../ui/primitives';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { SoonPayoutTable, payoutError } from '../../ui/domain/SoonPayoutTable';
import { SoonSpendingCapField, capError } from '../../ui/domain/SoonSpendingCapField';
import { CampaignStep } from './CampaignStep';
import { useCampaignFlow } from './useCampaignFlow';
import type { CampaignBudgetData } from './types';

export function CampaignBudget({ data, state = 'success' }: { data: CampaignBudgetData; state?: ScreenState }) {
  const { draft, update } = useCampaignFlow('budget');
  const [error, setError] = useState(false);
  const payouts = data.payouts.map((p) => ({ ...p, payout: draft.payouts?.[p.id] ?? p.payout }));
  const cap = draft.cap ?? data.cap;
  const overBalance = state === 'error' || data.overBalance;
  const setPayout = (id: string, v: string) => update({ payouts: { ...draft.payouts, [id]: v } });
  // INTEGRATION: PATCH /api/campaigns/:id { payouts, cap }; the server re-checks the cap against the wallet balance.
  const canContinue = () => {
    const ok = payouts.every((p) => !payoutError(p.payout)) && !capError(cap) && !overBalance;
    setError(!ok);
    return ok;
  };
  return (
    <CampaignStep
      step="budget"
      pageTitle="New campaign: people and budget"
      title="Payout per approved piece"
      definedIn="component inventory, Campaign v2 step 5 (D26, D31, D25); ADR-006"
      onContinue={canContinue}
      error={error && <Alert tone="danger" title="Fix the payouts and the spending cap before you continue." />}
    >
      <Stack gap={5}>
        <SoonPayoutTable caption="Payout per approved piece" rows={payouts} onChange={setPayout} />
        <Text variant="small" tone="secondary">{data.noXNote}</Text>
        <SoonSpendingCapField value={cap} onChange={(v) => update({ cap: v })} balance={data.balance} overBalance={overBalance} />
      </Stack>
    </CampaignStep>
  );
}

/*
 * Data contract: Tip-Sheet (canvas board "Tip-Sheet", v22; issue #82, sub-task "Fan tips in USDC": "a
 * tip sheet on a verified post (Verify-1-Match)"). Backend map: no tips row yet; the post comes from §4 row
 * "Verify-1, Verify-2, Verify-3" (registrations). Wallet rules: ADR-006. Shape: TipSheetData in ./types.ts.
 *
 * | Field           | Source                                                                         | Empty when           |
 * |-----------------|--------------------------------------------------------------------------------|----------------------|
 * | posts[], post   | POST /api/verify -> the matched registered post; the one a link names (?post=) | that post is not registered |
 * | creator.name    | registrations.brand_id -> brands.name (or the ambassador, for their posts)     | never                |
 * | creator.wallet  | the creator's linked payout wallet (wallets table, ADR-006)                    | not linked: tips off |
 * | feeRate         | pitch deck v2, Business model slide: 3% on tips                                | never                |
 * | amount          | Client: typed by the fan; checked by tipAmountCheck                            | until typed          |
 *
 * States (C28): success = the sheet at the amount step; empty = the creator has no wallet (tips off); loading =
 * waiting for the fan's wallet to sign; error = the tip was not sent.
 */
import { Button, Stack } from '../../ui/primitives';
import { EmptyState } from '../../ui/composites/EmptyState';
import { PublicFrame } from './components/PublicFrame';
import { GrowthTipSheet } from './components/GrowthTipSheet';
import { VerifyMatchResult } from '../public-next/components/VerifyMatchResult';
import { useTipFlow } from './useTipFlow';
import type { ScreenProps, TipSheetData } from './types';

export function TipSheet({ data, state = 'success' }: ScreenProps<TipSheetData>) {
  const flow = useTipFlow(data, state);
  return (
    <PublicFrame
      title="Is this official?"
      tag="COMING SOON"
      intro="This post checks out. If you like it, you can tip the creator in USDC."
      meta="Drawn, not built: tips need a wallet transfer that does not exist yet. Defined in: issue #82 (Fan tips in USDC)."
    >
      {flow.post ? (
        <>
          <Stack gap={4}>
            <VerifyMatchResult post={flow.post} />
            <div>
              <Button onClick={() => flow.setOpen(true)}>Tip {data.creator.name} in USDC</Button>
            </div>
          </Stack>
          <GrowthTipSheet flow={flow} data={data} />
        </>
      ) : (
        <EmptyState title="This post is not registered" body="There is nothing to tip: no registered post has this id. Treat it as unverified." />
      )}
    </PublicFrame>
  );
}

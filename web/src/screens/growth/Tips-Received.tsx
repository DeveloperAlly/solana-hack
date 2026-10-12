/*
 * Data contract: Tips-Received (canvas board "Tips-Received", v22; issue #82, sub-task "Fan tips in
 * USDC": "the creator's list of tips received"). Backend map: no tips row yet (the closest is §4 row "Amb-5a … M-5":
 * GET /api/me/earnings, payouts). USDC goes to the creator's own wallet (ADR-006). Shape: TipsReceivedData.
 *
 * | Field          | Source                                                                       | Empty when       |
 * |----------------|------------------------------------------------------------------------------|------------------|
 * | creator        | the signed-in brand or creator (brands.name)                                 | never            |
 * | feeRate        | pitch deck v2, Business model slide: 3%                                      | never            |
 * | tips[]         | GET /api/me/tips (not built yet) plus tips sent on Tip-Sheet (session)       | no tips yet      |
 * | tips[].amount  | the USDC transfer amount; bracketed in samples                               | never            |
 * | tips[].signature | the transfer's transaction (Solana Explorer, devnet)                       | "[tx]" in samples |
 *
 * States (C28): success = totals and the table; empty = no tips yet; loading = reading tips; error = could not read.
 */
import { Grid, Stack } from '../../ui/primitives';
import { StatTile } from '../../ui/composites/StatTile';
import { StateView } from '../../ui/composites/StateView';
import { GrowthFrame } from './components/GrowthFrame';
import { GrowthTipsTable } from './components/GrowthTipsTable';
import { formatRate, formatUsdc } from './format';
import { useTipsReceived } from './useTipsReceived';
import type { ScreenProps, TipsReceivedData } from './types';

export function TipsReceived({ data, state = 'success' }: ScreenProps<TipsReceivedData>) {
  const flow = useTipsReceived(data);
  return (
    <GrowthFrame
      artboard="Tips-Received"
      title="Tips received"
      tag="COMING SOON"
      intro={`Fans tip your verified posts in USDC, straight to your own wallet. JamJam’s fee is ${formatRate(data.feeRate)}.`}
      meta="Drawn, not built. Defined in: issue #82 (Fan tips in USDC); pitch deck v2, slides 06 and Business model."
    >
      <StateView
        state={state === 'empty' ? 'success' : state}
        loading={{ title: 'Loading your tips', body: 'Reading transfers to your wallet.' }}
        error={{ title: 'Could not load your tips', body: 'Your tips are safe in your wallet. Reload the page in a minute to see them here.' }}
      >
        <Stack gap={5}>
          <Grid min="sm" gap={4}>
            <StatTile label="Tips" value={String(flow.totals.count)} />
            <StatTile label="You received" value={formatUsdc(flow.totals.received, '[total]')} sub="After the fee" />
            <StatTile label={`Fees (${formatRate(data.feeRate)})`} value={formatUsdc(flow.totals.fees, '[total]')} />
          </Grid>
          <GrowthTipsTable rows={flow.rows} posts={flow.posts} />
        </Stack>
      </StateView>
    </GrowthFrame>
  );
}

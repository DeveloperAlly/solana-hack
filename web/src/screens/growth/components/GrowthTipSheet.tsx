import type { ReactNode } from 'react';
import { Alert, Button, Field, Stack, Text } from '../../../ui/primitives';
import { Sheet } from '../../../ui/composites/Sheet';
import { StatePanel } from '../../../ui/composites/StatePanel';
import { ScreenLink } from '../../../gallery/ScreenLink';
import { formatRate, formatUsdc } from '../format';
import { growthArtboards } from '../paths';
import type { TipFlow, TipStep } from '../useTipFlow';
import type { TipSheetData } from '../types';
import { GrowthFeeBreakdown } from './GrowthFeeBreakdown';

/** The tip sheet: amount, review, sending, sent or failed, one view per step (a lookup, not a ternary chain). */
export function GrowthTipSheet({ flow, data }: { flow: TipFlow; data: TipSheetData }) {
  const { creator, feeRate } = data;
  const wallet = creator.wallet ?? '[no wallet]';
  const breakdown = flow.amount !== null && flow.split && (
    <GrowthFeeBreakdown amount={flow.amount} fee={flow.split.fee} net={flow.split.net} feeRate={feeRate} creator={creator.name} wallet={wallet} />
  );
  const views: Record<TipStep, { body: ReactNode; footer?: ReactNode }> = {
    amount: {
      body: (
        <Stack gap={4}>
          <Text>Tips are USDC, sent from your own Solana wallet straight to {creator.name}’s own wallet. JamJam takes {formatRate(feeRate)} and never holds the money.</Text>
          {creator.wallet === null && <Alert tone="warning" title="Tips are off">{flow.check.label}</Alert>}
          <Field label="Amount (USDC)" inputMode="decimal" autoComplete="off" value={flow.raw} onChange={(e) => flow.setRaw(e.target.value)} disabled={creator.wallet === null} hint={flow.check.label} />
          {breakdown}
        </Stack>
      ),
      footer: <Button onClick={flow.review} disabled={flow.check.blocking}>Review tip</Button>,
    },
    review: {
      body: <Stack gap={4}><Text>Check the amounts, then confirm. Your wallet asks you to sign the transfer.</Text>{breakdown}</Stack>,
      footer: <Stack direction="row" gap={3} wrap><Button variant="secondary" onClick={flow.back}>Back</Button><Button onClick={flow.confirm} disabled={flow.check.blocking}>Confirm and send</Button></Stack>,
    },
    sending: { body: <StatePanel kind="loading" title="Waiting for your wallet" body="Sign the transfer in your wallet to send the tip." />, footer: <Button disabled>Sending…</Button> },
    sent: {
      body: <StatePanel kind="success" title={`Sent ${formatUsdc(flow.amount)} to ${creator.name}`} body="The USDC went straight to their wallet. Receipt: [tx]." actions={<ScreenLink artboard={growthArtboards.tips}>See it in the creator’s tips</ScreenLink>} />,
      footer: <Button variant="secondary" onClick={() => flow.setOpen(false)}>Done</Button>,
    },
    failed: {
      body: <StatePanel kind="error" title="The tip was not sent" body="Your wallet did not sign, or the network did not confirm. No USDC left your wallet." />,
      footer: <Button onClick={flow.retry}>Try again</Button>,
    },
  };
  const view = views[flow.step];
  return (
    <Sheet open={flow.open} onClose={() => flow.setOpen(false)} title={`Tip ${creator.name}`} footer={view.footer}>
      {view.body}
    </Sheet>
  );
}

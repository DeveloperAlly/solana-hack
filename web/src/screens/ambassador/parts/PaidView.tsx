import { Button, Grid, Link, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { KeyValueList } from '../../../ui/composites/KeyValueList';
import { campaignProgress, nextPieceLabel } from '../copy';
import type { StatusViewProps } from './statusView';

/**
 * Amb-5b / M-5 success (canvas note n-a5b): amount, receipt (opens the receipt sheet), the post with "See public check",
 * the balance, and "Write another" with the pieces left in this campaign, worked out from the piece just paid. Payouts go
 * to the ambassador's own wallet, so there is no withdraw action (backend map row "Amb-5a, 5b, 5c, 5d, M-5"; ADR-006).
 */
export function PaidView({ data, flow, onReceipt }: StatusViewProps) {
  const { paid } = data;
  if (!paid) return null;
  const desktop = flow.device === 'desktop';
  // The link the ambassador submitted, when they posted it themselves; otherwise the post JamJam published (bracketed until wired).
  const postLink = data.submittedUrl ? <Link href={data.submittedUrl} external>{data.submittedUrl}</Link> : paid.postLink;
  const progress = campaignProgress(data);
  const { next } = progress;
  // Starting the next piece picks it on Generate, with that piece's default draft.
  const write = next && (
    <Button href={flow.paths.generate} onClick={() => flow.remember({ piece: next, draft: undefined, review: undefined })}>{nextPieceLabel(next, desktop)}</Button>
  );
  if (!desktop) {
    return <Card variant="subtle" as="div"><Text variant="small">{progress.text}</Text>{write}</Card>;
  }
  return (
    <Stack gap={5}>
      <Card as="div">
        <KeyValueList
          label="Payment"
          items={[
            { label: 'Amount', value: `${data.piece.payout} to your wallet` },
            { label: 'Receipt', value: <Button variant="secondary" onClick={onReceipt} aria-haspopup="dialog">View onchain receipt</Button> },
            { label: 'Post', value: <>{postLink} · <Link href={flow.pages.verifyMatch}>See public check</Link></> },
          ]}
        />
      </Card>
      <Grid min="sm" gap={4}>
        <Card variant="subtle" as="div">
          <Text variant="small" tone="secondary">Your balance</Text>
          <Text as="strong" variant="body">{paid.balance}</Text>
        </Card>
        <Card variant="subtle" as="div">
          <Text variant="small" tone="secondary">This campaign</Text>
          <Text>{progress.text}</Text>
          {write && <span>{write}</span>}
        </Card>
      </Grid>
    </Stack>
  );
}

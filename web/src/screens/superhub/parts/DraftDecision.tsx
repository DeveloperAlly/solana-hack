import { useState, type ReactNode } from 'react';
import { Badge } from '../../../ui/primitives/Badge';
import { Button, Field, Stack } from '../../../ui/primitives';
import { StatePanel } from '../../../ui/composites/StatePanel';
import type { DraftReviewState } from '../hooks/useDraftReview';
import { draftStatusLabel, MANUAL_ROUTE, type Decision } from '../hooks/draftStatus';
import { useHubLinks } from '../paths';

export interface DraftDecisionProps {
  review: DraftReviewState;
  /** The chosen publish route, in words. */
  route: string;
}

/**
 * The publish card after a decision. Approval is recorded first (not on-chain); registering on Solana is the next,
 * separate step (web/worker/posts.ts: approved → registered). On the manual route the post counts as posted only once
 * its URL is pasted back. The status badge comes from the same function as the dashboard's buckets.
 */
export function DraftDecision({ review, route }: DraftDecisionProps) {
  const links = useHubLinks();
  const [url, setUrl] = useState('');
  const awaitingUrl = review.status === 'awaiting-url';
  const urlForm = review.publish === MANUAL_ROUTE && awaitingUrl && (
    <Stack gap={2}>
      <Field label="Post URL" type="url" value={url} placeholder="https://" error={review.urlError} onChange={(e) => setUrl(e.target.value)} />
      <Button variant="secondary" onClick={() => review.pasteUrl(url)}>Save the post URL</Button>
    </Stack>
  );
  const views: Record<Decision, { title: string; body: string; actions: ReactNode }> = {
    approved: {
      title: 'Approved',
      body: `Route: ${route}. Next, register it: the post's hash, kit version and your name go on Solana (devnet), so anyone can check it.`,
      actions: <><Button onClick={review.register}>Register on Solana</Button><Button variant="secondary" onClick={review.reopen}>Back to the draft</Button></>,
    },
    registered: {
      title: 'Registered on Solana (devnet)',
      body: `The post's hash, kit version and your name are on the public record. Route: ${route}.`,
      actions: <Button href={links.verifyMatch}>Check it on Verify</Button>,
    },
    rejected: { title: 'Rejected', body: 'This draft will not be posted. It moves to the Rejected tab.', actions: <Button variant="secondary" onClick={review.reopen}>Undo</Button> },
    rewrite: { title: 'Rewrite requested', body: 'The writer drafts a new version; it comes back through the same checks.', actions: <Button variant="secondary" onClick={review.reopen}>Undo</Button> },
  };
  const v = views[review.decision ?? 'approved'];
  return (
    <Stack gap={3}>
      <Badge tone={awaitingUrl ? 'warning' : 'neutral'}>{draftStatusLabel[review.status]}</Badge>
      <StatePanel kind="success" level={3} title={v.title} body={v.body} actions={v.actions} />
      {urlForm}
    </Stack>
  );
}

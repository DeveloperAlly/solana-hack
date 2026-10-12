import { Button } from '../../../ui/primitives';
import { StatePanel } from '../../../ui/composites/StatePanel';
import type { Decision } from '../hooks/useDraftReview';
import { paths } from '../paths';

const views: Record<Decision, { title: string; body: string; reopen: string }> = {
  approved: { title: 'Approved and registered', body: "The post's hash, kit version and your name are registered on Solana (devnet). Anyone can check it.", reopen: 'Back to the draft' },
  rejected: { title: 'Rejected', body: 'This draft will not be posted. It moves to the Rejected tab.', reopen: 'Undo' },
  rewrite: { title: 'Rewrite requested', body: 'The writer drafts a new version; it comes back through the same checks.', reopen: 'Undo' },
};

/** What the publish card shows after Approve, Reject or Ask for a rewrite (local state; Approve leads on to Verify). */
export function DraftDecision({ decision, onReopen }: { decision: Decision; onReopen: () => void }) {
  const v = views[decision];
  return (
    <StatePanel
      kind="success"
      level={3}
      title={v.title}
      body={v.body}
      actions={
        <>
          {decision === 'approved' && <Button href={paths.verifyMatch}>Check it on Verify</Button>}
          <Button variant="secondary" onClick={onReopen}>{v.reopen}</Button>
        </>
      }
    />
  );
}

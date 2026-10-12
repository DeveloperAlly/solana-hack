import type { ReactNode } from 'react';
import { Button } from '../../../ui/primitives';
import { StatePanel } from '../../../ui/composites/StatePanel';
import type { Decision } from '../hooks/useDraftReview';
import { paths } from '../paths';

export interface DraftDecisionProps {
  decision: Decision;
  /** The chosen publish route, in words. */
  route: string;
  onRegister: () => void;
  onReopen: () => void;
}

/**
 * The publish card after a decision. Approval is recorded first (not on-chain); registering on Solana is the next,
 * separate step, and only then can the post be checked on Verify (web/worker/posts.ts: approved → registered).
 */
export function DraftDecision({ decision, route, onRegister, onReopen }: DraftDecisionProps) {
  const views: Record<Decision, { title: string; body: string; actions: ReactNode }> = {
    approved: {
      title: 'Approved',
      body: `Route: ${route}. Next, register it: the post's hash, kit version and your name go on Solana (devnet), so anyone can check it.`,
      actions: <><Button onClick={onRegister}>Register on Solana</Button><Button variant="secondary" onClick={onReopen}>Back to the draft</Button></>,
    },
    registered: {
      title: 'Registered on Solana (devnet)',
      body: `The post's hash, kit version and your name are on the public record. Route: ${route}.`,
      actions: <Button href={paths.verifyMatch}>Check it on Verify</Button>,
    },
    rejected: { title: 'Rejected', body: 'This draft will not be posted. It moves to the Rejected tab.', actions: <Button variant="secondary" onClick={onReopen}>Undo</Button> },
    rewrite: { title: 'Rewrite requested', body: 'The writer drafts a new version; it comes back through the same checks.', actions: <Button variant="secondary" onClick={onReopen}>Undo</Button> },
  };
  const v = views[decision];
  return <StatePanel kind="success" level={3} title={v.title} body={v.body} actions={v.actions} />;
}

import type { ReactElement } from 'react';
import { Button } from '../../../ui/primitives';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { StatePanel } from '../../../ui/composites/StatePanel';
import { verifyPaths } from '../paths';
import type { CheckStatus } from '../useVerifyCheck';
import type { VerifyOutcome } from '../types';
import { VerifyOutcomeView } from './VerifyOutcomeView';

export interface VerifyCheckResultProps {
  status: CheckStatus;
  outcome: VerifyOutcome;
  errorNote: string;
  onRetry: () => void;
}

/**
 * The result area of the Verify screen: one view per check status, and per outcome once done. Results are announced
 * politely when they change.
 */
export function VerifyCheckResult({ status, outcome, errorNote, onRetry }: VerifyCheckResultProps) {
  const views: Record<CheckStatus, () => ReactElement> = {
    idle: () => (
      <EmptyState
        title="Paste a post to check it"
        body="Paste the exact text, or the original post's URL, rather than a screenshot or repost."
        actions={<Button href={verifyPaths.ledger} variant="secondary">Browse verified brands</Button>}
      />
    ),
    checking: () => <StatePanel kind="loading" title="Checking" body="Looking for a matching registration on Solana." />,
    error: () => (
      <StatePanel kind="error" title="Could not check right now" body={errorNote} actions={<Button variant="secondary" onClick={onRetry}>Try again</Button>} />
    ),
    done: () => <VerifyOutcomeView outcome={outcome} />,
  };
  return <div aria-live="polite">{views[status]()}</div>;
}

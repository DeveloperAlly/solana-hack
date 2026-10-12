import type { ReactNode } from 'react';
import { Button } from '../../../ui/primitives';
import { StatePanel } from '../../../ui/composites/StatePanel';
import type { CheckStatus } from '../useVerifyCheck';

export interface VerifyStatusViewProps {
  status: CheckStatus;
  /** Shown before anything is checked. */
  idle: ReactNode;
  /** The result, once the check is done. */
  done: ReactNode;
  errorNote: string;
  onRetry: () => void;
}

/**
 * The result area of a check (Verify and Verify-4): one view per status, chosen by lookup, inside a polite live region
 * so a new result is announced.
 */
export function VerifyStatusView({ status, idle, done, errorNote, onRetry }: VerifyStatusViewProps) {
  const views: Record<CheckStatus, () => ReactNode> = {
    idle: () => idle,
    checking: () => <StatePanel kind="loading" title="Checking" body="Looking for a matching registration on Solana." />,
    error: () => (
      <StatePanel kind="error" title="Could not check right now" body={errorNote} actions={<Button variant="secondary" onClick={onRetry}>Try again</Button>} />
    ),
    done: () => done,
  };
  return <div aria-live="polite">{views[status]()}</div>;
}

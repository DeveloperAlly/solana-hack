import { Button } from '../../../ui/primitives';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { verifyPaths } from '../paths';

/** Verify before anything is pasted: how to check, and a way to browse verified brands instead. */
export function VerifyCheckEmpty() {
  return (
    <EmptyState
      title="Paste a post to check it"
      body="Paste the exact text, or the original post's URL, rather than a screenshot or repost."
      actions={<Button href={verifyPaths.ledger} variant="secondary">Browse verified brands</Button>}
    />
  );
}

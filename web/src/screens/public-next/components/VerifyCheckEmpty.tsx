import { EmptyState } from '../../../ui/composites/EmptyState';
import { ScreenLink } from '../../../gallery/ScreenLink';
import { verifyArtboards } from '../paths';

/** Verify before anything is pasted: how to check, and a way to browse verified brands instead. */
export function VerifyCheckEmpty() {
  return (
    <EmptyState
      title="Paste a post to check it"
      body="Paste the exact text, or the original post's URL, rather than a screenshot or repost."
      actions={<ScreenLink artboard={verifyArtboards.ledger} as="button" variant="secondary">Browse verified brands</ScreenLink>}
    />
  );
}

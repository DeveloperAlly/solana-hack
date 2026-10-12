import { Badge, Button } from '../../../ui/primitives';
import { DiffView } from '../../../ui/composites/DiffView';
import { VerifyResultCard } from '../../../ui/domain/VerifyResultCard';
import { VerifyReportForm } from '../../../ui/domain/VerifyReportForm';
import { formatPercent } from '../format';
import { useVerifyLinks } from '../paths';
import type { VerifyOutcome } from '../types';

type Edited = Extract<VerifyOutcome, { kind: 'edited' }>;

/**
 * "Edited from a brand-approved original" (canvas Verify-3-Edited; note n-v3: a diff against the approved original).
 * The diff and similarity are computed from the pasted text (matchPost.ts), so any edit of an approved post shows here.
 */
export function VerifyEditedResult({ outcome }: { outcome: Edited }) {
  const { post, similarity, diff, brokenClaim } = outcome;
  const brand = post.brand.name;
  const links = useVerifyLinks();
  return (
    <VerifyResultCard
      tone="edited"
      title="Edited from a brand-approved original"
      summary={`${formatPercent(similarity)} similar to a piece ${brand} approved. The changes were not approved.`}
      actions={
        <>
          <Button href={links.check(post.text)} variant="secondary">View the original and its receipt</Button>
          <VerifyReportForm triggerLabel={`Report to ${brand}`} brandName={brand} />
        </>
      }
    >
      <DiffView segments={diff} mode="split" beforeLabel={`Approved original (${brand}, kit v${post.kitVersion})`} afterLabel="What you pasted" />
      {brokenClaim && (
        <span>
          <Badge>Added text breaks a {brand} banned claim ("{brokenClaim}")</Badge>
        </span>
      )}
    </VerifyResultCard>
  );
}

import { Stack, Text } from '../../../ui/primitives';
import { VerifyResultCard } from '../../../ui/domain/VerifyResultCard';
import { VerifyReportForm } from '../../../ui/domain/VerifyReportForm';
import { ScreenLink } from '../../../gallery/ScreenLink';
import { verifyArtboards } from '../paths';

/** "Not found" (canvas Verify-2-NoMatch; note n-v2: neutral wording, and the report goes to the brand owner). */
export function VerifyNoMatchResult() {
  return (
    <VerifyResultCard
      tone="nomatch"
      title="Not found"
      summary="We couldn't match this to anything created or paid for through JamJam."
      actions={
        <>
          <VerifyReportForm triggerLabel="Report possible impersonation" />
          <ScreenLink artboard={verifyArtboards.ledger} as="button" variant="secondary">Browse verified brands</ScreenLink>
        </>
      }
    >
      <Text>That doesn't prove it's fake. It means no brand on JamJam approved this text. If it claims to be from a brand, check the brand's own channels.</Text>
      <Stack gap={1}>
        <Text variant="label">Tips</Text>
        <Text variant="small">Paste the exact text, or the original post's URL rather than a screenshot or repost.</Text>
      </Stack>
    </VerifyResultCard>
  );
}

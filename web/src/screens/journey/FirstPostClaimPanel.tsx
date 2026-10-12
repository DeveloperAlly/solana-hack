import { Heading, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import type { JourneyClaimView } from './derive';

/**
 * J6's "Claim → evidence" panel for the selected claim of the draft on screen (canvas board J6-First-Post, note
 * n-j6-first-post 2). A claim whose evidence the person rejected on J3 is shown as unsupported: approval waits until it
 * is sourced or removed. Composition only, no styles.
 */
export function FirstPostClaimPanel({ claim }: { claim: JourneyClaimView }) {
  return (
    <Card variant={claim.evidence ? 'default' : 'emphasis'} labelledBy="post-claim">
      <Heading level={2} size="lg" id="post-claim">Claim → evidence</Heading>
      <Text variant="small"><strong>"{claim.text}"</strong></Text>
      {claim.evidence ? (
        <JourneyFactCard fact={claim.evidence} />
      ) : (
        <Text variant="small" role="alert">Its evidence was rejected on Confirm, so this claim is unsupported. Add a source or remove the claim.</Text>
      )}
    </Card>
  );
}

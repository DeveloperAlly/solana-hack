import { Badge } from '../../../ui/primitives/Badge';
import { Button, Choice, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { KeyValueList } from '../../../ui/composites/KeyValueList';
import type { DraftReviewState } from '../hooks/useDraftReview';
import type { DraftReviewData } from '../types';
import { DraftDecision } from './DraftDecision';

export interface ChecksAndPublishProps {
  review: DraftReviewState;
  data: DraftReviewData;
}

/**
 * D3 ChecksPanel and the publish step (n-dr 3–4): the no-AI-slop check, scores, claims gate and vocabulary, live from
 * the text; any failed check blocks "Approve and publish" and says why. After a decision, D50-style result in place.
 */
export function ChecksAndPublish({ review, data }: ChecksAndPublishProps) {
  return (
    <Stack as="aside" gap={4} aria-label="Checks and publish">
      <Card as="section" labelledBy="draft-checks" header={<Heading level={2} size="lg" id="draft-checks">Checks</Heading>}>
        <KeyValueList label="Checks" items={review.checks.map((c) => ({ label: c.label, value: <Badge tone={c.ok ? 'neutral' : 'warning'}>{c.result}</Badge> }))} />
        <Text variant="small" tone="secondary">{data.scoresNote}</Text>
      </Card>
      <Card as="section" labelledBy="draft-publish" header={<Heading level={2} size="lg" id="draft-publish">Publish</Heading>}>
        {review.decision ? (
          <DraftDecision decision={review.decision} onReopen={review.reopen} />
        ) : (
          <Stack gap={3}>
            <Choice legend="Where it goes" options={data.publishOptions} value={review.publish} onChange={review.setPublish} />
            <Button onClick={review.approve} disabled={review.blockers.length > 0}>Approve and publish</Button>
            {review.blockers.length > 0 && <Text variant="small" tone="danger">Blocked before approval: {review.blockers.join('; ')}.</Text>}
            <Stack direction="row" gap={2} wrap>
              <Button variant="secondary" onClick={review.askRewrite}>Ask for a rewrite</Button>
              <Button variant="secondary" onClick={review.reject}>Reject</Button>
            </Stack>
            <Text variant="small" tone="secondary">{data.approvalNote}</Text>
          </Stack>
        )}
      </Card>
    </Stack>
  );
}

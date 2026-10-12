import { Button, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { DiffView, type DiffSegment } from '../../../ui/composites/DiffView';
import { HubItemRow } from '../../../ui/domain/HubItemRow';
import type { DraftReviewState } from '../hooks/useDraftReview';
import type { DraftReviewData } from '../types';

export interface SlopAndHistoryProps {
  review: DraftReviewState;
  data: DraftReviewData;
}

/** D7 SlopFixList (what the no-AI-slop pass changed, with Show original) and the version history with Undo (n-dr 1). */
export function SlopAndHistory({ review, data }: SlopAndHistoryProps) {
  const segments: DiffSegment[] = data.slopFixes.flatMap((f, i) => [
    ...(i > 0 ? [{ kind: 'same' as const, text: ' · ' }] : []),
    { kind: 'removed' as const, text: f.removed },
    ...(f.added ? [{ kind: 'same' as const, text: ' replaced with ' }, { kind: 'added' as const, text: f.added }] : [{ kind: 'same' as const, text: ' removed' }]),
  ]);
  const original = review.versions[0];
  return (
    <>
      <Card variant="subtle" as="section" labelledBy="draft-slop" header={<><Heading level={2} size="lg" id="draft-slop">Slop check fixed {data.slopFixes.length} things before you saw this</Heading><Button variant="secondary" aria-expanded={review.showOriginal} onClick={review.toggleOriginal}>{review.showOriginal ? 'Hide original' : 'Show original'}</Button></>}>
        <DiffView segments={segments} />
        {review.showOriginal && original && <Text variant="small">Original: {original.text}</Text>}
      </Card>
      <Card as="section" labelledBy="draft-history" header={<Heading level={2} size="lg" id="draft-history">History</Heading>}>
        <Stack as="ul" gap={0}>
          {[...review.versions].reverse().map((v) => (
            <HubItemRow key={v.id} as="li" actions={v.id === original?.id ? <Text variant="small" tone="secondary">Original</Text> : <Button variant="secondary" aria-label={`Undo ${v.label}`} onClick={() => review.undo(v.id)}>Undo</Button>}>
              <Text variant="small">{v.label}</Text>
            </HubItemRow>
          ))}
        </Stack>
      </Card>
    </>
  );
}

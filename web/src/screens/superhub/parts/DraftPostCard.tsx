import { Badge } from '../../../ui/primitives/Badge';
import { Heading, Stack, Text } from '../../../ui/primitives';
import { DraftEditor } from '../../../ui/domain/DraftEditor';
import { xWeightedLength } from '../../../lib/xLength';
import { Card } from '../../../ui/composites/Card';
import { DiffView } from '../../../ui/composites/DiffView';
import { PolishBar } from '../../../ui/domain/PolishBar';
import { polishLabels, type DraftReviewState } from '../hooks/useDraftReview';
import type { DraftReviewData } from '../types';

export interface DraftPostCardProps {
  review: DraftReviewState;
  data: DraftReviewData;
}

/**
 * The Draft-Review post card: the shared D5 DraftEditor (slop phrases highlighted, the count as the channel counts it),
 * or, right after Beautify, before and after side by side with Undo Beautify one click away in the D6 PolishBar
 * (n-drb); the polish bar sits under either.
 */
export function DraftPostCard({ review, data }: DraftPostCardProps) {
  const { size, limit, weighted } = review.length;
  const b = review.beautified;
  const polished = review.versions.filter((v) => v.action && v.action !== 'slop');
  const lastPolish = polished.at(-1);
  return (
    <Card as="section" labelledBy="draft-editor" header={<Heading level={2} size="lg" id="draft-editor">{b ? 'Beautify applied' : 'Post'}</Heading>}>
      {b ? (
        <Stack gap={3}>
          {review.accessible && <Badge>Accessible mode on</Badge>}
          <DiffView mode="split" segments={[{ kind: 'removed', text: b.before }, { kind: 'added', text: b.after }]} />
          <Stack as="ul" gap={1}>{data.beautifyNotes.map((n) => <Text as="li" key={n} variant="small">{n}</Text>)}</Stack>
        </Stack>
      ) : (
        <DraftEditor
          label="Post (editable)"
          value={review.text}
          onChange={review.setText}
          highlights={data.slopPhrases}
          charLimit={limit ?? undefined}
          measure={weighted ? xWeightedLength : undefined}
          countNote={weighted ? 'as X counts them' : undefined}
          readOnly={review.locked}
          hint={review.locked ? 'Registered on Solana: a registered post cannot change. Draft a new one.' : undefined}
          error={review.overLimit && limit ? `Over the limit by ${size - limit} characters${weighted ? ' as X counts them' : ''}. Shorten it or use Shorten.` : null}
        />
      )}
      <PolishBar
        actions={Object.entries(polishLabels).map(([id, label]) => ({ id, label }))}
        applied={polished.map((v) => v.action as string)}
        onApply={(id) => review.polish(id as keyof typeof polishLabels)}
        onUndo={lastPolish ? () => review.undo(lastPolish.id) : undefined}
        busy={review.locked}
        failure={review.failed && { id: review.failed, reason: data.failureReason, onRetry: review.retry, onDismiss: review.dismiss }}
        accessibleMode={{ checked: review.accessible, onChange: review.setAccessible }}
        note="Every polish action is applied as a new version. Undo any of them from the history."
      />
    </Card>
  );
}

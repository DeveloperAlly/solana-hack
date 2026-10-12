import { Badge } from '../../../ui/primitives/Badge';
import { Field, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { DiffView } from '../../../ui/composites/DiffView';
import { PolishBar } from '../../../ui/domain/PolishBar';
import { polishLabels, type DraftReviewState } from '../hooks/useDraftReview';
import type { DraftReviewData } from '../types';

export interface DraftEditorProps {
  review: DraftReviewState;
  data: DraftReviewData;
}

/**
 * D5 DraftEditor: the editable post with its character count, or, right after Beautify, before and after side by side
 * with Undo Beautify one click away in the D6 PolishBar (n-drb); the polish bar sits under either.
 */
const lengthHint = ({ size, limit }: { size: number; limit: number | null }) => (limit ? `${size} / ${limit} characters (as X counts them)` : `${size} characters`);

export function DraftEditor({ review, data }: DraftEditorProps) {
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
        <Field
          label="Post (editable)"
          multiline
          rows={6}
          value={review.text}
          hint={review.locked ? 'Registered on Solana: a registered post cannot change. Draft a new one.' : lengthHint(review.length)}
          error={review.overLimit && review.length.limit ? `Over the limit by ${review.length.size - review.length.limit} characters as X counts them. Shorten it or use Shorten.` : null}
          readOnly={review.locked}
          onChange={(e) => review.setText(e.target.value)}
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

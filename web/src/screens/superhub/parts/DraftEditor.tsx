import { Badge } from '../../../ui/primitives/Badge';
import { Button, Field, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { DiffView } from '../../../ui/composites/DiffView';
import type { DraftReviewState } from '../hooks/useDraftReview';
import type { DraftReviewData } from '../types';
import { PolishBar } from './PolishBar';

export interface DraftEditorProps {
  review: DraftReviewState;
  data: DraftReviewData;
}

/**
 * D5 DraftEditor: the editable post with its character count, or, right after Beautify, before and after side by side
 * with Undo Beautify one click away (n-drb); the polish bar sits under either.
 */
export function DraftEditor({ review, data }: DraftEditorProps) {
  const b = review.beautified;
  const lastId = review.versions.at(-1)?.id;
  return (
    <Card as="section" labelledBy="draft-editor" header={<Heading level={2} size="lg" id="draft-editor">{b ? 'Beautify applied' : 'Post'}</Heading>}>
      {b ? (
        <Stack gap={3}>
          <Stack direction="row" gap={2} align="center" wrap>
            {review.accessible && <Badge>Accessible mode on</Badge>}
            <Button onClick={() => lastId && review.undo(lastId)} disabled={review.locked}>Undo Beautify</Button>
          </Stack>
          <DiffView mode="split" segments={[{ kind: 'removed', text: b.before }, { kind: 'added', text: b.after }]} />
          <Stack as="ul" gap={1}>{data.beautifyNotes.map((n) => <Text as="li" key={n} variant="small">{n}</Text>)}</Stack>
        </Stack>
      ) : (
        <Field
          label="Post (editable)"
          multiline
          rows={6}
          value={review.text}
          hint={review.locked ? 'Registered on Solana: a registered post cannot change. Draft a new one.' : `${review.text.length} / ${data.charLimit} characters`}
          error={review.overLimit ? `Over the limit by ${review.text.length - data.charLimit} characters. Shorten it or use Shorten.` : null}
          readOnly={review.locked}
          onChange={(e) => review.setText(e.target.value)}
        />
      )}
      <PolishBar review={review} failureReason={data.failureReason} />
    </Card>
  );
}

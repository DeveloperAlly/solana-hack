import { Button, Stack, Text } from '../../../ui/primitives';
import { Alert } from '../../../ui/primitives/Alert';
import { CheckboxRow } from '../../../ui/composites/CheckboxRow';
import { polishLabels, type DraftReviewState } from '../hooks/useDraftReview';
import type { PolishAction } from '../types';

const actions = Object.keys(polishLabels) as PolishAction[];

export interface PolishBarProps {
  review: DraftReviewState;
  failureReason?: string;
}

/**
 * D6 PolishBar (n-dr 1–2, n-dre): Review, Shorten, Clarify, Beautify, each a new version; accessible mode for Beautify;
 * a failed action says what happened, keeps the draft, and offers Retry or Dismiss while the others stay available.
 */
export function PolishBar({ review, failureReason }: PolishBarProps) {
  const pressed = review.failed ?? review.versions.at(-1)?.action;
  return (
    <Stack gap={3}>
      {review.failed && (
        <Alert tone="danger" title={`${polishLabels[review.failed]} didn't finish.`}>
          {failureReason}{' '}
          <Button onClick={review.retry}>Retry {polishLabels[review.failed]}</Button>{' '}
          <Button variant="secondary" onClick={review.dismiss}>Dismiss</Button>
        </Alert>
      )}
      <Stack direction="row" gap={2} align="center" wrap role="group" aria-label="Polish actions">
        {actions.map((a) => (
          <Button key={a} variant={pressed === a ? 'primary' : 'secondary'} aria-pressed={pressed === a} disabled={review.locked} onClick={() => review.polish(a)}>{polishLabels[a]}</Button>
        ))}
        <CheckboxRow label="Accessible mode (Beautify uses no Unicode styling)" checked={review.accessible} onChange={() => review.setAccessible(!review.accessible)} />
      </Stack>
      <Text variant="small" tone="secondary">Every polish action is applied as a new version. Undo any of them from the history.</Text>
    </Stack>
  );
}

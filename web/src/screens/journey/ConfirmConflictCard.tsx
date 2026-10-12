import { Alert, Button, Stack } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { InlineForm } from '../../ui/composites/InlineForm';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import type { ConfirmData } from './types';
import type { JourneyActions } from './useJourneyFlow';
import { useJourneyTask } from './useJourneyTask';
import { required } from './validators';

export function ConfirmConflictCard({ conflict, onResolve }: { conflict: NonNullable<ConfirmData['conflicts']>[number]; onResolve: NonNullable<JourneyActions['resolveConflict']> extends (id: string, resolution: infer R) => Promise<void> ? (resolution: R) => Promise<void> : never }) {
  const task = useJourneyTask();
  return <Card><JourneyFactCard fact={conflict.question} />
    <Stack gap={3}>{conflict.sides.map(side => <JourneyFactCard key={side.id} fact={side} actions={<Button disabled={task.busy} onClick={() => void task.run(() => onResolve({ mode: 'keep', keep: [side.id] }))}>Keep this version</Button>} />)}
      <Button variant="secondary" disabled={task.busy} onClick={() => void task.run(() => onResolve({ mode: 'reject_all' }))}>Reject all versions</Button>
      <InlineForm fields={[{ name: 'text', label: 'Your answer', multiline: true, validate: required('Give your answer.') }, { name: 'value', label: 'The value that resolves the disagreement', hint: 'For example, the year or location.', validate: required('Give the value.') }]} submitLabel="Save my answer" busy={task.busy} errors={{ text: task.error }} onSubmit={({ text, value }) => void task.run(() => onResolve({ mode: 'answer', answer: { text, value } }))} />
      {task.error && <Alert tone="danger">{task.error}</Alert>}
    </Stack>
  </Card>;
}

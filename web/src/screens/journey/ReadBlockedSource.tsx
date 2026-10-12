import { useJourneyTask } from './useJourneyTask';
import type { SourceInput } from './useJourneySources';
import { Alert, Button, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { FilePicker } from '../../ui/composites/FilePicker';
import { InlineForm } from '../../ui/composites/InlineForm';
import { useDisclosure } from '../../ui/hooks/useDisclosure';
import { required } from './validators';
import type { JourneySource } from './types';

export interface ReadBlockedSourceProps {
  source: JourneySource;
  onSupply: (how: string, input?: SourceInput) => void | Promise<void>;
  onSkip: () => void | Promise<void>;
}

/**
 * J1's blocked-source panel (canvas board J1-Read, error panel; note n-j1-read 2): paste the text, upload a file, or
 * skip. Composition only, no styles.
 */
export function ReadBlockedSource({ source, onSupply, onSkip }: ReadBlockedSourceProps) {
  const task = useJourneyTask();
  const paste = useDisclosure();
  return (
    <Card variant="emphasis" as="div">
      <Text variant="small" role="alert">
        <strong>{source.label} didn't let us read it</strong>{source.reason ? ` (${source.reason}).` : '.'}
      </Text>
      {task.error && !paste.open && <Alert tone="danger">{task.error}</Alert>}
      {paste.open ? (
        <InlineForm fields={[{ name: 'text', label: `Text from ${source.label}`, multiline: true, validate: required('Paste the text first.') }]} submitLabel="Add" onCancel={paste.hide} busy={task.busy} errors={{ text: task.error }} onSubmit={({ text }) => void task.run(() => onSupply('pasted text', { kind: 'text', value: text }), paste.hide)} />
      ) : (
        <Stack direction="row" gap={2} wrap>
          <Button variant="secondary" onClick={paste.show}>Paste the text</Button>
          <FilePicker label="Upload a file" accept=".pdf,.docx,.txt,.md" onFiles={([file]) => file && void task.run(() => onSupply(file.name, { kind: 'file', file }))} />
          <Button variant="secondary" disabled={task.busy} onClick={() => void task.run(onSkip)}>Skip</Button>
        </Stack>
      )}
    </Card>
  );
}

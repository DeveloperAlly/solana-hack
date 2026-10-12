import { useJourneyTask } from './useJourneyTask';
import type { SourceInput } from './useJourneySources';
import { Alert } from '../../ui/primitives';
import { useState, type ReactNode } from 'react';
import { Button, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { FilePicker } from '../../ui/composites/FilePicker';
import { InlineForm } from '../../ui/composites/InlineForm';
import { required, siteUrl } from './validators';

type AddForm = 'none' | 'link' | 'text';

/**
 * J1's "Add more" panel (canvas board J1-Read: "More sources, fewer questions"): another link, pasted text, or a PDF or
 * DOCX. Each adds a queued source through `onAdd`. Composition only, no styles.
 */
export function ReadAddMore({ onAdd }: { onAdd: (label: string, input?: SourceInput) => void | Promise<void> }) {
  const task = useJourneyTask();
  const [form, setForm] = useState<AddForm>('none');
  const close = () => setForm('none');
  const forms: Record<AddForm, ReactNode> = {
    none: (
      <Stack direction="row" gap={2} wrap>
        <Button variant="secondary" onClick={() => setForm('link')}>Another link</Button>
        <Button variant="secondary" onClick={() => setForm('text')}>Paste text</Button>
        <FilePicker label="PDF or DOCX" accept=".pdf,.docx" onFiles={([file]) => { if (file) void task.run(() => onAdd(file.name, { kind: 'file', file })); }} />
      </Stack>
    ),
    link: <InlineForm fields={[{ name: 'url', label: 'Another link', type: 'url', validate: siteUrl }]} submitLabel="Add" onCancel={close} busy={task.busy} errors={{ url: task.error }} onSubmit={({ url }) => void task.run(() => onAdd(url, { kind: 'url', value: url }), close)} />,
    text: <InlineForm fields={[{ name: 'text', label: 'Paste text', multiline: true, validate: required('Paste the text first.') }]} submitLabel="Add" onCancel={close} busy={task.busy} errors={{ text: task.error }} onSubmit={({ text }) => void task.run(() => onAdd('Pasted text', { kind: 'text', value: text }), close)} />,
  };
  return (
    <Card variant="subtle" labelledBy="read-add-more">
      <Heading level={2} size="lg" id="read-add-more">Add more</Heading>
      <Text variant="small" tone="secondary">More sources, fewer questions.</Text>
      {task.error && form === 'none' && <Alert tone="danger">{task.error}</Alert>}
      {forms[form]}
    </Card>
  );
}

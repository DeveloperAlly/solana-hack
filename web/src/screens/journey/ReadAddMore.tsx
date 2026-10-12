import { useState, type ReactNode } from 'react';
import { Button, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { JourneyFileButton } from '../../ui/domain/JourneyFileButton';
import { JourneyInlineForm } from '../../ui/domain/JourneyInlineForm';
import { required, siteUrl } from './validators';

type AddForm = 'none' | 'link' | 'text';

/**
 * J1's "Add more" panel (canvas board J1-Read: "More sources, fewer questions"): another link, pasted text, or a PDF or
 * DOCX. Each adds a queued source through `onAdd`. Composition only, no styles.
 */
export function ReadAddMore({ onAdd }: { onAdd: (label: string) => void }) {
  const [form, setForm] = useState<AddForm>('none');
  const close = () => setForm('none');
  const forms: Record<AddForm, ReactNode> = {
    none: (
      <Stack direction="row" gap={2} wrap>
        <Button variant="secondary" onClick={() => setForm('link')}>Another link</Button>
        <Button variant="secondary" onClick={() => setForm('text')}>Paste text</Button>
        <JourneyFileButton label="PDF or DOCX" accept=".pdf,.docx" onFile={(f) => onAdd(f.name)} />
      </Stack>
    ),
    link: <JourneyInlineForm label="Another link" submitLabel="Add" type="url" validate={siteUrl} onCancel={close} onSubmit={(v) => { onAdd(v); close(); }} />,
    text: <JourneyInlineForm label="Paste text" submitLabel="Add" multiline validate={required('Paste the text first.')} onCancel={close} onSubmit={() => { onAdd('Pasted text'); close(); }} />,
  };
  return (
    <Card variant="subtle" labelledBy="read-add-more">
      <Heading level={2} size="lg" id="read-add-more">Add more</Heading>
      <Text variant="small" tone="secondary">More sources, fewer questions.</Text>
      {forms[form]}
    </Card>
  );
}

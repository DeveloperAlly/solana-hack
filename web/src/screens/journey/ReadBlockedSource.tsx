import { Button, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { JourneyFileButton } from '../../ui/domain/JourneyFileButton';
import { JourneyInlineForm } from '../../ui/domain/JourneyInlineForm';
import { useDisclosure } from '../../ui/hooks/useDisclosure';
import { required } from './validators';
import type { JourneySource } from './types';

export interface ReadBlockedSourceProps {
  source: JourneySource;
  onSupply: (how: string) => void;
  onSkip: () => void;
}

/**
 * J1's blocked-source panel (canvas board J1-Read, error panel; note n-j1-read 2): paste the text, upload a file, or
 * skip. Composition only, no styles.
 */
export function ReadBlockedSource({ source, onSupply, onSkip }: ReadBlockedSourceProps) {
  const paste = useDisclosure();
  return (
    <Card variant="emphasis" as="div">
      <Text variant="small" role="alert">
        <strong>{source.label} didn't let us read it</strong>{source.reason ? ` (${source.reason}).` : '.'}
      </Text>
      {paste.open ? (
        <JourneyInlineForm label={`Text from ${source.label}`} submitLabel="Add" multiline validate={required('Paste the text first.')} onCancel={paste.hide} onSubmit={() => onSupply('pasted text')} />
      ) : (
        <Stack direction="row" gap={2} wrap>
          <Button variant="secondary" onClick={paste.show}>Paste the text</Button>
          <JourneyFileButton label="Upload a file" accept=".pdf,.docx,.txt,.md" onFile={(f) => onSupply(f.name)} />
          <Button variant="secondary" onClick={onSkip}>Skip</Button>
        </Stack>
      )}
    </Card>
  );
}

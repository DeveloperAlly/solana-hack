import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { JourneyFileButton } from './JourneyFileButton';

function Demo() {
  const [name, setName] = useState('');
  return (
    <Stack gap={2}>
      <JourneyFileButton label="PDF or DOCX" accept=".pdf,.docx" onFile={(f) => setName(f.name)} />
      <Text variant="small" tone="secondary" role="status">{name ? `Chosen: ${name}` : 'No file chosen'}</Text>
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D85',
  name: 'JourneyFileButton',
  description: 'A file input styled as a secondary button; the chosen name shows below.',
  render: () => <Demo />,
};

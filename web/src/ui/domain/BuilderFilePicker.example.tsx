import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { BuilderFilePicker } from './BuilderFilePicker';

function Demo() {
  const [files, setFiles] = useState<string[]>([]);
  return (
    <Stack gap={3}>
      <BuilderFilePicker label="Browse files" accept=".pdf,.md,.docx" multiple hint="PDF, Markdown, DOCX." onFiles={(n) => setFiles((f) => [...f, ...n])} />
      <Text variant="small" tone="secondary">Chosen: {files.length ? files.join(', ') : 'none'}</Text>
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'C14',
  name: 'BuilderFilePicker',
  description: 'Native file input behind a button-styled label; lists chosen names.',
  render: () => <Demo />,
};

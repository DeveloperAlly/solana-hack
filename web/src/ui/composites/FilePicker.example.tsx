import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { FilePicker } from './FilePicker';

// Labels from canvas boards Onboard-3-Sources, Ingest-Error and J1-Read (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'C14',
  name: 'FilePicker',
  description: 'Secondary with a hint and several files, primary single file, and disabled.',
  render: () => (
    <Stack gap={4}>
      <FilePicker label="Browse files" accept=".pdf,.md,.docx" multiple hint="PDF, Markdown or DOCX" onFiles={() => undefined} />
      <FilePicker label="Upload a file" accept=".pdf,.docx" variant="primary" onFiles={() => undefined} />
      <FilePicker label="Upload it as a file" disabled onFiles={() => undefined} />
    </Stack>
  ),
};

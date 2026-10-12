import type { WorkbenchExample } from '../../system/example';
import { Button, Stack } from '../primitives';
import { StatusList } from './StatusList';

// Rows from canvas boards J1-Read, J6-First-Post, J8-Hub-FirstRun and Ingest-Error (sample data;
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'C32',
  name: 'StatusList',
  description: 'Titled card with chips and a link row; plain list with muted and failed rows and per-row actions.',
  render: () => (
    <Stack gap={5}>
      <StatusList
        label="Checks"
        title
        titleLevel={4}
        surface="card"
        rows={[
          { id: 'slop', label: 'No AI slop', status: 'Passed', solid: true },
          { id: 'claims', label: 'Claims gate', status: 'Passed', solid: true },
          { id: 'record', label: 'Public record', status: 'Open the ledger', href: '/system' },
        ]}
      />
      <StatusList
        label="Sources"
        rows={[
          { id: 's1', label: 'jamjam.tech', status: 'Done · 2 facts found' },
          { id: 's2', label: 'docs.example.com', status: 'Reading…', solid: true },
          { id: 's3', label: 'example.com/blog', status: 'From step 1', tone: 'muted' },
          { id: 's4', label: 'example.com/blocked', detail: 'The site blocked our reader.', status: 'Failed', solid: true, tone: 'failed' },
        ]}
        actions={(r) => (r.tone === 'failed' ? <Button variant="secondary">Retry</Button> : null)}
      />
    </Stack>
  ),
};

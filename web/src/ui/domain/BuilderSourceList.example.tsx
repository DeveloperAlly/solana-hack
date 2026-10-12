import type { WorkbenchExample } from '../../system/example';
import { Button } from '../primitives';
import { BuilderSourceList, type SourceRow } from './BuilderSourceList';

// Rows from canvas boards Onboard-3b-Profiling and Ingest-Error (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
const rows: SourceRow[] = [
  { id: 'site', name: 'jamjam.tech', status: 'Done · 2 facts found', tone: 'done' },
  { id: 'press', name: '[2023 press or docs links]', status: 'Failed', tone: 'failed', error: "Couldn't open this page: it returned an error or blocks automated reading." },
  { id: 'sort', name: 'Sorting facts into the 17 kit sections', status: 'Waiting', tone: 'waiting' },
];

export const example: WorkbenchExample = {
  id: 'D12',
  name: 'BuilderSourceList',
  description: 'Done, failed (with reason and actions) and waiting rows.',
  render: () => <BuilderSourceList label="Sources" rows={rows} actions={(r) => r.tone === 'failed' && <Button>Retry</Button>} />,
};

import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { DiffView, type DiffSegment } from './DiffView';

const segments: DiffSegment[] = [
  { kind: 'same', text: "That's the gap aDNA fills: an open standard for project context" },
  { kind: 'removed', text: ' that any agent can read, version and audit.' },
  { kind: 'added', text: ". It will 10x your team's output." },
];

export const example: WorkbenchExample = {
  id: 'C23',
  name: 'DiffView',
  description: 'Inline and side by side.',
  render: () => (
    <Stack gap={4}>
      <DiffView segments={segments} />
      <DiffView segments={segments} mode="split" beforeLabel="Approved original" afterLabel="What you pasted" />
    </Stack>
  ),
};

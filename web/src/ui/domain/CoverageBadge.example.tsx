import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { CoverageBadge, coverageStatuses } from './CoverageBadge';

export const example: WorkbenchExample = {
  id: 'D51',
  name: 'CoverageBadge',
  description: 'Evidenced, Inferred, Missing: letter only (word for screen readers), with the word, and as a legend (canvas Coverage-Map).',
  render: () => (
    <Stack gap={3}>
      <Stack direction="row" gap={3} wrap>{coverageStatuses.map((s) => <CoverageBadge key={s} status={s} />)}</Stack>
      <Stack direction="row" gap={3} wrap>{coverageStatuses.map((s) => <CoverageBadge key={s} status={s} display="word" />)}</Stack>
      <Stack direction="row" gap={5} wrap>{coverageStatuses.map((s) => <CoverageBadge key={s} status={s} display="legend" />)}</Stack>
    </Stack>
  ),
};

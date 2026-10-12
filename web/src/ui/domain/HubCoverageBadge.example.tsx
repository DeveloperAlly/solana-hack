import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { HubCoverageBadge, coverageStatuses } from './HubCoverageBadge';

export const example: WorkbenchExample = {
  id: 'D51',
  name: 'HubCoverageBadge',
  description: 'Evidenced, Inferred, Missing: letter only (word for screen readers) and with the word shown.',
  render: () => (
    <Stack gap={3}>
      <Stack direction="row" gap={3} wrap>{coverageStatuses.map((s) => <HubCoverageBadge key={s} status={s} />)}</Stack>
      <Stack direction="row" gap={3} wrap>{coverageStatuses.map((s) => <HubCoverageBadge key={s} status={s} showWord />)}</Stack>
    </Stack>
  ),
};

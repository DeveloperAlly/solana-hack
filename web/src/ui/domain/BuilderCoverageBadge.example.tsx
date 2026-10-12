import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { BuilderCoverageBadge } from './BuilderCoverageBadge';

export const example: WorkbenchExample = {
  id: 'D51',
  name: 'BuilderCoverageBadge',
  description: 'E / I / M badges, plain and as a legend (canvas Coverage-Map).',
  render: () => (
    <Stack gap={3}>
      <Stack direction="row" gap={3}><BuilderCoverageBadge state="E" /><BuilderCoverageBadge state="I" /><BuilderCoverageBadge state="M" /></Stack>
      <Stack direction="row" gap={5} wrap><BuilderCoverageBadge state="E" withDetail /><BuilderCoverageBadge state="I" withDetail /><BuilderCoverageBadge state="M" withDetail /></Stack>
    </Stack>
  ),
};

import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { AmbBar } from './AmbBar';

export const example: WorkbenchExample = {
  id: 'P24',
  name: 'AmbBar',
  description: 'Decorative bar: spent and committed segments (canvas Amb-2), a single fill (Amb-1, small), and a threshold marker (Amb-3).',
  render: () => (
    <Stack gap={3}>
      <AmbBar segments={[{ pct: 27, tone: 'primary' }, { pct: 12, tone: 'secondary' }]} />
      <AmbBar size="sm" segments={[{ pct: 39, tone: 'primary' }]} />
      <AmbBar segments={[{ pct: 74, tone: 'primary' }]} marker={80} />
    </Stack>
  ),
};

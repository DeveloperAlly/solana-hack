import type { WorkbenchExample } from '../../system/example';
import { Button, Stack } from '../primitives';
import { AmbOnBrandMeter } from './AmbOnBrandMeter';

export const example: WorkbenchExample = {
  id: 'D4',
  name: 'AmbOnBrandMeter',
  description: 'Below the threshold (Drifting, canvas Amb-3), above it (On brand, Amb-4), and the mobile bar with its flags button (M-3).',
  render: () => (
    <Stack gap={5}>
      <AmbOnBrandMeter score={74} threshold={80} hint="Publishing unlocks at 80% with no banned claims." />
      <AmbOnBrandMeter score={91} threshold={80} />
      <AmbOnBrandMeter layout="bar" score={74} threshold={80} action={<Button variant="secondary">3 flags</Button>} />
    </Stack>
  ),
};

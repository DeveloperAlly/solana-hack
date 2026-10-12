import type { WorkbenchExample } from '../../system/example';
import { Badge, Stack } from '../primitives';
import { Meter } from './Meter';

// Scores from canvas boards Amb-3-Generate and M-3-Generate (threshold 80; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'P25',
  name: 'Meter',
  description: 'Above and below a threshold with a summary and hint, a plain meter without threshold, and small size.',
  render: () => (
    <Stack gap={5}>
      <Meter label="On-brand score" value={91} threshold={80} valueText="91%, publishing unlocks at 80%" summary={<><strong>91%</strong><Badge tone="solid">On brand</Badge></>} hint="Publishing unlocks at 80%." />
      <Meter label="On-brand score" value={64} threshold={80} valueText="64%, publishing unlocks at 80%" summary={<><strong>64%</strong><Badge>Drifting</Badge></>} />
      <Meter label="Platform fit" value={3} max={5} />
      <Meter label="Confidence" value={40} size="sm" />
    </Stack>
  ),
};

import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { BarList } from './BarList';

// Figures from canvas boards Analytics and Hub-Home (sample data; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'C22',
  name: 'BarList',
  description: 'Bars scaled to the largest value, and a single progress row against a fixed maximum with hidden labels.',
  render: () => (
    <Stack gap={5}>
      <BarList
        label="Engagement by voice"
        items={[
          { label: 'Founder', value: 3.1, display: '3.1%' },
          { label: 'Technical', value: 2.0, display: '2.0%' },
          { label: 'Playful', value: 1.0, display: '1.0%' },
        ]}
      />
      <BarList label="Campaign progress" hideLabels max={40} items={[{ label: 'Verified posts', value: 15, display: '15 of 40' }]} />
    </Stack>
  ),
};

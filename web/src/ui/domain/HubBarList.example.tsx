import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { HubBarList } from './HubBarList';

export const example: WorkbenchExample = {
  id: 'C22',
  name: 'HubBarList',
  description: 'Bars scaled to the largest value, and a single progress bar against a fixed maximum.',
  render: () => (
    <Stack gap={5}>
      <HubBarList
        label="Engagement by voice"
        items={[
          { label: 'Founder', value: 3.1, display: '3.1%' },
          { label: 'Technical', value: 2.0, display: '2.0%' },
          { label: 'Playful', value: 1.0, display: '1.0%' },
        ]}
      />
      <HubBarList label="Campaign progress" hideLabels max={40} items={[{ label: 'Verified posts', value: 15, display: '15 of 40' }]} />
    </Stack>
  ),
};

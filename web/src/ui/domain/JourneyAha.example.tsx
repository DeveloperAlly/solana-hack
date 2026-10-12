import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { JourneyAha } from './JourneyAha';

export const example: WorkbenchExample = {
  id: 'D80',
  name: 'JourneyAha',
  description: 'Aha callout: default (J1 to J6) and inverse (J7).',
  render: () => (
    <Stack gap={3}>
      <JourneyAha n={1}>It already knows us, and shows exactly where it read it.</JourneyAha>
      <JourneyAha n={5} tone="inverse">Anyone can check this came from you.</JourneyAha>
    </Stack>
  ),
};

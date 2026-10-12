import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { JourneyProgress } from './JourneyProgress';

export const example: WorkbenchExample = {
  id: 'P24',
  name: 'JourneyProgress',
  description: 'Empty, partial (coverage, with hint) and full.',
  render: () => (
    <Stack gap={4}>
      <JourneyProgress label="Nothing read yet" value={0} />
      <JourneyProgress label={<><strong>3 of 6 kit sections found</strong> · 1 partly · 2 need you</>} value={58} hint="Rises as you confirm." />
      <JourneyProgress label="Set up complete" value={100} />
    </Stack>
  ),
};

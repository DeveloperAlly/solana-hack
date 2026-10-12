import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { AmbStatusTimeline } from './AmbStatusTimeline';
import { sampleFailedSteps, sampleSteps } from './ambSamples';

export const example: WorkbenchExample = {
  id: 'D29',
  name: 'AmbStatusTimeline',
  description: 'Payout status: verifying (canvas Amb-5a), failed (Amb-5c), and vertical for mobile (M-5).',
  render: () => (
    <Stack gap={5}>
      <AmbStatusTimeline steps={sampleSteps} label="Verifying" />
      <AmbStatusTimeline steps={sampleFailedSteps} label="Failed" />
      <AmbStatusTimeline steps={sampleSteps} orientation="vertical" label="Vertical" />
    </Stack>
  ),
};

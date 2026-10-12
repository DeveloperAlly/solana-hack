import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { JourneyCopyButton } from './JourneyCopyButton';

export const example: WorkbenchExample = {
  id: 'C13',
  name: 'JourneyCopyButton',
  description: 'Primary and secondary; click to copy, the label confirms it.',
  render: () => (
    <Stack direction="row" gap={2} wrap>
      <JourneyCopyButton variant="primary" label="Copy post" text="Every brand tool I tried asked me questions my website already answered." />
      <JourneyCopyButton label="Copy check link" text="/screens/J7-Proof" />
    </Stack>
  ),
};

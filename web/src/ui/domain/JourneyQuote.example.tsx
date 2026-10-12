import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { JourneyQuote } from './JourneyQuote';

export const example: WorkbenchExample = {
  id: 'D81',
  name: 'JourneyQuote',
  description: 'The supporting line for a fact, small and extra small.',
  render: () => (
    <Stack gap={3}>
      <JourneyQuote>Build your brand. Then start creating.</JourneyQuote>
      <JourneyQuote size="xs">We read your site and links first and show what we found beside each question.</JourneyQuote>
    </Stack>
  ),
};

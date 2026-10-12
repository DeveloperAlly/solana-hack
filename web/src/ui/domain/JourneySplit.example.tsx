import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { Card } from '../composites/Card';
import { JourneySplit, type JourneySplitRatio } from './JourneySplit';

const ratios: JourneySplitRatio[] = ['rail', '6-5', '7-5', '5-7'];

export const example: WorkbenchExample = {
  id: 'L9',
  name: 'JourneySplit',
  description: 'Each ratio; columns stack under the md breakpoint.',
  render: () => (
    <Stack gap={4}>
      {ratios.map((r) => (
        <JourneySplit key={r} ratio={r} first={<Card as="div"><Text>{r}: first</Text></Card>} second={<Card as="div"><Text>{r}: second</Text></Card>} />
      ))}
    </Stack>
  ),
};

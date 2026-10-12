import type { WorkbenchExample } from '../../system/example';
import { queueFilters } from '../../domain/queue';
import { Stack } from '../primitives';
import { EmptyState } from '../composites/EmptyState';
import { DecisionQueue } from './DecisionQueue';

// Today's queue frame, canvas v24 board Today (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'D72',
  name: 'DecisionQueue',
  description: 'The queue frame with its kind filter, and the all-clear view when nothing waits.',
  render: () => (
    <Stack gap={4}>
      <DecisionQueue title="Needs you (example)" count={1} intro="One queue for every decision." filter={{ value: 'all', options: queueFilters, onChange: () => undefined }}>
        <li>One QueueItem goes here.</li>
      </DecisionQueue>
      <DecisionQueue title="All clear (example)" count={0} empty={<EmptyState level={3} title="All clear" body="Nothing needs you right now." />} />
    </Stack>
  ),
};

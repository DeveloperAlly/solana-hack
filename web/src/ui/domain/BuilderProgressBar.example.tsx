import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { BuilderProgressBar } from './BuilderProgressBar';

// Figures from canvas boards Onboard-3b-Profiling and Dashboard (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
export const example: WorkbenchExample = {
  id: 'P24',
  name: 'BuilderProgressBar',
  description: 'Single progress (reading sources) and a budget bar: spent, committed, remaining.',
  render: () => (
    <Stack gap={5}>
      <BuilderProgressBar label="Reading progress" segments={[{ value: 50, label: 'Read' }]} />
      <BuilderProgressBar
        label="Budget"
        segments={[{ value: 27, label: 'Spent' }, { value: 12, label: 'Committed', tone: 'muted' }]}
        caption="135 spent · 60 committed · 305 left of 500 USDC"
      />
    </Stack>
  ),
};

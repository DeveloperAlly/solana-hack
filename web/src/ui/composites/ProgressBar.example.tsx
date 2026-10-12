import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { ProgressBar } from './ProgressBar';

// Figures from canvas boards Onboard-3b-Profiling and Dashboard (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'P24',
  name: 'ProgressBar',
  description: 'Single progress, with a visible label, spent / committed / remaining with a caption, a threshold marker, small size, and decorative.',
  render: () => (
    <Stack gap={5}>
      <ProgressBar label="Reading progress" segments={[{ value: 50, label: 'Read' }]} />
      <ProgressBar label="Kit coverage: 70%" showLabel segments={[{ value: 70, label: 'Covered' }]} caption="12 of 17 sections have a draft" />
      <ProgressBar
        label="Budget"
        segments={[{ value: 27, label: 'Spent' }, { value: 12, label: 'Committed', tone: 'secondary' }]}
        caption="135 spent · 60 committed · 305 left of 500 USDC"
      />
      <ProgressBar label="Budget used" segments={[{ value: 85, label: 'Used' }]} marker={80} caption="Warns past 80%" />
      <ProgressBar label="Slots filled" size="sm" segments={[{ value: 30, label: 'Filled' }]} />
      <ProgressBar label="Kit completeness" decorative segments={[{ value: 70, label: 'Done' }]} caption="12 of 17 sections done" />
    </Stack>
  ),
};

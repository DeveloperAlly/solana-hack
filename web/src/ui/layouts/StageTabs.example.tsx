import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { StageTabs } from './StageTabs';

// The subnav of canvas v21 boards Brain and Grow-Home (config/nav.ts; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'L3',
  name: 'StageTabs',
  description: "A stage's tabs from config/nav.ts: Brand with The Brain current, and Grow's ten tabs on one scrolling row.",
  render: () => (
    <Stack gap={4}>
      <StageTabs stage="brand" current="brain" />
      <StageTabs stage="grow" current="overview" />
    </Stack>
  ),
};

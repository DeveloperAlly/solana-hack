import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { BudgetBar } from './BudgetBar';

// Figures from canvas boards Dashboard and Amb-2-Detail (sample amounts; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'D25',
  name: 'BudgetBar',
  description: 'Empty, ok (spent and committed), near cap (warns) and full with a custom caption.',
  render: () => (
    <Stack gap={5}>
      <BudgetBar budget={{ spent: 0, cap: 500, unit: 'USDC' }} />
      <BudgetBar budget={{ spent: 135, committed: 60, cap: 500, unit: 'USDC' }} />
      <BudgetBar budget={{ spent: 380, committed: 40, cap: 500, unit: 'USDC' }} />
      <BudgetBar budget={{ spent: 500, cap: 500, unit: 'USDC' }} caption="500 of 500 USDC paid out" />
    </Stack>
  ),
};

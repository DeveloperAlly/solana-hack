import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { AmbBudgetBar } from './AmbBudgetBar';
import { sampleBudget } from './ambSamples';

export const example: WorkbenchExample = {
  id: 'D25',
  name: 'AmbBudgetBar',
  description: 'Spent / committed / remaining against the cap: ok (Amb-2), near cap (warns under 20%), full (Amb-5d), empty.',
  render: () => (
    <Stack gap={5}>
      <AmbBudgetBar budget={sampleBudget} />
      <AmbBudgetBar budget={{ ...sampleBudget, spent: 380, committed: 40 }} />
      <AmbBudgetBar budget={{ spent: 500, cap: 500, unit: 'USDC' }} caption="500 of 500 USDC paid out" />
      <AmbBudgetBar budget={{ spent: 0, cap: 500, unit: 'USDC' }} />
    </Stack>
  ),
};

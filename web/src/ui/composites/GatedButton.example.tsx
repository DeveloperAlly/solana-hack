import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Button, Stack } from '../primitives';
import { GatedButton } from './GatedButton';

// Copy from canvas v21 Distribute-Adapt ("no platforms chosen (Schedule disabled)") and Event-Rating ("Register my rating").
function Live() {
  const [chosen, setChosen] = useState(0);
  const gate = chosen === 0 ? { blocking: true, label: 'Choose at least one platform.' } : { blocking: false, label: `${chosen} ready to schedule.` };
  return (
    <Stack direction="row" gap={3} wrap align="center">
      <Button variant="secondary" onClick={() => setChosen((n) => (n === 0 ? 3 : 0))}>{chosen === 0 ? 'Choose 3 platforms' : 'Clear platforms'}</Button>
      <GatedButton gate={gate} showPassLabel onClick={() => undefined}>Schedule {chosen}</GatedButton>
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'C36',
  name: 'GatedButton',
  description: 'An action and its one gate: blocked (disabled, reason shown), open, and open with the pass label.',
  render: () => (
    <Stack gap={4}>
      <GatedButton gate={{ blocking: true, label: 'Choose all five ratings first.' }}>Register my rating</GatedButton>
      <GatedButton gate={{ blocking: false, label: 'Ready.' }} variant="secondary">Approve</GatedButton>
      <Live />
    </Stack>
  ),
};

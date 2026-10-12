import type { WorkbenchExample } from '../../system/example';
import { useState } from 'react';
import { Stack } from '../primitives';
import { SoonSpendingCapField } from './SoonSpendingCapField';

function Demo() {
  const [cap, setCap] = useState('500');
  return (
    <Stack gap={5}>
      <SoonSpendingCapField value={cap} onChange={setCap} balance="[n]" />
      <SoonSpendingCapField value="500" onChange={() => {}} balance="[n]" overBalance />
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D31',
  name: 'SoonSpendingCapField',
  description: 'Default, then over the wallet balance (error).',
  render: () => <Demo />,
};

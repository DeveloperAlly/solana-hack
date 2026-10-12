import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { AmbSelect } from './AmbSelect';

function Demo() {
  const [sort, setSort] = useState('ending');
  const [format, setFormat] = useState('linkedin');
  return (
    <Stack gap={4}>
      <AmbSelect layout="inline" label="Sort" value={sort} onChange={setSort} options={[{ value: 'ending', label: 'Ending soonest' }, { value: 'payout', label: 'Highest payout' }]} />
      <AmbSelect label="Format" value={format} onChange={setFormat} options={[{ value: 'linkedin', label: 'LinkedIn post · 10 USDC' }, { value: 'tutorial', label: 'Tutorial · 50 USDC' }]} />
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'P13',
  name: 'AmbSelect',
  description: 'Native select: inline (the campaigns Sort, canvas Amb-1) and stacked (Format, Amb-3).',
  render: Demo,
};

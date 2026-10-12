import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Select } from './Select';
import { Stack } from './Stack';

// Option text from canvas boards BB-1-Basics, Kit-Export and Amb-1-Campaigns (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
function SortControl() {
  const [sort, setSort] = useState('closing');
  return (
    <Select
      label="Sort"
      layout="inline"
      value={sort}
      onValueChange={setSort}
      options={[{ value: 'closing', label: 'Closing soon' }, { value: 'payout', label: 'Highest payout' }, { value: 'new', label: 'Newest' }]}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'P13',
  name: 'Select',
  description: 'Stacked with string options and a hint, { value, label } options, error, disabled, and the inline sort layout.',
  render: () => (
    <Stack gap={5}>
      <Select label="Industry" hint="Pick the closest one." options={['Developer tools', 'Media', 'Gaming']} defaultValue="Developer tools" />
      <Select label="Kit version" options={[{ value: 'v2', label: 'v2 (approved)' }, { value: 'v1', label: 'v1 (registered)' }]} defaultValue="v2" />
      <Select label="Approval" error="Choose who approves posts." options={[{ value: '', label: 'Choose…' }, { value: 'you', label: 'You approve every piece' }]} defaultValue="" />
      <Select label="Region" disabled options={['Global']} />
      <SortControl />
    </Stack>
  ),
};

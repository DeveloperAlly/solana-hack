import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { VerifyToggleGroup } from './VerifyToggleGroup';

type Filter = 'all' | 'kit' | 'post';

export function VerifyToggleGroupDemo() {
  const [value, setValue] = useState<Filter>('all');
  return (
    <VerifyToggleGroup
      label="Filter by type"
      value={value}
      onChange={setValue}
      options={[
        { value: 'all', label: 'All' },
        { value: 'kit', label: 'Kits' },
        { value: 'post', label: 'Posts' },
      ]}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'C5',
  name: 'VerifyToggleGroup',
  description: 'Single-select toggle buttons (aria-pressed); the Ledger type filter and sort.',
  render: () => <VerifyToggleGroupDemo />,
};

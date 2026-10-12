import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { Menu } from './Menu';

function Demo() {
  const [last, setLast] = useState('none');
  return (
    <Stack direction="row" gap={4} align="center" wrap>
      <Menu trigger="Row actions" items={[{ id: 'edit', label: 'Edit' }, { id: 'dup', label: 'Duplicate' }, { id: 'del', label: 'Delete', disabled: true }]} onSelect={setLast} />
      <Text variant="small" tone="secondary">Last chosen: {last}</Text>
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'C16',
  name: 'Menu',
  description: 'Menu button with a disabled item; open it to see the items (arrows, Home, End, Escape).',
  render: () => <Demo />,
};

import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { TabNav, Tabs } from './Tabs';

function StateTabs() {
  const [v, setV] = useState('approval');
  return (
    <Tabs
      label="Content (example)"
      value={v}
      onChange={setV}
      items={[
        { id: 'approval', label: 'Needs approval', count: 6, panel: <Text>Six drafts wait for you.</Text> },
        { id: 'scheduled', label: 'Scheduled', count: 5, panel: <Text>Five posts are scheduled.</Text> },
        { id: 'posted', label: 'Posted', panel: <Text>Posted items.</Text> },
      ]}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'C4',
  name: 'Tabs',
  description: 'State driven with counts (arrow keys move), and link driven (TabNav).',
  render: () => (
    <Stack gap={5}>
      <StateTabs />
      <TabNav label="Settings (example)" value="ai" items={[{ id: 'ai', label: 'AI and keys', href: '/system' }, { id: 'conn', label: 'Connections', href: '/system' }, { id: 'plan', label: 'Plan', href: '/system' }]} />
    </Stack>
  ),
};

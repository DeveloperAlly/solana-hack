import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Box, Text } from '../primitives';
import { AppShell } from '../shells/AppShell';
import { BrandSwitcher } from './BrandSwitcher';
import { demoBrands } from './demoBrands';

function Demo() {
  const [id, setId] = useState('adna');
  return (
    <Box border="subtle" radius="box">
      <AppShell preview brandName={demoBrands.find((b) => b.id === id)?.name} brandSlot={<BrandSwitcher brands={demoBrands} currentId={id} onSelect={setId} onAdd={() => {}} />}>
        <Box padding={4}><Text>L1 AppShell with the brand switcher in its slot; the hub nav comes from routes.ts.</Text></Box>
      </AppShell>
    </Box>
  );
}

export const example: WorkbenchExample = {
  id: 'D48',
  name: 'BrandSwitcher (in the L1 AppShell slot)',
  description: 'The demo fixture brands; open the menu to switch or add a brand.',
  render: () => <Demo />,
};

import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { AmbChecksList } from './AmbChecksList';
import { sampleChecks } from './ambSamples';

function Demo() {
  const [open, setOpen] = useState([
    { ...sampleChecks[0], blocking: true },
    sampleChecks[1],
    { id: 'limit', title: 'Over the limit', label: 'Over the 3000-character limit by 12.', blocking: true },
  ]);
  const fix = (id: string) => setOpen((list) => list.filter((c) => c.id !== id));
  return (
    <Stack gap={5}>
      <AmbChecksList checks={open} onFix={fix} />
      <AmbChecksList compact checks={sampleChecks} onFix={() => undefined} />
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D3',
  name: 'AmbChecksList',
  description: 'Checks with their reason, a "Blocks publishing" badge where they block, and a one-click fix where there is one (canvas Amb-3); the compact mobile sheet list (M-3).',
  render: Demo,
};

import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { AmbChecksList } from './AmbChecksList';
import { sampleChecks } from './ambSamples';

function Demo() {
  const [open, setOpen] = useState(sampleChecks);
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
  description: 'Flags with one-click fixes (canvas Amb-3; fixing one removes it, then "No flags."), and the compact mobile sheet list (M-3).',
  render: Demo,
};

import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Button, Text } from '../primitives';
import { Sheet } from './Sheet';

// Content from canvas note n-m3 (mobile flags; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Show 3 flags</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="3 flags" footer={<Button onClick={() => setOpen(false)}>Apply all fixes</Button>}>
        <Text>Banned claim: &ldquo;[guaranteed returns]&rdquo;</Text>
      </Sheet>
    </>
  );
}

export const example: WorkbenchExample = {
  id: 'C18',
  name: 'Sheet',
  description: 'Closed with its opener; opens as a bottom sheet (narrow) or side panel (md and up) with a footer action.',
  render: () => <Demo />,
};

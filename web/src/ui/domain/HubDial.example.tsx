import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { HubDial } from './HubDial';

function Live() {
  const [v, setV] = useState(2);
  return <HubDial legend="Formality" start="Casual" end="Formal" value={v} onChange={setV} />;
}

export const example: WorkbenchExample = {
  id: 'C6',
  name: 'HubDial',
  description: 'Interactive 1–5 dial with end labels, and a locked (disabled) dial.',
  render: () => (
    <Stack gap={4}>
      <Live />
      <HubDial legend="Emoji, punctuation" start="None" end="Lots" value={1} onChange={() => undefined} disabled />
    </Stack>
  ),
};

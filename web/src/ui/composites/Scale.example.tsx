import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { Scale } from './Scale';

// Dimensions from canvas boards BB-6-Voice and Voice-Editor, and research 06 (voice model).
function Live({ layout }: { layout: 'inline' | 'stacked' }) {
  const [v, setV] = useState(2);
  return <Scale legend={layout === 'inline' ? 'Formality' : 'Energy'} startLabel={layout === 'inline' ? 'Casual' : 'Calm'} endLabel={layout === 'inline' ? 'Formal' : 'Hyped'} value={v} onChange={setV} layout={layout} />;
}

export const example: WorkbenchExample = {
  id: 'C6',
  name: 'Scale',
  description: 'Inline and stacked 1–5 scales, a 1–3 scale, and a locked (disabled) scale.',
  render: () => (
    <Stack gap={4}>
      <Live layout="inline" />
      <Live layout="stacked" />
      <Scale legend="Humour" startLabel="None" endLabel="Lots" value={2} steps={3} onChange={() => undefined} />
      <Scale legend="Emoji, punctuation" startLabel="None" endLabel="Lots" value={1} onChange={() => undefined} disabled />
    </Stack>
  ),
};

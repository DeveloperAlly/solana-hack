import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { JourneyPolishBar } from './JourneyPolishBar';

function Demo() {
  const [applied, setApplied] = useState<string[]>(['Shorten']);
  return <JourneyPolishBar actions={['Review', 'Shorten', 'Clarify', 'Beautify']} applied={applied} onApply={(a) => setApplied((x) => [...x, a])} onUndo={() => setApplied((x) => x.slice(0, -1))} />;
}

export const example: WorkbenchExample = {
  id: 'D6',
  name: 'JourneyPolishBar',
  description: 'Four actions; Shorten applied with Undo. Apply more, then undo them one by one.',
  render: () => <Demo />,
};

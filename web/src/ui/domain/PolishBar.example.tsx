import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { PolishBar } from './PolishBar';

// Actions from canvas boards Draft-Review, Draft-Review-PolishError (n-dr 1–2, n-dre) and J6-First-Post
// (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
const actions = [
  { id: 'review', label: 'Review' },
  { id: 'shorten', label: 'Shorten' },
  { id: 'clarify', label: 'Clarify' },
  { id: 'beautify', label: 'Beautify' },
];

function WithUndo() {
  const [applied, setApplied] = useState<string[]>(['shorten']);
  return <PolishBar actions={actions} applied={applied} onApply={(id) => setApplied((a) => [...a, id])} onUndo={() => setApplied((a) => a.slice(0, -1))} />;
}

function WithFailure() {
  const [accessible, setAccessible] = useState(true);
  return (
    <PolishBar
      actions={actions}
      applied={['review']}
      onApply={() => undefined}
      failure={{ id: 'beautify', reason: 'The model timed out. Your draft is unchanged.', onRetry: () => undefined, onDismiss: () => undefined }}
      accessibleMode={{ checked: accessible, onChange: setAccessible }}
      note="Every polish action is applied as a new version. Undo any of them from the history."
    />
  );
}

export const example: WorkbenchExample = {
  id: 'D6',
  name: 'PolishBar',
  description: 'Applied action pressed with Undo; a failed Beautify with Retry and Dismiss, accessible mode and a note; busy.',
  render: () => (
    <Stack gap={6}>
      <WithUndo />
      <WithFailure />
      <PolishBar actions={actions} applied={[]} onApply={() => undefined} busy />
    </Stack>
  ),
};

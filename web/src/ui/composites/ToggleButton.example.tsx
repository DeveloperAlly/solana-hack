import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { ToggleButton } from './ToggleButton';

// Labels from canvas notes n-a1 and n-a1b (closed and future campaigns; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
function Live() {
  const [on, setOn] = useState(false);
  return <ToggleButton pressed={on} onToggle={() => setOn((v) => !v)} label="Notify me" pressedLabel="We'll email you" context="about aDNA" />;
}

export const example: WorkbenchExample = {
  id: 'C34',
  name: 'ToggleButton',
  description: 'Off (interactive), on, and disabled.',
  render: () => (
    <Stack direction="row" gap={3} wrap>
      <Live />
      <ToggleButton pressed onToggle={() => undefined} label="Notify me" pressedLabel="We'll email you" context="about film.fun" />
      <ToggleButton pressed={false} disabled onToggle={() => undefined} label="Notify me" context="about GamersLab" />
    </Stack>
  ),
};

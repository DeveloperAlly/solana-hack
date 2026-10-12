import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { JourneyAddableToggles } from './JourneyAddableToggles';

// Alternatives from canvas board J4-Gaps-Voice (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #48).
function Demo() {
  const [options, setOptions] = useState(['Pressmaster', 'Google Pomelli', 'Canva Brand Kit']);
  const [selected, setSelected] = useState(['Pressmaster']);
  return (
    <JourneyAddableToggles
      label="Alternatives"
      options={options}
      selected={selected}
      onChange={setSelected}
      onAdd={(o) => { setOptions((x) => [...x, o]); setSelected((s) => [...s, o]); }}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'D87',
  name: 'JourneyAddableToggles',
  description: 'C5 ToggleGroup (multi) with + Add; the add field validates empty and duplicate names.',
  render: () => <Demo />,
};

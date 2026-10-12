import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { JourneyToggleChips } from './JourneyToggleChips';

// Alternatives from canvas board J4-Gaps-Voice (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #48).
function Demo() {
  const [options, setOptions] = useState(['Pressmaster', 'Google Pomelli', 'Canva Brand Kit']);
  const [selected, setSelected] = useState(['Pressmaster']);
  const toggle = (o: string) => setSelected((s) => (s.includes(o) ? s.filter((x) => x !== o) : [...s, o]));
  return <JourneyToggleChips label="Alternatives" options={options} selected={selected} onToggle={toggle} onAdd={(o) => { setOptions((x) => [...x, o]); setSelected((s) => [...s, o]); }} />;
}

export const example: WorkbenchExample = {
  id: 'C5',
  name: 'JourneyToggleChips',
  description: 'Multi-select chips with aria-pressed; + Add opens a validated field.',
  render: () => <Demo />,
};

import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { JourneyChoiceCards, type JourneyChoiceOption } from './JourneyChoiceCards';

// Paragraphs from canvas board J4-Gaps-Voice (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #48).
const options: JourneyChoiceOption[] = [
  { value: 'a', title: 'A', tag: 'Plainspoken', body: "You've already said who you are. On your site, in your docs, in old posts." },
  { value: 'b', title: 'B', tag: 'Candid founder', body: 'I built JamJam because every brand tool asked me questions my website already answered.' },
  { value: 'c', title: 'C', tag: 'Friendly', body: "Let's skip the blank form. Paste your site and we'll pull out what makes you, you." },
];

function Demo() {
  const [v, setV] = useState('b');
  return <JourneyChoiceCards legend="Which sounds most like you?" options={options} value={v} onChange={setV} />;
}

export const example: WorkbenchExample = {
  id: 'C7',
  name: 'JourneyChoiceCards',
  description: 'Radio cards; B selected; click or use arrow keys to change.',
  render: () => <Demo />,
};

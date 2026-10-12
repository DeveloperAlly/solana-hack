import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { BuilderChoiceCards } from './BuilderChoiceCards';

// Options from canvas board BB-1-Basics (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
const options = [
  { value: 'company', title: 'Company', meta: 'A product or organisation' },
  { value: 'person', title: 'Person', meta: 'A personal brand' },
  { value: 'founder', title: 'Founder-linked', meta: "A company plus its founder's profile" },
];

function Demo() {
  const [value, setValue] = useState('company');
  return <BuilderChoiceCards legend="Type" options={options} value={value} onChange={setValue} />;
}

export const example: WorkbenchExample = {
  id: 'C7',
  name: 'BuilderChoiceCards',
  description: 'Radio cards with title and meta; the checked card is outlined.',
  render: () => <Demo />,
};

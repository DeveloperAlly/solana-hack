import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { ChoiceCards } from './ChoiceCards';

// Options from canvas boards BB-1-Basics, BB-4-Alternatives and J4-Gaps-Voice (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
function Single() {
  const [v, setV] = useState('b');
  return (
    <ChoiceCards
      legend="Which sounds most like you?"
      legendSize="lg"
      value={v}
      onChange={setV}
      options={[
        { value: 'a', title: 'A', tag: 'Plainspoken', body: '[Sample] We ship docs your agents can read.' },
        { value: 'b', title: 'B', tag: 'Warm', body: '[Sample] Your agents deserve context, not guesswork.' },
        { value: 'c', title: 'C', tag: 'Technical', body: '[Sample] A typed context standard for agent repos.', disabled: true },
      ]}
    />
  );
}

function Multiple() {
  const [v, setV] = useState<string[]>(['x']);
  return (
    <ChoiceCards
      multiple
      layout="stack"
      legend="Where do you post?"
      value={v}
      onChange={setV}
      options={[
        { value: 'x', title: 'X', meta: 'Publishing coming soon' },
        { value: 'li', title: 'LinkedIn', meta: 'Publishing coming soon' },
      ]}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'C7',
  name: 'ChoiceCards',
  description: 'Radio mode with tags, a large legend and a disabled card; checkbox mode stacked with meta lines.',
  render: () => (
    <Stack gap={6}>
      <Single />
      <Multiple />
    </Stack>
  ),
};

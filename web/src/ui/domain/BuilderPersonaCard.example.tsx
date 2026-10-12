import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Grid, Text } from '../primitives';
import { BuilderPersonaCard, type Persona } from './BuilderPersonaCard';

// Placeholder persona from canvas board BB-5-Audience (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
const start: Persona[] = [{ id: 'p1', name: '[Persona 1 name]', job: '[job to be done]', pain: '[pain]', where: '[channels]' }];

function Demo() {
  const [personas, setPersonas] = useState(start);
  if (!personas.length) return <Text tone="secondary">No personas.</Text>;
  return (
    <Grid as="ul" min="sm" gap={4}>
      {personas.map((p) => (
        <BuilderPersonaCard key={p.id} persona={p} onChange={(n) => setPersonas((all) => all.map((x) => (x.id === n.id ? n : x)))} onRemove={(id) => setPersonas((all) => all.filter((x) => x.id !== id))} />
      ))}
    </Grid>
  );
}

export const example: WorkbenchExample = {
  id: 'D16',
  name: 'BuilderPersonaCard',
  description: 'Assumption persona with Edit, Remove and Mark validated.',
  render: () => <Demo />,
};

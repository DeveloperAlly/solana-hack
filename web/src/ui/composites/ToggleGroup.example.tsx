import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { ToggleGroup } from './ToggleGroup';

const channels = ['All', 'X', 'LinkedIn', 'Blog'].map((l) => ({ id: l.toLowerCase(), label: l }));

function Demo() {
  const [single, setSingle] = useState(['all']);
  const [multi, setMulti] = useState(['x', 'blog']);
  return (
    <Stack gap={3}>
      <ToggleGroup label="Filter by channel (single)" options={channels} value={single} onChange={setSingle} />
      <ToggleGroup label="Channels (multi)" options={channels.slice(1)} value={multi} onChange={setMulti} mode="multi" />
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'C5',
  name: 'ToggleGroup',
  description: 'Single select (filter) and multi select (channels).',
  render: () => <Demo />,
};

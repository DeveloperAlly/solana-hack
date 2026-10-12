import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { BuilderLinkAdder } from './BuilderLinkAdder';

function Demo() {
  const [links, setLinks] = useState<string[]>([]);
  return (
    <Stack gap={3}>
      <BuilderLinkAdder onAdd={(url) => setLinks((l) => [...l, url])} />
      <Text variant="small" tone="secondary">Added: {links.length ? links.join(', ') : 'none yet'}</Text>
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D12-add',
  name: 'BuilderLinkAdder',
  description: 'URL field with client-side check; an invalid address shows an inline error.',
  render: () => <Demo />,
};

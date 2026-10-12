import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Link } from '../primitives';
import { DistributePlatformPicker } from './DistributePlatformPicker';

// Options as canvas v21 Distribute-Adapt draws them; on a screen they come from config/platforms.ts.
const options = [
  { id: 'x', label: 'X', description: 'Coming soon' },
  { id: 'linkedin', label: 'LinkedIn', description: 'Coming soon' },
  { id: 'threads', label: 'Threads', description: 'Planned: copy and paste only' },
  { id: 'bluesky', label: 'Bluesky', description: 'Planned: copy and paste only' },
];

function Live() {
  const [value, setValue] = useState(['x', 'linkedin', 'threads']);
  return <DistributePlatformPicker legend="Platforms for this post" options={options} value={value} onChange={setValue} footer={<Link href="/system">All platforms</Link>} />;
}

export const example: WorkbenchExample = {
  id: 'D91',
  name: 'DistributePlatformPicker',
  description: 'Platforms for one post: three chosen (interactive); none chosen.',
  render: () => (
    <>
      <Live />
      <DistributePlatformPicker legend="Platforms for this draft" options={options} value={[]} onChange={() => undefined} />
    </>
  ),
};

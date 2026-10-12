import type { WorkbenchExample } from '../../system/example';
import { Badge, Link, Text } from '../primitives';
import { BuilderShell } from './BuilderShell';

export const example: WorkbenchExample = {
  id: 'L6-shell',
  name: 'BuilderShell',
  description: 'Brand Builder frame: logo, context line, Unverified flag and "Save and finish later".',
  render: () => (
    <BuilderShell context="Build your brand: JamJam" flags={<Badge>Unverified</Badge>} action={<Link href="/system">Save and finish later</Link>}>
      <Text>Wizard body.</Text>
    </BuilderShell>
  ),
};

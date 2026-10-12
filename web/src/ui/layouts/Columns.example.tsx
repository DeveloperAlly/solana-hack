import type { ReactNode } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Box, Stack, Text } from '../primitives';
import { Columns } from './Columns';

function Pane({ children }: { children: ReactNode }) {
  return <Box padding={3} background="subtle"><Text variant="small">{children}</Text></Box>;
}

export const example: WorkbenchExample = {
  id: 'L9',
  name: 'Columns',
  description: 'Main + aside, rail + main, fluid rail + main + aside (editor), and rail + main + equal pane (inbox). Stacks below lg.',
  render: () => (
    <Stack gap={5}>
      <Columns end={<Pane>Aside</Pane>}><Pane>Main</Pane></Columns>
      <Columns start={<Pane>Rail (table of contents)</Pane>}><Pane>Main</Pane></Columns>
      <Columns start={<Pane>Fluid rail</Pane>} startWidth="fluid" end={<Pane>Checks</Pane>} gap={6}><Pane>Editor</Pane></Columns>
      <Columns start={<Pane>Rail</Pane>} end={<Pane>Reading pane</Pane>} endWidth="equal"><Pane>List</Pane></Columns>
    </Stack>
  ),
};

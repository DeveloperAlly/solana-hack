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
  description: 'Main + aside, rail + main, fluid rail + main + aside (editor), rail + list + equal pane (inbox), and a Journey 7-5 split stacking below md.',
  render: () => (
    <Stack gap={5}>
      <Columns end={<Pane>Aside</Pane>}><Pane>Main</Pane></Columns>
      <Columns start={<Pane>Rail (table of contents)</Pane>}><Pane>Main</Pane></Columns>
      <Columns start={<Pane>Fluid rail</Pane>} startWidth="fluid" end={<Pane>Checks</Pane>} gap={6}><Pane>Editor</Pane></Columns>
      <Columns start={<Pane>Rail</Pane>} end={<Pane>Reading pane</Pane>} ratio="1-1"><Pane>List</Pane></Columns>
      <Columns end={<Pane>Preview (5)</Pane>} ratio="7-5" stackBelow="md"><Pane>Draft (7)</Pane></Columns>
    </Stack>
  ),
};

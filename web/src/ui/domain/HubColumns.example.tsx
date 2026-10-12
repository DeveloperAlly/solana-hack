import type { WorkbenchExample } from '../../system/example';
import { Box, Stack, Text } from '../primitives';
import { HubColumns } from './HubColumns';

const Pane = ({ label }: { label: string }) => <Box padding={3} border="subtle" radius="box"><Text variant="small">{label}</Text></Box>;

export const example: WorkbenchExample = {
  id: 'L9',
  name: 'HubColumns',
  description: 'Main with aside, rail with main and reading pane; one column on narrow screens.',
  render: () => (
    <Stack gap={4}>
      <HubColumns end={<Pane label="Aside" />}><Pane label="Main" /></HubColumns>
      <HubColumns start={<Pane label="Rail" />} end={<Pane label="Reading pane" />} endWidth="equal"><Pane label="List" /></HubColumns>
    </Stack>
  ),
};

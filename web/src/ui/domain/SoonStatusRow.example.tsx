import type { WorkbenchExample } from '../../system/example';
import { Button } from '../primitives';
import { SoonStatusList } from './SoonStatusList';
import { SoonStatusRow } from './SoonStatusRow';

export const example: WorkbenchExample = {
  id: 'D52',
  name: 'SoonStatusRow',
  description: 'Rows with a status chip and actions; the second row is selected.',
  render: () => (
    <SoonStatusList label="Publishing connections">
      <SoonStatusRow name="LinkedIn" detail="post as you" status={{ label: 'Not connected' }} actions={<Button variant="secondary">Connect</Button>} />
      <SoonStatusRow name="X" detail="post as the brand" status={{ label: 'Expired', tone: 'warning' }} selected actions={<Button variant="secondary">Reconnect</Button>} />
    </SoonStatusList>
  ),
};

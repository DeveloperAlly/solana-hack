import type { WorkbenchExample } from '../../system/example';
import { Badge, Button } from '../primitives';
import { List, ListRow } from './ListRow';

// Rows from canvas boards Settings: brands, Onboard-3b-Profiling, Ingest-Error and Inbox-All (sample data;
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'C31',
  name: 'ListRow',
  description: 'Name, detail, status and actions; selected; selectable and unread with lead and aside; muted (waiting); failed (announced).',
  render: () => (
    <List label="Example rows">
      <ListRow title="JamJam" detail="jamjam.tech · kit v1" status={{ label: 'Official', tone: 'solid' }} actions={<Button variant="secondary">Open</Button>} selected />
      <ListRow title="aDNA" detail="adna.network" status={{ label: 'Unverified' }} actions={<Button variant="secondary">Open</Button>} />
      <ListRow lead={<Badge>X</Badge>} title="[handle]: Does it work with [agent tool]?" aside={<span>14 min ago</span>} unread onSelect={() => undefined} />
      <ListRow title="docs.example.com/guide" status={{ label: 'From step 1' }} tone="muted" />
      <ListRow title="example.com/blocked" detail="The site blocked our reader. Upload a PDF instead." status={{ label: 'Failed', tone: 'solid' }} tone="failed" actions={<><Button variant="secondary">Retry</Button><Button variant="secondary">Skip</Button></>} />
    </List>
  ),
};

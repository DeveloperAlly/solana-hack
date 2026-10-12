import type { WorkbenchExample } from '../../system/example';
import { Badge, Button, Stack } from '../primitives';
import { PageHeader } from './PageHeader';

// Copy from canvas boards Settings: AI model and Quests ("Coming soon" page; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'L5',
  name: 'PageHeader',
  description: 'Title only; title with a flag, intro and meta line; and back link, status badge and actions (level 4 inside the workbench).',
  render: () => (
    <Stack gap={6}>
      <PageHeader title="Ledger" level={4} />
      <PageHeader
        title="Quests"
        level={4}
        badges={<Badge>Coming soon</Badge>}
        intro="Paid tasks for your community, with USDC rewards."
        meta="Drawn, not built. Defined in: canvas page Coming soon"
      />
      <PageHeader
        title="AI model"
        level={4}
        size="xl"
        back={{ href: '/system', label: 'Settings' }}
        badges={<Badge tone="solid">Default model</Badge>}
        actions={<Button variant="secondary">Test key</Button>}
      />
    </Stack>
  ),
};

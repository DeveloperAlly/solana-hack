import type { WorkbenchExample } from '../../system/example';
import { HubSideNav } from './HubSideNav';
import { CoverageBadge } from './CoverageBadge';

export const example: WorkbenchExample = {
  id: 'L7',
  name: 'HubSideNav',
  description: 'Links with counts (current page), titled filter buttons, and a table of contents with badges.',
  render: () => (
    <HubSideNav
      label="Example rail"
      current="all"
      sections={[
        { items: [{ id: 'all', label: 'All inboxes', count: 37, href: '/system' }, { id: 'needs', label: 'Needs reply', count: 6, href: '/system' }] },
        { title: 'Sources', items: [{ id: 'tg', label: 'Telegram', count: 12 }, { id: 'wa', label: 'WhatsApp Business', count: 5 }] },
        { title: 'Kit', items: [{ id: 's1', label: '1 Identity', href: '#s1', badge: <CoverageBadge status="evidenced" /> }] },
      ]}
    />
  ),
};

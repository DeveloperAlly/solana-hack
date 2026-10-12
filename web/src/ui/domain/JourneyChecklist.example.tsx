import type { WorkbenchExample } from '../../system/example';
import { screenPath } from '../../gallery/screenPath';
import { JourneyChecklist } from './JourneyChecklist';

// Items from canvas board J8-Hub-FirstRun (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #48).
export const example: WorkbenchExample = {
  id: 'D86',
  name: 'JourneyChecklist',
  description: 'Two done, two open with Start links.',
  render: () => (
    <JourneyChecklist
      title="Get set up"
      items={[
        { id: 'kit', label: 'Kit v1 approved and registered', hint: '', done: true },
        { id: 'post', label: 'First post official', hint: '', done: true },
        { id: 'sources', label: 'Add 2 more sources', hint: 'raises readiness, fewer questions later', done: false, href: screenPath('J1-Read') },
        { id: 'invite', label: 'Invite a teammate or partner', hint: 'coming soon', done: false, href: screenPath('Ledger') },
      ]}
    />
  ),
};

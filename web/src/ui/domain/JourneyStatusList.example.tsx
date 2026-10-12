import type { WorkbenchExample } from '../../system/example';
import { ExampleGrid } from '../../system/ExampleLayout';
import { JourneyStatusList } from './JourneyStatusList';

// Rows from canvas boards J1-Read and J8-Hub-FirstRun (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #48).
export const example: WorkbenchExample = {
  id: 'D12',
  name: 'JourneyStatusList',
  description: 'Status chips (solid and neutral) and link rows.',
  render: () => (
    <ExampleGrid>
      <JourneyStatusList
        title="Sources"
        rows={[
          { label: 'jamjam.tech', value: 'Read · 4 facts', solid: true },
          { label: '/how-it-works', value: 'Reading…' },
          { label: 'docs.example.com', value: 'Blocked', solid: true },
        ]}
      />
      <JourneyStatusList title="Your public record" rows={[{ label: 'Kit v1', value: 'Registered', href: '/screens/Ledger' }]} />
    </ExampleGrid>
  ),
};

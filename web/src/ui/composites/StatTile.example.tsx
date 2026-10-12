import type { WorkbenchExample } from '../../system/example';
import { ExampleGrid } from '../../system/ExampleLayout';
import { StatTile } from './StatTile';

export const example: WorkbenchExample = {
  id: 'C12',
  name: 'StatTile',
  description: 'Plain, as a link, sample data, and loading.',
  render: () => (
    <ExampleGrid>
      <StatTile label="Kit versions" value="1" />
      <StatTile label="Drafts awaiting you" value="6" sub="all passed slop check" href="/system" />
      <StatTile label="Replies drafted" value="4" sub="X 2 · LinkedIn 1" sample />
      <StatTile label="Posts registered" value="" loading />
    </ExampleGrid>
  ),
};

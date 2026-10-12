import type { WorkbenchExample } from '../../system/example';
import { BuilderCoverageMap, type CoverageRow } from './BuilderCoverageMap';

// First three rows of canvas board Coverage-Map (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50). Sample data.
const rows: CoverageRow[] = [
  { section: 'Identity', cells: [{ state: 'inferred', action: 'Confirm draft' }, { state: 'evidenced', action: 'Confirm only' }] },
  { section: 'Purpose', gate: 'Gate 1', cells: [{ state: 'inferred', action: 'Confirm draft' }, { state: 'evidenced', action: 'Confirm only' }] },
  { section: 'Beliefs / POV', cells: [{ state: 'missing', action: 'Ask: step 2' }, { state: 'inferred', action: 'Confirm draft' }] },
];

export const example: WorkbenchExample = {
  id: 'D13',
  name: 'BuilderCoverageMap',
  description: 'Compare variant: two brands side by side with counted totals.',
  render: () => <BuilderCoverageMap caption="Coverage by section. JamJam: zero public presence. film.fun: public site and posts." brands={['JamJam', 'film.fun']} rows={rows} />,
};

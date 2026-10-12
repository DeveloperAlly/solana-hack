import { platformStatuses } from '../../../config/platforms';
import { Field, Stack } from '../../../ui/primitives';
import { ToggleGroup } from '../../../ui/composites/ToggleGroup';
import type { PlatformFilter } from '../types';

const options = [{ id: 'all', label: 'All' }, ...platformStatuses.map((s) => ({ id: s.id, label: s.label }))];

export interface GrowthPlatformControlsProps {
  filter: PlatformFilter;
  onFilter: (f: PlatformFilter) => void;
  query: string;
  onQuery: (q: string) => void;
  /** How many platforms match, announced politely. */
  count: number;
}

/** The catalog's status filter (All, Live, Coming soon, Planned), its search box and the match count. */
export function GrowthPlatformControls({ filter, onFilter, query, onQuery, count }: GrowthPlatformControlsProps) {
  return (
    <Stack gap={3}>
      <Stack direction="row" gap={4} wrap align="end" justify="between">
        <ToggleGroup label="Filter by status" options={options} value={[filter]} onChange={([id]) => onFilter(id as PlatformFilter)} />
        <Field label="Search platforms" type="search" value={query} onChange={(e) => onQuery(e.target.value)} />
      </Stack>
      <p role="status" className="wl-visually-hidden">{count === 1 ? '1 platform' : `${count} platforms`}</p>
    </Stack>
  );
}

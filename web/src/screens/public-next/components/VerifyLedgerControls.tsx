import { Stack } from '../../../ui/primitives';
import { ToggleGroup } from '../../../ui/composites/ToggleGroup';
import type { LedgerFilter, LedgerSort } from '../types';

const filterOptions: { id: LedgerFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'kit', label: 'Kits' },
  { id: 'post', label: 'Posts' },
];
const sortOptions: { id: LedgerSort; label: string }[] = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
];

export interface VerifyLedgerControlsProps {
  filter: LedgerFilter;
  onFilter: (f: LedgerFilter) => void;
  sort: LedgerSort;
  onSort: (s: LedgerSort) => void;
}

/** Ledger type filter (canvas: All / Kits / Posts) and date order, as two C5 ToggleGroups. */
export function VerifyLedgerControls({ filter, onFilter, sort, onSort }: VerifyLedgerControlsProps) {
  return (
    <Stack direction="row" gap={6} justify="between" wrap>
      <ToggleGroup label="Filter by type" options={filterOptions} value={[filter]} onChange={(v) => onFilter(v[0] as LedgerFilter)} />
      <ToggleGroup label="Sort by date" options={sortOptions} value={[sort]} onChange={(v) => onSort(v[0] as LedgerSort)} />
    </Stack>
  );
}

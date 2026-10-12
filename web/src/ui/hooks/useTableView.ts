import { useMemo, useState } from 'react';

export type SortDirection = 'ascending' | 'descending';
export interface SortState { key: string; direction: SortDirection }

export interface TableViewOptions<Row> {
  rows: Row[];
  /** Compare functions by column key; only these columns sort. */
  comparators: Record<string, (a: Row, b: Row) => number>;
  initialSort?: SortState;
  /** Filter predicate for the selected filter option; null or the "all" option keeps every row. */
  match?: (row: Row, option: string) => boolean;
  initialFilter?: string;
  allOption?: string;
}

/** Sort and filter state for C10 DataTable, kept out of the table's markup. */
export function useTableView<Row>({ rows, comparators, initialSort, match, initialFilter, allOption = 'all' }: TableViewOptions<Row>) {
  const [sort, setSort] = useState<SortState | undefined>(initialSort);
  const [filter, setFilter] = useState<string>(initialFilter ?? allOption);

  const view = useMemo(() => {
    const kept = match && filter !== allOption ? rows.filter((r) => match(r, filter)) : rows;
    const cmp = sort && comparators[sort.key];
    if (!cmp || !sort) return kept;
    const sorted = [...kept].sort(cmp);
    return sort.direction === 'descending' ? sorted.reverse() : sorted;
  }, [rows, comparators, sort, match, filter, allOption]);

  /** Sorts by a column: ascending first, then toggles direction. */
  function sortBy(key: string) {
    setSort((s) => ({ key, direction: s?.key === key && s.direction === 'ascending' ? 'descending' : 'ascending' }));
  }

  return { view, sort, sortBy, filter, setFilter };
}

import { Field, Select } from '../primitives';
import type { SelectOption } from '../primitives/Select';
import styles from './EventBoardFilters.module.css';

export interface EventBoardFiltersProps {
  query: string;
  onQuery: (q: string) => void;
  sort: string;
  sortOptions: SelectOption[];
  onSort: (s: string) => void;
  kind: string;
  kindOptions: SelectOption[];
  onKind: (k: string) => void;
  /** How many events match, announced as it changes. */
  count: number;
}

/**
 * D104 EventBoardFilters: search, sort and kind for the public events board (canvas v21 Events-Board). The match count
 * is announced politely. States: all, filtered, no match (the screen shows its empty view).
 */
export function EventBoardFilters({ query, onQuery, sort, sortOptions, onSort, kind, kindOptions, onKind, count }: EventBoardFiltersProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.search}>
        <Field label="Search events" type="search" placeholder="Event, city or organiser" value={query} onChange={(e) => onQuery(e.target.value)} />
      </div>
      <Select label="Sort" options={sortOptions} value={sort} onValueChange={onSort} />
      <Select label="Kind" options={kindOptions} value={kind} onValueChange={onKind} />
      <p className={styles.count} role="status">{count} {count === 1 ? 'event' : 'events'}</p>
    </div>
  );
}

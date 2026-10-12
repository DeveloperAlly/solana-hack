import type { SortDirection } from '../hooks/useTableView';
import styles from './DataTable.module.css';

export interface SortHeaderProps {
  label: string;
  /** Current direction when this column is the sort column. */
  direction?: SortDirection;
  onSort: () => void;
  align?: 'start' | 'end';
}

/**
 * A sortable column header: th with aria-sort and a button inside (WAI-ARIA APG sortable table example:
 * https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/).
 */
export function SortHeader({ label, direction, onSort, align }: SortHeaderProps) {
  const arrow = direction === 'ascending' ? '▲' : direction === 'descending' ? '▼' : '↕';
  return (
    <th scope="col" aria-sort={direction ?? 'none'} className={align === 'end' ? styles.end : undefined}>
      <button type="button" className={styles.sort} onClick={onSort}>
        {label}
        <span aria-hidden="true" className={styles.arrow}>{arrow}</span>
      </button>
    </th>
  );
}

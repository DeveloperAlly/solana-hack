import { useMemo, type ReactNode } from 'react';
import { Text } from '../primitives/Text';
import { useTableView, type SortState } from '../hooks/useTableView';
import { SortHeader } from './SortHeader';
import { ToggleGroup, type ToggleOption } from './ToggleGroup';
import styles from './DataTable.module.css';

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  /** Cell content; defaults to String(row[key]). */
  cell?: (row: Row) => ReactNode;
  /** Render this column's cells as row headers (th scope="row"). Use for the column that names the row. */
  rowHeader?: boolean;
  align?: 'start' | 'end';
  /** Makes the column sortable (header button, aria-sort); compares two rows ascending. */
  sort?: (a: Row, b: Row) => number;
}

export interface DataTableFilter<Row> {
  /** Accessible name of the filter group, e.g. "Filter by type". */
  label: string;
  /** The first option should be the "all" option (id "all"). */
  options: ToggleOption[];
  match: (row: Row, optionId: string) => boolean;
  initial?: string;
}

export type DataTableState = 'ready' | 'loading' | 'error';

export interface DataTableProps<Row> {
  /** Visible caption; names the table for assistive tech. */
  caption: string;
  /** Hide the caption visually but keep it for screen readers. */
  hideCaption?: boolean;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Per-row actions, rendered in a last column. */
  actions?: (row: Row) => ReactNode;
  state?: DataTableState;
  /** Shown in place of rows when there are none (C3 EmptyState or a sentence). */
  empty?: ReactNode;
  /** Shown in place of rows when state is error. */
  error?: ReactNode;
  /** Header stays visible while the rows scroll inside a box of bounded height (token layout.table.maxHeight). */
  stickyHeader?: boolean;
  /** Filter chips above the table (C5 ToggleGroup, single select). */
  filter?: DataTableFilter<Row>;
  initialSort?: SortState;
}

/**
 * C10 DataTable: column config, a scrollable box for narrow screens, row actions, a sticky header, sortable columns
 * and filter chips. States: ready, empty (no rows), loading (skeleton rows, aria-busy), error.
 */
export function DataTable<Row>({ caption, hideCaption, columns, rows, rowKey, actions, state = 'ready', empty, error, stickyHeader, filter, initialSort }: DataTableProps<Row>) {
  const comparators = useMemo(() => Object.fromEntries(columns.filter((c) => c.sort).map((c) => [c.key, c.sort!])), [columns]);
  const { view, sort, sortBy, filter: selected, setFilter } = useTableView({ rows, comparators, initialSort, match: filter?.match, initialFilter: filter?.initial });
  const colCount = columns.length + (actions ? 1 : 0);
  const message = (content: ReactNode) => (
    <tr>
      <td colSpan={colCount} className={styles.message}>{content}</td>
    </tr>
  );
  const body =
    state === 'loading'
      ? [0, 1, 2].map((i) => (
          <tr key={i} aria-hidden="true">
            {Array.from({ length: colCount }, (_, j) => <td key={j}><span className={styles.skeleton} /></td>)}
          </tr>
        ))
      : state === 'error'
        ? message(error ?? <Text tone="danger">Could not load these rows.</Text>)
        : view.length === 0
          ? message(empty ?? <Text tone="secondary">Nothing here yet.</Text>)
          : view.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => {
                  const content = c.cell ? c.cell(row) : String((row as Record<string, unknown>)[c.key] ?? '');
                  const cls = c.align === 'end' ? styles.end : undefined;
                  return c.rowHeader
                    ? <th key={c.key} scope="row" className={[styles.rowHeader, cls].filter(Boolean).join(' ')}>{content}</th>
                    : <td key={c.key} className={cls}>{content}</td>;
                })}
                {actions && <td className={styles.actions}>{actions(row)}</td>}
              </tr>
            ));

  return (
    <div className={styles.root}>
      {filter && <ToggleGroup label={filter.label} options={filter.options} value={[selected]} onChange={(v) => setFilter(v[0])} />}
      {/* The scroll box is focusable so keyboard users can scroll a wide table (axe scrollable-region-focusable). */}
      <div className={[styles.scroll, stickyHeader && styles.scrollSticky].filter(Boolean).join(' ')} tabIndex={0} role="region" aria-label={caption}>
        <table className={[styles.table, stickyHeader && styles.sticky].filter(Boolean).join(' ')} aria-busy={state === 'loading' || undefined}>
          <caption className={hideCaption ? 'wl-visually-hidden' : styles.caption}>{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) =>
                c.sort ? (
                  <SortHeader key={c.key} label={c.header} align={c.align} direction={sort?.key === c.key ? sort.direction : undefined} onSort={() => sortBy(c.key)} />
                ) : (
                  <th key={c.key} scope="col" className={c.align === 'end' ? styles.end : undefined}>{c.header}</th>
                ),
              )}
              {actions && <th scope="col"><span className="wl-visually-hidden">Actions</span></th>}
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
        {state === 'loading' && <span className="wl-visually-hidden" role="status">Loading</span>}
      </div>
    </div>
  );
}

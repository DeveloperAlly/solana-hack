import type { ReactNode } from 'react';
import { Text } from '../primitives/Text';
import styles from './DataTable.module.css';

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  /** Cell content; defaults to String(row[key]). */
  cell?: (row: Row) => ReactNode;
  /** Render this column's cells as row headers (th scope="row"). Use for the column that names the row. */
  rowHeader?: boolean;
  align?: 'start' | 'end';
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
  stickyHeader?: boolean;
}

/**
 * C10 DataTable: column config, a scrollable box for narrow screens, row actions and a sticky header.
 * States: ready, empty (no rows), loading (skeleton rows, aria-busy), error.
 */
export function DataTable<Row>({ caption, hideCaption, columns, rows, rowKey, actions, state = 'ready', empty, error, stickyHeader }: DataTableProps<Row>) {
  const colCount = columns.length + (actions ? 1 : 0);
  const message = (content: ReactNode) => (
    <tr>
      <td colSpan={colCount} className={styles.message}>{content}</td>
    </tr>
  );
  return (
    // The scroll box is focusable so keyboard users can scroll a wide table (axe scrollable-region-focusable).
    <div className={styles.scroll} tabIndex={0} role="region" aria-label={caption}>
      <table className={[styles.table, stickyHeader && styles.sticky].filter(Boolean).join(' ')} aria-busy={state === 'loading' || undefined}>
        <caption className={hideCaption ? 'wl-visually-hidden' : styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={c.align === 'end' ? styles.end : undefined}>{c.header}</th>
            ))}
            {actions && <th scope="col"><span className="wl-visually-hidden">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {state === 'loading'
            ? [0, 1, 2].map((i) => (
                <tr key={i} aria-hidden="true">
                  {Array.from({ length: colCount }, (_, j) => <td key={j}><span className={styles.skeleton} /></td>)}
                </tr>
              ))
            : state === 'error'
              ? message(error ?? <Text tone="danger">Could not load these rows.</Text>)
              : rows.length === 0
                ? message(empty ?? <Text tone="secondary">Nothing here yet.</Text>)
                : rows.map((row) => (
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
                  ))}
        </tbody>
      </table>
      {state === 'loading' && <span className="wl-visually-hidden" role="status">Loading</span>}
    </div>
  );
}

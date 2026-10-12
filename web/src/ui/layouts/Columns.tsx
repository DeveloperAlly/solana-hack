import type { ReactNode } from 'react';
import styles from './Columns.module.css';

export interface ColumnsProps {
  /** Leading column: a side nav, table of contents or editor rail. */
  start?: ReactNode;
  /** The main column. */
  children: ReactNode;
  /** Trailing column: an aside, a checks rail or a reading pane. */
  end?: ReactNode;
  /** `rail` (default): the fixed rail width token. `fluid`: half the main column (an editor's left rail). */
  startWidth?: 'rail' | 'fluid';
  /** `aside` (default): half the main column. `equal`: as wide as the main column (a reading pane). */
  endWidth?: 'aside' | 'equal';
  /** Gap between columns, in space steps (default 5). */
  gap?: 5 | 6;
}

/**
 * L9 Columns (TwoColumn and its three-column forms): start | main | end, side by side from the lg breakpoint and
 * stacked in source order (start, main, end) on narrow screens. Covers main + aside (campaign detail, Draft-Review),
 * rail + main (Brand-Build TOC), rail + main + rail (the ambassador editor) and three panes (Inbox-All).
 * Replaces HubColumns and AmbColumns (issue #46, shared consolidation).
 */
export function Columns({ start, children, end, startWidth = 'rail', endWidth = 'aside', gap = 5 }: ColumnsProps) {
  const cls = [
    styles.cols,
    styles[`gap${gap}`],
    start !== undefined && styles[`start-${startWidth}`],
    end !== undefined && styles[`end-${endWidth}`],
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      {start !== undefined && <div className={styles.col}>{start}</div>}
      <div className={styles.col}>{children}</div>
      {end !== undefined && <div className={styles.col}>{end}</div>}
    </div>
  );
}

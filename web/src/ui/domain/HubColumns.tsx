import type { ReactNode } from 'react';
import styles from './HubColumns.module.css';

export interface HubColumnsProps {
  /** Left column at rail width: a side nav or table of contents. */
  start?: ReactNode;
  /** The main column. */
  children: ReactNode;
  /** Right column: an aside (narrow) or a reading pane (as wide as the main column). */
  end?: ReactNode;
  endWidth?: 'aside' | 'equal';
}

/**
 * L9 hub columns: rail | main | aside layouts from the Superhub artboards (Inbox-All three panes, Brand-Build TOC,
 * Content-Dashboard calendar rail, Draft-Review checks). Stacks to one column on narrow screens, start first.
 */
export function HubColumns({ start, children, end, endWidth = 'aside' }: HubColumnsProps) {
  const cls = [styles.cols, start !== undefined && styles.hasStart, end !== undefined && styles[endWidth]].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {start !== undefined && <div className={styles.start}>{start}</div>}
      <div className={styles.main}>{children}</div>
      {end !== undefined && <div className={styles.end}>{end}</div>}
    </div>
  );
}

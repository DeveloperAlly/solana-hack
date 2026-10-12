import type { ReactNode } from 'react';
import styles from './Columns.module.css';

/** Main column : end column, as canvas fractions. `2-1` main + aside; `1-1` equal panes; `7-5`, `6-5`, `5-7` the Journey splits. */
export type ColumnsRatio = '2-1' | '1-1' | '7-5' | '6-5' | '5-7';

export interface ColumnsProps {
  /** Leading column: a side nav, table of contents or editor rail. */
  start?: ReactNode;
  /** The main column. */
  children: ReactNode;
  /** Trailing column: an aside, a checks rail or a reading pane. */
  end?: ReactNode;
  /** `rail` (default): the fixed rail width token. `fluid`: half the main column at 2-1 (an editor's left rail). */
  startWidth?: 'rail' | 'fluid';
  /** Main : end proportions (default `2-1`). */
  ratio?: ColumnsRatio;
  /** Gap between columns, in space steps (default 5). */
  gap?: 5 | 6 | 7;
  /** Breakpoint under which the columns stack in source order (default `lg`; the Journey boards use `md`). */
  stackBelow?: 'md' | 'lg';
}

/**
 * L9 Columns (TwoColumn and its three-column forms): start | main | end, side by side from a breakpoint and stacked in
 * source order (start, main, end) below it. Covers main + aside (campaign detail, Draft-Review), rail + main (Brand-Build
 * TOC, J1-Read), rail + main + rail (the ambassador editor), three panes (Inbox-All) and the Journey splits.
 * Replaces HubColumns, AmbColumns and JourneySplit (issue #46, shared consolidation).
 */
/** A slot renders something: not undefined, null, a boolean (from `cond && <X />`) or an empty string. Zero counts. */
function renders(node: ReactNode): boolean {
  return node !== undefined && node !== null && typeof node !== 'boolean' && node !== '';
}

export function Columns({ start, children, end, startWidth = 'rail', ratio = '2-1', gap = 5, stackBelow = 'lg' }: ColumnsProps) {
  // Empty slots add no column, so a conditional rail (`start={show && <Rail />}`) never reserves its width.
  const hasStart = renders(start);
  const hasEnd = renders(end);
  const cls = [
    styles.cols,
    styles[stackBelow],
    styles[`gap${gap}`],
    styles[`r${ratio}`],
    hasStart && styles.hasStart,
    hasStart && styles[`start-${startWidth}`],
    hasEnd && styles.hasEnd,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      {hasStart && <div className={styles.col}>{start}</div>}
      <div className={styles.col}>{children}</div>
      {hasEnd && <div className={styles.col}>{end}</div>}
    </div>
  );
}

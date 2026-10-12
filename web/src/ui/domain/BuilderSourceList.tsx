import type { ReactNode } from 'react';
import { Badge } from '../primitives/Badge';
import styles from './BuilderSourceList.module.css';

export type SourceRowTone = 'done' | 'active' | 'waiting' | 'failed';

export interface SourceRow {
  id: string;
  /** Link, file name or account name. */
  name: string;
  /** Status chip text, e.g. "Done · 2 facts found", "Reading…", "From step 1". */
  status: string;
  tone: SourceRowTone;
  /** Plain reason, shown under the name on a failed row. */
  error?: string;
}

export interface BuilderSourceListProps {
  /** Accessible name of the list. */
  label: string;
  rows: SourceRow[];
  /** Per-row actions (Remove, Retry, Skip, Connect for publishing). */
  actions?: (row: SourceRow) => ReactNode;
}

// Solid chip for work in progress and failures (canvas "chipd"), outline otherwise.
const solid: ReadonlySet<SourceRowTone> = new Set(['active', 'failed']);

/**
 * D12 SourceList: rows of source, status chip and actions; a failed row shows its reason and is announced.
 * Canvas boards Onboard-3-Sources, Onboard-3b-Profiling and Ingest-Error.
 */
export function BuilderSourceList({ label, rows, actions }: BuilderSourceListProps) {
  return (
    <ul className={styles.list} aria-label={label}>
      {rows.map((r) => (
        <li key={r.id} className={[styles.row, styles[r.tone]].join(' ')}>
          <span className={styles.name} role={r.tone === 'failed' ? 'alert' : undefined}>
            {r.tone === 'failed' ? <strong>{r.name}</strong> : r.name}
            {r.error && <span className={styles.error}>{r.error}</span>}
          </span>
          <Badge tone={solid.has(r.tone) ? 'solid' : 'neutral'}>{r.status}</Badge>
          {actions && <span className={styles.actions}>{actions(r)}</span>}
        </li>
      ))}
    </ul>
  );
}

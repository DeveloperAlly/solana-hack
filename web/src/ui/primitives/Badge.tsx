import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'solid' | 'success' | 'warning';

/** C5 Badge: a status or tag chip (e.g. Approved, Coming soon). Text carries the meaning, not colour. */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children?: ReactNode }) {
  return <span className={[styles.badge, tone !== 'neutral' && styles[tone]].filter(Boolean).join(' ')}>{children}</span>;
}

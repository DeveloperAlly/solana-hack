import type { ReactNode } from 'react';
import styles from './JourneyAha.module.css';

export type JourneyAhaTone = 'default' | 'inverse';

export interface JourneyAhaProps {
  /** Aha moment number on the journey map (1 to 5). */
  n: number;
  /** What the person should feel at this moment, in their words. */
  children: ReactNode;
  /** inverse: the solid, larger callout for the last moment (canvas board J7-Proof). */
  tone?: JourneyAhaTone;
}

/**
 * JourneyAha: marks an aha moment on a Journey screen (canvas boards J1, J3, J4, J6 and J7; issue #48).
 * The label "Aha n" is text, so the meaning never rests on the border or the fill.
 */
export function JourneyAha({ n, children, tone = 'default' }: JourneyAhaProps) {
  return (
    <aside className={`${styles.aha} ${styles[tone]}`} aria-label={`Aha moment ${n}`}>
      <b className={styles.label}>Aha {n}</b>
      <span className={styles.text}>{children}</span>
    </aside>
  );
}

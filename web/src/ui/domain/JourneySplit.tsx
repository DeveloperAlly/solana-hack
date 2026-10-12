import type { ReactNode } from 'react';
import styles from './JourneySplit.module.css';

/** Column proportions from the canvas: a fixed rail then content (J1), or two fractions (first : second). */
export type JourneySplitRatio = 'rail' | '6-5' | '7-5' | '5-7';

export interface JourneySplitProps {
  ratio: JourneySplitRatio;
  /** Left column (the rail, for `rail`). On narrow screens it stacks first. */
  first: ReactNode;
  second: ReactNode;
}

/**
 * JourneySplit (inventory L9 TwoColumn): two columns that stack under the md breakpoint. Ratios match canvas boards
 * Main (6-5), J1-Read (rail), J2-Save (6-5), J6-First-Post (7-5), J7-Proof (5-7) and J8-Hub-FirstRun (7-5); issue #48.
 */
export function JourneySplit({ ratio, first, second }: JourneySplitProps) {
  return (
    <div className={`${styles.split} ${styles[`r${ratio}`]}`}>
      <div className={styles.col}>{first}</div>
      <div className={styles.col}>{second}</div>
    </div>
  );
}

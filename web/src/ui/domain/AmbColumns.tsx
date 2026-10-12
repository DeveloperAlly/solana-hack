import type { ReactNode } from 'react';
import styles from './AmbColumns.module.css';

export interface AmbColumnsProps {
  /** `main-aside`: wide main and a narrow aside (campaign detail). `rail-main-rail`: two rails around a wide main (editor). */
  layout: 'main-aside' | 'rail-main-rail';
  children: ReactNode;
}

/** L9 TwoColumn (and a three-column editor variant): columns side by side on wide screens, stacked in source order on narrow ones. */
export function AmbColumns({ layout, children }: AmbColumnsProps) {
  return <div className={`${styles.cols} ${styles[layout]}`}>{children}</div>;
}

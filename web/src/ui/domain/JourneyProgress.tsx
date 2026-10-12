import { useId, type ReactNode } from 'react';
import styles from './JourneyProgress.module.css';

export interface JourneyProgressProps {
  /** Visible caption; it is also the bar's accessible name. */
  label: ReactNode;
  /** Percentage, 0 to 100. Values outside are clamped. */
  value: number;
  /** Optional line under the bar. */
  hint?: ReactNode;
}

/**
 * JourneyProgress (inventory P24 ProgressBar, single segment): kit coverage (J1), kit readiness (J3) and setup progress
 * (J8) on canvas boards J1-Read, J3-Confirm and J8-Hub-FirstRun (issue #48). A native <progress>, so the fill needs no
 * inline style and assistive tech reads the value; the caption carries the number in text too.
 */
export function JourneyProgress({ label, value, hint }: JourneyProgressProps) {
  const id = useId();
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={styles.root}>
      <span id={id} className={styles.label}>{label}</span>
      <progress className={styles.bar} max={100} value={v} aria-labelledby={id}>{v}%</progress>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}

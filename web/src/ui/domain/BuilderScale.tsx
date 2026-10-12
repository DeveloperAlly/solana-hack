import { useId } from 'react';
import styles from './BuilderScale.module.css';

export interface BuilderScaleProps {
  legend: string;
  /** Labels for the low and high ends, e.g. "Casual" and "Formal". */
  low: string;
  high: string;
  value: number;
  onChange: (value: number) => void;
  /** Number of steps (default 5). */
  steps?: number;
}

/**
 * C6 Scale: a 1-to-n radio dial with end labels; arrow keys move between steps (native radio behaviour).
 * Canvas board BB-6-Voice ("Fine-tune three dials").
 */
export function BuilderScale({ legend, low, high, value, onChange, steps = 5 }: BuilderScaleProps) {
  const name = useId();
  return (
    <fieldset className={styles.scale}>
      <legend className={styles.legend}>{legend}</legend>
      <span className={styles.end} aria-hidden="true">{low}</span>
      {Array.from({ length: steps }, (_, i) => i + 1).map((n) => (
        <label key={n} className={styles.step}>
          <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} aria-label={`${n} of ${steps} (${low} to ${high})`} />
          <span aria-hidden="true">{n}</span>
        </label>
      ))}
      <span className={styles.end} aria-hidden="true">{high}</span>
    </fieldset>
  );
}

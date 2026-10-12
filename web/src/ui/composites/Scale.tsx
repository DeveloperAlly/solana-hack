import { useId } from 'react';
import styles from './Scale.module.css';

export interface ScaleProps {
  /** What the scale measures, e.g. "Formality". */
  legend: string;
  /** Labels for step 1 and the top step, e.g. "Casual" and "Formal". */
  startLabel: string;
  endLabel: string;
  value: number;
  onChange: (value: number) => void;
  /** Number of steps (default 5). */
  steps?: number;
  /** Locks the scale (a channel cap); the reason belongs in nearby text. */
  disabled?: boolean;
  /** `inline` (default): legend beside the steps. `stacked`: legend above them. */
  layout?: 'inline' | 'stacked';
}

/**
 * C6 Scale: a 1-to-n radio scale with end labels (voice dials, ratings). Native radios, so arrow keys move the value;
 * the end words are read with steps 1 and n. States: selected, locked (disabled).
 * Replaces BuilderScale and HubDial (issue #46, shared consolidation).
 */
export function Scale({ legend, startLabel, endLabel, value, onChange, steps = 5, disabled = false, layout = 'inline' }: ScaleProps) {
  const name = useId();
  return (
    <fieldset className={`${styles.scale} ${styles[layout]}`} disabled={disabled}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.steps}>
        <span className={styles.end} aria-hidden="true">{startLabel}</span>
        {Array.from({ length: steps }, (_, i) => i + 1).map((n) => (
          <label key={n} className={styles.step}>
            <input type="radio" name={name} value={n} checked={n === value} onChange={() => onChange(n)} />
            <span>{n}</span>
            {n === 1 && <span className="wl-visually-hidden"> ({startLabel})</span>}
            {n === steps && <span className="wl-visually-hidden"> ({endLabel})</span>}
          </label>
        ))}
        <span className={styles.end} aria-hidden="true">{endLabel}</span>
      </div>
    </fieldset>
  );
}

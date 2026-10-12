import { useId } from 'react';
import styles from './HubDial.module.css';

export interface HubDialProps {
  /** Dimension name, e.g. "Formality". */
  legend: string;
  /** End labels for 1 and the top step, e.g. "Casual" and "Formal". */
  start: string;
  end: string;
  value: number;
  onChange: (value: number) => void;
  /** Number of steps; the canvas dials are 1 to 5. */
  steps?: number;
  disabled?: boolean;
}

/**
 * C6 Dial: one voice dimension as a 1–n radio scale with end labels (canvas Voice-Editor, research 06).
 * Native radios, so arrow keys move the value; disabled locks it (a channel cap).
 */
export function HubDial({ legend, start, end, value, onChange, steps = 5, disabled = false }: HubDialProps) {
  const name = useId();
  return (
    <fieldset className={styles.dial} disabled={disabled}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.scale}>
        <span className={styles.end} aria-hidden="true">{start}</span>
        {Array.from({ length: steps }, (_, i) => i + 1).map((n) => (
          <label key={n} className={[styles.step, n === value && styles.on].filter(Boolean).join(' ')}>
            <input type="radio" name={name} value={n} checked={n === value} onChange={() => onChange(n)} />
            <span>{n}</span>
            {n === 1 && <span className="wl-visually-hidden"> ({start})</span>}
            {n === steps && <span className="wl-visually-hidden"> ({end})</span>}
          </label>
        ))}
        <span className={styles.end} aria-hidden="true">{end}</span>
      </div>
    </fieldset>
  );
}

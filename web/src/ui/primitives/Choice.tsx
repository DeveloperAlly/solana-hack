import { useId } from 'react';
import styles from './Choice.module.css';

export interface ChoiceOption { value: string; label: string }

/** C3 Choice: a single-select radio group in a fieldset with a legend. */
export function Choice({ legend, options, value, onChange }: { legend: string; options: ChoiceOption[]; value: string; onChange: (v: string) => void }) {
  const name = useId();
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((o) => (
          <label key={o.value} className={styles.option}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

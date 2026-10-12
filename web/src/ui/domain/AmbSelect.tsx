import { useId } from 'react';
import styles from './AmbSelect.module.css';

export interface AmbSelectOption {
  value: string;
  label: string;
}

export interface AmbSelectProps {
  label: string;
  options: AmbSelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** `stacked`: label above (forms). `inline`: label beside it, small (the campaigns "Sort" control). */
  layout?: 'stacked' | 'inline';
}

/** P13 Select (native first): a labelled native select; stacked for forms, inline for sort controls. */
export function AmbSelect({ label, options, value, onChange, layout = 'stacked' }: AmbSelectProps) {
  const id = useId();
  return (
    <div className={`${styles.field} ${styles[layout]}`}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <select id={id} className={styles.control} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

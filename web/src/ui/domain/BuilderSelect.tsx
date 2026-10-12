import { useId, type SelectHTMLAttributes } from 'react';
import styles from './BuilderSelect.module.css';

export interface BuilderSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  options: string[];
  hint?: string;
}

/** P13 Select: a labelled native select with an optional hint, styled like the Field control. Canvas BB-1-Basics, Kit-Export. */
export function BuilderSelect({ label, options, hint, className, ...rest }: BuilderSelectProps) {
  const id = useId();
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      {hint && <span id={`${id}-hint`} className={styles.hint}>{hint}</span>}
      <select {...rest} id={id} className={styles.control} aria-describedby={hint ? `${id}-hint` : undefined}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

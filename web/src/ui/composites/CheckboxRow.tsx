import { useEffect, useId, useRef, type InputHTMLAttributes } from 'react';
import styles from './CheckboxRow.module.css';

export interface CheckboxRowProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: string;
  description?: string;
  /** Mixed state, for a parent row whose children are partly checked. */
  indeterminate?: boolean;
}

/** P14 Checkbox, as a row: native checkbox with label and description; checked, indeterminate and disabled states. */
export function CheckboxRow({ label, description, indeterminate = false, className, ...rest }: CheckboxRowProps) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <div className={[styles.row, className].filter(Boolean).join(' ')}>
      <input {...rest} ref={ref} id={id} type="checkbox" className={styles.box} aria-describedby={description ? `${id}-d` : undefined} />
      <div className={styles.text}>
        <label htmlFor={id} className={styles.label}>{label}</label>
        {description && <span id={`${id}-d`} className={styles.description}>{description}</span>}
      </div>
    </div>
  );
}

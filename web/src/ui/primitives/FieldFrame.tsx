import { useId, type ReactNode } from 'react';
import styles from './Field.module.css';

/** Props every field control receives from its frame: the id, the shared class and the hint / error wiring. */
export interface FieldControlProps {
  id: string;
  className: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

export interface FieldFrameProps {
  label: string;
  hint?: string;
  error?: string | null;
  /** Keeps the label for assistive tech but hides it visually (a table cell input named by its column). */
  hideLabel?: boolean;
  /** Renders the control (input, textarea, select) with the props the frame wires up. */
  children: (control: FieldControlProps) => ReactNode;
}

/** The label, hint and error around one control; shared by C1 Field and SelectField so both read the same. */
export function FieldFrame({ label, hint, error, hideLabel = false, children }: FieldFrameProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={hideLabel ? 'wl-visually-hidden' : styles.label}>
        {label}
      </label>
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {children({ id, className: styles.control, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error && (
        <span id={errId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

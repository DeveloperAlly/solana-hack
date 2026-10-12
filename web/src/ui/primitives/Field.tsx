import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface Common {
  label: string;
  hint?: string;
  error?: string | null;
}
export type FieldProps = Common &
  (
    | ({ multiline?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>)
    | ({ multiline: true } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>)
  );

/** C1 Field: a labelled text input or textarea, with hint and error wired to aria-describedby. */
export function Field(props: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const { label, hint, error, multiline, ...rest } = props as Common & { multiline?: boolean } & Record<string, unknown>;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;
  const shared = { id, className: styles.control, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy };
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {multiline ? (
        <textarea {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...shared} />
      ) : (
        <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} {...shared} />
      )}
      {error && (
        <span id={errId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

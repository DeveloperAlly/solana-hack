import { useState, type FormEvent, type HTMLAttributes } from 'react';
import { Field } from '../primitives/Field';
import { Button } from '../primitives/Button';
import styles from './JourneyInlineForm.module.css';

export interface JourneyInlineFormProps {
  label: string;
  submitLabel: string;
  /** Returns an error message, or null when the value is valid. Runs on submit, and again as the person fixes it. */
  validate: (value: string) => string | null;
  /** Called with the trimmed value once it is valid. */
  onSubmit: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  type?: 'text' | 'email' | 'url';
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  /** Working state: the button shows `busyLabel` and is disabled. */
  busy?: boolean;
  busyLabel?: string;
  /** Adds a Cancel button. */
  onCancel?: () => void;
  /** Error from outside (a failed request), shown under the field. */
  error?: string | null;
  /** Validates from the first render, e.g. to show an invalid value that was carried in. */
  showErrorsNow?: boolean;
}

/**
 * JourneyInlineForm (inventory P17 Field + P8 Button): one labelled field and a submit button, validated on the client
 * with the error under the field. Used for the site URL (Main), another link and pasted text (J1), email and code (J2)
 * and the one-sentence voice (J4) on the canvas Journey boards (issue #48).
 */
export function JourneyInlineForm(props: JourneyInlineFormProps) {
  const { label, submitLabel, validate, onSubmit, defaultValue = '', placeholder, hint, multiline = false, type = 'text', inputMode, autoComplete, busy = false, busyLabel, onCancel, error, showErrorsNow = false } = props;
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(showErrorsNow);
  const problem = touched ? validate(value.trim()) : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validate(value.trim()) === null) onSubmit(value.trim());
  }
  const shared = { label, hint, placeholder, value, error: problem ?? error, onChange: (e: { target: { value: string } }) => setValue(e.target.value) };
  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-busy={busy || undefined}>
      <div className={styles.field}>
        {multiline ? <Field {...shared} multiline rows={2} /> : <Field {...shared} type={type} inputMode={inputMode} autoComplete={autoComplete} />}
      </div>
      <div className={styles.actions}>
        <Button type="submit" disabled={busy}>{busy && busyLabel ? busyLabel : submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

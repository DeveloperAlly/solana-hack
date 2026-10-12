import { useState, type FormEvent } from 'react';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import styles from './AmbInlineForm.module.css';

export interface AmbInlineFormProps {
  label: string;
  type?: 'email' | 'url' | 'text';
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  submitLabel: string;
  variant?: 'primary' | 'secondary';
  /** Returns an error message, or null when the value is fine. Runs on submit, then on each edit once shown. */
  validate: (value: string) => string | null;
  onSubmit: (value: string) => void;
}

/**
 * One field and a submit button with client-side validation: inline email sign-in to join a campaign (canvas note
 * n-a2) and the pasted-URL publish routes (n-a4). States: idle, invalid (error under the field), submitted.
 */
export function AmbInlineForm({ label, type = 'text', placeholder, defaultValue = '', hint, submitLabel, variant = 'primary', validate, onSubmit }: AmbInlineFormProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = value.trim();
    const err = validate(v);
    setTouched(true);
    setError(err);
    if (!err) onSubmit(v);
  }

  function edit(v: string) {
    setValue(v);
    if (touched) setError(validate(v.trim()));
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <Field label={label} type={type} placeholder={placeholder} hint={hint} value={value} error={error} onChange={(e) => edit(e.target.value)} />
      <Button type="submit" variant={variant}>{submitLabel}</Button>
    </form>
  );
}

import { useState, type FormEvent } from 'react';
import { Field } from '../primitives/Field';
import { Button } from '../primitives/Button';
import styles from './VerifyInput.module.css';

export interface VerifyInputProps {
  /** Initial text or URL (fixture data in the gallery). */
  defaultValue?: string;
  /** Called with the trimmed text on Check. Leave out for a presentational screen. */
  onCheck?: (text: string) => void;
  /** Checking state: the button says so and is disabled. */
  checking?: boolean;
  error?: string | null;
  label?: string;
}

/** D33 VerifyInput: text or URL in, Check out; checking state. Used by Main (landing) and Verify-1/2/3. */
export function VerifyInput({ defaultValue = '', onCheck, checking = false, error, label = 'Text or URL' }: VerifyInputProps) {
  const [text, setText] = useState(defaultValue);
  function submit(e: FormEvent) {
    e.preventDefault();
    onCheck?.(text.trim());
  }
  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-busy={checking || undefined}>
      <div className={styles.field}>
        <Field label={label} multiline rows={2} value={text} onChange={(e: { target: { value: string } }) => setText(e.target.value)} error={error} />
      </div>
      <Button type="submit" disabled={checking}>{checking ? 'Checking…' : 'Check'}</Button>
    </form>
  );
}

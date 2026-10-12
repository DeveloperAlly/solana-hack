import { useState, type FormEvent, type HTMLAttributes } from 'react';
import { Button, type ButtonVariant } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { useDisclosure } from '../hooks/useDisclosure';
import { Card } from './Card';
import styles from './InlineForm.module.css';

export interface InlineFormField {
  name: string;
  label: string;
  hint?: string;
  type?: 'text' | 'url' | 'email' | 'password';
  placeholder?: string;
  defaultValue?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  /** A textarea instead of an input (a one-sentence voice, a draft); `rows` sets its height. */
  multiline?: boolean;
  rows?: number;
  /** Returns an error message, or null when the value is fine. Gets the trimmed value. */
  validate?: (value: string) => string | null;
}

export interface InlineFormProps {
  /** Accessible name of the form. */
  label?: string;
  fields: InlineFormField[];
  submitLabel: string;
  submitVariant?: ButtonVariant;
  /** Gets every field's trimmed value by name, only when all fields are valid. */
  onSubmit: (values: Record<string, string>) => void;
  /** Shows a Cancel button. */
  onCancel?: () => void;
  cancelLabel?: string;
  /** Disables the submit button while a submit runs, and marks the form aria-busy. */
  busy?: boolean;
  /** Submit label while busy, e.g. "Checking…". */
  busyLabel?: string;
  /** Errors from outside (a failed request), by field name; shown under the field until the person edits that field or client validation has its own. */
  errors?: Record<string, string | null | undefined>;
  /** Validates from the first render, e.g. to show that a value carried in is invalid. */
  validateOnMount?: boolean;
  /** `stacked` (default): fields above the buttons. `row`: one field and the button on one line, wrapping when narrow. */
  layout?: 'stacked' | 'row';
  /** `plain` (default) or `card` (a subtle Card around the form, for forms that open in place). */
  surface?: 'plain' | 'card';
  /** Clears the fields after a valid submit (an "Add a link" row that stays open). */
  resetOnSubmit?: boolean;
  /**
   * Starts collapsed behind a secondary button with this label (e.g. "Add a brand"). The form opens in place and
   * closes on a valid submit or on Cancel (Cancel is added automatically).
   */
  triggerLabel?: string;
}

const initial = (fields: InlineFormField[]) => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']));

function FormBody({ label, fields, submitLabel, submitVariant = 'primary', onSubmit, onCancel, cancelLabel = 'Cancel', busy = false, busyLabel, errors: outside, validateOnMount = false, layout = 'stacked', surface = 'plain', resetOnSubmit = false }: Omit<InlineFormProps, 'triggerLabel'>) {
  const check = (f: InlineFormField, v: string) => f.validate?.(v.trim()) ?? null;
  const [values, setValues] = useState<Record<string, string>>(() => initial(fields));
  const [errors, setErrors] = useState<Record<string, string | null>>(() =>
    validateOnMount ? Object.fromEntries(fields.map((f) => [f.name, check(f, f.defaultValue ?? '')])) : {},
  );
  const [submitted, setSubmitted] = useState(validateOnMount);
  // Fields edited since the outside errors arrived: their outside error is stale, so it no longer shows (Codex review
  // on PR #80). A new `errors` object from the parent starts the record again.
  const [edited, setEdited] = useState<{ source: typeof outside; names: Record<string, true> }>({ source: outside, names: {} });
  const editedNames = edited.source === outside ? edited.names : {};
  const errorFor = (name: string) => errors[name] || (editedNames[name] ? null : outside?.[name]) || null;

  function change(f: InlineFormField, v: string) {
    setValues((prev) => ({ ...prev, [f.name]: v }));
    setEdited({ source: outside, names: { ...editedNames, [f.name]: true } });
    // After the first submit, errors follow the person's edits.
    if (submitted) setErrors((prev) => ({ ...prev, [f.name]: check(f, v) }));
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const next = Object.fromEntries(fields.map((f) => [f.name, check(f, values[f.name])]));
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    onSubmit(Object.fromEntries(fields.map((f) => [f.name, values[f.name].trim()])));
    if (resetOnSubmit) {
      setValues(initial(fields));
      setSubmitted(false);
    }
  }

  const form = (
    <form aria-label={label} aria-busy={busy || undefined} onSubmit={submit} noValidate className={`${styles.form} ${styles[layout]}`}>
      {fields.map((f) => (
        <div key={f.name} className={styles.field}>
          {f.multiline ? (
            <Field label={f.label} hint={f.hint} placeholder={f.placeholder} multiline rows={f.rows ?? 2} value={values[f.name]} error={errorFor(f.name)} onChange={(e: { target: { value: string } }) => change(f, e.target.value)} />
          ) : (
            <Field
              label={f.label}
              hint={f.hint}
              type={f.type ?? 'text'}
              placeholder={f.placeholder}
              inputMode={f.inputMode}
              autoComplete={f.autoComplete}
              value={values[f.name]}
              error={errorFor(f.name)}
              onChange={(e: { target: { value: string } }) => change(f, e.target.value)}
            />
          )}
        </div>
      ))}
      <div className={styles.actions}>
        <Button type="submit" variant={submitVariant} disabled={busy}>{busy && busyLabel ? busyLabel : submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>}
      </div>
    </form>
  );
  return surface === 'card' ? <Card variant="subtle" as="div">{form}</Card> : form;
}

/**
 * C30 InlineForm: a small form shown in place (Add a link, Add a brand, inline email to join a campaign, paste a
 * post URL): labelled fields with client-side validation and errors on each field, submit and optional cancel.
 * Values are trimmed. Optional trigger button, card surface, row layout and reset after submit.
 * Replaces SoonInlineForm, SoonAddForm, AmbInlineForm, JourneyInlineForm and BuilderLinkAdder (issue #46, shared consolidation).
 */
export function InlineForm({ triggerLabel, ...props }: InlineFormProps) {
  const { open, show, hide } = useDisclosure();
  if (triggerLabel === undefined) return <FormBody {...props} />;
  if (!open) return <Button variant="secondary" onClick={show}>{triggerLabel}</Button>;
  return (
    <FormBody
      {...props}
      onSubmit={(values) => {
        props.onSubmit(values);
        hide();
      }}
      onCancel={() => {
        props.onCancel?.();
        hide();
      }}
    />
  );
}

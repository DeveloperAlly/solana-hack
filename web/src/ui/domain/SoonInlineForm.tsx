import { useState, type FormEvent } from 'react';
import { Button, Field, Stack } from '../primitives';
import { Card } from '../composites/Card';

export interface SoonInlineField {
  name: string;
  label: string;
  hint?: string;
  type?: 'text' | 'url' | 'email' | 'password';
  defaultValue?: string;
  /** Returns an error message, or null when the value is fine. Runs on submit and as the person fixes a field. */
  validate?: (value: string) => string | null;
}

export interface SoonInlineFormProps {
  /** Accessible name of the form. */
  label: string;
  fields: SoonInlineField[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => void;
  onCancel?: () => void;
  /** Disables the submit button while a submit runs. */
  busy?: boolean;
}

const initial = (fields: SoonInlineField[]) => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']));

/**
 * A small form shown in place (Add endpoint, Add a brand, Add a source, Add evidence): labelled fields, client-side
 * validation with errors on each field, submit and cancel. Values are trimmed before onSubmit.
 */
export function SoonInlineForm({ label, fields, submitLabel, onSubmit, onCancel, busy = false }: SoonInlineFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => initial(fields));
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const check = (f: SoonInlineField, v: string) => f.validate?.(v.trim()) ?? null;

  function change(f: SoonInlineField, v: string) {
    setValues((prev) => ({ ...prev, [f.name]: v }));
    if (errors[f.name]) setErrors((prev) => ({ ...prev, [f.name]: check(f, v) }));
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    const next = Object.fromEntries(fields.map((f) => [f.name, check(f, values[f.name])]));
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    onSubmit(Object.fromEntries(fields.map((f) => [f.name, values[f.name].trim()])));
  }

  return (
    <Card variant="subtle" as="div">
      <form aria-label={label} onSubmit={submit} noValidate>
        <Stack gap={4}>
          {fields.map((f) => (
            <Field key={f.name} label={f.label} hint={f.hint} type={f.type ?? 'text'} value={values[f.name]} error={errors[f.name]} onChange={(e: { target: { value: string } }) => change(f, e.target.value)} />
          ))}
          <Stack direction="row" gap={3} wrap>
            <Button type="submit" disabled={busy}>{submitLabel}</Button>
            {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
          </Stack>
        </Stack>
      </form>
    </Card>
  );
}

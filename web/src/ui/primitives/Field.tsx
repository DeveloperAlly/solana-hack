import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { FieldFrame } from './FieldFrame';

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

/** C1 Field: a labelled text input or textarea, with hint and error wired to aria-describedby (frame: FieldFrame). */
export function Field(props: FieldProps) {
  const { label, hint, error, multiline, ...rest } = props as Common & { multiline?: boolean } & Record<string, unknown>;
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      {(control) =>
        multiline
          ? <textarea {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...control} />
          : <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} {...control} />}
    </FieldFrame>
  );
}

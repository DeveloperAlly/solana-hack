import type { SelectHTMLAttributes } from 'react';
import { FieldFrame } from './FieldFrame';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> {
  label: string;
  hint?: string;
  error?: string | null;
  options: SelectOption[];
}

/** C1 Field (select): a labelled native select with hint and error, in the same frame and styles as Field (issue #52). */
export function SelectField({ label, hint, error, options, ...rest }: SelectFieldProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      {(control) => (
        <select {...rest} {...control}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </FieldFrame>
  );
}

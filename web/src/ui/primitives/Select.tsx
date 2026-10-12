import type { ChangeEvent, SelectHTMLAttributes } from 'react';
import { FieldFrame, type FieldLayout } from './FieldFrame';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> {
  label: string;
  /** Options as `{ value, label }`, or plain strings when the value is the label. */
  options: ReadonlyArray<SelectOption | string>;
  hint?: string;
  error?: string | null;
  /** `stacked` (default) for forms; `inline` puts a compact select beside its label (toolbar sort controls). */
  layout?: FieldLayout;
  /** Class on the field wrapper (label, control, hint and error), as BuilderSelect had it; the control keeps the shared style. */
  className?: string;
  /** Called with the chosen value; use it instead of reading `event.target.value` in `onChange`. */
  onValueChange?: (value: string) => void;
}

const toOption = (o: SelectOption | string): SelectOption => (typeof o === 'string' ? { value: o, label: o } : o);

/**
 * P13 Select: a labelled native select with hint and error, in the same frame and styles as P17 Field.
 * Native first, so keyboard and screen reader behaviour come from the browser. Controlled (`value`) or not (`defaultValue`).
 * Replaces BuilderSelect, AmbSelect and SelectField (issue #46, shared consolidation).
 */
export function Select({ label, options, hint, error, layout = 'stacked', className, onValueChange, onChange, ...rest }: SelectProps) {
  function change(e: ChangeEvent<HTMLSelectElement>) {
    onChange?.(e);
    onValueChange?.(e.target.value);
  }
  return (
    <FieldFrame label={label} hint={hint} error={error} layout={layout} className={className}>
      {(control) => (
        <select {...rest} {...control} onChange={change}>
          {options.map(toOption).map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldFrame>
  );
}

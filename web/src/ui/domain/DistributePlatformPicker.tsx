import type { ReactNode } from 'react';
import { CheckboxRow } from '../composites/CheckboxRow';
import styles from './DistributePlatformPicker.module.css';

export interface DistributePlatformOption {
  id: string;
  label: string;
  /** One line under the name: status, or how it posts. */
  description?: string;
}

export interface DistributePlatformPickerProps {
  legend: string;
  options: DistributePlatformOption[];
  /** Chosen platform ids. */
  value: string[];
  onChange: (value: string[]) => void;
  /** After the options, e.g. an "All platforms" link. */
  footer?: ReactNode;
}

/**
 * D91 DistributePlatformPicker: which platforms one post goes to (canvas v21 Distribute-Adapt "Platforms for this
 * post"). Options come from the platform registry (config/platforms.ts) through the screen. States: some chosen, none
 * chosen (the screen disables Schedule).
 */
export function DistributePlatformPicker({ legend, options, value, onChange, footer }: DistributePlatformPickerProps) {
  const toggle = (id: string, on: boolean) => onChange(on ? options.map((o) => o.id).filter((o) => o === id || value.includes(o)) : value.filter((v) => v !== id));
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((o) => (
          <CheckboxRow key={o.id} label={o.label} description={o.description} checked={value.includes(o.id)} onChange={(e) => toggle(o.id, e.target.checked)} />
        ))}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </fieldset>
  );
}

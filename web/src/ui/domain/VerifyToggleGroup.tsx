import { Button } from '../primitives/Button';
import styles from './VerifyToggleGroup.module.css';

export interface ToggleOption<V extends string> {
  value: V;
  label: string;
}

export interface VerifyToggleGroupProps<V extends string> {
  /** Accessible name of the group, e.g. "Filter by type". */
  label: string;
  options: ToggleOption<V>[];
  value: V;
  onChange: (value: V) => void;
}

/**
 * C5 ToggleGroup (single select), built for the Ledger filter and sort (canvas Ledger: All / Kits / Posts).
 * Each option is a real button with aria-pressed; the pressed one takes the primary style, so the state is not colour only.
 */
export function VerifyToggleGroup<V extends string>({ label, options, value, onChange }: VerifyToggleGroupProps<V>) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {options.map((o) => {
        const pressed = o.value === value;
        return (
          <Button key={o.value} variant={pressed ? 'primary' : 'secondary'} aria-pressed={pressed} onClick={() => onChange(o.value)}>
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}

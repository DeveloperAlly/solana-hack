import styles from './ToggleGroup.module.css';

export interface ToggleOption {
  id: string;
  label: string;
}

export interface ToggleGroupProps {
  /** Accessible name of the group, e.g. "Filter by type". */
  label: string;
  options: ToggleOption[];
  /** Selected ids. Single mode keeps exactly one. */
  value: string[];
  onChange: (value: string[]) => void;
  mode?: 'single' | 'multi';
}

/**
 * C5 ToggleGroup: chip-style toggle buttons (aria-pressed) in a labelled group, single or multi select.
 * Used for channel filters (Content-Dashboard) and type filters (Ledger). Native buttons: Tab moves, Enter/Space toggle.
 */
export function ToggleGroup({ label, options, value, onChange, mode = 'single' }: ToggleGroupProps) {
  function toggle(id: string) {
    if (mode === 'single') return onChange([id]);
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {options.map((o) => {
        const pressed = value.includes(o.id);
        return (
          <button key={o.id} type="button" aria-pressed={pressed} className={[styles.chip, pressed && styles.pressed].filter(Boolean).join(' ')} onClick={() => toggle(o.id)}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

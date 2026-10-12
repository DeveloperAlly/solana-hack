import styles from './AmbFilterChips.module.css';

export interface AmbFilterOption {
  id: string;
  label: string;
}

export interface AmbFilterChipsProps {
  /** Accessible name of the group ("Filter by channel"). */
  label: string;
  options: AmbFilterOption[];
  value: string;
  onChange: (id: string) => void;
}

/** C5 ToggleGroup (single, chip style): pressed buttons that filter a list; scrolls sideways when it overflows (canvas note n-m1). */
export function AmbFilterChips({ label, options, value, onChange }: AmbFilterChipsProps) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" className={styles.chip} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

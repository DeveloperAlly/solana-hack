import { useId, useState } from 'react';
import { JourneyInlineForm } from './JourneyInlineForm';
import styles from './JourneyToggleChips.module.css';

export interface JourneyToggleChipsProps {
  /** Accessible name of the group. */
  label: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  /** Adds a "+ Add" chip that opens a field; called with the new option. */
  onAdd?: (option: string) => void;
  /** Label of the add field. */
  addLabel?: string;
}

/**
 * JourneyToggleChips (inventory C5 ToggleGroup, multi, chip style): toggle buttons with aria-pressed, plus an optional
 * add-your-own field. Used for alternatives on canvas board J4-Gaps-Voice (issue #48). Pressed chips show a check and a
 * heavier border, so the state never rests on colour.
 */
export function JourneyToggleChips({ label, options, selected, onToggle, onAdd, addLabel = 'Add your own' }: JourneyToggleChipsProps) {
  const [adding, setAdding] = useState(false);
  const labelId = useId();
  const validate = (v: string) => (!v ? 'Type a name first.' : options.includes(v) ? 'That one is already listed.' : null);
  return (
    <div className={styles.root}>
      <div role="group" aria-labelledby={labelId} className={styles.chips}>
        <span id={labelId} className="wl-visually-hidden">{label}</span>
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button key={o} type="button" aria-pressed={on} className={[styles.chip, on && styles.on].filter(Boolean).join(' ')} onClick={() => onToggle(o)}>
              {o}{on && <span aria-hidden="true"> ✓</span>}
            </button>
          );
        })}
        {onAdd && !adding && <button type="button" className={styles.chip} onClick={() => setAdding(true)}>+ Add</button>}
      </div>
      {onAdd && adding && (
        <JourneyInlineForm label={addLabel} submitLabel="Add" validate={validate} onCancel={() => setAdding(false)} onSubmit={(v) => { onAdd(v); setAdding(false); }} />
      )}
    </div>
  );
}

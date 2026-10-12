import { ToggleGroup } from '../composites/ToggleGroup';
import { Button } from '../primitives/Button';
import { useDisclosure } from '../hooks/useDisclosure';
import { JourneyInlineForm } from './JourneyInlineForm';
import styles from './JourneyAddableToggles.module.css';

export interface JourneyAddableTogglesProps {
  /** Accessible name of the group. */
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Called with a new option the person typed; it is already validated as non-empty and not listed. */
  onAdd: (option: string) => void;
  /** Label of the add field. */
  addLabel?: string;
}

/**
 * JourneyAddableToggles: C5 ToggleGroup (multi) plus "+ Add", which opens a validated field for an option of the
 * person's own (canvas board J4-Gaps-Voice, "Pick, edit or add your own"; issue #48). Composes the foundation's
 * ToggleGroup, useDisclosure and JourneyInlineForm; it adds no chip styles of its own.
 */
export function JourneyAddableToggles({ label, options, selected, onChange, onAdd, addLabel = 'Add your own' }: JourneyAddableTogglesProps) {
  const add = useDisclosure();
  const validate = (v: string) => {
    if (!v) return 'Type a name first.';
    return options.includes(v) ? 'That one is already listed.' : null;
  };
  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <ToggleGroup mode="multi" label={label} options={options.map((o) => ({ id: o, label: o }))} value={selected} onChange={onChange} />
        {!add.open && <Button variant="secondary" onClick={add.show}>+ Add</Button>}
      </div>
      {add.open && (
        <JourneyInlineForm label={addLabel} submitLabel="Add" validate={validate} onCancel={add.hide} onSubmit={(v) => { onAdd(v); add.hide(); }} />
      )}
    </div>
  );
}

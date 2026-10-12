import { ToggleGroup } from '../composites/ToggleGroup';
import { InlineForm } from '../composites/InlineForm';
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
 * JourneyAddableToggles: C5 ToggleGroup (multi) plus "+ Add", C30 InlineForm opened in place for an option of the
 * person's own (canvas board J4-Gaps-Voice, "Pick, edit or add your own"; issue #48). Composition of shared parts only.
 */
export function JourneyAddableToggles({ label, options, selected, onChange, onAdd, addLabel = 'Add your own' }: JourneyAddableTogglesProps) {
  const validate = (v: string) => {
    if (!v) return 'Type a name first.';
    return options.includes(v) ? 'That one is already listed.' : null;
  };
  return (
    <div className={styles.root}>
      <ToggleGroup mode="multi" label={label} options={options.map((o) => ({ id: o, label: o }))} value={selected} onChange={onChange} />
      <InlineForm triggerLabel="+ Add" layout="row" fields={[{ name: 'option', label: addLabel, validate }]} submitLabel="Add" onSubmit={({ option }) => onAdd(option)} />
    </div>
  );
}

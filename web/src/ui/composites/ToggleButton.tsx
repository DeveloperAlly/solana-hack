import { Button } from '../primitives/Button';
import styles from './ToggleButton.module.css';

export interface ToggleButtonProps {
  pressed: boolean;
  onToggle: () => void;
  /** Label when off, e.g. "Notify me". */
  label: string;
  /** Label when on, e.g. "We'll email you" (default: `label`). */
  pressedLabel?: string;
  /** Read after the label by screen readers only, to say what it is for, e.g. "about aDNA". */
  context?: string;
  disabled?: boolean;
}

/**
 * C34 ToggleButton: an on / off button (aria-pressed) that is primary when on and secondary when off, with its own
 * label per state. States: off, on, disabled. Replaces AmbNotifyButton (issue #46, shared consolidation).
 */
export function ToggleButton({ pressed, onToggle, label, pressedLabel, context, disabled = false }: ToggleButtonProps) {
  return (
    <span className={styles.root}>
      <Button variant={pressed ? 'primary' : 'secondary'} aria-pressed={pressed} onClick={onToggle} disabled={disabled}>
        {pressed ? (pressedLabel ?? label) : label}
        {context && <>{' '}<span className="wl-visually-hidden">{context}</span></>}
      </Button>
    </span>
  );
}

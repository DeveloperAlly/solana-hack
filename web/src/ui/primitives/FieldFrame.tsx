import { useId, type ReactNode } from 'react';
import styles from './Field.module.css';

/** Props every field control receives from its frame: the id, the shared class and the hint / error wiring. */
export interface FieldControlProps {
  id: string;
  className: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

/** `stacked`: label above the control (forms). `inline`: label beside a compact control (a "Sort" select in a toolbar). */
export type FieldLayout = 'stacked' | 'inline';

export interface FieldFrameProps {
  label: string;
  hint?: string;
  error?: string | null;
  layout?: FieldLayout;
  /** Keeps the label for assistive tech but hides it visually (a table cell input named by its column). */
  hideLabel?: boolean;
  /** Extra class on the frame (the wrapper), e.g. to place the field in a grid. */
  className?: string;
  /** Renders the control (input, textarea, select) with the props the frame wires up. */
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * The label, hint and error around one control; shared by P17 Field and P13 Select so every control reads the same
 * (issue #46, shared consolidation; first written for issue #52).
 */
export function FieldFrame({ label, hint, error, layout = 'stacked', hideLabel = false, className, children }: FieldFrameProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={[styles.field, layout === 'inline' && styles.inline, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={hideLabel ? 'wl-visually-hidden' : styles.label}>
        {label}
      </label>
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {children({ id, className: styles.control, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error && (
        <span id={errId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

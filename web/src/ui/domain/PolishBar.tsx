import { Alert } from '../primitives/Alert';
import { Button } from '../primitives/Button';
import { CheckboxRow } from '../composites/CheckboxRow';
import styles from './PolishBar.module.css';

export interface PolishAction {
  id: string;
  /** Button text, e.g. "Shorten". */
  label: string;
}

export interface PolishBarProps {
  /** Polish actions in order, e.g. Review, Shorten, Clarify, Beautify. */
  actions: PolishAction[];
  /** Ids of the actions applied so far, oldest first; the last is pressed and can be undone. */
  applied: string[];
  onApply: (id: string) => void;
  /** Shows "Undo <last>" beside the applied line. */
  onUndo?: () => void;
  /** Working state while an action runs: actions are disabled. */
  busy?: boolean;
  /** A failed action: what happened, with Retry and Dismiss; the draft and the other actions stay available. */
  failure?: { id: string; reason?: string; onRetry: () => void; onDismiss: () => void };
  /** Accessible-mode toggle for Beautify (no Unicode styling). */
  accessibleMode?: { checked: boolean; onChange: (checked: boolean) => void; label?: string };
  /** Help line under the bar, e.g. "Every polish action is applied as a new version." */
  note?: string;
}

/**
 * D6 PolishBar: reversible polish actions on a draft. The last applied action is pressed and announced politely,
 * with Undo; a failure keeps the draft and offers Retry or Dismiss; optional accessible mode for Beautify.
 * Replaces Superhub's parts/PolishBar and JourneyPolishBar (issue #46, shared consolidation).
 */
export function PolishBar({ actions, applied, onApply, onUndo, busy = false, failure, accessibleMode, note }: PolishBarProps) {
  const labelOf = (id: string) => actions.find((a) => a.id === id)?.label ?? id;
  const last = applied.at(-1);
  // Only an applied action is pressed; a failure shows in the alert alone, since the draft did not change.
  const pressed = last;
  return (
    <div className={styles.root}>
      {failure && (
        <Alert tone="danger" title={`${labelOf(failure.id)} didn't finish.`}>
          {failure.reason}{' '}
          <span className={styles.row}>
            <Button onClick={failure.onRetry}>Retry {labelOf(failure.id)}</Button>
            <Button variant="secondary" onClick={failure.onDismiss}>Dismiss</Button>
          </span>
        </Alert>
      )}
      <div className={styles.row}>
        <div role="group" aria-label="Polish actions" className={styles.row}>
          {actions.map((a) => (
            <Button key={a.id} variant={pressed === a.id ? 'primary' : 'secondary'} aria-pressed={pressed === a.id} disabled={busy} onClick={() => onApply(a.id)}>{a.label}</Button>
          ))}
        </div>
        {accessibleMode && (
          <CheckboxRow label={accessibleMode.label ?? 'Accessible mode (Beautify uses no Unicode styling)'} checked={accessibleMode.checked} onChange={() => accessibleMode.onChange(!accessibleMode.checked)} />
        )}
      </div>
      <div className={styles.status} role="status">
        {last !== undefined && (
          <>
            <span>{labelOf(last)} applied{applied.length > 1 ? ` (${applied.length} changes)` : ''}</span>
            {onUndo && <Button variant="secondary" onClick={onUndo} disabled={busy}>Undo {labelOf(last)}</Button>}
          </>
        )}
      </div>
      {note && <p className={styles.note}>{note}</p>}
    </div>
  );
}

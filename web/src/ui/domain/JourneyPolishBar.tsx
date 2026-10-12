import { Button } from '../primitives/Button';
import styles from './JourneyPolishBar.module.css';

export interface JourneyPolishBarProps {
  /** Polish actions, in order, e.g. Review, Shorten, Clarify, Beautify. */
  actions: string[];
  /** Actions applied so far, oldest first; the last one can be undone. */
  applied: string[];
  onApply: (action: string) => void;
  onUndo: () => void;
  /** Working state while an action runs. */
  busy?: boolean;
}

/**
 * JourneyPolishBar (inventory D6 PolishBar): reversible polish actions on a draft, with Undo for the last one (canvas
 * board J6-First-Post, "Polish actions with undo (built)"; issue #48). The applied action is announced politely.
 */
export function JourneyPolishBar({ actions, applied, onApply, onUndo, busy = false }: JourneyPolishBarProps) {
  const last = applied[applied.length - 1];
  return (
    <div className={styles.root}>
      <div role="group" aria-label="Polish" className={styles.actions}>
        {actions.map((a) => (
          <Button key={a} variant="secondary" disabled={busy} onClick={() => onApply(a)}>{a}</Button>
        ))}
      </div>
      <div className={styles.status} role="status">
        {last && (
          <>
            <span>{last} applied{applied.length > 1 ? ` (${applied.length} changes)` : ''}</span>
            <Button variant="secondary" onClick={onUndo} disabled={busy}>Undo {last}</Button>
          </>
        )}
      </div>
    </div>
  );
}

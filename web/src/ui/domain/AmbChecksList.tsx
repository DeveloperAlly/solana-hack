import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import styles from './AmbChecksList.module.css';

export interface AmbCheck {
  id: string;
  /** Check kind as shown: "Banned claim", "Avoided term", "Missing disclosure", "Over the limit". */
  title: string;
  /** The flagged words, when the check points at text. */
  phrase?: string;
  /** What is wrong and what the brand wants instead. */
  label: string;
  /** This check alone keeps the post from publishing; shown as a "Blocks publishing" badge. */
  blocking?: boolean;
  /** One-click fix label ("Remove line"); `shortFixLabel` is the compact one ("Remove"). No fix: no button. */
  fixLabel?: string;
  shortFixLabel?: string;
}

export interface AmbChecksListProps {
  checks: AmbCheck[];
  onFix: (id: string) => void;
  /** One line per flag with a short fix button (mobile bottom sheet). */
  compact?: boolean;
  /** Shown when nothing is flagged. */
  emptyText?: string;
  /** Fixes are off while a draft is generating. */
  disabled?: boolean;
}

/**
 * D3 ChecksPanel (full list): each open check with what is wrong, whether it blocks publishing, and a one-click fix
 * where there is one (canvas note n-a3). Empty: a single line.
 */
export function AmbChecksList({ checks, onFix, compact = false, emptyText = 'No flags.', disabled = false }: AmbChecksListProps) {
  if (checks.length === 0) return <p className={styles.empty}>{emptyText}</p>;
  return (
    <ul className={`${styles.list} ${compact ? styles.compact : ''}`}>
      {checks.map((c) => (
        <li key={c.id} className={styles.item}>
          <p className={styles.head}>
            <strong>{c.title}</strong>
            {c.phrase && <span>{compact ? ': ' : ' · '}"{c.phrase}"</span>}
          </p>
          {c.blocking && <Badge tone="solid">Blocks publishing</Badge>}
          {!compact && <p className={styles.detail}>{c.label}</p>}
          {c.fixLabel && (
            <Button variant="secondary" onClick={() => onFix(c.id)} disabled={disabled}>
              {compact ? c.shortFixLabel ?? c.fixLabel : c.fixLabel}
              <span className="wl-visually-hidden">: {c.title}</span>
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

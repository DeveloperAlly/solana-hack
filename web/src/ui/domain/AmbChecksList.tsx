import { Button } from '../primitives/Button';
import styles from './AmbChecksList.module.css';

export interface AmbCheck {
  id: string;
  /** Check kind as shown: "Banned claim", "Avoided term", "Missing disclosure". */
  title: string;
  /** The flagged words, when the check points at text. */
  phrase?: string;
  /** Why it was flagged and what the brand wants instead. */
  detail: string;
  /** One-click fix label ("Remove line"); `shortFixLabel` is the compact one ("Remove"). */
  fixLabel: string;
  shortFixLabel?: string;
}

export interface AmbChecksListProps {
  checks: AmbCheck[];
  onFix: (id: string) => void;
  /** One line per flag with a short fix button (mobile bottom sheet). */
  compact?: boolean;
  /** Shown when nothing is flagged. */
  emptyText?: string;
}

/** D3 ChecksPanel (full list): each open flag with its reason and a one-click fix (canvas note n-a3). Empty: a single line. */
export function AmbChecksList({ checks, onFix, compact = false, emptyText = 'No flags.' }: AmbChecksListProps) {
  if (checks.length === 0) return <p className={styles.empty}>{emptyText}</p>;
  return (
    <ul className={`${styles.list} ${compact ? styles.compact : ''}`}>
      {checks.map((c) => (
        <li key={c.id} className={styles.item}>
          <p className={styles.head}>
            <strong>{c.title}</strong>
            {c.phrase && <span>{compact ? ': ' : ' · '}"{c.phrase}"</span>}
          </p>
          {!compact && <p className={styles.detail}>{c.detail}</p>}
          <Button variant="secondary" onClick={() => onFix(c.id)}>
            {compact ? c.shortFixLabel ?? c.fixLabel : c.fixLabel}
            <span className="wl-visually-hidden">: {c.title}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}

import { BarTrack, type BarSize } from './BarTrack';
import styles from './BarList.module.css';

export interface BarListItem {
  label: string;
  /** Numeric value that sets the bar length. */
  value: number;
  /** The value as people read it ("3.1%", "15 of 40"). This is what assistive tech reads. */
  display: string;
}

export interface BarListProps {
  /** Accessible name of the list. */
  label: string;
  items: BarListItem[];
  /** Full-bar value; defaults to the largest item, so the top bar is full. */
  max?: number;
  /** Hides the item labels visually (a single progress row under its own heading); they stay for screen readers. */
  hideLabels?: boolean;
  size?: BarSize;
}

/**
 * C22 BarList: horizontal bars, each with a label and its value in words (canvas Analytics "Engagement by voice",
 * Hub-Home campaign progress). The drawn bar is hidden from assistive tech; the text is read. An empty list renders
 * nothing. Replaces HubBarList (issue #46, shared consolidation).
 */
export function BarList({ label, items, max, hideLabels = false, size = 'md' }: BarListProps) {
  if (items.length === 0) return null;
  // Scale to the true maximum (fractional lists fill the top bar); an all-zero list draws every bar empty.
  const top = max ?? Math.max(...items.map((i) => i.value));
  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item.label} className={[styles.item, hideLabels && styles.bare].filter(Boolean).join(' ')}>
          <span className={hideLabels ? 'wl-visually-hidden' : styles.label}>{item.label}</span>
          <BarTrack segments={[{ pct: top > 0 ? (item.value / top) * 100 : 0 }]} size={size} />
          <span className={styles.value}>{item.display}</span>
        </li>
      ))}
    </ul>
  );
}

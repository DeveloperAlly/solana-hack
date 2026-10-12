import styles from './HubBarList.module.css';

export interface HubBarItem {
  label: string;
  /** Numeric value that sets the bar length. */
  value: number;
  /** The value as people read it ("3.1%", "15 of 40"). */
  display: string;
}

export interface HubBarListProps {
  /** Accessible name of the list. */
  label: string;
  items: HubBarItem[];
  /** Full-bar value; defaults to the largest item, so the top bar is full. */
  max?: number;
  /** Hides the item labels (a single progress bar under its own heading). */
  hideLabels?: boolean;
}

/**
 * C22 BarList: horizontal bars with a label and the value in words (canvas Analytics "Engagement by voice / format",
 * Hub-Home campaign progress). Bars are native <progress> elements, so length needs no inline style; the text value
 * is what assistive tech reads, and the bar is hidden from it. Empty list renders nothing.
 */
export function HubBarList({ label, items, max, hideLabels = false }: HubBarListProps) {
  if (items.length === 0) return null;
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item.label} className={[styles.item, hideLabels && styles.bare].filter(Boolean).join(' ')}>
          <span className={hideLabels ? 'wl-visually-hidden' : styles.label}>{item.label}</span>
          <progress className={styles.bar} value={item.value} max={top} aria-hidden="true" />
          <span className={styles.value}>{item.display}</span>
        </li>
      ))}
    </ul>
  );
}

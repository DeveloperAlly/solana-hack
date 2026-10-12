import styles from './JourneyStepCards.module.css';

export interface JourneyStepCard {
  title: string;
  body: string;
}

export interface JourneyStepCardsProps {
  items: JourneyStepCard[];
  /** Accessible name of the list. */
  label: string;
}

/**
 * JourneyStepCards: an ordered list of numbered cards, "what happens next" (canvas board Main, section "What happens in
 * the next few minutes"; issue #48). Wraps to fewer columns on narrow screens; the order is in the markup.
 */
export function JourneyStepCards({ items, label }: JourneyStepCardsProps) {
  return (
    <ol className={styles.list} aria-label={label}>
      {items.map((it, i) => (
        <li key={it.title} className={styles.card}>
          <span className={styles.num} aria-hidden="true">{i + 1}</span>
          <strong>{it.title}</strong>
          <span className={styles.body}>{it.body}</span>
        </li>
      ))}
    </ol>
  );
}

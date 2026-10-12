import { useId, type ReactNode } from 'react';
import styles from './BuilderChoiceCards.module.css';

export interface ChoiceCardOption {
  value: string;
  title: string;
  /** Main text under the title (a sample paragraph, a positioning line). */
  body?: ReactNode;
  /** Secondary line (description, sources). */
  meta?: ReactNode;
}

export interface BuilderChoiceCardsProps {
  legend: string;
  options: ChoiceCardOption[];
  value: string;
  onChange: (value: string) => void;
  /** Lay the cards out in a row that wraps (default) or stack them. */
  layout?: 'row' | 'stack';
}

/**
 * C7 ChoiceCards (radio mode): a fieldset of selectable cards with title, body and meta; the checked card is outlined.
 * Canvas boards BB-1-Basics (type), BB-4-Alternatives (positioning options), BB-6-Voice (pick by example).
 */
export function BuilderChoiceCards({ legend, options, value, onChange, layout = 'row' }: BuilderChoiceCardsProps) {
  const name = useId();
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={`${styles.cards} ${styles[layout]}`}>
        {options.map((o) => (
          <label key={o.value} className={styles.card}>
            <span className={styles.title}>
              <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
              {o.title}
            </span>
            {o.body && <span>{o.body}</span>}
            {o.meta && <span className={styles.meta}>{o.meta}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

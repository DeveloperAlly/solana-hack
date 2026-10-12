import { useId, type ReactNode } from 'react';
import styles from './JourneyChoiceCards.module.css';

export interface JourneyChoiceOption {
  value: string;
  /** Short title, e.g. "A". */
  title: string;
  /** Tag chip, e.g. "Plainspoken". */
  tag?: string;
  body: string;
}

export interface JourneyChoiceCardsProps {
  /** Visible legend (the question). */
  legend: ReactNode;
  options: JourneyChoiceOption[];
  /** Selected value; empty string for none. */
  value: string;
  onChange: (value: string) => void;
}

/**
 * JourneyChoiceCards (inventory C7 ChoiceCards, radio mode): one pick from cards with a title, tag and body; the picked
 * card is outlined. Used by voice by example on canvas board J4-Gaps-Voice (issue #48). Native radios keep keyboard
 * and screen reader behaviour.
 */
export function JourneyChoiceCards({ legend, options, value, onChange }: JourneyChoiceCardsProps) {
  const name = useId();
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.grid}>
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          return (
            <label key={o.value} className={[styles.card, o.value === value && styles.selected].filter(Boolean).join(' ')}>
              <span className={styles.head}>
                <input
                  type="radio"
                  name={name}
                  value={o.value}
                  checked={o.value === value}
                  onChange={() => onChange(o.value)}
                  aria-labelledby={[`${id}-t`, o.tag && `${id}-g`].filter(Boolean).join(' ')}
                  aria-describedby={`${id}-b`}
                />
                <strong id={`${id}-t`}>{o.title}</strong>
                {o.tag && <span id={`${id}-g`} className={styles.tag}>{o.tag}</span>}
              </span>
              <span id={`${id}-b`} className={styles.body}>{o.body}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

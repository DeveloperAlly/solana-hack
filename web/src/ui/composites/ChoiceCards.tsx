import { useId, type ReactNode } from 'react';
import styles from './ChoiceCards.module.css';

export interface ChoiceCardOption {
  value: string;
  /** Short title, e.g. "A" or "Developer tool". */
  title: string;
  /** Tag chip beside the title, e.g. "Plainspoken". */
  tag?: string;
  /** Main text under the title (a sample paragraph, a positioning line). */
  body?: ReactNode;
  /** Secondary line (description, sources). */
  meta?: ReactNode;
  disabled?: boolean;
}

interface Common {
  /** The question. A string or a node (e.g. with a hint). */
  legend: ReactNode;
  options: ChoiceCardOption[];
  /** `row` (default): cards wrap in a row. `stack`: one per line. */
  layout?: 'row' | 'stack';
  /** `md` (default): a field-style legend. `lg`: a display-size legend (a step's main question). */
  legendSize?: 'md' | 'lg';
}

export type ChoiceCardsProps = Common &
  (
    | { multiple?: false; value: string; onChange: (value: string) => void }
    | { multiple: true; value: string[]; onChange: (value: string[]) => void }
  );

/**
 * C7 ChoiceCards: a fieldset of selectable cards with title, tag, body and meta; the checked card is outlined.
 * Radio mode (one pick) by default, checkbox mode with `multiple`. Native inputs keep keyboard and screen reader
 * behaviour; the title (and tag) name each input and the body describes it.
 * Replaces BuilderChoiceCards and JourneyChoiceCards (issue #46, shared consolidation).
 */
export function ChoiceCards(props: ChoiceCardsProps) {
  const { legend, options, layout = 'row', legendSize = 'md' } = props;
  const name = useId();
  const isChecked = (v: string) => (props.multiple ? props.value.includes(v) : props.value === v);
  function toggle(v: string) {
    if (props.multiple) props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else props.onChange(v);
  }
  return (
    <fieldset className={styles.group}>
      <legend className={`${styles.legend} ${styles[legendSize]}`}>{legend}</legend>
      <div className={`${styles.cards} ${styles[layout]}`}>
        {options.map((o, i) => {
          const id = `${name}-${i}`;
          return (
            <label key={o.value} className={[styles.card, o.disabled && styles.disabled].filter(Boolean).join(' ')}>
              <span className={styles.head}>
                <input
                  type={props.multiple ? 'checkbox' : 'radio'}
                  name={name}
                  value={o.value}
                  checked={isChecked(o.value)}
                  disabled={o.disabled}
                  onChange={() => toggle(o.value)}
                  aria-labelledby={[`${id}-t`, o.tag && `${id}-g`].filter(Boolean).join(' ')}
                  aria-describedby={[o.body && `${id}-b`, o.meta && `${id}-m`].filter(Boolean).join(' ') || undefined}
                />
                <span id={`${id}-t`} className={styles.title}>{o.title}</span>
                {o.tag && <span id={`${id}-g`} className={styles.tag}>{o.tag}</span>}
              </span>
              {o.body && <span id={`${id}-b`} className={styles.body}>{o.body}</span>}
              {o.meta && <span id={`${id}-m`} className={styles.meta}>{o.meta}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

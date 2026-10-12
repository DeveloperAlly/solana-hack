import { useId, type ReactNode } from 'react';
import { Heading } from '../primitives/Heading';
import { Select, type SelectOption } from '../primitives/Select';
import styles from './DecisionQueue.module.css';

export interface DecisionQueueProps {
  /** Heading, e.g. "Needs you"; the count follows it. */
  title: string;
  count: number;
  /** One line under the heading. */
  intro?: ReactNode;
  /** The kind filter (Today); omit on a short list (M-Today). */
  filter?: { value: string; options: SelectOption[]; onChange: (value: string) => void };
  /** Anchor id for "Clear n decisions". */
  id?: string;
  /** D73 QueueItem rows. */
  children?: ReactNode;
  /** Shown in place of the list when there is nothing to decide. */
  empty?: ReactNode;
  /** After the list: "4 more". */
  footer?: ReactNode;
}

/**
 * D72 DecisionQueue: Today's one queue of decisions (ADR-012 decision 1). Heading with the count, an optional kind
 * filter, the items as a list, or the empty view when nothing needs a person.
 */
export function DecisionQueue({ title, count, intro, filter, id, children, empty, footer }: DecisionQueueProps) {
  const headingId = useId();
  return (
    <section id={id} className={styles.root} aria-labelledby={headingId}>
      <div className={styles.head}>
        <Heading level={2} size="lg" id={headingId}>{title} · {count}</Heading>
        {filter && <Select label="Show" layout="inline" options={filter.options} value={filter.value} onValueChange={filter.onChange} />}
      </div>
      {intro != null && <p className={styles.intro}>{intro}</p>}
      {count > 0 ? <ul className={styles.list} aria-label={title}>{children}</ul> : empty}
      {footer}
    </section>
  );
}

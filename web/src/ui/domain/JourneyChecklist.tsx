import { useId } from 'react';
import { Card } from '../composites/Card';
import { Button } from '../primitives/Button';
import { Heading } from '../primitives/Heading';
import { JourneyProgress } from './JourneyProgress';
import styles from './JourneyChecklist.module.css';

export interface JourneyChecklistItem {
  id: string;
  label: string;
  /** Why it matters, or its tag ("coming soon"). */
  hint: string;
  done: boolean;
  /** Where Start leads. Done items have no action. */
  href?: string;
}

export interface JourneyChecklistProps {
  title: string;
  items: JourneyChecklistItem[];
}

/**
 * JourneyChecklist: the first-run setup checklist with progress; each open item has a Start link to the screen that
 * does it (canvas board J8-Hub-FirstRun, "Get set up"; issue #48). Done items say "done" in text, not only with a tick.
 */
export function JourneyChecklist({ title, items }: JourneyChecklistProps) {
  const headingId = useId();
  const done = items.filter((i) => i.done).length;
  const percent = items.length ? (done / items.length) * 100 : 0;
  return (
    <Card variant="selected" labelledBy={headingId}>
      <div className={styles.head}>
        <Heading level={2} size="lg" id={headingId}>{title}</Heading>
      </div>
      <JourneyProgress label={`${done} of ${items.length} done`} value={percent} />
      <ul className={styles.list}>
        {items.map((it) => (
          <li key={it.id} className={[styles.row, it.done && styles.done].filter(Boolean).join(' ')}>
            <span className={styles.label}>
              <span aria-hidden="true">{it.done ? '☑' : '☐'}</span> {it.label}
            </span>
            <span className={styles.hint}>{it.done ? 'done' : it.hint}</span>
            {!it.done && it.href && <Button variant="secondary" href={it.href} aria-label={`Start: ${it.label}`}>Start</Button>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

import { useId } from 'react';
import { Card } from '../composites/Card';
import { Badge, Button, Heading, Text } from '../primitives';
import type { BadgeTone } from '../primitives/Badge';
import styles from './EventPlanPhase.module.css';

export interface EventPlanPhaseItem {
  id: string;
  /** From the linked drafts' status ("Published", "Needs you", "Drafted"), or "After the event". */
  status: { label: string; tone?: BadgeTone };
  brief: string;
  /** A link to where the item is worked on, or a button that acts in place (e.g. draft its posts). */
  action?: { label: string; href: string } | { label: string; onClick: () => void };
}

export interface EventPlanPhaseProps {
  title: string;
  /** "14 days before", or the timings of its items joined. */
  timing: string;
  items: EventPlanPhaseItem[];
}

/**
 * D97 EventPlanPhase: one phase of an event's content plan (canvas v21 Event-Detail: Announce, Countdown, Live, Recap,
 * Follow up). Each item's status comes from its drafts, which are ordinary drafts reviewed like any other. States:
 * published, needs you, drafted, waiting for the event.
 */
export function EventPlanPhase({ title, timing, items }: EventPlanPhaseProps) {
  const id = useId();
  return (
    <Card labelledBy={id}>
      <div className={styles.head}>
        <Heading level={3} size="lg" id={id}>{title}</Heading>
        <Text variant="small" tone="secondary">{timing}</Text>
      </div>
      <ul className={styles.items}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <Badge tone={item.status.tone}>{item.status.label}</Badge>
            <Text variant="small" className={styles.brief}>{item.brief}</Text>
            {item.action && ('href' in item.action
              ? <Button variant="secondary" href={item.action.href}>{item.action.label}</Button>
              : <Button variant="secondary" onClick={item.action.onClick}>{item.action.label}</Button>)}
          </li>
        ))}
      </ul>
    </Card>
  );
}

import type { ReactNode } from 'react';
import { queueFilters } from '../../domain/queue';
import { Button, Heading, Text } from '../../ui/primitives';
import { DecisionQueue } from '../../ui/domain/DecisionQueue';
import { QueueItem } from '../../ui/domain/QueueItem';
import { EmptyState } from '../../ui/composites/EmptyState';
import { useLoopLinks } from './paths';
import type { QueueRow } from './useToday';

export interface TodayQueueProps {
  rows: QueueRow[];
  pending: number;
  filter?: { value: string; onChange: (v: string) => void };
  surface?: 'row' | 'card';
  /** "4 more" on the phone. */
  footer?: ReactNode;
  /** Items decided this session: listed under Done with their outcome. */
  done?: QueueRow[];
}

/** Today's queue: D72 DecisionQueue of D73 QueueItems, with the all-clear view when nothing waits (Today, M-Today). */
export function TodayQueue({ rows, pending, filter, surface = 'row', footer, done = [] }: TodayQueueProps) {
  const { links, to } = useLoopLinks();
  const item = (r: QueueRow) => (
    <QueueItem
      key={r.item.id}
      surface={surface}
      item={r.item}
      gate={r.gate}
      openHref={to(r.item.open.artboard)}
      whyHref={r.item.kind === 'draft' && r.item.whyThis ? to(r.item.whyThis) : undefined}
      onAct={r.act}
      outcome={r.outcome}
      status={r.status}
    />
  );
  const doneList = done.length > 0 && (
    <section aria-labelledby="queue-done-h">
      <Heading level={3} size="lg" id="queue-done-h">Done · {done.length}</Heading>
      <ul className="wl-list" aria-label="Done">{done.map(item)}</ul>
    </section>
  );
  return (
    <DecisionQueue
      id="queue"
      title="Needs you"
      count={pending}
      intro="One queue for every decision. Nothing posts, pays or changes the Brain until you say so."
      filter={filter && { ...filter, options: queueFilters }}
      footer={<>{footer}{doneList}</>}
      empty={<EmptyState title="All clear" body="Nothing needs you right now. New drafts, replies and suggested rules land here." actions={<Button variant="secondary" href={links.calendar}>See what's next</Button>} />}
    >
      {rows.length === 0 && <li><Text variant="small" tone="secondary">Nothing of this kind waits on you.</Text></li>}
      {rows.map(item)}
    </DecisionQueue>
  );
}

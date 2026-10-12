import type { Gate } from '../../domain/approval';
import { primaryActions, type QueueItem as QueueEntry } from '../../domain/queue';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Link } from '../primitives/Link';
import { ApprovalItem } from './ApprovalItem';
import styles from './QueueItem.module.css';

export interface QueueItemProps {
  item: QueueEntry;
  /** The item's one gate (domain/queue.ts `gateFor`): its badge and the primary action both read it. */
  gate: Gate;
  /** Where the item is worked on: its `open` link (Edit, Review, Open plan, Decide). */
  openHref: string;
  /** "Why this?" on a draft. */
  whyHref?: string;
  /** Runs the kind's one-tap action (Approve, Send, Approve and pay, Approve rule). Omit for kinds without one. */
  onAct?: () => void;
  /** The result once acted on; replaces the actions. */
  outcome?: string;
  /** A status line that stays, e.g. an approval gone stale. */
  status?: string;
  /** `row` (default): a row in the Today list. `card`: a phone card with full-width buttons (M-Today). */
  surface?: 'row' | 'card';
}

/**
 * D73 QueueItem: one decision in Today's queue, on the D1 ApprovalItem frame. Kind chip, the item, its meta line,
 * the gate as a badge, then the open link and the kind's one-tap action. A blocking gate disables the action and
 * the badge says why, from the same `{ blocking, label }`, so they can never disagree.
 */
export function QueueItem({ item, gate, openHref, whyHref, onAct, outcome, status, surface = 'row' }: QueueItemProps) {
  const action = primaryActions[item.kind];
  const card = surface === 'card';
  return (
    <ApprovalItem
      surface={card ? 'card' : 'row'}
      as={card ? 'li' : undefined}
      blocked={Boolean(action) && gate.blocking}
      meta={<Badge>{item.chip}</Badge>}
      draft={<span className={styles.text}>{item.text}</span>}
      note={<>{item.meta}{whyHref && <> · <Link href={whyHref}>Why this?</Link></>}</>}
      checks={action && <Badge tone={gate.blocking ? 'warning' : 'neutral'}>{gate.blocking ? `Blocked: ${gate.label}` : gate.label}</Badge>}
      status={status}
      outcome={outcome}
      actions={
        <div className={card ? styles.fill : styles.actions}>
          <Button variant="secondary" href={openHref} fullWidth={card}>{item.open.label}</Button>
          {action && onAct && <Button onClick={onAct} disabled={gate.blocking} fullWidth={card}>{action.label}</Button>}
        </div>
      }
    />
  );
}

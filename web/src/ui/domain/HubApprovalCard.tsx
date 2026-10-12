import type { ReactNode } from 'react';
import { Card } from '../composites/Card';
import styles from './HubApprovalCard.module.css';

export interface HubApprovalCardProps {
  /** Header line: channel badge, author, time, labels. */
  meta: ReactNode;
  /** The incoming message or mention being answered. */
  incoming?: ReactNode;
  /** Image or video slot (D46 watermark media). */
  media?: ReactNode;
  /** A note under the incoming message: why flagged, which voice drafted it, check results. */
  note?: ReactNode;
  /** The drafted reply or post. */
  draft?: ReactNode;
  /** Approve, Edit, Skip, Snooze and so on. Hidden once there is an outcome. */
  actions?: ReactNode;
  /** What happened after an action ("Sent", with an Undo button); announced politely and replaces the actions. */
  outcome?: ReactNode;
  /** Blocked by a failed check (e.g. no watermark): the card takes the emphasis border. */
  blocked?: boolean;
}

/**
 * D1 ApprovalItem: one item waiting on a person (canvas Engage-Queue, Inbox-NeedsReply, Influencer-Queue).
 * States: default, held (no draft), blocked, and done (outcome shown instead of the actions).
 */
export function HubApprovalCard({ meta, incoming, media, note, draft, actions, outcome, blocked = false }: HubApprovalCardProps) {
  return (
    <Card as="article" variant={blocked ? 'emphasis' : 'default'}>
      <div className={styles.meta}>{meta}</div>
      {media}
      {incoming && <blockquote className={styles.incoming}>{incoming}</blockquote>}
      {note && <div className={styles.note}>{note}</div>}
      {draft && <div className={styles.draft}>{draft}</div>}
      {outcome ? (
        <div className={styles.outcome} role="status">{outcome}</div>
      ) : (
        actions && <div className={styles.actions}>{actions}</div>
      )}
    </Card>
  );
}

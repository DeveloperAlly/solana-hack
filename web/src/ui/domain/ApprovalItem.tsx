import type { ReactNode } from 'react';
import { Card } from '../composites/Card';
import styles from './ApprovalItem.module.css';

export interface ApprovalItemProps {
  /** Header line: channel badge, author, time, kind, amount. */
  meta: ReactNode;
  /** The incoming message or mention being answered (shown as a quote). */
  incoming?: ReactNode;
  /** Image or video slot (D46 watermark media). */
  media?: ReactNode;
  /** A note: why it was flagged, which voice drafted it. */
  note?: ReactNode;
  /** The drafted reply, post or submission excerpt. */
  draft?: ReactNode;
  /** Check chips and links under the draft (e.g. "On-brand 91%", "View post"). */
  checks?: ReactNode;
  /** Current status that stays while actions remain ("Approved · not paid yet"); announced politely. */
  status?: ReactNode;
  /** In-place panel above the actions, e.g. the reject-reason form. */
  children?: ReactNode;
  /** Approve, Edit, Reject, Pay, Skip, Snooze. Hidden once there is an outcome. */
  actions?: ReactNode;
  /** Final result after an action ("Sent", "Skipped"); announced politely and replaces the actions. */
  outcome?: ReactNode;
  /** Blocked by a failed check (e.g. no watermark): emphasis border on a card, a strong rule on a row. */
  blocked?: boolean;
  /** `card` (default): a C1 Card. `row`: a list row with a rule under it, for items inside a list. */
  surface?: 'card' | 'row';
  /** Element: `article` (default for card) or `li` (default for row, inside a ul). */
  as?: 'article' | 'li' | 'div';
}

/**
 * D1 ApprovalItem: one item waiting on a person, as slots, so every kind (reply, post, ambassador submission,
 * outreach, influencer post) composes the same frame. States: default, held (no draft), blocked, and done (outcome
 * replaces actions). Replaces HubApprovalCard and the frame of BuilderApprovalItem (issue #46, shared consolidation).
 */
export function ApprovalItem({ meta, incoming, media, note, draft, checks, status, children, actions, outcome, blocked = false, surface = 'card', as }: ApprovalItemProps) {
  const body = (
    <>
      <div className={styles.meta}>{meta}</div>
      {media}
      {incoming != null && <blockquote className={styles.incoming}>{incoming}</blockquote>}
      {note != null && <div className={styles.note}>{note}</div>}
      {draft != null && <div className={styles.draft}>{draft}</div>}
      {checks != null && <div className={styles.row}>{checks}</div>}
      {status != null && <p className={styles.status} role="status">{status}</p>}
      {children}
      {outcome != null ? <p className={styles.outcome} role="status">{outcome}</p> : actions != null && <div className={styles.row}>{actions}</div>}
    </>
  );
  if (surface === 'row') {
    const Row = as ?? 'li';
    return <Row className={[styles.listRow, blocked && styles.blocked].filter(Boolean).join(' ')}>{body}</Row>;
  }
  return <Card as={as ?? 'article'} variant={blocked ? 'emphasis' : 'default'}>{body}</Card>;
}

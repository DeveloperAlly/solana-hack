import type { ReactNode } from 'react';
import styles from './HubItemRow.module.css';

export interface HubItemRowProps {
  /** Leading slot: a channel badge, a checkbox, a platform name. */
  lead?: ReactNode;
  /** The row's main text. */
  children: ReactNode;
  /** Secondary column: scores, time, status. */
  aside?: ReactNode;
  /** Trailing actions: Review, Connect. */
  actions?: ReactNode;
  /** Highlights the row (the open message, the chosen item). */
  selected?: boolean;
  /** Unread rows are bold. */
  unread?: boolean;
  as?: 'div' | 'li';
}

/**
 * D38 row: one line item with lead, body, aside and actions; wraps on narrow screens (canvas Hub-Home "Needs you next",
 * Content-Dashboard drafts, Inbox-All messages, Analytics-Empty sources). States: default, selected, unread.
 */
export function HubItemRow({ lead, children, aside, actions, selected = false, unread = false, as: As = 'div' }: HubItemRowProps) {
  const cls = [styles.row, selected && styles.selected, unread && styles.unread].filter(Boolean).join(' ');
  return (
    <As className={cls}>
      {lead && <div className={styles.lead}>{lead}</div>}
      <div className={styles.body}>{children}</div>
      {aside && <div className={styles.aside}>{aside}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </As>
  );
}

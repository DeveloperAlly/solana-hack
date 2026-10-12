import type { ReactNode } from 'react';
import { Badge, type BadgeTone } from '../primitives/Badge';
import styles from './ListRow.module.css';

export interface ListProps {
  /** Accessible name of the list. */
  label: string;
  /** ListRow items. */
  children?: ReactNode;
}

/** The list that holds ListRow items: a ul with its styling reset and a rule between rows. */
export function List({ label, children }: ListProps) {
  return <ul className={styles.list} aria-label={label}>{children}</ul>;
}

export interface ListRowProps {
  /** Leading slot: a channel badge, a checkbox, a platform name. */
  lead?: ReactNode;
  /** The row's main text (name, link, file, message preview). */
  title: ReactNode;
  /** Secondary line under the title. */
  detail?: ReactNode;
  /** Secondary column: scores, time. */
  aside?: ReactNode;
  /** Status chip. */
  status?: { label: string; tone?: BadgeTone };
  /** Trailing actions (Buttons or Links). */
  actions?: ReactNode;
  /** Highlights the row (the open message, the current brand). */
  selected?: boolean;
  /** Bold title (an unread message). */
  unread?: boolean;
  /** `muted` greys the title (waiting); `failed` frames the row as an error and announces the title and detail. */
  tone?: 'default' | 'muted' | 'failed';
  /** Makes the title a button that opens or picks the row (aria-pressed follows `selected`). Title must be phrasing content. */
  onSelect?: () => void;
  /** `li` (default, inside List) or `div`. */
  as?: 'li' | 'div';
}

/**
 * C31 ListRow: one line item with lead, title and detail, aside, status chip and actions; wraps on narrow screens.
 * States: default, selected, unread, muted (waiting), failed (announced); selectable with onSelect.
 * Replaces SoonStatusRow + SoonStatusList and HubItemRow, and is the row for D12 SourceList (BuilderSourceList)
 * (issue #46, shared consolidation).
 */
export function ListRow({ lead, title, detail, aside, status, actions, selected = false, unread = false, tone = 'default', onSelect, as: As = 'li' }: ListRowProps) {
  const cls = [styles.row, selected && styles.selected, unread && styles.unread, tone !== 'default' && styles[tone]].filter(Boolean).join(' ');
  const text = (
    <>
      <span className={styles.title}>{title}</span>
      {detail != null && <span className={styles.detail}>{detail}</span>}
    </>
  );
  return (
    <As className={cls}>
      {lead != null && <div className={styles.lead}>{lead}</div>}
      {onSelect ? (
        <button type="button" className={`${styles.body} ${styles.select}`} aria-pressed={selected} onClick={onSelect}>{text}</button>
      ) : (
        <div className={styles.body} role={tone === 'failed' ? 'alert' : undefined}>{text}</div>
      )}
      {aside != null && <div className={styles.aside}>{aside}</div>}
      {(status || actions != null) && (
        <div className={styles.side}>
          {status && <Badge tone={status.tone}>{status.label}</Badge>}
          {actions}
        </div>
      )}
    </As>
  );
}

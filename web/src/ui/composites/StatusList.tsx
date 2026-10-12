import { useId, type ReactNode } from 'react';
import type { BadgeTone } from '../primitives/Badge';
import { Heading, type HeadingLevel } from '../primitives/Heading';
import { Link } from '../primitives/Link';
import { Card, type CardVariant } from './Card';
import { List, ListRow } from './ListRow';
import styles from './StatusList.module.css';

export interface StatusListRow {
  id: string;
  label: ReactNode;
  /** Secondary line under the label (a failure reason). */
  detail?: ReactNode;
  /** Status chip text, e.g. "Done · 2 facts", "Reading…", "Passed". */
  status?: string;
  /** Solid chip for a done, passed, in-progress or failed state; outline otherwise. */
  solid?: boolean;
  /** Shows the status as a link to this href instead of a chip (the public record). */
  href?: string;
  /** `muted` (waiting) or `failed` (framed and announced). */
  tone?: 'default' | 'muted' | 'failed';
}

export interface StatusListProps {
  /** Accessible name of the list; also the visible heading when `title` is on. */
  label: string;
  rows: StatusListRow[];
  /** Shows `label` as a heading above the rows. */
  title?: boolean;
  titleLevel?: HeadingLevel;
  /** `plain` (default) or `card` (a titled C1 Card, Journey style). */
  surface?: 'plain' | 'card';
  cardVariant?: CardVariant;
  /** Per-row actions (Remove, Retry, Skip). */
  actions?: (row: StatusListRow) => ReactNode;
}

/**
 * C32 StatusList: label / status rows from data (sources, checks, drafted sections, the public record), built on
 * C31 List and ListRow. Plain or as a titled card; per-row actions; a row status can be a link.
 * Replaces JourneyStatusList, and the data form of SoonStatusList and BuilderSourceList (issue #46, shared consolidation).
 */
export function StatusList({ label, rows, title = false, titleLevel = 2, surface = 'plain', cardVariant = 'default', actions }: StatusListProps) {
  const headingId = useId();
  const list = (
    <List label={label}>
      {rows.map((r) => (
        <ListRow
          key={r.id}
          title={r.label}
          detail={r.detail}
          tone={r.tone}
          status={!r.href && r.status ? { label: r.status, tone: (r.solid ? 'solid' : 'neutral') as BadgeTone } : undefined}
          actions={(r.href && r.status) || actions ? <>{r.href && r.status && <Link href={r.href}>{r.status}</Link>}{actions?.(r)}</> : undefined}
        />
      ))}
    </List>
  );
  const heading = title && <Heading level={titleLevel} size="lg" id={headingId}>{label}</Heading>;
  if (surface === 'card') {
    return (
      <Card variant={cardVariant} labelledBy={title ? headingId : undefined}>
        {heading}
        {list}
      </Card>
    );
  }
  return (
    <div className={styles.plain}>
      {heading}
      {list}
    </div>
  );
}

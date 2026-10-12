import { useId } from 'react';
import { Card, type CardVariant } from '../composites/Card';
import { KeyValueList } from '../composites/KeyValueList';
import { Badge } from '../primitives/Badge';
import { Heading } from '../primitives/Heading';
import { Link } from '../primitives/Link';
import styles from './JourneyStatusList.module.css';

/** One row: a label and its status chip, or a link when `href` is set. */
export interface JourneyStatusRow {
  label: string;
  value: string;
  /** A done or passed state: solid chip. */
  solid?: boolean;
  href?: string;
}

/** A row's value: its link, or its status chip (solid for a done or passed state). */
function rowValue(row: JourneyStatusRow) {
  if (row.href) return <Link href={row.href}>{row.value}</Link>;
  return <Badge tone={row.solid ? 'solid' : 'neutral'}>{row.value}</Badge>;
}

export interface JourneyStatusListProps {
  title: string;
  rows: JourneyStatusRow[];
  variant?: CardVariant;
}

/**
 * JourneyStatusList (inventory D12 SourceList and D3 ChecksPanel, compact): a titled card of label / status rows. Used
 * for sources (J1), checks (J6), drafted sections (J5) and the public record (J8) on the canvas Journey boards (issue
 * #48). Composes C1 Card and C11 KeyValueList; the status is a text chip, so it reads the same in every theme.
 */
export function JourneyStatusList({ title, rows, variant = 'default' }: JourneyStatusListProps) {
  const headingId = useId();
  return (
    <Card variant={variant} labelledBy={headingId}>
      <Heading level={2} size="lg" id={headingId}>{title}</Heading>
      <div className={styles.rows}>
        <KeyValueList
          items={rows.map((r) => ({ label: r.label, value: rowValue(r) }))}
        />
      </div>
    </Card>
  );
}

import type { ReactNode } from 'react';
import { Card } from '../composites/Card';
import { Badge } from '../primitives/Badge';
import { Link } from '../primitives/Link';
import { Text } from '../primitives/Text';
import { EvidenceChip, type EvidenceStatus } from './EvidenceChip';
import { JourneyQuote } from './JourneyQuote';
import styles from './JourneyFactCard.module.css';

/** Where a fact was read. `url` is the page itself; the card links to it so anyone can check the quote. */
export interface JourneyFactSource {
  /** e.g. "jamjam.tech · home page". */
  label: string;
  url?: string;
}

/** A fact found on the brand's own pages (the `evidence` rows a kit section cites). */
export interface JourneyFact {
  id: string;
  /** Kit section label, with its gate if it has one, e.g. "Positioning · Gate 2". */
  section: string;
  status: EvidenceStatus;
  statement: string;
  /** The exact line on the page. Absent for inferred facts, which carry a `note` instead. */
  quote?: string;
  source?: JourneyFactSource;
  /** Why there is no quote, or what happens next, e.g. "Inferred from 3 pages". */
  note?: string;
}

export interface JourneyFactCardProps {
  fact: JourneyFact;
  /** Accept / Edit / Reject, or a link onward. */
  actions?: ReactNode;
  /** Shown beside the status chip, e.g. the person's decision ("Accepted"). */
  decision?: string;
  /** Replaces the statement while the person edits it. */
  editor?: ReactNode;
  /** dashed: a section nothing on the pages supports yet (Needs you). */
  variant?: 'default' | 'dashed';
}

/**
 * JourneyFactCard (inventory D14 EvidenceList + Citation): a fact with its section, status, the exact quote and the
 * page it came from (canvas boards J1-Read, J3-Confirm, Main; issue #48). A fact is kept only when its quote is on the page.
 */
export function JourneyFactCard({ fact, actions, decision, editor, variant = 'default' }: JourneyFactCardProps) {
  return (
    <Card as="article" variant={variant}>
      <div className={styles.head}>
        <Badge>{fact.section}</Badge>
        <EvidenceChip status={fact.status} />
        {decision && <Badge tone="solid">{decision}</Badge>}
      </div>
      {editor ?? <Text>{fact.statement}</Text>}
      {fact.quote && <JourneyQuote>{fact.quote}</JourneyQuote>}
      {fact.note && <Text variant="caption" tone="secondary">{fact.note}</Text>}
      {fact.source && (
        <Text variant="caption" tone="secondary">
          {fact.source.label}
          {fact.source.url && <> · <Link href={fact.source.url} external>Open the page</Link></>}
        </Text>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </Card>
  );
}

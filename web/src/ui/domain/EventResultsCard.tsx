import { useId } from 'react';
import { Card } from '../composites/Card';
import { KeyValueList } from '../composites/KeyValueList';
import { Heading, Link, Text } from '../primitives';
import type { EventResults } from '../../domain/event';
import styles from './EventResultsCard.module.css';

export interface EventResultsCardProps {
  /** Null before the event ends. */
  results: EventResults | null;
  /** What appears once the event ends. */
  pending: string;
  link?: { label: string; href: string };
  /** Heading (default "Results"). */
  title?: string;
}

const notAvailable = 'Not available';

/**
 * D99 EventResultsCard: an event's results (canvas v21 Event-Detail "Results": posts verified, reach, leads, cost).
 * A number a platform does not share reads "Not available", never an estimate (canvas note n-c2). States: pending, results.
 */
export function EventResultsCard({ results, pending, link, title = 'Results' }: EventResultsCardProps) {
  const id = useId();
  return (
    <Card labelledBy={id}>
      <Heading level={2} size="lg" id={id}>{title}</Heading>
      {results ? (
        <KeyValueList
          label="Event results"
          items={[
            { label: 'Posts verified', value: String(results.postsVerified) },
            { label: 'Reach', value: results.reach === null ? notAvailable : results.reach.toLocaleString('en') },
            { label: 'Leads', value: String(results.leads) },
            { label: 'Cost', value: results.costUsdc === null ? 'None' : `${results.costUsdc} USDC` },
          ]}
        />
      ) : (
        <Text variant="small" tone="secondary">{pending}</Text>
      )}
      {link && <span className={styles.link}><Link href={link.href}>{link.label}</Link></span>}
    </Card>
  );
}

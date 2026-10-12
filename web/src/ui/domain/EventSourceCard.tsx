import { useId, type ReactNode } from 'react';
import { Card } from '../composites/Card';
import { Badge, Heading, Link, Text } from '../primitives';
import type { EventSourceFact } from '../../config/eventSources';
import styles from './EventSourceCard.module.css';

export interface EventSourceCardProps {
  title: string;
  /** Registry status label, e.g. "Planned". */
  status: string;
  /** What this source gives the brand now. */
  summary: ReactNode;
  /** Facts from the source registry, each with where it was read. */
  facts: EventSourceFact[];
  /** What connecting needs, and what to do without it. */
  requirement?: string;
  /** What is not confirmed yet; each line is said as unverified. */
  unverified: string[];
  actions?: ReactNode;
}

/**
 * D96 EventSourceCard: one event source from config/eventSources.ts (canvas v21 Events "From your Luma calendar"), with
 * what connecting needs, its facts with their sources, and what is still unverified. States: connected, not connected.
 */
export function EventSourceCard({ title, status, summary, facts, requirement, unverified, actions }: EventSourceCardProps) {
  const id = useId();
  return (
    <Card variant="subtle" labelledBy={id}>
      <div className={styles.head}>
        <Heading level={2} size="lg" id={id}>{title}</Heading>
        <Badge>{status}</Badge>
      </div>
      <Text variant="small">{summary}</Text>
      {requirement && <Text variant="small" tone="secondary">{requirement}</Text>}
      {facts.length > 0 && (
        <ul className={styles.facts}>
          {facts.map((f) => (
            <li key={f.text}>
              {f.text}{' '}
              {f.source.href ? <Link href={f.source.href} external>{f.source.label}</Link> : <span className={styles.source}>{f.source.label}</span>}
            </li>
          ))}
        </ul>
      )}
      {unverified.map((u) => <Text key={u} variant="caption" tone="secondary">Unverified: {u}</Text>)}
      {actions && <div className={styles.actions}>{actions}</div>}
    </Card>
  );
}

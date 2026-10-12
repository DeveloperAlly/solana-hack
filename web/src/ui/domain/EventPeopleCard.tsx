import { useId } from 'react';
import { Card } from '../composites/Card';
import { Heading, Link, Text } from '../primitives';
import styles from './EventPeopleCard.module.css';

export interface EventPeopleCardProps {
  title: string;
  /** Bracketed in samples: "[Creator name] · ambassador". */
  people: { id: string; name: string; role: string }[];
  /** Shown when nobody is listed yet. */
  empty: string;
  link?: { label: string; href: string };
}

/** D98 EventPeopleCard: who's going to an event (canvas v21 Event-Detail aside). States: people listed, nobody yet. */
export function EventPeopleCard({ title, people, empty, link }: EventPeopleCardProps) {
  const id = useId();
  return (
    <Card labelledBy={id}>
      <Heading level={2} size="lg" id={id}>{title}</Heading>
      {people.length === 0 ? (
        <Text variant="small" tone="secondary">{empty}</Text>
      ) : (
        <ul className={styles.people}>
          {people.map((p) => <li key={p.id}>{p.name} · {p.role}</li>)}
        </ul>
      )}
      {link && <Text variant="small"><Link href={link.href}>{link.label}</Link></Text>}
    </Card>
  );
}

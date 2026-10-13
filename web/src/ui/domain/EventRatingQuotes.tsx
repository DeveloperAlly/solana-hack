import { useId, type ReactNode } from 'react';
import { Card } from '../composites/Card';
import { Heading, Text } from '../primitives';
import styles from './EventRatingQuotes.module.css';

export interface EventRatingQuote {
  id: string;
  line: string;
  /** "Attendee · checked in · rated 2" */
  meta: string;
  /** Link to where it is registered. */
  registered: ReactNode;
  /** A verified organiser's reply under it. Organisers reply; they never edit or remove. */
  reply?: { organiser: string; text: string };
  /** Earlier versions, oldest first: an edit adds a version and these stay visible. */
  earlier?: { id: string; line: string; meta: string }[];
  /** Removed after a report, reviewed by a person: shown as a tombstone with its date and reason, never hidden. */
  removed?: { at: string; reason: string };
}

export interface EventRatingQuotesProps {
  title: string;
  quotes: EventRatingQuote[];
  empty: string;
}

/**
 * D101 EventRatingQuotes: what attendees said, each line with its proof and registration, and an organiser's reply
 * under the rating it answers (canvas v26 Event-Rating). Ratings are append-only: an edited one keeps its earlier
 * versions behind "Edited, see earlier versions", and a removed one stays as a tombstone with its date and reason.
 * States: quotes, edited, removed, none yet.
 */
export function EventRatingQuotes({ title, quotes, empty }: EventRatingQuotesProps) {
  const id = useId();
  return (
    <Card labelledBy={id}>
      <Heading level={2} size="lg" id={id}>{title}</Heading>
      {quotes.length === 0 ? (
        <Text variant="small" tone="secondary">{empty}</Text>
      ) : (
        <ul className={styles.list}>
          {quotes.map((q) => (
            <li key={q.id} className={styles.item}>
              {q.removed ? (
                <p className={styles.tombstone}>Removed {q.removed.at}: {q.removed.reason} Its registration stays.</p>
              ) : (
                <blockquote className={styles.quote}>{q.line}</blockquote>
              )}
              <Text variant="caption" tone="secondary">{q.meta} · {q.registered}</Text>
              {q.earlier && q.earlier.length > 0 && (
                <details className={styles.earlier}>
                  <summary>Edited, see earlier versions ({q.earlier.length})</summary>
                  <ol className={styles.versions}>
                    {q.earlier.map((v) => <li key={v.id}><span className={styles.quote}>{v.line}</span> <Text as="span" variant="caption" tone="secondary">{v.meta}</Text></li>)}
                  </ol>
                </details>
              )}
              {q.reply && (
                <div className={styles.reply}>
                  <Text variant="small"><strong>Organiser reply:</strong> {q.reply.text}</Text>
                  <Text variant="caption" tone="secondary">{q.reply.organiser} · verified organiser</Text>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

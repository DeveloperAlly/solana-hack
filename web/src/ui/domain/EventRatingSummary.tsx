import { useId } from 'react';
import { Card } from '../composites/Card';
import { BarList } from '../composites/BarList';
import { Heading, Text } from '../primitives';
import { ratingQuestions, registeredLabel, summaryScore, type RatingSummary } from '../../domain/rating';
import styles from './EventRatingSummary.module.css';

export interface EventRatingSummaryProps {
  summary: RatingSummary;
  /** Accessible name of the card (default "Score"). */
  title?: string;
}

const one = (n: number) => n.toFixed(1);

/**
 * D100 EventRatingSummary: an event's overall score and one bar per question, out of 5 (canvas v21 Event-Rating).
 * States: rated, no ratings yet.
 */
export function EventRatingSummary({ summary, title = 'Score' }: EventRatingSummaryProps) {
  const id = useId();
  const score = summaryScore(summary);
  return (
    <Card labelledBy={id}>
      <Heading level={2} size="lg" id={id} className="wl-visually-hidden">{title}</Heading>
      {score === null || !summary.averages ? (
        <Text tone="secondary">No ratings yet. The first attendee to rate sets the score.</Text>
      ) : (
        <>
          <p className={styles.score}>
            <strong className={styles.big}>{one(score)}</strong>
            <span className={styles.out}>out of 5 · {registeredLabel(summary)}</span>
          </p>
          <BarList label="Score by question" max={5} items={ratingQuestions.map((q) => ({ label: q.label, value: summary.averages![q.id], display: one(summary.averages![q.id]) }))} />
        </>
      )}
    </Card>
  );
}

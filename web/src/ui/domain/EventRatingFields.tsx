import { GatedButton, type Gate } from '../composites/GatedButton';
import { Field, Select } from '../primitives';
import { ratingQuestions, ratingScale, type RatingDraftScores, type RatingQuestionId, type RatingScore } from '../../domain/rating';
import styles from './EventRatingFields.module.css';

export interface EventRatingFieldsProps {
  /** Locked until attendance is proven: the whole fieldset is disabled. */
  locked: boolean;
  scores: RatingDraftScores;
  onScore: (question: RatingQuestionId, score: RatingScore | null) => void;
  line: string;
  onLine: (line: string) => void;
  /** The one gate for Register: all five chosen, proof done, a line written. */
  gate: Gate;
  onRegister: () => void;
  registerLabel: string;
}

const options = [{ value: '', label: 'Choose 1 to 5' }, ...ratingScale.map((n) => ({ value: String(n), label: String(n) }))];

/**
 * D103 EventRatingFields: step 2 of rating an event, five questions and a line (canvas v21 Event-Rating). No score is
 * pre-selected; Register stays disabled until the gate passes. States: locked, filling, ready.
 */
export function EventRatingFields({ locked, scores, onScore, line, onLine, gate, onRegister, registerLabel }: EventRatingFieldsProps) {
  return (
    <div className={styles.root}>
      <fieldset className={styles.fields} disabled={locked}>
        <legend className={styles.legend}>{locked ? 'Your ratings (unlock after proof)' : 'Your ratings'}</legend>
        {ratingQuestions.map((q) => (
          <Select
            key={q.id}
            label={q.label}
            options={options}
            value={scores[q.id] === null ? '' : String(scores[q.id])}
            onValueChange={(v) => onScore(q.id, v ? (Number(v) as RatingScore) : null)}
          />
        ))}
        <Field label="In a line" placeholder="What should people know?" value={line} onChange={(e) => onLine(e.target.value)} maxLength={140} />
      </fieldset>
      <GatedButton gate={gate} onClick={onRegister}>{registerLabel}</GatedButton>
    </div>
  );
}

import { useState } from 'react';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Text } from '../primitives/Text';
import { Card } from '../composites/Card';
import styles from './BuilderFactConfirm.module.css';

export type FactDecision = 'open' | 'confirmed' | 'rejected';

export interface BuilderFactConfirmProps {
  /** Where the fact came from, e.g. "jamjam.tech". */
  source: string;
  fact: string;
  defaultDecision?: FactDecision;
  onDecide?: (decision: FactDecision) => void;
}

const outcome: Record<Exclude<FactDecision, 'open'>, string> = {
  confirmed: 'Confirmed. Saved as evidence from this source.',
  rejected: "Marked as not quite. We won't use it; tell us the right version in your answers.",
};

/**
 * D14 evidence, confirm form: a fact found in a source, shown for the owner to confirm before it is used.
 * Canvas board BB-2-Origin ("Found in your sources"; note n-bb2.3).
 */
export function BuilderFactConfirm({ source, fact, defaultDecision = 'open', onDecide }: BuilderFactConfirmProps) {
  const [decision, setDecision] = useState<FactDecision>(defaultDecision);
  function decide(d: FactDecision) {
    setDecision(d);
    onDecide?.(d);
  }
  return (
    <Card variant="subtle" as="div">
      <div className={styles.head}>
        <Text as="span" variant="small"><strong>Found in your sources</strong></Text>
        <Badge>{source} · {decision === 'open' ? 'confirm' : decision}</Badge>
      </div>
      <Text>{fact}</Text>
      {decision === 'open' ? (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => decide('confirmed')}>That&apos;s right</Button>
          <Button variant="secondary" onClick={() => decide('rejected')}>Not quite</Button>
        </div>
      ) : (
        <div className={styles.actions}>
          <Text as="span" variant="small" role="status">{outcome[decision]}</Text>
          <Button variant="secondary" onClick={() => decide('open')}>Change</Button>
        </div>
      )}
    </Card>
  );
}

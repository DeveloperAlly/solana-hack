import { useId, useState, type ReactNode } from 'react';
import { Card } from '../composites/Card';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Heading } from '../primitives/Heading';
import { Text } from '../primitives/Text';
import { JourneyInlineForm } from './JourneyInlineForm';
import styles from './JourneyGateCard.module.css';

/** A recorded gate decision: who approved it, when, and the optional why (the `gates` row). */
export interface JourneyGateDecision {
  by: string;
  at: string;
  why?: string;
}

export interface JourneyGateCardProps {
  gate: number;
  title: string;
  /** The AI draft for this section. */
  draft: string;
  /** What it was built from, e.g. "2 facts, 1 answer". */
  builtFrom: string;
  /** The evidence itself, shown under "See evidence". */
  evidence: ReactNode;
  decision?: JourneyGateDecision;
  onApprove: (why: string) => void;
  onEdit: (draft: string) => void;
  /** Withdraws an approval so the draft can change. */
  onReopen: () => void;
}

const required = (v: string) => (v ? null : 'The section cannot be empty.');

/**
 * JourneyGateCard (inventory D17 DecisionGate, compact): one of the three kit gates with its draft, what it was built
 * from, the evidence, an optional why and Approve / Edit. Approval records who and when (canvas board J5-Approve-Kit;
 * issue #48). States: pending, editing, approved.
 */
export function JourneyGateCard({ gate, title, draft, builtFrom, evidence, decision, onApprove, onEdit, onReopen }: JourneyGateCardProps) {
  const headingId = useId();
  const [why, setWhy] = useState('');
  const [editing, setEditing] = useState(false);
  return (
    <Card variant="selected" labelledBy={headingId}>
      <div className={styles.head}>
        <Badge>Gate {gate}</Badge>
        <Heading level={2} size="lg" id={headingId}>{title}</Heading>
        {decision && <Badge tone="solid">Approved</Badge>}
      </div>
      {editing ? (
        <JourneyInlineForm label={`${title} draft`} submitLabel="Save" multiline defaultValue={draft} validate={required} onCancel={() => setEditing(false)} onSubmit={(v) => { onEdit(v); setEditing(false); }} />
      ) : (
        <Text>{draft}</Text>
      )}
      <details className={styles.evidence}>
        <summary>Built from: {builtFrom} · See evidence</summary>
        <div className={styles.evidenceBody}>{evidence}</div>
      </details>
      {decision ? (
        <div className={styles.actions}>
          <Text variant="small" tone="secondary">Approved by {decision.by} · {decision.at}{decision.why ? ` · "${decision.why}"` : ''}</Text>
          <Button variant="secondary" onClick={onReopen}>Change</Button>
        </div>
      ) : (
        <>
          <Field label="Why (optional)" value={why} onChange={(e: { target: { value: string } }) => setWhy(e.target.value)} />
          <div className={styles.actions}>
            <Button onClick={() => onApprove(why.trim())} disabled={editing}>Approve</Button>
            <Button variant="secondary" onClick={() => setEditing(true)} disabled={editing}>Edit</Button>
          </div>
        </>
      )}
    </Card>
  );
}

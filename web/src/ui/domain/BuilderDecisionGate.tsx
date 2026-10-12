import { useState, type ReactNode } from 'react';
import { Alert } from '../primitives/Alert';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Text } from '../primitives/Text';
import { Card } from '../composites/Card';
import { StatePanel } from '../composites/StatePanel';
import { useRequiredNote } from '../hooks/useRequiredNote';
import styles from './BuilderDecisionGate.module.css';

export type GateStatus = 'pending' | 'approved' | 'changes' | 'deferred';

export interface GateDecision {
  status: GateStatus;
  /** Who decided and when (approved), shown as the decision record. */
  by?: string;
  at?: string;
  /** Optional "why", saved with an approval. */
  why?: string;
  /** What should change (changes requested). */
  note?: string;
}

export interface BuilderDecisionGateProps {
  /** What is being approved, e.g. "purpose"; used in labels ("Approve purpose"). */
  subject: string;
  /** Chip over the draft, e.g. "AI draft · confirm". */
  draftLabel: string;
  /** Line beside the chip, e.g. "Drafted from 4 sources". */
  draftMeta?: string;
  /** Label of the optional why field. */
  whyLabel: string;
  /** Who is approving (the signed-in owner). */
  approver: string;
  decision: GateDecision;
  onDecide: (decision: GateDecision) => void;
  backHref: string;
  backLabel?: string;
  /** Where Continue and "Save, decide later" go. */
  nextHref: string;
  /** The draft, its sources and draft actions. */
  children: ReactNode;
}

const stamp = () => `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

/**
 * D17 DecisionGate: an editable AI draft with what it was built from, an optional why, and the decision: Approve (records
 * who, when, why), Request changes (with a note), or Save, decide later. States: pending, changes requested, deferred,
 * approved. Canvas boards BB-Gate1-Purpose, BB-Gate2-Positioning, BB-Gate3-Voice (notes n-g1, n-g2, n-g3).
 */
export function BuilderDecisionGate({ subject, draftLabel, draftMeta, whyLabel, approver, decision, onDecide, backHref, backLabel = 'Back', nextHref, children }: BuilderDecisionGateProps) {
  const [why, setWhy] = useState(decision.why ?? '');
  const changes = useRequiredNote('Say what should change, so the next draft can fix it.');
  const requestChanges = () => changes.submit((note) => onDecide({ status: 'changes', note }));

  if (decision.status === 'approved') {
    return (
      <StatePanel
        kind="success"
        title={`${subject[0].toUpperCase()}${subject.slice(1)} approved`}
        body={`Decision recorded: ${decision.by}, ${decision.at}${decision.why ? `. Why: ${decision.why}` : ''}. Reopening it later creates a new kit version.`}
        actions={<><Button href={nextHref}>Continue</Button><Button variant="secondary" onClick={() => onDecide({ status: 'pending' })}>Reopen</Button></>}
      />
    );
  }

  return (
    <div className={styles.gate}>
      {decision.status === 'changes' && <Alert tone="warning" title="Changes requested">{decision.note} Edit the draft or try another, then approve.</Alert>}
      {decision.status === 'deferred' && <Alert tone="info" title="Saved, not decided">Kit v1 can&apos;t be approved until all three gates pass.</Alert>}
      <Card variant="selected" as="section">
        <div className={styles.head}><Badge>{draftLabel}</Badge>{draftMeta && <Text as="span" variant="small" tone="secondary">{draftMeta}</Text>}</div>
        {children}
      </Card>
      <Field label={whyLabel} value={why} onChange={(e: { target: { value: string } }) => setWhy(e.target.value)} />
      {changes.open && (
        <Card variant="subtle" as="div">
          <Field label="What should change?" multiline rows={2} value={changes.text} onChange={(e: { target: { value: string } }) => changes.setText(e.target.value)} error={changes.error} />
          <div className={styles.row}><Button onClick={requestChanges}>Send request</Button><Button variant="secondary" onClick={changes.cancel}>Cancel</Button></div>
        </Card>
      )}
      <Text variant="small" tone="secondary">Approving records a decision: who, when and why. You can reopen it later; that creates a new kit version.</Text>
      <div className={styles.footer}>
        <Button href={backHref} variant="secondary">{backLabel}</Button>
        <div className={styles.row}>
          {!changes.open && <Button variant="secondary" onClick={changes.show}>Request changes</Button>}
          <Button href={nextHref} variant="secondary" onClick={() => onDecide({ status: 'deferred' })}>Save, decide later</Button>
          {/* INTEGRATION: POST /api/brands/:id/gates/:gate/approve (backend map §4, row "Gate 1, Gate 2, Gate 3"). */}
          <Button onClick={() => onDecide({ status: 'approved', by: approver, at: stamp(), why: why.trim() || undefined })}>Approve {subject}</Button>
        </div>
      </div>
    </div>
  );
}

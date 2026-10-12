import { useState } from 'react';
import { Button } from '../../ui/primitives';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import { JourneyInlineForm } from '../../ui/domain/JourneyInlineForm';
import { required } from './validators';
import type { FactDecision, FactRecord, JourneyFact } from './types';

export interface ConfirmFactCardProps {
  fact: JourneyFact;
  /** The person's decision, with their wording when they edited it; undefined until decided. */
  record?: FactRecord;
  onDecide: (decision: FactDecision, edit?: string) => void;
  onUndo: () => void;
}

const decisionLabel: Record<FactDecision, string> = { accepted: 'Accepted', edited: 'Edited', rejected: 'Rejected' };

/**
 * A J3 card: the found fact with Accept / Edit / Reject (canvas board J3-Confirm, note n-j3-confirm 1). Edit swaps the
 * statement for a validated field; a decided card shows its decision and Undo. Composition only, no styles.
 */
export function ConfirmFactCard({ fact, record, onDecide, onUndo }: ConfirmFactCardProps) {
  const decision = record?.decision;
  const [editing, setEditing] = useState(false);
  const shown = record?.decision === 'edited' ? { ...fact, statement: record.edit } : fact;
  const editor = editing ? (
    <JourneyInlineForm label={`Edit: ${fact.section}`} submitLabel="Save" multiline defaultValue={shown.statement} validate={required('The statement cannot be empty.')} onCancel={() => setEditing(false)} onSubmit={(v) => { onDecide('edited', v); setEditing(false); }} />
  ) : undefined;
  const actions = decision ? (
    <Button variant="secondary" onClick={onUndo}>Undo</Button>
  ) : (
    <>
      <Button onClick={() => onDecide('accepted')} disabled={editing}>Accept</Button>
      <Button variant="secondary" onClick={() => setEditing(true)} disabled={editing}>Edit</Button>
      <Button variant="secondary" onClick={() => onDecide('rejected')} disabled={editing}>Reject</Button>
    </>
  );
  return <JourneyFactCard fact={shown} decision={decision && decisionLabel[decision]} editor={editor} actions={actions} />;
}

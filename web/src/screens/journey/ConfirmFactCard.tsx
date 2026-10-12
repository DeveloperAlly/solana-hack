import { useState } from 'react';
import { Button } from '../../ui/primitives';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import { JourneyInlineForm } from '../../ui/domain/JourneyInlineForm';
import { required } from './validators';
import type { FactDecision, JourneyFact } from './types';

export interface ConfirmFactCardProps {
  fact: JourneyFact;
  decision?: FactDecision;
  /** The person's wording, when they edited the statement. */
  edit?: string;
  onDecide: (decision: FactDecision, edit?: string) => void;
  onUndo: () => void;
}

const decisionLabel: Record<FactDecision, string> = { accepted: 'Accepted', edited: 'Edited', rejected: 'Rejected' };

/**
 * A J3 card: the found fact with Accept / Edit / Reject (canvas board J3-Confirm, note n-j3-confirm 1). Edit swaps the
 * statement for a validated field; a decided card shows its decision and Undo. Composition only, no styles.
 */
export function ConfirmFactCard({ fact, decision, edit, onDecide, onUndo }: ConfirmFactCardProps) {
  const [editing, setEditing] = useState(false);
  const shown = edit ? { ...fact, statement: edit } : fact;
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

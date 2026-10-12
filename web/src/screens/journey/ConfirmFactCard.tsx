import { useJourneyTask } from './useJourneyTask';
import { useState } from 'react';
import { Alert, Button } from '../../ui/primitives';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import { InlineForm } from '../../ui/composites/InlineForm';
import { required } from './validators';
import type { FactDecision, FactRecord, JourneyFact } from './types';

export interface ConfirmFactCardProps {
  fact: JourneyFact;
  /** The person's decision, with their wording when they edited it; undefined until decided. */
  record?: FactRecord;
  onDecide: (decision: FactDecision, edit?: string) => void | Promise<void>;
  onUndo: () => void | Promise<void>;
}

const decisionLabel: Record<FactDecision, string> = { accepted: 'Accepted', edited: 'Edited', rejected: 'Rejected' };

/**
 * A J3 card: the found fact with Accept / Edit / Reject (canvas board J3-Confirm, note n-j3-confirm 1). Edit swaps the
 * statement for a validated field; a decided card shows its decision and Undo. Composition only, no styles.
 */
export function ConfirmFactCard({ fact, record, onDecide, onUndo }: ConfirmFactCardProps) {
  const decision = record?.decision;
  const task = useJourneyTask();
  const [editing, setEditing] = useState(false);
  const shown = record?.decision === 'edited' ? { ...fact, statement: record.edit } : fact;
  const editor = editing ? (
    <InlineForm fields={[{ name: 'statement', label: `Edit: ${fact.section}`, multiline: true, defaultValue: shown.statement, validate: required('The statement cannot be empty.') }]} submitLabel="Save" onCancel={() => setEditing(false)} busy={task.busy} errors={{ statement: task.error }} onSubmit={({ statement }) => void task.run(() => onDecide('edited', statement), () => setEditing(false))} />
  ) : undefined;
  const actions = decision ? (
    <Button variant="secondary" disabled={task.busy} onClick={() => void task.run(onUndo)}>Undo</Button>
  ) : (
    <>
      <Button onClick={() => void task.run(() => onDecide('accepted'))} disabled={editing || task.busy}>Accept</Button>
      <Button variant="secondary" onClick={() => setEditing(true)} disabled={editing}>Edit</Button>
      <Button variant="secondary" onClick={() => void task.run(() => onDecide('rejected'))} disabled={editing || task.busy}>Reject</Button>
    </>
  );
  return <>{task.error && !editing && <Alert tone="danger">{task.error}</Alert>}<JourneyFactCard fact={shown} decision={decision && decisionLabel[decision]} editor={editor} actions={actions} /></>;
}

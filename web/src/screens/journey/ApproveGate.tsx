import { useState } from 'react';
import { Button, Text } from '../../ui/primitives';
import { InlineForm } from '../../ui/composites/InlineForm';
import { DecisionGate, type GateDecision } from '../../ui/domain/DecisionGate';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import { required } from './validators';
import type { JourneyGate } from './types';

export interface ApproveGateProps {
  gate: JourneyGate;
  decision: GateDecision;
  /** The person approved it and its inputs changed since: it is pending again. */
  stale: boolean;
  approver: string;
  onDecide: (decision: GateDecision) => void;
  onEdit: (draft: string) => void;
}

/**
 * One J5 gate (canvas board J5-Approve-Kit, note n-j5-approve-kit): D17 DecisionGate, compact, with the draft or its
 * edit form as content and Edit as an extra action (Approve waits while editing). Composition only, no styles.
 */
export function ApproveGate({ gate, decision, stale, approver, onDecide, onEdit }: ApproveGateProps) {
  const [editing, setEditing] = useState(false);
  return (
    <DecisionGate
      variant="compact"
      subject={gate.title.toLowerCase()}
      gate={gate.gate}
      title={gate.title}
      builtFrom={gate.builtFrom}
      evidence={gate.evidence.map((f) => <JourneyFactCard key={f.id} fact={f} />)}
      decision={decision}
      approver={approver}
      onDecide={onDecide}
      approveDisabled={editing}
      actions={<Button variant="secondary" onClick={() => setEditing(true)} disabled={editing}>Edit</Button>}
    >
      {stale && <Text variant="small" role="status">Its inputs changed since you approved it: check the draft and approve again.</Text>}
      {editing ? (
        <InlineForm
          fields={[{ name: 'draft', label: `${gate.title} draft`, multiline: true, defaultValue: gate.draft, validate: required('The section cannot be empty.') }]}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={({ draft }) => { onEdit(draft); setEditing(false); }}
        />
      ) : (
        <Text>{gate.draft}</Text>
      )}
    </DecisionGate>
  );
}

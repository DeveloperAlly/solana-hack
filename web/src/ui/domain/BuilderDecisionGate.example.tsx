import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Field } from '../primitives';
import { BuilderDecisionGate, type GateDecision } from './BuilderDecisionGate';

// Draft text from canvas board BB-Gate1-Purpose (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
function Demo() {
  const [decision, setDecision] = useState<GateDecision>({ status: 'pending' });
  return (
    <BuilderDecisionGate
      subject="purpose"
      draftLabel="AI draft · confirm"
      draftMeta="Drafted from 4 sources"
      whyLabel="Why this wording? (optional, saved with the decision)"
      approver="[owner email]"
      decision={decision}
      onDecide={setDecision}
      backHref="/system"
      nextHref="/system"
    >
      <Field label="Purpose statement" multiline rows={3} defaultValue="[Purpose drafted from your answers]" />
    </BuilderDecisionGate>
  );
}

export const example: WorkbenchExample = {
  id: 'D17',
  name: 'BuilderDecisionGate',
  description: 'Pending gate: approve (records who, when, why), request changes with a note, or save and decide later.',
  render: () => <Demo />,
};

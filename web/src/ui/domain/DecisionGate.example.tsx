import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Button, Field, Stack, Text } from '../primitives';
import { DecisionGate, type GateDecision } from './DecisionGate';

// Draft text from canvas boards BB-Gate1-Purpose and J5-Approve-Kit (placeholders; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
const fixedNow = () => '2026-10-12 09:00 UTC';

function Full() {
  const [decision, setDecision] = useState<GateDecision>({ status: 'pending' });
  return (
    <DecisionGate
      subject="purpose"
      draftLabel="AI draft · confirm"
      draftMeta="Drafted from 4 sources"
      whyLabel="Why this wording? (optional, saved with the decision)"
      approver="[owner email]"
      decision={decision}
      onDecide={setDecision}
      back={{ href: '/system' }}
      nextHref="/system"
      now={fixedNow}
    >
      <Field label="Purpose statement" multiline rows={3} defaultValue="[Purpose drafted from your answers]" />
    </DecisionGate>
  );
}

function Compact({ initial, gate, title }: { initial: GateDecision; gate: number; title: string }) {
  const [decision, setDecision] = useState<GateDecision>(initial);
  return (
    <DecisionGate
      variant="compact"
      gate={gate}
      title={title}
      titleLevel={4}
      subject={title.toLowerCase()}
      approver="[owner email]"
      decision={decision}
      onDecide={setDecision}
      builtFrom="2 facts, 1 answer"
      evidence={<Text variant="small">&ldquo;[Quote from your site]&rdquo;</Text>}
      actions={<Button variant="secondary">Edit</Button>}
      now={fixedNow}
    >
      <Text>[Positioning drafted from your sources]</Text>
    </DecisionGate>
  );
}

export const example: WorkbenchExample = {
  id: 'D17',
  name: 'DecisionGate',
  description: 'Full gate (approve, request changes, save and decide later), compact pending card with evidence and Edit, and compact approved card.',
  render: () => (
    <Stack gap={6}>
      <Full />
      <Compact gate={2} title="Positioning" initial={{ status: 'pending' }} />
      <Compact gate={3} title="Voice" initial={{ status: 'approved', by: '[owner email]', at: '2026-10-12 09:00 UTC', why: '[reason]' }} />
    </Stack>
  ),
};

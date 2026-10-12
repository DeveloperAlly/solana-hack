/*
 * Data contract: BB-Gate3-Voice (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-Gate3-Voice, note n-g3;
 * issue #50). Backend map §4, row "Gate 1, Gate 2, Gate 3" (POST …/gates/voice/approve -> decisions, voices). Shape:
 * GateVoiceData in ./types.
 *
 * | Field           | Source                                                                         | Empty |
 * |-----------------|--------------------------------------------------------------------------------|-------|
 * | brand           | brands, profiles                                                               | never |
 * | template        | templates: matched by the BB-6 round 1 pick (kept in the flow)                 | n/a   |
 * | dimensions      | Formality, Energy, Humour from the BB-6 dials (flow); the other five from the template | n/a |
 * | sample          | POST …/draft-section: a paragraph at these settings                            | n/a   |
 * | claims          | voices.claims rules; strictness is a gate with rule checkboxes, not a dial     | n/a   |
 *
 * States: success (pending gate). Approve, Request changes and Save, decide later as on Gate 1.
 */
import { useId, useState } from 'react';
import { Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { CheckboxRow } from '../../ui/composites/CheckboxRow';
import { DataTable } from '../../ui/composites/DataTable';
import { BuilderGateStep } from './BuilderGateStep';
import { useBuilderFlow } from './useBuilderFlow';
import type { GateVoiceData } from './types';

export function BBGate3Voice({ data }: { data: GateVoiceData }) {
  const { voice, dials } = useBuilderFlow('gateVoice');
  const claimsId = useId();
  const [claims, setClaims] = useState(data.claims);
  const dimensions = [{ name: 'Formality', value: dials.formality }, { name: 'Energy', value: dials.energy }, { name: 'Humour', value: dials.humour }, ...data.otherDimensions];
  return (
    <BuilderGateStep flow="gateVoice" gate="voice" brand={data.brand} title="Approve your core voice" draftLabel="Core voice" whyLabel="Why this voice? (optional, saved with the decision)">
      <Text><strong>Core voice:</strong> {data.templates[voice.round1]}, tuned by your picks</Text>
      <DataTable
        caption="Voice dimensions"
        hideCaption
        columns={dimensions.map((d) => ({ key: d.name, header: d.name, cell: () => String(d.value) }))}
        rows={[{ id: 'voice' }]}
        rowKey={(r) => r.id}
      />
      <Card variant="subtle" as="div">
        <Text variant="small"><strong>Sample in this voice</strong></Text>
        <Text>{data.sample}</Text>
      </Card>
      <Card as="div">
        <Stack role="group" aria-labelledby={claimsId} gap={1}>
          <Text variant="label" id={claimsId}>Claims gate ({data.strictness})</Text>
          {claims.map((c) => (
            <CheckboxRow key={c.id} label={c.label} checked={c.checked} onChange={(e) => setClaims((all) => all.map((x) => (x.id === c.id ? { ...x, checked: e.target.checked } : x)))} />
          ))}
        </Stack>
      </Card>
    </BuilderGateStep>
  );
}

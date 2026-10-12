/*
 * Data contract: BB-Gate1-Purpose (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-Gate1-Purpose, note n-g1;
 * issue #50). Backend map §4, row "Gate 1, Gate 2, Gate 3" (POST …/draft-section variants, POST …/gates/purpose/approve ->
 * decisions, kit_sections). Shape: GatePurposeData in ./types.
 *
 * | Field        | Source                                                                       | Empty                        |
 * |--------------|------------------------------------------------------------------------------|------------------------------|
 * | brand        | brands, profiles (approver recorded on the decision)                         | never                        |
 * | draft        | POST …/draft-section (purpose), from the BB-2 and BB-3 answers               | drafting (not reached here)  |
 * | alternatives | POST …/draft-section variants ("Try another draft")                          | button cycles back to draft  |
 * | shorter      | POST …/draft-section ("Make it shorter")                                     | n/a                          |
 * | draftMeta    | count of evidence the draft was built from                                   | n/a                          |
 * | basedOn      | evidence the draft cites                                                     | never: built from answers    |
 *
 * States: success (pending gate). Approve records who, when and why; Request changes needs a note; Save, decide later
 * is allowed, but kit v1 can't be approved until all three gates pass (note n-g1.3). Decisions live in the flow.
 */
import { useState } from 'react';
import { Button, Field, Stack } from '../../ui/primitives';
import { BuilderLabelledCard } from './BuilderLabelledCard';
import { BuilderGateStep } from './BuilderGateStep';
import type { GatePurposeData } from './types';

export function BBGate1Purpose({ data }: { data: GatePurposeData }) {
  const drafts = [data.draft, ...data.alternatives];
  const [draft, setDraft] = useState(data.draft);
  const another = () => setDraft(drafts[(drafts.indexOf(draft) + 1) % drafts.length]);
  return (
    <BuilderGateStep
      flow="gatePurpose"
      gate="purpose"
      brand={data.brand}
      title="Approve your purpose"
      intro="Nothing downstream is written until you approve this. Edit it until it sounds true."
      draftLabel="AI draft · confirm"
      draftMeta={data.draftMeta}
      whyLabel="Why this wording? (optional, saved with the decision)"
    >
      <Field label="Purpose statement" multiline rows={3} value={draft} onChange={(e: { target: { value: string } }) => setDraft(e.target.value)} />
      <BuilderLabelledCard label="Based on" lines={data.basedOn} />
      {/* INTEGRATION: POST /api/brands/:id/draft-section (purpose variants) (backend map §4, row "Gate 1, Gate 2, Gate 3"). */}
      <Stack direction="row" gap={3} wrap>
        <Button variant="secondary" onClick={another}>Try another draft</Button>
        <Button variant="secondary" onClick={() => setDraft(data.shorter)}>Make it shorter</Button>
      </Stack>
    </BuilderGateStep>
  );
}

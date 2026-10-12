import { Button, Field, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { AmbSelect } from '../../../ui/domain/AmbSelect';
import type { DraftState } from '../useDraft';
import type { GenerateData } from '../types';

export interface GenerateControlsProps {
  draft: DraftState;
  formats: GenerateData['formats'];
}

/** Generate, left rail (canvas Amb-3): format, your angle, Regenerate (keeps the angle) and the save note (canvas note n-a3). */
export function GenerateControls({ draft, formats }: GenerateControlsProps) {
  return (
    <Card as="div">
      <AmbSelect label="Format" options={formats.map((f) => ({ value: f.id, label: f.label }))} value={draft.format} onChange={draft.setFormat} />
      <Field label="Your angle" multiline rows={5} hint="Your own story makes it yours. We keep the brand voice." value={draft.angle} onChange={(e) => draft.setAngle(e.target.value)} />
      <Button variant="secondary" onClick={draft.regenerate}>Regenerate</Button>
      <Text variant="small" tone="secondary" role="status">{draft.note}</Text>
    </Card>
  );
}

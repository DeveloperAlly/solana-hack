import { Select, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { pieceLabel } from '../copy';
import type { DraftState } from '../useDraft';
import type { GenerateData } from '../types';
import { AngleField } from './AngleField';

export interface GenerateControlsProps {
  draft: DraftState;
  formats: GenerateData['formats'];
}

/** Generate, left rail (canvas Amb-3): the piece's format, your angle and the save note (canvas note n-a3). */
export function GenerateControls({ draft, formats }: GenerateControlsProps) {
  return (
    <Card as="div">
      <Select label="Format" options={formats.map((f) => ({ value: f.id, label: pieceLabel(f) }))} value={draft.format} onValueChange={draft.setFormat} />
      <AngleField draft={draft} multiline />
      <Text variant="small" tone="secondary" role="status">{draft.note}</Text>
    </Card>
  );
}

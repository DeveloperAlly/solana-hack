import { Button, Link, Text } from '../../../ui/primitives';
import { AmbOnBrandMeter } from '../../../ui/domain/AmbOnBrandMeter';
import { AmbChecksList } from '../../../ui/domain/AmbChecksList';
import type { DraftState } from '../useDraft';
import { InfoCard } from './InfoCard';

export interface ChecksPanelProps {
  draft: DraftState;
  threshold: number;
  publishHref: string;
  onPublish: () => void;
}

/** Generate, right rail (canvas Amb-3): on-brand meter, open flags with one-click fixes, and Continue (unlocks per note n-a3). */
export function ChecksPanel({ draft, threshold, publishHref, onPublish }: ChecksPanelProps) {
  return (
    <InfoCard title="On-brand">
      <AmbOnBrandMeter score={draft.score} threshold={threshold} hint={`Publishing unlocks at ${threshold}% with no banned claims.`} />
      <AmbChecksList checks={draft.open} onFix={draft.fix} />
      <Button onClick={onPublish} disabled={!draft.canPublish}>Continue to publish</Button>
      <Text variant="small"><Link href={publishHref}>Prototype: skip ahead (flags fixed)</Link></Text>
    </InfoCard>
  );
}

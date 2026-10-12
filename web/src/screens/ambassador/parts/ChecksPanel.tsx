import type { ReactNode } from 'react';
import { AmbOnBrandMeter } from '../../../ui/domain/AmbOnBrandMeter';
import { AmbChecksList } from '../../../ui/domain/AmbChecksList';
import type { DraftState } from '../useDraft';
import { InfoCard } from './InfoCard';

export interface ChecksPanelProps {
  draft: DraftState;
  threshold: number;
  generating: boolean;
  /** The draft's actions, below the flags (DraftActions). */
  actions: ReactNode;
}

/** Generate, right rail (canvas Amb-3): on-brand meter, open flags with one-click fixes, then the actions slot. */
export function ChecksPanel({ draft, threshold, generating, actions }: ChecksPanelProps) {
  return (
    <InfoCard title="On-brand">
      <AmbOnBrandMeter score={draft.score} threshold={threshold} below={draft.scoreBlocks} hint={`Publishing unlocks at ${threshold}% with no banned claims and the disclosure added.`} />
      <AmbChecksList checks={draft.checks} onFix={draft.fix} disabled={generating} />
      {actions}
    </InfoCard>
  );
}

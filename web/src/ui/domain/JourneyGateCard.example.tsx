import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { ExampleGrid } from '../../system/ExampleLayout';
import { JourneyGateCard, type JourneyGateDecision } from './JourneyGateCard';
import { JourneyQuote } from './JourneyQuote';

// Gate copy from canvas board J5-Approve-Kit (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #48).
function Demo({ approved, gate, title }: { approved?: boolean; gate: number; title: string }) {
  const [draft, setDraft] = useState(`[${title} drafted from 2 facts and your answer]`);
  const [decision, setDecision] = useState<JourneyGateDecision | undefined>(approved ? { by: '[approver]', at: '[time]' } : undefined);
  return (
    <JourneyGateCard
      gate={gate}
      title={title}
      draft={draft}
      builtFrom="2 facts, 1 answer"
      evidence={<JourneyQuote size="xs">Your approved kit and approved posts are registered on Solana, so anyone can check what really came from you.</JourneyQuote>}
      decision={decision}
      onApprove={(why) => setDecision({ by: '[approver]', at: '[time]', why: why || undefined })}
      onEdit={setDraft}
      onReopen={() => setDecision(undefined)}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'D17',
  name: 'JourneyGateCard',
  description: 'Pending (Approve, Edit, why) and approved (who, when, Change).',
  render: () => (
    <ExampleGrid>
      <Demo gate={1} title="Purpose" />
      <Demo approved gate={3} title="Voice" />
    </ExampleGrid>
  ),
};

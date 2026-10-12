/*
 * Data contract: BB-Gate2-Positioning (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-Gate2-Positioning,
 * note n-g2; issue #50). Backend map §4, row "Gate 1, Gate 2, Gate 3" (POST …/draft-section, POST …/gates/positioning/approve).
 * Shape: GatePositioningData in ./types.
 *
 * | Field       | Source                                                                      | Empty   |
 * |-------------|-----------------------------------------------------------------------------|---------|
 * | brand       | brands, profiles                                                            | never   |
 * | draft       | POST …/draft-section from the option picked on BB-4 (kept in the flow)      | n/a     |
 * | alternative | evidence: the BB-4 "alternatives" answer                                     | bracket |
 * | edge        | evidence: the BB-4 "edge" answer                                             | bracket |
 * | sourcesNote | the answers and public competitor pages the draft cites                     | n/a     |
 *
 * States: success (pending gate). Approve, Request changes and Save, decide later as on Gate 1.
 */
import { Field, Grid, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { BuilderGateStep } from './BuilderGateStep';
import { useBuilderFlow } from './useBuilderFlow';
import type { GatePositioningData } from './types';

export function BBGate2Positioning({ data }: { data: GatePositioningData }) {
  const { positioningOption } = useBuilderFlow('gatePositioning');
  return (
    <BuilderGateStep
      flow="gatePositioning"
      gate="positioning"
      brand={data.brand}
      title="Approve your positioning"
      draftLabel={positioningOption ? `AI draft from option ${positioningOption} · confirm` : 'AI draft · confirm'}
      whyLabel="Why this position? (optional, saved with the decision)"
      backLabel="Back to options"
    >
      <Field label="Positioning statement" multiline rows={3} defaultValue={data.draft} />
      <Grid min="sm" gap={4}>
        <Card variant="subtle" as="div"><Text variant="small"><strong>Alternative named</strong></Text><Text variant="small">{data.alternative}</Text></Card>
        <Card variant="subtle" as="div"><Text variant="small"><strong>Your edge</strong></Text><Text variant="small">{data.edge}</Text></Card>
      </Grid>
      <Text variant="small" tone="secondary">{data.sourcesNote}</Text>
    </BuilderGateStep>
  );
}

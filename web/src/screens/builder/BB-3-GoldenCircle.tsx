/*
 * Data contract: BB-3-GoldenCircle (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-3-GoldenCircle,
 * note n-bb3; issue #50). Backend map §4, row "BB-2 to BB-6". Shape: GoldenCircleData in ./types.
 *
 * | Field     | Source                                                                         | Empty            |
 * |-----------|--------------------------------------------------------------------------------|------------------|
 * | brand     | brands, profiles                                                               | never            |
 * | questions | GET …/interview/next (what / how / why); answers POST …/interview/answer         | blank textareas  |
 *
 * States: success. Outside in, "why" emphasised; "Draft my purpose" leads to Gate 1 (note n-bb3.2), where
 * POST …/draft-section drafts the purpose.
 */
import { Button } from '../../ui/primitives';
import { BuilderAnswers } from './BuilderAnswers';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { useBuilderFlow } from './useBuilderFlow';
import type { GoldenCircleData } from './types';

export function BB3GoldenCircle({ data }: { data: GoldenCircleData }) {
  const { back, next, skip } = useBuilderFlow('goldenCircle');
  return (
    <BuilderStep
      flow="goldenCircle"
      brand={data.brand}
      tag="FALLBACK"
      title="What, how and why"
      intro="Start from the outside in. One or two sentences each."
      estimate="About 2 minutes · then Gate 1: Purpose"
      footer={
        <BuilderStepFooter back={back} skip={skip ? { href: skip, label: "Skip, draft from what you've told us" } : undefined}>
          <Button href={next ?? ''}>Draft my purpose</Button>
        </BuilderStepFooter>
      }
    >
      <BuilderAnswers answers={data.questions} layout="grid" />
    </BuilderStep>
  );
}

/*
 * Data contract: BB-2-Origin (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-2-Origin, note n-bb2;
 * issue #50). Backend map §4, row "BB-2 to BB-6" (GET …/interview/next, POST …/interview/answer). Shape: OriginData.
 *
 * | Field        | Source                                                                 | Empty                              |
 * |--------------|------------------------------------------------------------------------|------------------------------------|
 * | brand        | brands, profiles                                                       | never                              |
 * | fact         | evidence (a found fact with its source) from GET …/interview/next      | box hidden when nothing was found  |
 * | answers      | GET …/interview/next (questions); answers POST …/interview/answer;     | blank textareas                    |
 * |              | saved as evidence "owner answer, [date]" (note n-bb2.4)                 |                                    |
 *
 * States: success. "Record voice" needs speech-to-text (backend map G-VOICE-INPUT), so it says typing is the way for now.
 */
import { useState } from 'react';
import { Alert, Button, Stack } from '../../ui/primitives';
import { ToggleGroup } from '../../ui/composites/ToggleGroup';
import { BuilderFactConfirm } from '../../ui/domain/BuilderFactConfirm';
import { BuilderAnswers } from './BuilderAnswers';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { useBuilderFlow } from './useBuilderFlow';
import type { OriginData } from './types';

const modes = [{ id: 'type', label: 'Type' }, { id: 'voice', label: 'Record voice' }];

export function BB2Origin({ data }: { data: OriginData }) {
  const { back, next, skip } = useBuilderFlow('origin');
  const [mode, setMode] = useState(['type']);
  return (
    <BuilderStep
      flow="origin"
      brand={data.brand}
      tag="FALLBACK"
      title="How it started"
      intro="Talk or type. Short answers are fine; we draft from them and you approve."
      estimate="About 3 minutes for this step · about 12 left"
      footer={<BuilderStepFooter back={back} skip={skip ? { href: skip, label: 'Skip for now' } : undefined}><Button href={next ?? ''}>Continue</Button></BuilderStepFooter>}
    >
      <Stack gap={3}>
        <ToggleGroup label="Answer mode" options={modes} value={mode} onChange={setMode} />
        {mode[0] === 'voice' && <Alert tone="info" title="Recording isn't available yet">Type your answers for now; voice answers come later.</Alert>}
      </Stack>
      {/* INTEGRATION: confirming saves the fact as evidence via POST /api/brands/:id/interview/answer (backend map §4). */}
      {data.fact && <BuilderFactConfirm source={data.fact.source} fact={data.fact.text} />}
      <BuilderAnswers answers={data.answers} />
    </BuilderStep>
  );
}

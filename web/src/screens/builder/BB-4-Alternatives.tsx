/*
 * Data contract: BB-4-Alternatives (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-4-Alternatives,
 * note n-bb4; issue #50). Backend map §4, row "BB-2 to BB-6" (POST …/draft-section for the options; Exa /search for
 * competitor pages). Shape: AlternativesData in ./types.
 *
 * | Field       | Source                                                                         | Empty                      |
 * |-------------|--------------------------------------------------------------------------------|----------------------------|
 * | brand       | brands, profiles                                                               | never                      |
 * | questions   | GET …/interview/next (alternatives, edge); POST …/interview/answer              | blank textareas            |
 * | optionSets  | POST …/draft-section (three positioning options, each with sources)            | loading while drafting     |
 * | sourcesNote | Sources behind the options (owner answers, public competitor pages)            | n/a                        |
 *
 * States: success; loading (option cards drafting; the note marks it [not drawn]). The pick is kept in the flow and
 * Gate 2 drafts from it. "Show three different options" moves to the next set.
 */
import { useState } from 'react';
import { Button, Text } from '../../ui/primitives';
import { StatePanel } from '../../ui/composites/StatePanel';
import { BuilderChoiceCards } from '../../ui/domain/BuilderChoiceCards';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { BuilderAnswers } from './BuilderAnswers';
import { BuilderSection } from './BuilderSection';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { useBuilderFlow } from './useBuilderFlow';
import type { AlternativesData } from './types';

export function BB4Alternatives({ data, state = 'success' }: { data: AlternativesData; state?: ScreenState }) {
  const { back, next, skip, positioningOption, choosePositioning } = useBuilderFlow('alternatives');
  const [setIndex, setSetIndex] = useState(0);
  const options = data.optionSets[setIndex];
  const selected = options.some((o) => o.value === positioningOption) ? positioningOption : options[0].value;
  function moreOptions() {
    // INTEGRATION: POST /api/brands/:id/draft-section (positioning, three more) (backend map §4, row "BB-2 to BB-6").
    const i = (setIndex + 1) % data.optionSets.length;
    setSetIndex(i);
    choosePositioning(data.optionSets[i][0].value);
  }
  return (
    <BuilderStep
      flow="alternatives"
      brand={data.brand}
      tag="FALLBACK"
      title="Alternatives and your edge"
      estimate="About 3 minutes · then Gate 2: Positioning"
      footer={
        <BuilderStepFooter back={back} skip={skip ? { href: skip, label: 'Skip for now' } : undefined}>
          <Button href={next ?? ''} onClick={() => choosePositioning(selected)}>Continue with option {selected}</Button>
        </BuilderStepFooter>
      }
    >
      <BuilderAnswers answers={data.questions} />
      <BuilderSection title="Three ways to position it" badge="AI drafts · pick one">
        <Text variant="small" tone="secondary">{data.sourcesNote}</Text>
        {state === 'loading' ? (
          <StatePanel kind="loading" title="Drafting three options" body="Reading your answers and public competitor pages." />
        ) : (
          <BuilderChoiceCards legend="Positioning options" options={options} value={selected} onChange={choosePositioning} />
        )}
        <div><Button variant="secondary" onClick={moreOptions} disabled={state === 'loading'}>Show three different options</Button></div>
      </BuilderSection>
    </BuilderStep>
  );
}

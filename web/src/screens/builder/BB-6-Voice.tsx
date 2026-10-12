/*
 * Data contract: BB-6-Voice (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-6-Voice, note n-bb6;
 * issue #50). Backend map §4, row "BB-2 to BB-6" (POST …/draft-section for the samples). Shape: VoiceData in ./types.
 *
 * | Field     | Source                                                                                  | Empty   |
 * |-----------|-----------------------------------------------------------------------------------------|---------|
 * | brand     | brands, profiles                                                                        | never   |
 * | round1    | POST …/draft-section: one message at three templates (research 06 voice templates)       | n/a     |
 * | round2    | POST …/draft-section: three variants around the round 1 pick                             | n/a     |
 * | templates | templates table: the template each round 1 pick matches                                 | n/a     |
 * | dials     | The three intake dials of the 9 voice dimensions (Formality, Energy, Humour)             | n/a     |
 *
 * States: success. Picks and dials are kept in the flow, so Gate 3 shows the voice they make.
 */
import { Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { ChoiceCards } from '../../ui/composites/ChoiceCards';
import { Scale } from '../../ui/composites/Scale';
import { BuilderSection } from './BuilderSection';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { useBuilderFlow } from './useBuilderFlow';
import type { VoiceData } from './types';

export function BB6Voice({ data }: { data: VoiceData }) {
  const { back, next, skip, voice, pickVoice, dials, setDials } = useBuilderFlow('voice');
  const round2 = data.round2[voice.round1] ?? [];
  return (
    <BuilderStep
      flow="voice"
      brand={data.brand}
      tag="FALLBACK"
      title="Pick the one that sounds like you"
      intro="Same message, three ways. Choose by ear, not by adjective."
      estimate="About 3 minutes · then Gate 3: Voice"
      footer={<BuilderStepFooter back={back} skip={skip} skipLabel="Skip, use the template as is" next={{ label: 'Continue', href: next }} />}
    >
      <ChoiceCards legend="Round 1 of 2" options={data.round1} value={voice.round1} onChange={(r1) => pickVoice({ round1: r1, round2: data.round2[r1]?.[0]?.value ?? '' })} />
      <ChoiceCards legend="Round 2 of 2 (closer to your first pick)" options={round2} value={voice.round2} onChange={(r2) => pickVoice({ ...voice, round2: r2 })} />
      <Card as="div">
        <BuilderSection title="Fine-tune three dials">
          {data.dials.map((d) => (
            <Scale key={d.key} legend={d.legend} startLabel={d.low} endLabel={d.high} value={dials[d.key]} onChange={(v) => setDials({ ...dials, [d.key]: v })} />
          ))}
          <Text variant="small" tone="secondary">
            The other five dimensions and the claims gate start from the template your picks matched ({data.templates[voice.round1]}). Change them later in Voices.
          </Text>
        </BuilderSection>
      </Card>
    </BuilderStep>
  );
}

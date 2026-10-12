/*
 * Data contract: J4-Gaps-Voice, "Gaps + voice by example (AHA 3)" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J4-Gaps-Voice, note n-j4-gaps-voice; issue #48). Shape: GapsVoiceData in ./types. Backend map:
 * .agentic/what/context/backend_map.md §4, row "BB-2 to BB-6".
 *
 * | Field          | Source                                                                                        | Empty when |
 * |----------------|-----------------------------------------------------------------------------------------------|------------|
 * | brandName      | `brands.name`, GET /api/brands/:id                                                            | never      |
 * | alternatives   | POST …/draft-section at BB-4 (Exa /search competitor research, H6 #35), each with its source  | options [] when research finds none: add your own |
 * | edgeQuestion, originQuestion, originNote | GET …/interview/next: only the "Needs you" sections are asked         | absent once covered |
 * | voice.rounds   | POST …/draft-section (BB-6 samples): 3 paragraphs written from the site, round 2 around the pick | never      |
 *
 * Answers, alternatives and picks persist through useJourneyFlow (INTEGRATION there: PUT /api/brands/:id/answers/:step).
 * Nothing is preselected. J5 opens once both questions are answered and the voice is set (a round 2 pick, or one sentence).
 * States: success only (the board draws one state and its note names no others).
 */
import { Field, Heading, Select, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { EvidenceChip } from '../../ui/domain/EvidenceChip';
import { JourneyAddableToggles } from '../../ui/domain/JourneyAddableToggles';
import { GapsVoicePicker } from './GapsVoicePicker';
import { JourneyNextButton } from './JourneyNextButton';
import { JourneyStepFrame } from './JourneyStepFrame';
import { useJourneyHref } from './paths';
import { useJourneyFlow, voiceDone } from './useJourneyFlow';
import type { GapsVoiceData } from './types';

export function J4GapsVoice({ data }: { data: GapsVoiceData }) {
  const to = useJourneyHref();
  const { selections, actions, live, busy } = useJourneyFlow('gapsVoice');
  const alt = data.alternatives;
  const options = [...alt.options, ...selections.customAlternatives];
  const answer = (id: string) => ({ value: selections.answers[id] ?? '', onChange: (e: { target: { value: string } }) => actions.setAnswer(id, e.target.value) });
  const questions = data.questions?.filter(q => q.kind === 'missing' && q.id !== 'voice.template') ?? [];
  const voiceSet = selections.voice.mode === 'sentence' ? Boolean(selections.voice.sentence.trim()) : Boolean(selections.voice.picks[2]);
  const ready = live ? voiceSet && questions.every(q => q.optional || selections.answers[q.id]?.trim()) : voiceDone(selections);
  return (
    <JourneyStepFrame step="gapsVoice" title={live ? `${questions.length} questions, then your voice` : 'Two questions, then your voice'} footer={<JourneyNextButton href={to('approveKit')} ready={ready && !busy} onGo={actions.finishGaps} hint="Answer both questions, then pick a voice in round 2 or write one sentence.">Review my kit</JourneyNextButton>}>
      {!live && <><Card labelledBy="gaps-q1" header={<><Heading level={2} size="lg" id="gaps-q1">1. {alt.question}</Heading><EvidenceChip status="needs-you" /></>}>
        <Text variant="small" tone="secondary">{alt.hint}</Text>
        <JourneyAddableToggles
          label={`Alternatives to ${data.brandName}`}
          options={options}
          selected={selections.alternatives}
          onChange={actions.setAlternatives}
          onAdd={actions.addAlternative}
          addLabel="Another alternative"
        />
        <Text variant="small">Compared against: {selections.alternatives.join(', ') || 'none picked yet'}</Text>
        <Text variant="caption" tone="secondary">{alt.source}</Text>
        <Field label={data.edgeQuestion} multiline rows={2} placeholder="[owner answer]" {...answer('edge')} />
      </Card>
      <Card labelledBy="gaps-q2" header={<><Heading level={2} size="lg" id="gaps-q2">2. {data.originQuestion}</Heading><EvidenceChip status="needs-you" /></>}>
        <Field label="Your answer" multiline rows={2} placeholder="[owner answer, typed or recorded]" hint={data.originNote} {...answer('origin')} />
      </Card>
      </>}
      {live && questions.map((q, i) => <Card key={q.id} header={<Heading level={2} size="lg">{i + 1}. {q.question}</Heading>}><Field label={q.question} multiline rows={2} hint={q.optional ? 'Optional' : undefined} {...answer(q.id)} /></Card>)}
      <GapsVoicePicker voice={data.voice} />
      {live && <Select label="Claims gate" value={selections.answers.claims || '5'} options={[{ value: '5', label: 'Strict: every claim needs evidence' }, { value: '4', label: 'Standard' }, { value: '3', label: 'Light' }]} onValueChange={v => actions.setAnswer('claims', v)} />}
    </JourneyStepFrame>
  );
}

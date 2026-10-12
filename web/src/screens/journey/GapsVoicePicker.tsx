import { useJourneyTask } from './useJourneyTask';
import { Alert, Badge, Button, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { JourneyAha } from '../../ui/domain/JourneyAha';
import { ChoiceCards } from '../../ui/composites/ChoiceCards';
import { InlineForm } from '../../ui/composites/InlineForm';
import { useDisclosure } from '../../ui/hooks/useDisclosure';
import { useJourneyFlow } from './useJourneyFlow';
import { required } from './validators';
import type { GapsVoiceData } from './types';

/**
 * J4's voice by example (canvas board J4-Gaps-Voice, note n-j4-gaps-voice 2 and 3): pick one of three paragraphs, twice,
 * or write one sentence instead. Picks and the sentence are one choice in useJourneyFlow (VoiceChoice), never both. Composition only, no styles.
 */
export function GapsVoicePicker({ voice }: { voice: GapsVoiceData['voice'] }) {
  const task = useJourneyTask();
  const { selections, actions } = useJourneyFlow('gapsVoice');
  const sentence = useDisclosure();
  const v = selections.voice;
  // In sentence mode no card is picked; picking one switches back to picks and drops the sentence (one state shape).
  const round = v.mode === 'picks' ? v.round : 1;
  const pick = v.mode === 'picks' ? v.picks[round] ?? '' : '';
  const sentenceText = v.mode === 'sentence' ? v.sentence : '';
  return (
    <Card variant="selected" as="div">
      <ChoiceCards
        legendSize="lg"
        key={round}
        legend={<>Which sounds most like you? <Badge>Round {round} of 2</Badge></>}
        options={voice.rounds[round - 1]}
        value={pick}
        onChange={(v) => void task.run(() => actions.pickVoice(round, v))}
      />
      <Text variant="small" tone="secondary">{voice.intro}</Text>
      {pick && <JourneyAha n={3}>That sounds like us.</JourneyAha>}
      {sentence.open && (
        <InlineForm fields={[{ name: 'sentence', label: 'Your voice in one sentence', multiline: true, defaultValue: sentenceText, validate: required('Write one sentence first.') }]} submitLabel="Use this" onCancel={sentence.hide} busy={task.busy} errors={{ sentence: task.error }} onSubmit={({ sentence: text }) => void task.run(() => actions.setVoiceSentence(text), sentence.hide)} />
      )}
      {sentenceText && !sentence.open && <Text variant="small">Your sentence: "{sentenceText}"</Text>}
      {task.error && !sentence.open && <Alert tone="danger">{task.error}</Alert>}
      <Stack direction="row" gap={2} wrap>
        {round === 1 && <Button onClick={() => void task.run(() => actions.setVoiceRound(2))} disabled={!pick || task.busy}>Next round</Button>}
        {round === 2 && <Button variant="secondary" disabled={task.busy} onClick={() => void task.run(() => actions.setVoiceRound(1))}>Back to round 1</Button>}
        {!sentence.open && <Button variant="secondary" onClick={sentence.show}>None of these: write one sentence</Button>}
      </Stack>
    </Card>
  );
}

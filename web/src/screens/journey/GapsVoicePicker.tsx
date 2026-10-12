import { Badge, Button, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { JourneyAha } from '../../ui/domain/JourneyAha';
import { JourneyChoiceCards } from '../../ui/domain/JourneyChoiceCards';
import { JourneyInlineForm } from '../../ui/domain/JourneyInlineForm';
import { useDisclosure } from '../../ui/hooks/useDisclosure';
import { useJourneyFlow } from './useJourneyFlow';
import { required } from './validators';
import type { GapsVoiceData } from './types';

/**
 * J4's voice by example (canvas board J4-Gaps-Voice, note n-j4-gaps-voice 2 and 3): pick one of three paragraphs, twice,
 * or write one sentence instead. Picks live in useJourneyFlow. Composition only, no styles.
 */
export function GapsVoicePicker({ voice }: { voice: GapsVoiceData['voice'] }) {
  const { selections, actions } = useJourneyFlow('gapsVoice');
  const sentence = useDisclosure();
  const round = selections.voiceRound;
  const pick = selections.voicePicks[round] ?? '';
  return (
    <Card variant="selected" as="div">
      <JourneyChoiceCards
        key={round}
        legend={<>Which sounds most like you? <Badge>Round {round} of 2</Badge></>}
        options={voice.rounds[round - 1]}
        value={pick}
        onChange={(v) => actions.pickVoice(round, v)}
      />
      <Text variant="small" tone="secondary">{voice.intro}</Text>
      {pick && <JourneyAha n={3}>That sounds like us.</JourneyAha>}
      {sentence.open && (
        <JourneyInlineForm label="Your voice in one sentence" submitLabel="Use this" multiline defaultValue={selections.voiceSentence} validate={required('Write one sentence first.')} onCancel={sentence.hide} onSubmit={(v) => { actions.setVoiceSentence(v); sentence.hide(); }} />
      )}
      {selections.voiceSentence && !sentence.open && <Text variant="small">Your sentence: "{selections.voiceSentence}"</Text>}
      <Stack direction="row" gap={2} wrap>
        {round === 1 && <Button onClick={() => actions.setVoiceRound(2)} disabled={!pick}>Next round</Button>}
        {round === 2 && <Button variant="secondary" onClick={() => actions.setVoiceRound(1)}>Back to round 1</Button>}
        {!sentence.open && <Button variant="secondary" onClick={sentence.show}>None of these: write one sentence</Button>}
      </Stack>
    </Card>
  );
}

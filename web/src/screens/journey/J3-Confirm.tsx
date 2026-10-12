/*
 * Data contract: J3-Confirm, "Confirm: prefilled cards (AHA 2)" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J3-Confirm, note n-j3-confirm; issue #48). Shape: ConfirmData in ./types. Backend map:
 * .agentic/what/context/backend_map.md §4, rows "Coverage-Map" and "Gate 1, Gate 2, Gate 3".
 *
 * | Field         | Source                                                                                            | Empty when |
 * |---------------|---------------------------------------------------------------------------------------------------|------------|
 * | facts[]       | `evidence` rows per kit section with their quote, via GET /api/brands/:id (web/worker/api.ts, brandState) | [] for an empty site (J1 sends it to J4) |
 * | voice         | The partly found voice section (`kit_sections` row, status inferred)                                | never      |
 * | missing       | Sections with no evidence: GET /api/brands/:id/coverage ("Needs you")                               | absent once covered |
 * | readinessBase | GET /api/brands/:id/coverage before confirming                                                      | 0          |
 * | questionsLeft, timeLeft | Count of "Needs you" sections; the board's time estimate                                 | 0          |
 * | deferredNote  | Static copy (decision D2: 11 sections deferred to Brand > Kit)                                      | never      |
 *
 * Accept, Edit and Reject persist through useJourneyFlow (INTEGRATION there: PUT and POST /api/brands/:id/sections/...).
 * J4 opens only once every found card has a decision (accepted, edited or rejected).
 * Readiness here rises from the base by an equal share for each card confirmed, across the six cards; the live
 * figure comes from the coverage endpoint. States: success only (the board draws one state and its note names no others).
 */
import { Grid, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import { JourneyAha } from '../../ui/domain/JourneyAha';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import { ProgressBar } from '../../ui/composites/ProgressBar';
import { ConfirmFactCard } from './ConfirmFactCard';
import { JourneyNextButton } from './JourneyNextButton';
import { JourneyStepFrame } from './JourneyStepFrame';
import { useJourneyHref } from './paths';
import { useJourneyFlow } from './useJourneyFlow';
import type { ConfirmData } from './types';

export function J3Confirm({ data }: { data: ConfirmData }) {
  const to = useJourneyHref();
  const { selections, actions } = useJourneyFlow('confirm');
  const decided = data.facts.every((f) => selections.facts[f.id]);
  const hint = 'Accept, edit or reject each card first.';
  const confirmed = data.facts.filter((f) => ['accepted', 'edited'].includes(selections.facts[f.id]?.decision ?? '')).length;
  const cards = data.facts.length + 2;
  const readiness = data.readinessBase + Math.round(((100 - data.readinessBase) * confirmed) / cards);
  return (
    <JourneyStepFrame
      step="confirm"
      title="Confirm what we found"
      intro="Accept, edit or reject. Every card shows the line it came from. We'll only ask about what's missing."
      footer={
        <>
          <Text><strong>{confirmed} confirmed</strong> · {data.questionsLeft} questions left · {data.timeLeft}</Text>
          <JourneyNextButton href={to('gapsVoice')} ready={decided} hint={hint}>Answer {data.questionsLeft} questions</JourneyNextButton>
        </>
      }
    >
      <Card as="div">
        <SampleFlag />
        <ProgressBar showLabel label={`Kit readiness ${readiness}%`} segments={[{ value: readiness, label: 'Ready' }]} caption="Rises as you confirm. Kit v1 needs the 3 gates; nothing else blocks it." />
      </Card>
      <JourneyAha n={2}>I'm confirming, not typing.</JourneyAha>
      <Grid min="lg" gap={4}>
        {data.facts.map((f) => (
          <ConfirmFactCard
            key={f.id}
            fact={f}
            record={selections.facts[f.id]}
            onDecide={(d, edit) => actions.decideFact(f.id, d, edit)}
            onUndo={() => actions.undoFact(f.id)}
          />
        ))}
        <JourneyFactCard fact={data.voice} actions={<JourneyNextButton href={to('gapsVoice')} ready={decided} hint={hint}>Pick by example</JourneyNextButton>} />
        <JourneyFactCard fact={data.missing} variant="dashed" />
      </Grid>
      <Text variant="small" tone="secondary">{data.deferredNote}</Text>
    </JourneyStepFrame>
  );
}

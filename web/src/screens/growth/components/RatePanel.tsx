import { useId } from 'react';
import { Card } from '../../../ui/composites/Card';
import { EventProofStep } from '../../../ui/domain/EventProofStep';
import { EventRatingFields } from '../../../ui/domain/EventRatingFields';
import { Alert, Button, Heading, Text } from '../../../ui/primitives';
import { currentVersion, overallScore } from '../../../domain/rating';
import type { EventRatingFlow } from '../useEventRating';

/** "Rate this event": closed until the event ends; then prove you went, five questions and a line; or your rating. */
export function RatePanel({ flow }: { flow: EventRatingFlow }) {
  const id = useId();
  const body = () => {
    if (!flow.open) return <Text tone="secondary">Rating opens after the event ends.</Text>;
    if (flow.mine && !flow.editing) {
      return (
        <>
          <Alert tone="success" title={`You rated it ${overallScore(currentVersion(flow.mine).scores).toFixed(1)} of 5`}>
            {currentVersion(flow.mine).line} Saved here as a preview: registering on Solana is not built yet, so nothing was registered.
            {flow.mine.versions.length > 1 && ` Version ${flow.mine.versions.length}; your earlier versions stay visible.`}
          </Alert>
          <div><Button variant="secondary" onClick={flow.startEdit}>Edit my rating</Button></div>
        </>
      );
    }
    return (
      <>
        <Text variant="small" tone="secondary">Step 1: prove you went. Step 2: five questions and a line.</Text>
        <EventProofStep proof={flow.proof} onLuma={flow.proveWithLuma} onEmail={flow.proveWithEmail} onReset={flow.resetProof} />
        <EventRatingFields locked={flow.proof.status !== 'proven'} scores={flow.scores} onScore={flow.setScore} line={flow.line} onLine={flow.setLine}
          gate={flow.gate} onRegister={flow.register} registerLabel={flow.editing ? 'Register my edit' : 'Register my rating'} />
      </>
    );
  };
  return (
    <Card labelledBy={id}>
      <Heading level={2} size="lg" id={id}>Rate this event</Heading>
      {body()}
    </Card>
  );
}

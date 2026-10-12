import { Grid, Heading, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';

/** What JamJam does, one card per step of the loop (build, run, grow, prove). */
export function GrowthLoopGrid({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <Grid as="ul" min="sm" gap={4}>
      {steps.map((s) => (
        <Card key={s.title} as="li">
          <Heading level={3} size="lg">{s.title}</Heading>
          <Text tone="secondary">{s.body}</Text>
        </Card>
      ))}
    </Grid>
  );
}

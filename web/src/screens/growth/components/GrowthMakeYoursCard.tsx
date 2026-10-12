import { Button, Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';

/** "Make yours on JamJam": the call to action a badge visitor sees under the verified post (the flywheel). */
export function GrowthMakeYoursCard({ href }: { href: string }) {
  return (
    <Card variant="subtle" as="div">
      <Stack gap={3}>
        <Heading level={2} size="lg">Make yours on JamJam</Heading>
        <Text tone="secondary">Build your brand kit free, write in your own voice, and let anyone check that a post is really yours.</Text>
        <div>
          <Button href={href}>Build your brand free</Button>
        </div>
      </Stack>
    </Card>
  );
}

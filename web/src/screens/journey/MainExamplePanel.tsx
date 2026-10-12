import { Badge, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import { useJourneyHref } from './paths';
import type { MainExample } from './types';

/**
 * Main's right panel (canvas board Main, "Real example: JamJam built itself"; issue #48): JamJam's own kit facts and
 * its first post, with Check it yourself. Rendered only when `example` exists; composition only, no styles.
 */
export function MainExamplePanel({ example }: { example: MainExample }) {
  const to = useJourneyHref();
  return (
    <Card variant="selected" labelledBy="main-example" header={<><Text as="strong" id="main-example">{example.title}</Text><Badge>{example.kitChip}</Badge></>}>
      {example.facts.map(({ fact, decision }) => (
        <JourneyFactCard key={fact.id} fact={fact} decision={decision} />
      ))}
      <Card variant="subtle" as="div">
        <Text variant="small"><strong>{example.post.title}</strong></Text>
        <Text variant="small">{example.post.text}</Text>
        <Stack direction="row" gap={2} wrap>
          {example.post.badges.map((b) => <Badge key={b.label} tone={b.solid ? 'solid' : 'neutral'}>{b.label}</Badge>)}
        </Stack>
        <Link href={to('proof')}>Check it yourself</Link>
      </Card>
    </Card>
  );
}

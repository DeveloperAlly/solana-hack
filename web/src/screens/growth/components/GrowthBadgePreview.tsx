import { useId } from 'react';
import { Heading, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { GrowthCheckBadge } from '../../../ui/domain/GrowthCheckBadge';
import { GrowthEmbedSnippet } from '../../../ui/domain/GrowthEmbedSnippet';
import { ScreenLink } from '../../../gallery/ScreenLink';
import { growthArtboards } from '../paths';
import type { BadgeEmbedFlow } from '../useBadge';

/** The badge preview and its embed code, once a post is picked; a prompt to pick one before that. */
export function GrowthBadgePreview({ flow }: { flow: BadgeEmbedFlow }) {
  const headingId = useId();
  return (
    <Card labelledBy={headingId} header={<Heading level={2} size="lg" id={headingId}>Preview and code</Heading>}>
      {flow.post && flow.snippet ? (
        <Stack gap={4}>
          <GrowthCheckBadge brand={flow.post.brand.name} variant={flow.style} />
          <GrowthEmbedSnippet label="HTML snippet" code={flow.snippet} hint="Paste it under the post on your site. It links to Verify for this post." />
          <ScreenLink artboard={growthArtboards.badgeLanding}>Open where the badge lands</ScreenLink>
        </Stack>
      ) : (
        <Text tone="secondary">Choose a post to see its badge and code.</Text>
      )}
    </Card>
  );
}

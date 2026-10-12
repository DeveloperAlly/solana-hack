/*
 * Data contract: Influencer-Queue (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * Influencer-Queue, note n-iq). Shape: InfluencerQueueData in ./types.ts. Backend map §4 Grow, row "Influencer-Setup,
 * Influencer-Queue (experimental)": `GET /api/personas/:id/queue` (tables personas, drafts, registrations).
 *
 * | Field            | Source                                                                                       |
 * |------------------|----------------------------------------------------------------------------------------------|
 * | title, subtitle  | personas: name, voice, the brand it represents                                               |
 * | posts[]          | drafts for the persona: image (Storage), channel, slot, caption, check results               |
 * | posts[].stamped  | Watermark detected on the media; a post without it is blocked (n-iq 2)                       |
 *
 * Empty: nothing drafted this week ("Nothing waiting"). States drawn: success only.
 */
import { Button, Grid, Text } from '../../ui/primitives';
import { HubPage } from './parts/HubPage';
import { PageHeader } from './parts/PageHeader';
import { InfluencerPostCard } from './parts/InfluencerPostCard';
import { useReviewQueue } from './hooks/useReviewQueue';
import { useOutcomes } from './hooks/useOutcomes';
import { useHubLinks } from './paths';
import type { InfluencerQueueData } from './types';

export function InfluencerQueue({ data }: { data: InfluencerQueueData }) {
  const links = useHubLinks();
  const queue = useReviewQueue<'approved'>();
  const restamped = useOutcomes<'stamped'>();
  return (
    <HubPage section="grow" sub="influencer">
      <Text variant="small" tone="secondary">{data.banner}</Text>
      <PageHeader title={data.title} tag="EXPERIMENTAL" intro={data.subtitle} actions={<Button variant="secondary" href={links.influencerSetup}>Persona settings</Button>} />
      <Grid min="md" gap={4}>
        {data.posts.map((post) => (
          <InfluencerPostCard key={post.id} post={post} stamped={post.stamped || !!restamped.outcomeOf(post.id)} onRestamp={() => restamped.set(post.id, 'stamped')} queue={queue} />
        ))}
      </Grid>
    </HubPage>
  );
}

/*
 * Data contract: Badge-Embed (pending canvas board "Badge-Embed", page Growth; issue #82, sub-task "Check-it badge":
 * "a badge and embed screen to copy from"). Backend map §4, row "Verify-1, Verify-2, Verify-3" (registrations: only a
 * registered post can carry the badge). The badge image route is not built yet. Shape: BadgeEmbedData in ./types.ts.
 *
 * | Field          | Source                                                                        | Empty when            |
 * |----------------|-------------------------------------------------------------------------------|-----------------------|
 * | posts[]        | GET /api/ledger?brand= -> post rows (registrations joined to drafts)          | no registered post    |
 * | verifyUrl      | the public Verify page (live /verify)                                         | never                 |
 * | imageUrl       | GET /badge/:postId.svg?style= (not built yet)                                 | never                 |
 * | post, style    | Client: the person's picks (session; Verify-Badge-Landing reads them)         | post: until picked    |
 *
 * States (C28): success = options, preview and code; empty = no registered post yet; loading = reading posts;
 * error = posts could not be read.
 */
import { Button } from '../../ui/primitives';
import { Columns } from '../../ui/layouts/Columns';
import { StateView } from '../../ui/composites/StateView';
import { LoopFrame } from './components/LoopFrame';
import { GrowthBadgeOptions } from './components/GrowthBadgeOptions';
import { GrowthBadgePreview } from './components/GrowthBadgePreview';
import { useBadgeEmbed } from './useBadge';
import type { BadgeEmbedData, ScreenProps } from './types';

export function BadgeEmbed({ data, state = 'success' }: ScreenProps<BadgeEmbedData>) {
  const flow = useBadgeEmbed(data);
  return (
    <LoopFrame
      artboard="Badge-Embed"
      title="Check-it badge"
      tag="COMING SOON"
      intro="Put the badge on a verified post. Anyone who clicks it lands on Verify and sees the post is yours."
      meta="Drawn, not built: the badge image route does not exist yet. Defined in: issue #82 (Check-it badge); pitch deck v2, Business model slide."
    >
      <StateView
        state={data.posts.length === 0 ? 'empty' : state}
        loading={{ title: 'Loading your posts', body: 'Reading your registered posts.' }}
        error={{ title: 'Could not load your posts', body: 'Reload the page in a minute.' }}
        empty={{ title: 'No registered posts yet', body: 'Approve and register a post first. Only registered posts can carry the badge.', actions: <Button href="/create" variant="secondary">Create a post</Button> }}
      >
        <Columns ratio="1-1" end={<GrowthBadgePreview flow={flow} />}>
          <GrowthBadgeOptions posts={data.posts} flow={flow} />
        </Columns>
      </StateView>
    </LoopFrame>
  );
}

/*
 * Data contract: Verify-Badge-Landing (canvas board "Verify-Badge-Landing", v22; issue #82, sub-task
 * "Check-it badge": "the screen it lands on (Verify with 'Make yours on JamJam')"). Backend map §4, row "Verify-1,
 * Verify-2, Verify-3" (POST /api/verify; registrations). Shape: VerifyBadgeLandingData in ./types.ts.
 *
 * | Field          | Source                                                                         | Empty when            |
 * |----------------|--------------------------------------------------------------------------------|-----------------------|
 * | posts[], post  | GET /api/verify?post=<id> (not built yet: Verify matches text today) -> the registered post; the badge's post from Badge-Embed (session) | the badge's post is not registered |
 * | style          | Client: the badge style picked on Badge-Embed (session)                        | never (outline)       |
 * | makeYoursHref  | the live landing (/)                                                           | never                 |
 *
 * States (C28): success = verified post with the badge and "Make yours"; empty = the badge's post is not registered;
 * loading = checking; error = could not check.
 */
import { Stack, Text } from '../../ui/primitives';
import { Columns } from '../../ui/layouts/Columns';
import { StateView } from '../../ui/composites/StateView';
import { GrowthCheckBadge } from '../../ui/domain/GrowthCheckBadge';
import { ScreenLink } from '../../gallery/ScreenLink';
import { VerifyMatchResult } from '../public-next/components/VerifyMatchResult';
import { PublicFrame } from './components/PublicFrame';
import { GrowthMakeYoursCard } from './components/GrowthMakeYoursCard';
import { growthArtboards } from './paths';
import { useVisitedPost } from './useBadge';
import type { ScreenProps, VerifyBadgeLandingData } from './types';

export function VerifyBadgeLanding({ data, state = 'success' }: ScreenProps<VerifyBadgeLandingData>) {
  const { post, style } = useVisitedPost(data.posts, data.defaultPostId);
  return (
    <PublicFrame
      title="Is this official?"
      tag="COMING SOON"
      intro="You came here from a check-it badge. This is what the brand approved and registered."
      meta="Drawn, not built: Verify looks posts up by their text today, not by a badge link. Defined in: issue #82 (Check-it badge)."
    >
      <StateView
        state={post ? state : 'empty'}
        loading={{ title: 'Checking', body: 'Looking for the registration on Solana.' }}
        error={{ title: 'Could not check right now', body: 'Solana could not be checked just now, so this cannot be confirmed. Try again in a minute.' }}
        empty={{ title: 'This badge points at nothing registered', body: 'Treat the post as unverified. A real badge always opens a registered post.' }}
      >
        {post && (
          <Columns end={<GrowthMakeYoursCard href={data.makeYoursHref} />}>
            <Stack gap={4}>
              <Stack direction="row" gap={3} align="center" wrap>
                <GrowthCheckBadge brand={post.brand.name} variant={style} />
                <Text variant="small" tone="secondary">The badge you clicked</Text>
              </Stack>
              <VerifyMatchResult post={post} />
              <ScreenLink artboard={growthArtboards.tip}>Tip {post.brand.name} in USDC</ScreenLink>
            </Stack>
          </Columns>
        )}
      </StateView>
    </PublicFrame>
  );
}

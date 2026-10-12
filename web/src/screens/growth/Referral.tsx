/*
 * Data contract: Referral (pending canvas board "Referral", page Growth; issue #82, sub-task "Refer a friend").
 * Backend map: no row yet. Referrals are not in the backend map or web/worker (no referrals table or endpoint), so
 * every source below is "not built yet". Shape: ReferralData in ./types.ts.
 *
 * | Field            | Source                                                              | Empty when                 |
 * |------------------|---------------------------------------------------------------------|----------------------------|
 * | link             | GET /api/referrals/link (not built yet); code bracketed             | never                      |
 * | shareText        | client copy around the link                                         | never                      |
 * | offer            | pitch deck v2, Business model slide (Flywheel): 2 months free each  | never                      |
 * | referrals[]      | GET /api/referrals (not built yet) plus invites sent on this screen | nobody invited yet         |
 * | referrals[].status | invited, joined, rewarded (both got 2 months free)                | never                      |
 *
 * States (C28): success = link, offer and list; empty = nobody invited yet; loading = reading referrals;
 * error = referrals could not be read.
 */
import { Stack } from '../../ui/primitives';
import { Columns } from '../../ui/layouts/Columns';
import { StateView } from '../../ui/composites/StateView';
import { ScreenLink } from '../../gallery/ScreenLink';
import { LoopFrame } from './components/LoopFrame';
import { GrowthOfferCard } from './components/GrowthOfferCard';
import { GrowthReferralList } from './components/GrowthReferralList';
import { GrowthReferralShare } from './components/GrowthReferralShare';
import { growthArtboards } from './paths';
import { useReferral } from './useReferral';
import type { ReferralData, ScreenProps } from './types';

export function Referral({ data, state = 'success' }: ScreenProps<ReferralData>) {
  const flow = useReferral(data);
  const preview = <ScreenLink artboard={growthArtboards.referralLanding}>See what your friend sees</ScreenLink>;
  return (
    <LoopFrame
      artboard="Referral"
      title="Refer a friend"
      tag="COMING SOON"
      intro="Share your link. When a friend joins, you both get 2 months free."
      meta="Drawn, not built. Defined in: issue #82 (Refer a friend); pitch deck v2, Business model slide."
    >
      <StateView
        state={state === 'empty' ? 'success' : state}
        loading={{ title: 'Loading your referrals', body: 'Reading who joined with your link.' }}
        error={{ title: 'Could not load your referrals', body: 'Your link still works. Reload the page in a minute to see who joined.' }}
      >
        <Columns end={<GrowthOfferCard offer={data.offer} actions={preview} />}>
          <Stack gap={5}>
            <GrowthReferralShare link={data.link} shareText={data.shareText} onInvite={flow.invite} />
            <GrowthReferralList flow={flow} />
          </Stack>
        </Columns>
      </StateView>
    </LoopFrame>
  );
}

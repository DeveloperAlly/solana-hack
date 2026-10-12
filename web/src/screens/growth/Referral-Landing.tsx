/*
 * Data contract: Referral-Landing (canvas board "Referral-Landing", v22; issue #82, sub-task "Refer a
 * friend": "a landing screen for the person invited"). Backend map: no row yet (no referrals table or endpoint in
 * web/worker). Sign-in is Supabase email code (ADR-006). Shape: ReferralLandingData in ./types.ts.
 *
 * | Field     | Source                                                                       | Empty when |
 * |-----------|------------------------------------------------------------------------------|------------|
 * | inviter   | GET /api/referrals/:code -> inviter display name (not built yet); bracketed  | never      |
 * | offer     | pitch deck v2, Business model slide (Flywheel)                               | never      |
 * | loop[]    | pitch deck v2, slide 03 "Solution" (BUILD, RUN, GROW, PROVE)                 | never      |
 * | email     | Client: the visitor's address, sent with POST /api/referrals/claim (not built yet) | before submit |
 *
 * States (C28): success = the invite and claim form; loading = opening the invite; error = the link is not valid.
 */
import { Stack } from '../../ui/primitives';
import { StateView } from '../../ui/composites/StateView';
import { GrowthPublicFrame } from './components/GrowthPublicFrame';
import { GrowthOfferCard } from './components/GrowthOfferCard';
import { GrowthClaimForm } from './components/GrowthClaimForm';
import { GrowthLoopGrid } from './components/GrowthLoopGrid';
import { useReferralClaim } from './useReferralClaim';
import type { ReferralLandingData, ScreenProps } from './types';

export function ReferralLanding({ data, state = 'success' }: ScreenProps<ReferralLandingData>) {
  const flow = useReferralClaim();
  return (
    <GrowthPublicFrame
      title={`${data.inviter} invited you to JamJam`}
      tag="COMING SOON"
      intro="JamJam builds your brand, runs it and proves it. Join with this invite and you both get 2 months free."
      meta="Drawn, not built. Defined in: issue #82 (Refer a friend)."
    >
      <StateView
        state={state}
        loading={{ title: 'Opening your invite', body: 'Checking the invite link.' }}
        error={{ title: 'This invite link is not valid', body: 'It may have expired or been mistyped. Ask your friend to send it again.' }}
      >
        <Stack gap={6}>
          <GrowthOfferCard offer={data.offer} actions={<GrowthClaimForm flow={flow} />} />
          <GrowthLoopGrid steps={data.loop} />
        </Stack>
      </StateView>
    </GrowthPublicFrame>
  );
}

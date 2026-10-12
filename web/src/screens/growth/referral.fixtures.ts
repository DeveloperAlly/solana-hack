// Sample data for Referral and Referral-Landing (issue #82).
// Sources (AGENTS rule 6): the offer is pitch deck v2, Business model slide, Flywheel panel: "Refer a friend: you both
// get 2 months free." (https://claude.ai/artifact/4QPRrRAXx8VF4PsKf5qZ8d; issue #82 calls it slide 9). The loop lines
// are deck slide 03 "Solution" (BUILD, RUN, GROW, PROVE). The offer's terms are not set anywhere yet, so they stay
// bracketed, as do the referral code, names and dates.
import type { ReferralData, ReferralLandingData, ReferralOffer } from './types';

const link = 'https://jamjam.tech/r/[code]';

export const referralOffer: ReferralOffer = {
  headline: 'You both get 2 months free',
  detail: 'When a friend joins JamJam with your link, you each get 2 months free. [offer terms]',
  source: 'Pitch deck v2, Business model slide (Flywheel)',
};

export const referral: ReferralData = {
  link,
  shareText: `I build my brand and prove my posts on JamJam. Join with my link and we both get 2 months free: ${link}`,
  offer: referralOffer,
  referrals: [
    { id: 'ref-sample-1', who: '[Friend name]', invitedAt: null, status: 'rewarded' },
    { id: 'ref-sample-2', who: '[Friend name]', invitedAt: null, status: 'joined' },
    { id: 'ref-sample-3', who: '[friend email]', invitedAt: null, status: 'invited' },
  ],
};

export const referralEmpty: ReferralData = { ...referral, referrals: [] };

export const referralLanding: ReferralLandingData = {
  inviter: '[Founder name]',
  offer: referralOffer,
  loop: [
    { title: 'Build', body: 'Purpose, positioning and voice, built from everything you’ve published, or from scratch. Every fact sourced.' },
    { title: 'Run', body: 'Posts in your voice. Every claim backed by your evidence.' },
    { title: 'Grow', body: 'Your team, partners and ambassadors write from your kit. You approve every piece.' },
    { title: 'Prove', body: 'Approved work is publicly verifiable as yours, so impersonators stand out.' },
  ],
};

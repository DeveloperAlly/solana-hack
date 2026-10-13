// A public page's data when it was opened for one brand (`?brand=`, linkedBrand.ts): built from that brand's Grow data
// (loopDataFor, the same data its brand screens show), with the page's neutral fixture only for copy no brand owns.
// Every variant a page's demo states use is given, so a linked page's empty and error states are that brand's too.
import { mapVariants, type BrandVariants } from './brandData';
import type { LinkedBrand } from './linkedBrand';
import { inviteAccept } from './team.fixtures';
import { referralLanding } from './referral.fixtures';
import { verifyBadgeLanding } from './badge.fixtures';
import { tipFeeRate, tipSheet } from './tips.fixtures';
import { eventRating, eventRatingEmpty } from './board.fixtures';
import type { EventRatingData, InviteAcceptData, ReferralLandingData, TipSheetData, VerifyBadgeLandingData } from './types';

/** Invite-Accept for the brand that sent the invite: its name, roles and pending invites (Invite-Team's own). */
export function inviteAcceptFor(b: LinkedBrand): BrandVariants<InviteAcceptData> {
  const team = b.grow.team.success;
  const success: InviteAcceptData = { brand: b.name, roles: team.roles, invites: team.invites, voices: inviteAccept.voices };
  return { success, empty: { ...success, invites: [] } };
}

/** Referral-Landing for a friend invited from a brand's Referral: the same JamJam offer, naming where the inviter is from. */
export function referralLandingFor(b: LinkedBrand): BrandVariants<ReferralLandingData> {
  return { success: { ...referralLanding, fromBrand: b.name } };
}

/** The brand's registered posts a badge can point at (Badge-Embed's own). */
const registeredPosts = (b: LinkedBrand) => b.grow.badge.success.posts;

/** Verify-Badge-Landing for a badge on one of the brand's posts. */
export function badgeLandingFor(b: LinkedBrand): BrandVariants<VerifyBadgeLandingData> {
  const posts = registeredPosts(b);
  const success: VerifyBadgeLandingData = { ...verifyBadgeLanding, posts, defaultPostId: posts[0]?.id ?? '' };
  return { success, empty: { ...success, posts: [] } };
}

/** Tip-Sheet for one of the brand's posts: the brand is the creator; its wallet stays bracketed in sample data. */
export function tipSheetFor(b: LinkedBrand): BrandVariants<TipSheetData> {
  const posts = registeredPosts(b);
  const success: TipSheetData = { posts, defaultPostId: posts[0]?.id ?? '', creator: { name: b.name, wallet: tipSheet.creator.wallet }, feeRate: tipFeeRate };
  return { success, empty: { ...success, creator: { ...success.creator, wallet: null } } };
}

/** Event-Rating opened from a brand's Events or Event-Detail: the same public ratings, with the way back to that brand. */
export function eventRatingFor(b: LinkedBrand): BrandVariants<EventRatingData> {
  return mapVariants({ success: eventRating, empty: eventRatingEmpty }, (d) => ({ ...d, fromBrand: b.name }));
}

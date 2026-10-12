// Data shapes for the Growth page (issue #82): platforms, refer a friend, check-it badge, fan tips, team invites.
// Screens, hooks and fixtures import from here. The platform shape is the M2 registry (config/platforms.ts); verified
// posts reuse the Verify page's ApprovedPost (screens/public-next/types.ts), so a badge or a tip points at the same
// registered post Verify shows.
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import type { Platform, PlatformStatus } from '../../config/platforms';
import type { ApprovedPost, IsoDateTime } from '../public-next/types';

export type { ApprovedPost, IsoDateTime };

/** Every screen takes its data plus the demo state from the gallery switcher (C28). */
export interface ScreenProps<D> {
  data: D;
  state?: ScreenState;
}

/** One check result. Badges render from it and actions are disabled while any check is blocking (brief: one source). */
export interface Check {
  blocking: boolean;
  label: string;
}

// Platforms ----------------------------------------------------------------------------------------------------------

export type PlatformFilter = 'all' | PlatformStatus;

export interface PlatformsData {
  platforms: Platform[];
  /** Page-level note: what works on every platform today (manual post, paste the link back, Verify). */
  everywhere: string;
}

export interface PlatformDetailData {
  platforms: Platform[];
  /** Platform shown when the URL names none (`?platform=`). */
  defaultId: string;
  /** Platforms with an inbox capability point here for messaging (canvas Inbox-Connect). */
  messagingNote: string;
}

/** Preview connection state per platform id (nothing really connects: no integration exists). */
export type ConnectionState = 'connected';

// Refer a friend -----------------------------------------------------------------------------------------------------

export type ReferralStatus = 'invited' | 'joined' | 'rewarded';

export interface Referral {
  id: string;
  /** Who was invited: an email typed on the screen, or a bracketed sample name. */
  who: string;
  invitedAt: IsoDateTime;
  status: ReferralStatus;
}

export interface ReferralOffer {
  headline: string;
  detail: string;
  /** Source of the offer (pitch deck). */
  source: string;
}

export interface ReferralData {
  link: string;
  shareText: string;
  offer: ReferralOffer;
  referrals: Referral[];
}

export interface ReferralLandingData {
  inviter: string;
  offer: ReferralOffer;
  /** What JamJam does, one line per step of the loop (pitch deck slide 03). */
  loop: { title: string; body: string }[];
}

// Check-it badge -----------------------------------------------------------------------------------------------------

export type { GrowthBadgeStyle as BadgeStyle } from '../../ui/domain/GrowthCheckBadge';

export interface BadgeEmbedData {
  /** The brand's registered posts a badge can point at. */
  posts: ApprovedPost[];
  /** Public Verify address the badge links to. */
  verifyUrl: string;
  /** Badge image address (not built yet: say so on screen). */
  imageUrl: string;
}

export interface VerifyBadgeLandingData {
  posts: ApprovedPost[];
  /** Post shown when nothing was picked on Badge-Embed. */
  defaultPostId: string;
  /** Where "Make yours on JamJam" goes (the live landing). */
  makeYoursHref: string;
}

// Fan tips -----------------------------------------------------------------------------------------------------------

export interface Tip {
  id: string;
  postId: string;
  postLabel: string;
  /** Sender's wallet, bracketed in samples. */
  from: string;
  /** USDC; null while bracketed in sample data. */
  amount: number | null;
  at: IsoDateTime;
  signature: string | null;
}

export interface TipSheetData {
  /** Verified posts a visitor can tip; the one they came from (Verify-Badge-Landing) opens, else `defaultPostId`. */
  posts: ApprovedPost[];
  defaultPostId: string;
  creator: { name: string; wallet: string | null };
  /** Fee on tips, as a share (pitch deck slide "Business model": 3%). */
  feeRate: number;
}

export interface TipsReceivedData {
  creator: string;
  feeRate: number;
  tips: Tip[];
}

// Team invites -------------------------------------------------------------------------------------------------------

export type TeamRole = 'teammate' | 'partner';

export interface RoleOption {
  id: TeamRole;
  label: string;
  /** What the role can do. */
  detail: string;
}

export interface Member {
  id: string;
  name: string;
  role: TeamRole;
}

export interface Invite {
  id: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  sentAt: IsoDateTime;
}

export interface TeamData {
  brand: string;
  owner: string;
  /** Free seats on the plan (canvas Partners: "uses 1 of 3 seats"). */
  seatLimit: number;
  roles: RoleOption[];
  members: Member[];
  invites: Invite[];
}

export interface InviteAcceptData {
  brand: string;
  roles: RoleOption[];
  /** Pending invites before any change on Invite-Team; the screen opens the newest one. */
  invites: Invite[];
  /** Voices a partner may write in (canvas Partners). */
  voices: string[];
}

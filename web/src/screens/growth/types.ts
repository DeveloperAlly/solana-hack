// Data shapes for the Growth page (issue #82): platforms, refer a friend, check-it badge, fan tips, team invites; and the
// loop screens of ADR-012 built beside them: Grow home, Distribute adapt, Events, and the public events board.
// Screens, hooks and fixtures import from here. The platform shape is the M2 registry (config/platforms.ts); verified
// posts reuse the Verify page's ApprovedPost (screens/public-next/types.ts), so a badge or a tip points at the same
// registered post Verify shows.
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import type { Platform, PlatformStatus } from '../../config/platforms';
import type { ApprovedPost, IsoDateTime } from '../public-next/types';
import type { ArtboardName } from '../../config/artboards';
import type { Approval } from '../../domain/approval';
import type { Post } from '../../domain/post';
import type { BoardEventKind, BrandEvent } from '../../domain/event';
import type { EventRating, OrganiserReply, RatingSummary } from '../../domain/rating';
import type { Quest, QuestDraft } from '../../domain/quest';
import type { AmbassadorPostItem } from '../../domain/queue';

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

// Grow home (canvas v21 Grow-Home) ---------------------------------------------------------------------------------

/** A link on a Grow card or tile: the board it opens. */
export interface GrowLink {
  label: string;
  artboard: ArtboardName;
}

/** One KPI tile whose number is not derived from another screen's state (ambassadors, the campaign). */
export interface GrowStat {
  label: string;
  value: string;
  sub: string;
  artboard: ArtboardName;
}

/** One Grow area card: what it does, its boards, and the first action it teaches on a first run. */
export interface GrowArea {
  id: string;
  title: string;
  body: string;
  links: GrowLink[];
  firstAction: { text: string; link: GrowLink };
}

export interface GrowHomeData {
  brand: string;
  /** Ambassadors and campaign tiles; the events and referrals tiles are derived from their own screens' data. */
  stats: { ambassadors: GrowStat; campaign: GrowStat };
  areas: GrowArea[];
  /** The Events data, so the Events tile counts the same events Events lists (with this session's changes). */
  events: EventsData;
  /** The Referral data, so the Referrals tile counts the same referrals Referral lists. */
  referral: ReferralData;
}

// Distribute: adapt and schedule (canvas v21 Distribute-Adapt) ------------------------------------------------------

/** One platform's adapted version as drafted. */
export interface AdaptVersionSeed {
  text: string;
  /**
   * The sample claims gate: phrases it finds without a source. Its result for any text is how many of these the text
   * still contains (the real gate re-reads the text against the Brain's facts). Any found blocks approval.
   */
  unsourcedClaims: string[];
}

/** A slot already taken on a platform's calendar (canvas note: "schedule conflict"). */
export interface TakenSlot {
  platformId: string;
  slot: string;
  what: string;
}

export interface AdaptData {
  /** The approved original every version is adapted from (the shared Post type). */
  post: Post;
  brainVersion: string;
  /** Who approves here; bracketed in samples. */
  approver: string;
  /** The brand's platforms this post can go to (registry ids, config/platforms.ts), in registry order. */
  platformIds: string[];
  /** Chosen when the screen opens. */
  chosen: string[];
  versions: Record<string, AdaptVersionSeed>;
  /** Versions already approved, each bound to its text and the original's by fingerprint. */
  approvals: Record<string, Approval>;
  /** Times offered in "When", best first. */
  slots: string[];
  taken: TakenSlot[];
}

// Events (canvas v21 Events and Event-Detail) -----------------------------------------------------------------------

export interface EventsData {
  /** The sample "today" (local date) that splits Upcoming from Past and says which event is on the day. */
  today: string;
  events: BrandEvent[];
  /** Ordinary drafts the plan items point at (the shared Post type, the same drafts Create shows). */
  drafts: Post[];
  brainVersion: string;
  /** The connected Luma calendar, bracketed; null when Luma is not connected. */
  lumaCalendar: string | null;
}

export interface EventDetailData extends EventsData {
  /** Event shown when the URL names none (`?event=`). */
  defaultId: string;
}

export type EventsTab = 'upcoming' | 'past';

// Public events board (canvas v21 Events-Board and Event-Rating, ROADMAP) ------------------------------------------

/** The viewer's own attendance, for the sample proof (nothing is checked for real: ratings are ROADMAP). */
export interface SampleAttendance {
  /** The viewer has a checked-in Luma ticket for the event. */
  lumaCheckedIn: boolean;
  /** Emails on the organiser's guest list, bracketed or example.com in samples. */
  guestList: string[];
}

export interface BoardEvent {
  id: string;
  /** Always bracketed: never a real event. */
  name: string;
  place: string;
  /** "Sep", "monthly". */
  when: string;
  kind: BoardEventKind;
  /** Local date the event ends; rating opens after it. */
  endsOn: string;
  /** Bracketed organiser. */
  organiser: string;
  /** "In a line" summary. */
  line: string;
  summary: RatingSummary;
  ratings: EventRating[];
  replies: OrganiserReply[];
  attendance: SampleAttendance;
}

export interface EventsBoardData {
  today: string;
  events: BoardEvent[];
}

export interface EventRatingData extends EventsBoardData {
  defaultId: string;
}

// Quests (canvas v24 Quests) ---------------------------------------------------------------------------------------

export interface QuestsData {
  quests: Quest[];
  /** Submissions, as items of the one approval queue (domain/queue.ts): ambassador posts with a payout. */
  submissions: AmbassadorPostItem[];
  /** USDC paid this month before this session. */
  paidThisMonth: number;
  /** Quests suggested from the kit, for the empty state (canvas note: "suggest three from the kit"). */
  suggestions: QuestDraft[];
}

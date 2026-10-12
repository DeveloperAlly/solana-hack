// The Growth page's session state (issue #82): what a person changed on one screen, which every later screen reads.
// Changes are kept as additions and removals on top of each screen's fixture data, so any fixture (or the empty
// demo state) plus the person's own actions gives what they expect to see. In memory for the tab only: nothing is
// persisted and nothing calls the network (each write names its future endpoint in an INTEGRATION comment).
import { createBrandScopedStore } from '../../lib/brandScopedStore';
import { activeBrand } from '../../flows/brand/activeBrand';
import type { Approval, Approver } from '../../lib/approval';
import type { CheckRun } from './adaptChecks';
import type { BrandEvent, EventRole, EventStatus, EventPlanItem } from '../../domain/event';
import type { Post } from '../../domain/post';
import type { EventRating } from '../../domain/rating';
import type { Quest } from '../../domain/quest';
import type { BadgeStyle, ConnectionState, Invite, Member, Referral, Tip } from './types';

/** What a person changed on one adapted post (Distribute-Adapt), over its fixture. */
export interface AdaptEdits {
  /** The original's text after an edit here; its approval goes stale. */
  original?: string;
  /** The original re-approved after an edit (only through its gate: lib/approval.ts approveThrough). */
  originalApproval?: Approval<Approver>;
  chosen?: string[];
  texts: Record<string, string>;
  /**
   * The checks' last run per text ('original' or a platform id), with the text they read. Any other text is pending
   * until they re-run on it (Codex review on PR 102).
   */
  checks: Record<string, CheckRun & { text: string }>;
  approvals: Record<string, Approval<Approver>>;
  when: Record<string, string>;
  /** Platforms sent to the calendar, with their slots. */
  scheduled?: Record<string, string>;
}

/** What a person changed on one brand event (Events, Event-Detail), over its fixture. */
export interface EventEdit {
  status?: EventStatus;
  role?: EventRole;
  plan?: EventPlanItem[];
}

export interface GrowthSession {
  /** Preview connections by platform id (Platform-Detail Connect; Platforms reads them). */
  connections: Record<string, ConnectionState>;
  /** Friends invited on Referral, newest first. */
  referralsAdded: Referral[];
  /** Badge-Embed picks; Verify-Badge-Landing shows the picked post and style. */
  badge: { postId: string | null; style: BadgeStyle };
  /** Tips sent on Tip-Sheet, newest first; Tips-Received lists them. */
  tipsSent: Tip[];
  /** Invites sent on Invite-Team, newest first; Invite-Accept opens the newest pending one. */
  invitesAdded: Invite[];
  /** Invites revoked on Invite-Team, or accepted or declined on Invite-Accept. */
  invitesClosed: string[];
  /** People who accepted an invite (Invite-Accept); Invite-Team lists them as members. */
  membersAdded: Member[];
  /** Distribute-Adapt edits, by post id. */
  adapt: Record<string, AdaptEdits>;
  /** Events added by hand on Events, newest first. */
  eventsAdded: BrandEvent[];
  /** Accept, skip, role and plan changes, by event id (Events, Event-Detail; Grow-Home counts them). */
  eventEdits: Record<string, EventEdit>;
  /** Drafts made from an event's plan: ordinary drafts (the shared Post type), newest first. */
  draftsAdded: Post[];
  /** The viewer's own rating, by board event id (Event-Rating; Events-Board counts it). */
  myRatings: Record<string, EventRating>;
  /** Quests opened on Quests, newest first. */
  questsAdded: Quest[];
}

/**
 * Kept per brand (lib/brandScopedStore, keyed by the active brand), so connections, referrals, the badge, tips, invites
 * and members made for one brand never show under another (Codex review on PR #103).
 */
export const growthSession = createBrandScopedStore<GrowthSession>(activeBrand, {
  connections: {},
  referralsAdded: [],
  badge: { postId: null, style: 'outline' },
  tipsSent: [],
  invitesAdded: [],
  invitesClosed: [],
  membersAdded: [],
  adapt: {},
  eventsAdded: [],
  eventEdits: {},
  draftsAdded: [],
  myRatings: {},
  questsAdded: [],
});

/** "2026-10-13T09:41" for now, in the viewer's local time (the format the date formatter reads). */
export function nowIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

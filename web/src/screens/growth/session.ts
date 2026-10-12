// The Growth page's session state (issue #82): what a person changed on one screen, which every later screen reads.
// Changes are kept as additions and removals on top of each screen's fixture data, so any fixture (or the empty
// demo state) plus the person's own actions gives what they expect to see. In memory for the tab only: nothing is
// persisted and nothing calls the network (each write names its future endpoint in an INTEGRATION comment).
import { createStore } from '../../lib/createStore';
import type { BadgeStyle, ConnectionState, Invite, Member, Referral, Tip } from './types';

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
}

export const growthSession = createStore<GrowthSession>({
  connections: {},
  referralsAdded: [],
  badge: { postId: null, style: 'outline' },
  tipsSent: [],
  invitesAdded: [],
  invitesClosed: [],
  membersAdded: [],
});

/** "2026-10-13T09:41" for now, in the viewer's local time (the format the date formatter reads). */
export function nowIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

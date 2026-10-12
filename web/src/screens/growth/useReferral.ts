import { useMemo, useState } from 'react';
import { uniqueId } from '../../lib/id';
import { emailCheck } from './checks';
import { growthSession, nowIso } from './session';
import type { Referral, ReferralData, ReferralStatus } from './types';

export type ReferralFilter = 'all' | ReferralStatus;

export const referralStatusLabels: Record<ReferralStatus, string> = {
  invited: 'Invited',
  joined: 'Joined',
  rewarded: '2 months free each',
};

export interface ReferralFlow {
  referrals: Referral[];
  /** Referrals that match the filter. */
  shown: Referral[];
  filter: ReferralFilter;
  setFilter: (f: ReferralFilter) => void;
  counts: Record<ReferralFilter, number>;
  /** Invites a friend by email; returns an error message, or null when the invite was added. */
  invite: (email: string) => string | null;
}

/** Refer-a-friend flow state: the referral list (fixture plus friends invited here), its status filter and invites. */
export function useReferral(data: ReferralData): ReferralFlow {
  const [session, set] = growthSession.use();
  const [filter, setFilter] = useState<ReferralFilter>('all');
  const referrals = useMemo(() => [...session.referralsAdded, ...data.referrals], [session.referralsAdded, data.referrals]);
  const counts = useMemo(() => {
    const c: Record<ReferralFilter, number> = { all: referrals.length, invited: 0, joined: 0, rewarded: 0 };
    referrals.forEach((r) => (c[r.status] += 1));
    return c;
  }, [referrals]);
  function invite(email: string): string | null {
    const check = emailCheck(email);
    if (check.blocking) return check.label;
    const who = email.trim();
    if (referrals.some((r) => r.who.toLowerCase() === who.toLowerCase())) return `${who} is already invited.`;
    // INTEGRATION: POST /api/referrals { email } (not built yet: no referrals table or endpoint in web/worker).
    set({ referralsAdded: [{ id: uniqueId('ref'), who, invitedAt: nowIso(), status: 'invited' }, ...session.referralsAdded] });
    return null;
  }
  const shown = filter === 'all' ? referrals : referrals.filter((r) => r.status === filter);
  return { referrals, shown, filter, setFilter, counts, invite };
}

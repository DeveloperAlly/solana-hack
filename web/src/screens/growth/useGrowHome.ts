import { roleLabel } from '../../domain/event';
import { eventDay } from './eventPlan';
import { growthSession } from './session';
import { useBrandEvents } from './useBrandEvents';
import type { GrowHomeData, GrowStat } from './types';

/** Grow-Home's tiles: ambassadors and campaign from its data; events and referrals counted from their own screens' state. */
export function useGrowHome(data: GrowHomeData): GrowStat[] {
  const events = useBrandEvents(data.events);
  const [session] = growthSession.use();
  const next = events.upcoming[0];
  const referrals = data.referral.referrals.length + session.referralsAdded.length;
  return [
    data.stats.ambassadors,
    {
      label: 'Events',
      value: String(events.upcoming.length),
      sub: next ? `next: ${eventDay(next.startsAt).split(' ')[0]}${next.role ? `, you’re ${roleLabel(next.role).toLowerCase()}` : ''}` : 'None coming up',
      artboard: 'Events',
    },
    data.stats.campaign,
    { label: 'Referrals', value: String(referrals), sub: '2 months free each', artboard: 'Referral' },
  ];
}

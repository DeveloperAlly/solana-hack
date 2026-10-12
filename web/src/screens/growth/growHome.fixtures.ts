// Sample data for Grow-Home (canvas v21 board Grow-Home; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). Card copy is
// the board's; the referral offer is pitch deck v2 (Business model slide, Flywheel). The Events and Referrals tiles are
// not written here: they count the Events and Referral screens' own data, with this session's changes.
import { events, eventsEmpty } from './events.fixtures';
import { referral, referralEmpty } from './referral.fixtures';
import type { GrowArea, GrowHomeData } from './types';

const areas: GrowArea[] = [
  {
    id: 'ambassadors', title: 'Ambassadors',
    body: 'Brand-invited seats, plus public campaigns anyone can join. They post from your kit; you approve; they’re paid in USDC.',
    links: [{ label: 'Ambassadors', artboard: 'Dashboard' }],
    firstAction: { text: 'Invite your first ambassador to a seat.', link: { label: 'Invite an ambassador', artboard: 'Dashboard' } },
  },
  {
    id: 'events', title: 'Events',
    body: 'From your Luma calendar or added by hand. A content plan for before, during and after, with ambassadors who are going.',
    links: [{ label: 'Events', artboard: 'Events' }],
    firstAction: { text: 'Add your first event to get a content plan for it.', link: { label: 'Add an event', artboard: 'Events' } },
  },
  {
    id: 'campaigns', title: 'Campaigns',
    body: 'A goal, an audience, a plan, people and a budget cap. Learn tells you what worked.',
    links: [{ label: 'Campaigns', artboard: 'Campaign-v2-1-Goal' }],
    firstAction: { text: 'Start with the goal: what should this campaign change?', link: { label: 'New campaign', artboard: 'Campaign-v2-1-Goal' } },
  },
  {
    id: 'engage', title: 'Engage',
    body: 'Replies drafted in your Replies voice for mentions worth answering.',
    links: [{ label: 'Reply queue', artboard: 'Engage-Queue' }],
    firstAction: { text: 'Set the rules for which mentions get a drafted reply.', link: { label: 'Set reply rules', artboard: 'Engage-Rules' } },
  },
  {
    id: 'partners', title: 'Partners and leads',
    body: 'Agencies on seats with chosen voices; people worth talking to, found from your audience.',
    links: [{ label: 'Partners', artboard: 'Partners' }, { label: 'Leads', artboard: 'Leads' }],
    firstAction: { text: 'Give an agency a seat and choose the voices it may use.', link: { label: 'Add a partner', artboard: 'Partners' } },
  },
  {
    id: 'referrals', title: 'Referrals and team',
    body: 'Refer a friend and you both get 2 months free. Invite teammates to approve and write.',
    links: [{ label: 'Refer', artboard: 'Referral' }, { label: 'Team', artboard: 'Invite-Team' }],
    firstAction: { text: 'Share your link: you both get 2 months free.', link: { label: 'Refer a friend', artboard: 'Referral' } },
  },
];

export const growHome: GrowHomeData = {
  brand: 'aDNA',
  stats: {
    ambassadors: { label: 'Ambassadors', value: '8', sub: '5 seats · 3 from the public campaign', artboard: 'Dashboard' },
    campaign: { label: 'Campaign', value: '15 / 40', sub: 'verified posts · launch week', artboard: 'Campaign-v2-2-Measure' },
  },
  areas,
  events,
  referral,
};

/** First run: nothing yet, so each card teaches its first action (canvas Grow-Home note). */
export const growHomeFirstRun: GrowHomeData = {
  ...growHome,
  stats: {
    ambassadors: { ...growHome.stats.ambassadors, value: '0', sub: 'No ambassadors yet' },
    campaign: { ...growHome.stats.campaign, value: 'None', sub: 'No campaign yet' },
  },
  events: eventsEmpty,
  referral: referralEmpty,
};

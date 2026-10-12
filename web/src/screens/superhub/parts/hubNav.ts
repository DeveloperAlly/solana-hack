import type { NavItem } from '../../../config/routes';
import type { TabItem } from '../../../ui/composites/TabLabel';
import { paths } from '../paths';

/** Hub sections: one top-nav item each (canvas nav on every Superhub artboard). */
export type HubSection = 'home' | 'inbox' | 'brand' | 'create' | 'grow' | 'analytics';

/**
 * Top nav, as drawn on the canvas: Home, Inbox, Brand, Create, Grow, Analytics, Ledger.
 * Tags are the canvas board tags of each section's first screen (canvas.json board titles).
 */
export const hubTopNav: NavItem[] = [
  { path: paths.home, label: 'Home', tag: 'HACKATHON' },
  { path: paths.inboxAll, label: 'Inbox', tag: 'STRETCH' },
  { path: paths.brandBuild, label: 'Brand', tag: 'HACKATHON (THIN)' },
  { path: paths.content, label: 'Create', tag: 'HACKATHON' },
  { path: paths.engageQueue, label: 'Grow', tag: 'STRETCH' },
  { path: paths.analytics, label: 'Analytics', tag: 'ROADMAP' },
  { path: paths.ledger, label: 'Ledger', tag: 'HACKATHON' },
];

/** The top-nav item each section marks as current. */
export const sectionPath: Record<HubSection, string> = {
  home: paths.home,
  inbox: paths.inboxAll,
  brand: paths.brandBuild,
  create: paths.content,
  grow: paths.engageQueue,
  analytics: paths.analytics,
};

type SubItem = TabItem & { href: string };

/** Second-level tabs (canvas `.sub` bars on the Brand, Create and Grow artboards). */
export const hubSubnav: Partial<Record<HubSection, { label: string; items: SubItem[] }>> = {
  brand: {
    label: 'Brand',
    items: [
      { id: 'kit', label: 'Brand kit', href: paths.brandBuild },
      { id: 'voices', label: 'Voices', href: paths.voiceTemplates },
      { id: 'claims', label: 'Claims', href: paths.claims },
      { id: 'verification', label: 'Verification', href: paths.verification },
    ],
  },
  create: {
    label: 'Create',
    items: [
      { id: 'content', label: 'Content', href: paths.content },
      { id: 'campaigns', label: 'Campaigns', href: paths.campaignGoal },
      { id: 'calendar', label: 'Calendar', href: paths.contentCalendar },
    ],
  },
  grow: {
    label: 'Grow',
    items: [
      { id: 'engagement', label: 'Engagement', href: paths.engageQueue },
      { id: 'ambassadors', label: 'Ambassadors', href: paths.ambassadors },
      { id: 'partners', label: 'Partners', href: paths.partners },
      { id: 'leads', label: 'Leads (experimental)', href: paths.leads },
      { id: 'influencer', label: 'Influencer (experimental)', href: paths.influencerSetup },
    ],
  },
};

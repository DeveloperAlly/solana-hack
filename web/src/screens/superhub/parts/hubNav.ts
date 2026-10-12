import type { RouteTag } from '../../../config/routes';
import type { TabItem } from '../../../ui/composites/TabLabel';
import type { HubLink } from '../paths';

/** Hub sections: one top-nav item each (canvas nav on every Superhub artboard). */
export type HubSection = 'home' | 'inbox' | 'brand' | 'create' | 'grow' | 'analytics';

/**
 * Top nav, as drawn on the canvas: Home, Inbox, Brand, Create, Grow, Analytics, Ledger.
 * Tags are the canvas board tags of each section's first screen (canvas.json board titles).
 */
export const hubTopNav: { link: HubLink; label: string; tag: RouteTag }[] = [
  { link: 'home', label: 'Home', tag: 'HACKATHON' },
  { link: 'inboxAll', label: 'Inbox', tag: 'STRETCH' },
  { link: 'brandBuild', label: 'Brand', tag: 'HACKATHON (THIN)' },
  { link: 'content', label: 'Create', tag: 'HACKATHON' },
  { link: 'engageQueue', label: 'Grow', tag: 'STRETCH' },
  { link: 'analytics', label: 'Analytics', tag: 'ROADMAP' },
  { link: 'ledger', label: 'Ledger', tag: 'HACKATHON' },
];

/** The top-nav item each section marks as current. */
export const sectionLink: Record<HubSection, HubLink> = {
  home: 'home',
  inbox: 'inboxAll',
  brand: 'brandBuild',
  create: 'content',
  grow: 'engageQueue',
  analytics: 'analytics',
};

type SubItem = TabItem & { link: HubLink };

/** Second-level tabs (canvas `.sub` bars on the Brand, Create and Grow artboards). */
export const hubSubnav: Partial<Record<HubSection, { label: string; items: SubItem[] }>> = {
  brand: {
    label: 'Brand',
    items: [
      { id: 'kit', label: 'Brand kit', link: 'brandBuild' },
      { id: 'voices', label: 'Voices', link: 'voiceTemplates' },
      { id: 'claims', label: 'Claims', link: 'claims' },
      { id: 'verification', label: 'Verification', link: 'verification' },
    ],
  },
  create: {
    label: 'Create',
    items: [
      { id: 'content', label: 'Content', link: 'content' },
      { id: 'campaigns', label: 'Campaigns', link: 'campaignGoal' },
      { id: 'calendar', label: 'Calendar', link: 'contentCalendar' },
    ],
  },
  grow: {
    label: 'Grow',
    items: [
      { id: 'engagement', label: 'Engagement', link: 'engageQueue' },
      { id: 'ambassadors', label: 'Ambassadors', link: 'ambassadors' },
      { id: 'partners', label: 'Partners', link: 'partners' },
      { id: 'leads', label: 'Leads (experimental)', link: 'leads' },
      { id: 'influencer', label: 'Influencer (experimental)', link: 'influencerSetup' },
    ],
  },
};

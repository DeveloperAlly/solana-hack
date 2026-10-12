// Screen-to-screen routing for the Brand Builder page (issue #50). Every link names a canvas artboard by key from this one
// map and is resolved by the gallery's screenPath / useScreenHref (src/gallery/screenPath.ts), which keeps ?theme=.
import { useCallback } from 'react';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { useScreenHref } from '../../gallery/screenPath';
import type { ArtboardName } from '../../config/artboards';

export const boards = {
  // This page's artboards.
  signIn: 'Onboard-1-SignIn',
  domain: 'Onboard-2-Domain',
  domainFailed: 'Onboard-2b-DomainFailed',
  sources: 'Onboard-3-Sources',
  profiling: 'Onboard-3b-Profiling',
  ingestError: 'Ingest-Error',
  basics: 'BB-1-Basics',
  origin: 'BB-2-Origin',
  goldenCircle: 'BB-3-GoldenCircle',
  alternatives: 'BB-4-Alternatives',
  audience: 'BB-5-Audience',
  voice: 'BB-6-Voice',
  gatePurpose: 'BB-Gate1-Purpose',
  gatePositioning: 'BB-Gate2-Positioning',
  gateVoice: 'BB-Gate3-Voice',
  coverage: 'Coverage-Map',
  published: 'Onboard-6-Published',
  registerFailed: 'Kit-RegisterFailed',
  kitExport: 'Kit-Export',
  dashboard: 'Dashboard',
  dashboardEmpty: 'Dashboard-Empty',
  // Artboards on other canvas pages that these screens link to (canvas hrefs).
  main: 'Main',
  hubHome: 'Hub-Home',
  brandBuild: 'Brand-Build',
  draftReview: 'Draft-Review',
  verifyMatch: 'Verify-1-Match',
  // The canvas Dashboard links to Campaign-Builder, which Campaign v2 replaced (Campaign-v2-1-Goal is its first step).
  campaignBuilder: 'Campaign-v2-1-Goal',
  ledger: 'Ledger',
  voices: 'Voice-Templates',
  claims: 'Claims',
  engageQueue: 'Engage-Queue',
  partners: 'Partners',
  leads: 'Leads',
  influencer: 'Influencer-Setup',
} as const satisfies Record<string, ArtboardName>;

export type BoardKey = keyof typeof boards;

/** (board, state?) => href to that artboard that keeps the gallery theme. */
export function useBoardHref(): (key: BoardKey, state?: ScreenState) => string {
  const href = useScreenHref();
  return useCallback((key: BoardKey, state?: ScreenState) => href(boards[key], state), [href]);
}

export interface SubnavItem {
  id: string;
  label: string;
  board: BoardKey;
}

/** Hub sub-navigation drawn on Kit-Export (Brand) and Dashboard (Grow), canvas boards of the same names. */
export const brandSubnav: SubnavItem[] = [
  { id: 'kit', label: 'Brand kit', board: 'brandBuild' },
  { id: 'voices', label: 'Voices', board: 'voices' },
  { id: 'claims', label: 'Claims', board: 'claims' },
  { id: 'verification', label: 'Verification', board: 'domain' },
];
export const growSubnav: SubnavItem[] = [
  { id: 'engagement', label: 'Engagement', board: 'engageQueue' },
  { id: 'ambassadors', label: 'Ambassadors', board: 'dashboard' },
  { id: 'partners', label: 'Partners', board: 'partners' },
  { id: 'leads', label: 'Leads (experimental)', board: 'leads' },
  { id: 'influencer', label: 'Influencer (experimental)', board: 'influencer' },
];

/** Each approval gate's screen, for "approve the gates first" links. */
export const gateBoards = { purpose: 'gatePurpose', positioning: 'gatePositioning', voice: 'gateVoice' } as const satisfies Record<string, BoardKey>;

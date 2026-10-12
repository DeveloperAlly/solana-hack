import { useMemo } from 'react';
import { useScreenHref } from '../../gallery/screenPath';
import type { ArtboardName } from '../../config/artboards';

/**
 * Every board the loop screens link to, in one map (link key → canvas artboard). Screens name a key or a fixture's
 * artboard, never a path; hrefs go through the gallery's typed `useScreenHref`, which keeps the theme. Boards on
 * other pages resolve once their page PRs merge (Grow's on ui/loop-grow).
 */
export const loopBoards = {
  today: 'Today',
  brain: 'Brain',
  post: 'Post-Detail',
  learnRules: 'Learn-Rules',
  verifyHome: 'Verify-Home',
  brandSwitcher: 'Brand-Switcher',
  draftReview: 'Draft-Review',
  adapt: 'Distribute-Adapt',
  connections: 'Settings-Connections',
  verifyMatch: 'Verify-1-Match',
  verifyNoMatch: 'Verify-2-NoMatch',
  ledger: 'Ledger',
  badge: 'Badge-Embed',
  calendar: 'Publish-Calendar',
  kit: 'Brand-Build',
  voices: 'Voice-Templates',
  claims: 'Claims',
  kitExport: 'Kit-Export',
  contentDashboard: 'Content-Dashboard',
} as const satisfies Record<string, ArtboardName>;

export type LoopLinkKey = keyof typeof loopBoards;

/** `links.<key>` for the map above, and `to(artboard)` for an artboard named in fixture data. */
export function useLoopLinks() {
  const href = useScreenHref();
  return useMemo(() => ({
    links: Object.fromEntries(Object.entries(loopBoards).map(([k, a]) => [k, href(a)])) as Record<LoopLinkKey, string>,
    to: (artboard: ArtboardName) => href(artboard),
  }), [href]);
}

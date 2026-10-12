// Screen links for the "Coming soon" canvas page (issue #51): the one map of every artboard this page links to.
// Paths come from the gallery's useScreenHref (src/gallery/screenPath.ts), which keeps ?theme= across navigation;
// this file never builds a path itself (screens/README.md, "Links between screens").
import { useMemo } from 'react';
import { useScreenHref } from '../../gallery/screenPath';

export const soonArtboards = {
  settingsAI: 'Settings-AI',
  settingsGetKey: 'Settings-GetKey',
  settingsConnections: 'Settings-Connections',
  settingsPlan: 'Settings-Plan',
  pricing: 'Pricing',
  upgrade: 'Upgrade',
  mediaComposer: 'Media-Composer',
  mediaReview: 'Media-Review',
  campaignGoal: 'Campaign-v2-1-Goal',
  campaignAudience: 'Campaign-v2-3-Audience',
  campaignMeasure: 'Campaign-v2-2-Measure',
  campaignPlan: 'Campaign-v2-4-Plan',
  campaignBudget: 'Campaign-v2-5-Budget',
  campaignLaunch: 'Campaign-v2-6-Launch',
  publishCalendar: 'Publish-Calendar',
  claims: 'Claims',
  brandSwitcher: 'Brand-Switcher',
  founderProfile: 'Founder-Profile',
  outcomeLog: 'Outcome-Log',
  // Other canvas pages (built by their own sub-issues of #45).
  main: 'Main',
  contentDashboard: 'Content-Dashboard',
  brandBuild: 'Brand-Build',
} as const;

export type SoonRoute = keyof typeof soonArtboards;

/** Every link target of this page as an href that keeps the current gallery theme. */
export function useSoonRoutes(): Record<SoonRoute, string> {
  const href = useScreenHref();
  return useMemo(() => Object.fromEntries(Object.entries(soonArtboards).map(([key, artboard]) => [key, href(artboard)])) as Record<SoonRoute, string>, [href]);
}

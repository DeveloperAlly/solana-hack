// Route paths for the "Coming soon" canvas page (issue #51). Every link in this page's screens reads from here.
// Gallery routes are /screens/<Artboard> (issue #46); targets on other canvas pages use their artboard names.
const screen = (artboard: string) => `/screens/${artboard}`;

export const soonRoutes = {
  settingsAI: screen('Settings-AI'),
  settingsGetKey: screen('Settings-GetKey'),
  settingsConnections: screen('Settings-Connections'),
  settingsPlan: screen('Settings-Plan'),
  pricing: screen('Pricing'),
  upgrade: screen('Upgrade'),
  mediaComposer: screen('Media-Composer'),
  mediaReview: screen('Media-Review'),
  campaignGoal: screen('Campaign-v2-1-Goal'),
  campaignAudience: screen('Campaign-v2-3-Audience'),
  campaignMeasure: screen('Campaign-v2-2-Measure'),
  campaignPlan: screen('Campaign-v2-4-Plan'),
  campaignBudget: screen('Campaign-v2-5-Budget'),
  campaignLaunch: screen('Campaign-v2-6-Launch'),
  publishCalendar: screen('Publish-Calendar'),
  claims: screen('Claims'),
  brandSwitcher: screen('Brand-Switcher'),
  founderProfile: screen('Founder-Profile'),
  outcomeLog: screen('Outcome-Log'),
  // Other canvas pages (built by their own sub-issues of #45).
  main: screen('Main'),
  contentDashboard: screen('Content-Dashboard'),
  brandBuild: screen('Brand-Build'),
} as const;

export type SoonRoute = (typeof soonRoutes)[keyof typeof soonRoutes];

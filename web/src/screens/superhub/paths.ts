/**
 * Every route the Superhub screens link to, in one map (issue #52). Screens never write a path literal.
 * Links between screens go to the gallery route `/screens/<Artboard>` (issue #45: no flow routes in the new build yet).
 * Artboards outside this page are built by their own page PRs (#48–#53); their links resolve once those merge.
 */
const screen = (artboard: string) => `/screens/${artboard}`;

export const paths = {
  // This page (canvas "Superhub (v2)")
  home: screen('Hub-Home'),
  inboxAll: screen('Inbox-All'),
  inboxNeedsReply: screen('Inbox-NeedsReply'),
  inboxConnect: screen('Inbox-Connect'),
  brandBuild: screen('Brand-Build'),
  voiceTemplates: screen('Voice-Templates'),
  voiceEditor: screen('Voice-Editor'),
  content: screen('Content-Dashboard'),
  contentEmpty: screen('Content-Dashboard-Empty'),
  contentCalendar: `${screen('Content-Dashboard')}#calendar`,
  draftReview: screen('Draft-Review'),
  draftBeautified: screen('Draft-Review-Beautified'),
  draftPolishError: screen('Draft-Review-PolishError'),
  campaignGoal: screen('Campaign-v2-1-Goal'),
  campaignMeasure: screen('Campaign-v2-2-Measure'),
  engageQueue: screen('Engage-Queue'),
  engageRules: screen('Engage-Rules'),
  partners: screen('Partners'),
  leads: screen('Leads'),
  influencerSetup: screen('Influencer-Setup'),
  influencerQueue: screen('Influencer-Queue'),
  analytics: screen('Analytics'),
  analyticsEmpty: screen('Analytics-Empty'),
  // Other pages
  main: screen('Main'),
  ledger: screen('Ledger'),
  claims: screen('Claims'),
  verification: screen('Onboard-2-Domain'),
  profiling: screen('Onboard-3b-Profiling'),
  ingestError: screen('Ingest-Error'),
  kitExport: screen('Kit-Export'),
  kitPublished: screen('Onboard-6-Published'),
  ambassadors: screen('Dashboard'),
  verifyMatch: screen('Verify-1-Match'),
  campaignAudience: screen('Campaign-v2-3-Audience'),
} as const;

export type HubPath = (typeof paths)[keyof typeof paths];

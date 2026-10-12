// Route paths for the Brand Builder page (issue #50). Every link between screens comes from here.
// Screens open at their gallery route /screens/<Artboard> (issue #46); screens on other pages are linked the same way.

const screen = (artboard: string) => `/screens/${artboard}`;

export const builderPaths = {
  signIn: screen('Onboard-1-SignIn'),
  domain: screen('Onboard-2-Domain'),
  domainFailed: screen('Onboard-2b-DomainFailed'),
  sources: screen('Onboard-3-Sources'),
  profiling: screen('Onboard-3b-Profiling'),
  ingestError: screen('Ingest-Error'),
  basics: screen('BB-1-Basics'),
  origin: screen('BB-2-Origin'),
  goldenCircle: screen('BB-3-GoldenCircle'),
  alternatives: screen('BB-4-Alternatives'),
  audience: screen('BB-5-Audience'),
  voice: screen('BB-6-Voice'),
  gatePurpose: screen('BB-Gate1-Purpose'),
  gatePositioning: screen('BB-Gate2-Positioning'),
  gateVoice: screen('BB-Gate3-Voice'),
  coverage: screen('Coverage-Map'),
  published: screen('Onboard-6-Published'),
  registerFailed: screen('Kit-RegisterFailed'),
  kitExport: screen('Kit-Export'),
  dashboard: screen('Dashboard'),
  dashboardEmpty: screen('Dashboard-Empty'),
} as const;

/** Screens on other canvas pages that Brand Builder screens link to (canvas hrefs). */
export const otherPaths = {
  main: screen('Main'),
  hubHome: screen('Hub-Home'),
  brandBuild: screen('Brand-Build'),
  draftReview: screen('Draft-Review'),
  verifyMatch: screen('Verify-1-Match'),
  campaignBuilder: screen('Campaign-Builder'),
  ledger: screen('Ledger'),
  voices: screen('Voice-Templates'),
  claims: screen('Claims'),
  engageQueue: screen('Engage-Queue'),
  partners: screen('Partners'),
  leads: screen('Leads'),
  influencer: screen('Influencer-Setup'),
} as const;

export type BuilderPathKey = keyof typeof builderPaths;

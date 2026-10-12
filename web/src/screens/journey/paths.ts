/*
 * Every route the Journey screens link to, in one map (issue #48). Targets are gallery routes, /screens/<Artboard>, the
 * canvas board each link points at (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). Boards other pages build
 * (Ledger, BB-1-Basics and so on) open once those pages land; until then the gallery says "No such screen".
 */
const screen = (artboard: string) => `/screens/${artboard}`;

export const journeyPaths = {
  main: screen('Main'),
  read: screen('J1-Read'),
  save: screen('J2-Save'),
  confirm: screen('J3-Confirm'),
  gapsVoice: screen('J4-Gaps-Voice'),
  approveKit: screen('J5-Approve-Kit'),
  firstPost: screen('J6-First-Post'),
  proof: screen('J7-Proof'),
  hub: screen('J8-Hub-FirstRun'),
  // Boards on other canvas pages that Journey links to.
  basics: screen('BB-1-Basics'),
  signIn: screen('Onboard-1-SignIn'),
  ledger: screen('Ledger'),
  brandBuild: screen('Brand-Build'),
  contentDashboard: screen('Content-Dashboard'),
  draftReview: screen('Draft-Review'),
  engageQueue: screen('Engage-Queue'),
  inbox: screen('Inbox-All'),
  analytics: screen('Analytics'),
  settingsAi: screen('Settings-AI'),
  partners: screen('Partners'),
} as const;

export type JourneyPath = (typeof journeyPaths)[keyof typeof journeyPaths];

/** The seven numbered steps of the first run, in order, with the time estimate each canvas board shows. */
export const journeySteps = [
  { id: 'read', label: 'Read', path: journeyPaths.read, estimate: 'About 9 min left · target' },
  { id: 'save', label: 'Save', path: journeyPaths.save, estimate: 'About 8 min left · target' },
  { id: 'confirm', label: 'Confirm', path: journeyPaths.confirm, estimate: 'About 7 min left · target' },
  { id: 'gapsVoice', label: 'Gaps + voice', path: journeyPaths.gapsVoice, estimate: 'About 5 min left · target' },
  { id: 'approveKit', label: 'Approve kit', path: journeyPaths.approveKit, estimate: 'About 3 min left · target' },
  { id: 'firstPost', label: 'First post', path: journeyPaths.firstPost, estimate: 'About 2 min left · target' },
  { id: 'proof', label: 'Prove', path: journeyPaths.proof, estimate: 'Done · target under 10 min' },
] as const;

export type JourneyStepId = (typeof journeySteps)[number]['id'];

/** Live public nav paths (config/routes.ts publicNav) mapped to the boards canvas Main links to. */
const publicTargets: Record<string, string> = {
  '/': journeyPaths.main,
  '/how-it-works': `${journeyPaths.main}#how`,
  '/verify': journeyPaths.proof,
  '/ledger': journeyPaths.ledger,
  '/sign-in': journeyPaths.signIn,
  '/home': journeyPaths.hub,
};

/** Live hub nav paths (config/routes.ts hubNav) mapped to the boards canvas J8-Hub-FirstRun links to. */
const hubTargets: Record<string, string> = {
  '/home': journeyPaths.hub,
  '/brand': journeyPaths.brandBuild,
  '/create': journeyPaths.contentDashboard,
  '/grow': journeyPaths.engageQueue,
  '/inbox': journeyPaths.inbox,
  '/analytics': journeyPaths.analytics,
  '/ledger': journeyPaths.ledger,
  '/settings': journeyPaths.settingsAi,
};

export const publicNavHref = (path: string) => publicTargets[path] ?? path;
export const hubNavHref = (path: string) => hubTargets[path] ?? path;

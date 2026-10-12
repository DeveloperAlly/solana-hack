/*
 * Sample data for J8-Hub-FirstRun: canvas board J8-Hub-FirstRun (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * J8-Hub-FirstRun) and its note n-j8-hub-firstrun, issue #48, backend map §4 rows "Content-Dashboard (and its empty
 * state), Hub-Home" and "Ledger". "Readiness 72%" is the board's sample figure (flagged "Sample data"); the next post
 * topic stays bracketed.
 */
import type { HubFirstRunData } from './types';
import { journeyPaths } from './paths';

export const hubFirstRunFixture: HubFirstRunData = {
  brandName: 'JamJam',
  status: 'Kit v1 registered · first post official · readiness 72%',
  checklist: [
    { id: 'kit', label: 'Kit v1 approved and registered', hint: '', done: true },
    { id: 'post', label: 'First post official', hint: '', done: true },
    { id: 'sources', label: 'Add 2 more sources', hint: 'raises readiness, fewer questions later', done: false, href: journeyPaths.read },
    { id: 'plan', label: "Plan this week's posts", hint: '3 drafts from your messaging', done: false, href: journeyPaths.contentDashboard },
    { id: 'ai', label: 'Connect your AI model key', hint: 'Settings › AI · your key, encrypted', done: false, href: journeyPaths.settingsAi },
    { id: 'invite', label: 'Invite a teammate or partner', hint: 'coming soon', done: false, href: journeyPaths.partners },
  ],
  nextPost: '[Topic from your messaging pillar 2]',
  publicRecord: [
    { label: 'Kit v1', value: 'Registered', href: journeyPaths.ledger },
    { label: 'Launch post', value: 'Registered', href: journeyPaths.ledger },
  ],
  comingSoon: 'Inbox, publishing to X and LinkedIn, ambassador campaigns, analytics. Each shows here when it ships.',
};

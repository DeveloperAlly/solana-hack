// Sample props for the Amb* workbench examples and tests: the canvas's own sample text (wireframe canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, page "Ambassador", boards Amb-1 to Amb-5d; issue #53).
import type { AmbBudget } from './AmbBudgetBar';
import type { AmbCampaignFields } from './AmbCampaignCard';
import type { AmbCheck } from './AmbChecksList';
import type { AmbNavItem } from './AmbShell';
import type { AmbTimelineStep } from './AmbStatusTimeline';

/** Board Amb-1-Campaigns, first card. */
export const sampleCampaign: AmbCampaignFields = {
  brandLine: 'aDNA · open standard for agentic project context',
  title: 'aDNA launch week',
  channelsLabel: 'LinkedIn · Blog',
  payout: '5–50 USDC',
  payoutSub: 'Blog post 5 · LinkedIn 10 · Tutorial 50',
  timeLeft: '6 days left',
  timeSub: 'ends 12 Oct',
  slots: '17 of 30 slots',
  budgetUsedPct: 39,
  budgetReached: false,
};

/** Board Amb-1-Campaigns, third card (bracketed on the canvas). */
export const sampleClosedCampaign: AmbCampaignFields = {
  brandLine: 'Ally Haire · founder, engineer, writer',
  title: '[Ally Haire campaign name]',
  channelsLabel: 'LinkedIn · Blog',
  payout: '[payout] USDC',
  budgetReached: true,
};

/** Board Amb-2-Detail: "305 of 500 USDC left". */
export const sampleBudget: AmbBudget = { spent: 135, committed: 60, cap: 500, unit: 'USDC' };

/** Board Amb-3-Generate flags. */
export const sampleChecks: AmbCheck[] = [
  { id: 'banned', title: 'Banned claim', phrase: "10x your team's output", detail: "aDNA doesn't allow productivity numbers without a source.", fixLabel: 'Remove line', shortFixLabel: 'Remove' },
  { id: 'avoided', title: 'Avoided term', phrase: 'memory dump', detail: 'aDNA says "project context".', fixLabel: 'Replace' },
  { id: 'disclosure', title: 'Missing disclosure', detail: 'Add "Sponsored by aDNA" or #ad.', fixLabel: 'Add at end', shortFixLabel: 'Add' },
];

/** Board Amb-3-Generate draft, lines 4 and 5. */
export const sampleDraft = "It will 10x your team's output.\n\nStop pasting a memory dump into every new session.";

/** Board Amb-5a-Verifying timeline. */
export const sampleSteps: AmbTimelineStep[] = [
  { label: 'Published', state: 'done', note: '16:21' },
  { label: 'Verifying…', state: 'current', note: 'Usually under a minute' },
  { label: 'Approved', state: 'todo', note: 'aDNA reviews within 48 h' },
  { label: 'Paid', state: 'todo', note: '10 USDC' },
];

/** Board Amb-5c-VerifyFailed timeline. */
export const sampleFailedSteps: AmbTimelineStep[] = [
  { label: 'Submitted', state: 'done', note: '16:40 · URL pasted' },
  { label: 'Not verified', state: 'failed', note: '16:41' },
  { label: 'Approved', state: 'todo' },
  { label: 'Paid', state: 'todo' },
];

/** Canvas nav: Campaigns, My posts, Earnings. Workbench anchors, so examples never leave /system. */
export const sampleNav: AmbNavItem[] = [
  { id: 'campaigns', label: 'Campaigns', href: '/system#campaigns' },
  { id: 'posts', label: 'My posts', href: '/system#posts' },
  { id: 'earnings', label: 'Earnings', href: '/system#earnings' },
];

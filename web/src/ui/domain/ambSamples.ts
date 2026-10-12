// Sample props for the Amb* workbench examples and tests: the canvas's own sample text (wireframe canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, page "Ambassador", boards Amb-1 to Amb-5d; issue #53).
import type { AmbCampaignFields } from './AmbCampaignCard';
import type { AmbCheck } from './AmbChecksList';

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

/** Board Amb-1-Campaigns, third card: a closed campaign, with a listed demo brand (GamersLab) and bracketed details. */
export const sampleClosedCampaign: AmbCampaignFields = {
  brandLine: 'GamersLab · [one-line description]',
  title: '[GamersLab campaign name]',
  channelsLabel: 'LinkedIn · Blog',
  payout: '[payout] USDC',
  budgetReached: true,
};


/** Board Amb-3-Generate flags. */
export const sampleChecks: AmbCheck[] = [
  { id: 'banned', title: 'Banned claim', phrase: "10x your team's output", label: "aDNA doesn't allow productivity numbers without a source.", fixLabel: 'Remove line', shortFixLabel: 'Remove' },
  { id: 'avoided', title: 'Avoided term', phrase: 'memory dump', label: 'aDNA says "project context".', fixLabel: 'Replace' },
  { id: 'disclosure', title: 'Missing disclosure', label: 'Add "Sponsored by aDNA" or #ad.', fixLabel: 'Add at end', shortFixLabel: 'Add' },
];

/** Board Amb-3-Generate draft, lines 4 and 5. */
export const sampleDraft = "It will 10x your team's output.\n\nStop pasting a memory dump into every new session.";

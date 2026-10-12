// Sample data for the Ambassador screens (issue #53). Every string is the canvas's own sample text, from the wireframe canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn (page "Ambassador"), on the board named beside each fixture. Anything the
// canvas brackets stays bracketed: those values are not sourced yet (canvas legend n-legend). Shapes: ./types.ts.
// Backend map rows (.agentic/what/context/backend_map.md §4): "Amb-1, Amb-1b, M-1", "Amb-2, M-2", "Amb-3, M-3", "Amb-4, M-4"
// and "Amb-5a, 5b, 5c, 5d, M-5".
import type { Account, CampaignDetailData, CampaignsData, CampaignSummary, GenerateData, PostStatusData, PublishData } from './types';

/** Board Amb-1-Campaigns nav chip "Mai T. · 15 USDC". */
export const mai: Account = { name: 'Mai T.', balance: '15 USDC' };

/** Board Amb-1-Campaigns, first card. Payouts from board Amb-2-Detail "What you can make". */
const adnaLaunch: CampaignSummary = {
  id: 'adna-launch-week',
  brand: 'aDNA',
  brandLine: 'aDNA · open standard for agentic project context',
  title: 'aDNA launch week',
  channels: ['linkedin', 'blog'],
  payoutRange: '5–50 USDC',
  payoutBreakdown: 'Blog post 5 · LinkedIn 10 · Tutorial 50',
  timeLeft: '6 days left',
  endsOn: 'ends 12 Oct',
  daysLeft: 6,
  maxPayout: 50,
  slots: '17 of 30 slots',
  budgetUsedPct: 39,
  budgetReached: false,
  hasDetail: true,
};

/** Board Amb-1-Campaigns: the film.fun and Ally Haire cards are bracketed on the canvas. */
const campaigns: CampaignSummary[] = [
  adnaLaunch,
  {
    id: 'film-fun',
    brand: 'film.fun',
    brandLine: 'film.fun · AI filmmaking studio',
    title: '[film.fun campaign name]',
    channels: ['linkedin', 'blog'],
    payoutRange: '[payout] USDC',
    timeLeft: '2 days left',
    daysLeft: 2,
    maxPayout: null,
    slots: '[n] slots',
    budgetReached: false,
    hasDetail: false,
  },
  {
    id: 'ally-haire',
    brand: 'Ally Haire',
    brandLine: 'Ally Haire · founder, engineer, writer',
    title: '[Ally Haire campaign name]',
    channels: ['linkedin', 'blog'],
    payoutRange: '[payout] USDC',
    daysLeft: null,
    maxPayout: null,
    budgetReached: true,
    hasDetail: false,
  },
];

export const campaignsData: CampaignsData = { account: mai, campaigns, notifyBrands: ['aDNA', 'film.fun', 'GamersLab', 'Ally Haire'] };

/** Board Amb-1b-CampaignsEmpty: nothing open; notify-me per brand; earnings stay visible (canvas note n-a1b). */
export const campaignsEmpty: CampaignsData = { ...campaignsData, campaigns: [] };

/** Board Amb-2-Detail (signed out: the nav shows "Sign in"); board M-2-Detail uses the same campaign. */
export const campaignDetail: CampaignDetailData = {
  account: null,
  campaign: adnaLaunch,
  brandVerified: 'aDNA · adna.network verified',
  reviewNote: 'Brand reviews each post',
  brief:
    'Explain why agents need shared project context. Start from a real moment when an agent lost context on your project, then show how a shared, versioned context file fixes it. Link to adna.network.',
  formats: [
    { id: 'blog', format: 'Blog post', where: 'Your blog', payout: '5 USDC' },
    { id: 'linkedin', format: 'LinkedIn post', where: 'LinkedIn', payout: '10 USDC' },
    { id: 'tutorial', format: 'Tutorial', where: 'Your blog', payout: '50 USDC' },
  ],
  formatsNote: 'Up to 3 pieces, one per channel.',
  rules: [
    'Disclose the sponsorship: "Sponsored by aDNA" or #ad',
    'Publish from your own account by 12 Oct, 23:59',
    'Keep it on-brand: JamJam flags drift and banned claims as you edit',
    'aDNA reviews each verified post within 48 hours',
  ],
  // "305 of 500 USDC left"; the bar draws 27% spent and 12% committed.
  budget: { spent: 135, committed: 60, cap: 500, unit: 'USDC' },
  howPaid: 'USDC lands in your JamJam account as soon as aDNA approves your verified post. Withdraw any time.',
  joinEmail: 'mai@[email]',
};

/** Board Amb-3-Generate (desktop) and M-3-Generate (mobile). Score 74% as generated, 91% with flags fixed (board Amb-4-Publish). */
export const generateData: GenerateData = {
  account: mai,
  campaignTitle: 'aDNA launch week',
  pieceLabel: "Piece 2 of 3 · written in aDNA's kit v1 voice",
  formatLabel: 'LinkedIn post · 10 USDC',
  formats: [
    { id: 'linkedin', label: 'LinkedIn post · 10 USDC' },
    { id: 'blog', label: 'Blog post · 5 USDC (done)' },
    { id: 'tutorial', label: 'Tutorial · 50 USDC' },
  ],
  format: 'linkedin',
  angle: 'I lost a day when my agent forgot our API conventions after a restart.',
  draft: [
    'My coding agent lost a full day of work last week. Not the code. The context.',
    "After a restart it had forgotten our API conventions, which tests were flaky, and why we'd ruled out two libraries. I explained it all again.",
    "That's the gap aDNA fills: an open standard for project context that any agent can read, version and audit. One shared file. No lock-in.",
    "It will 10x your team's output.",
    'Stop pasting a memory dump into every new session. Give your agents the context your team already has.',
    'adna.network',
  ].join('\n\n'),
  generatedNote: 'Draft generated 16:18 · edits saved',
  charLimit: 3000,
  score: 74,
  scoreWhenClean: 91,
  threshold: 80,
  checks: [
    {
      id: 'banned',
      title: 'Banned claim',
      phrase: "10x your team's output",
      detail: "aDNA doesn't allow productivity numbers without a source.",
      fixLabel: 'Remove line',
      shortFixLabel: 'Remove',
      rule: { kind: 'phrase', phrase: "10x your team's output", blocks: true, fix: { kind: 'remove-line' } },
    },
    {
      id: 'avoided',
      title: 'Avoided term',
      phrase: 'memory dump',
      detail: 'aDNA says "project context".',
      fixLabel: 'Replace',
      rule: { kind: 'phrase', phrase: 'memory dump', blocks: false, fix: { kind: 'replace', with: 'project context' } },
    },
    {
      id: 'disclosure',
      title: 'Missing disclosure',
      detail: 'Add "Sponsored by aDNA" or #ad.',
      fixLabel: 'Add at end',
      shortFixLabel: 'Add',
      rule: { kind: 'missing', anyOf: ['Sponsored by aDNA', '#ad'], append: 'Sponsored by aDNA', blocks: true },
    },
  ],
};

/** Board Amb-4-Publish (desktop) and M-4-Publish (mobile). No X route (ADR-002; canvas note n-a4). */
export const publishData: PublishData = {
  account: mai,
  formatLabel: 'LinkedIn post',
  chips: ['On-brand 91% ✓', 'No flags', 'Disclosure added'],
  mobileChips: ['On-brand 91% ✓', 'No flags'],
  postPreview: 'My coding agent lost a full day of work last week. Not the code. The context. …  Sponsored by aDNA',
  postLength: 212,
  connectedAs: 'Mai T.',
  routes: [
    {
      id: 'on-behalf',
      title: 'Post to LinkedIn for me',
      badge: 'Fastest · for this post',
      description: 'We publish from your LinkedIn account, so the post is verified the moment it goes live.',
      mobileDescription: 'Verified instantly. Connected as Mai T.',
      submitLabel: 'Post now',
    },
    {
      id: 'paste-url',
      title: 'Posted it yourself?',
      description: 'Paste the LinkedIn post URL. We read it back and match the author and the text.',
      field: { label: 'LinkedIn post URL', placeholder: 'https://www.linkedin.com/posts/…' },
      submitLabel: 'Submit URL',
    },
    {
      id: 'blog-url',
      title: 'Submit blog URL',
      description: 'For tutorials. Publish on your blog, then send the link. We check the page matches your draft.',
      field: { label: 'Page URL', placeholder: 'https://yourblog.com/…' },
      submitLabel: 'Submit',
    },
  ],
  notes: [
    "X posts aren't paid: X bans paying people for posts (ADR-002).",
    "A fingerprint of this text is recorded with your payment, so anyone can check it's brand-approved.",
  ],
};

/** Board Amb-5a-Verifying (loading). */
export const statusVerifying: PostStatusData = {
  account: mai,
  context: 'aDNA launch week · LinkedIn post · 10 USDC',
  title: 'Checking your post',
  outcome: 'verifying',
  steps: [
    { label: 'Published', state: 'done', note: '16:21 · [View on LinkedIn]' },
    { label: 'Verifying…', state: 'current', note: 'Usually under a minute' },
    { label: 'Approved', state: 'todo', note: 'aDNA reviews within 48 h' },
    { label: 'Paid', state: 'todo', note: '10 USDC' },
  ],
  message: "We're confirming the post is live on your account and matches your draft. You can close this page; we'll email you at each step.",
};

/** Board Amb-5b-Paid (success); board M-5-Status draws the same post. Balance after payout: 25 USDC. */
export const statusPaid: PostStatusData = {
  account: { ...mai, balance: '25 USDC' },
  context: 'aDNA launch week · LinkedIn post',
  title: 'Paid 10 USDC',
  outcome: 'paid',
  steps: [
    { label: 'Published', state: 'done', note: '16:21' },
    { label: 'Verified', state: 'done', note: '16:22 · posted from your account' },
    { label: 'Approved', state: 'done', note: '17:05 · by aDNA' },
    { label: 'Paid', state: 'done', note: '17:05' },
  ],
  paid: {
    amount: '10 USDC to your JamJam account',
    receipt: [
      { label: 'Amount', value: '10 USDC' },
      { label: 'Time', value: '17:05' },
      { label: 'Receipt', value: '[onchain receipt link]' },
    ],
    postLink: '[LinkedIn post link]',
    balance: '25 USDC',
    progress: '2 of 3 pieces done. Tutorial (50 USDC) still open.',
    nextLabel: { desktop: 'Write another piece', mobile: 'Write the tutorial (50 USDC)' },
  },
};

/** Board Amb-5c-VerifyFailed (error). */
export const statusFailed: PostStatusData = {
  account: mai,
  context: 'aDNA launch week · LinkedIn post · 10 USDC',
  title: "We couldn't verify your post",
  outcome: 'failed',
  steps: [
    { label: 'Submitted', state: 'done', note: '16:40 · URL pasted' },
    { label: 'Not verified', state: 'failed', note: '16:41' },
    { label: 'Approved', state: 'todo' },
    { label: 'Paid', state: 'todo' },
  ],
  failure: {
    chip: 'Check failed',
    title: "The post at that link doesn't match your draft",
    reasons: [
      "Text differs from your approved draft by 38%. Small edits are fine; rewrites aren't.",
      'Or the post is from a different LinkedIn account than the one on your profile (@[ambassador handle]).',
    ],
    held: 'Nothing has been paid. Your slot is held until 12 Oct, 23:59.',
    recoveries: [
      { id: 'link', title: 'Wrong link?', body: 'Paste the URL of the post you made from your draft.', actionLabel: 'Paste a different URL', to: 'publish' },
      { id: 'edit', title: 'Edited too much?', body: 'Edit in JamJam so the on-brand check passes, then repost.', actionLabel: 'Re-edit and repost', to: 'generate', primary: true },
      { id: 'review', title: "Think it's right?", body: 'Send it to aDNA to review by hand.', actionLabel: 'Ask aDNA to review', doneLabel: 'Sent to aDNA for review' },
    ],
  },
};

/** Board Amb-5d-BudgetReached (error). */
export const statusBudget: PostStatusData = {
  account: mai,
  context: 'aDNA launch week · Tutorial · 50 USDC',
  title: 'This campaign ran out of budget',
  outcome: 'budget',
  steps: [
    { label: 'Published', state: 'done', note: '11 Oct, 09:12' },
    { label: 'Verified', state: 'done', note: 'Page matches draft 96%' },
    { label: 'Not paid', state: 'failed', note: 'Budget reached' },
    { label: 'Paid', state: 'todo' },
  ],
  budget: {
    chip: 'Budget reached',
    title: "aDNA's 500 USDC cap was used up before your tutorial was approved",
    budget: { spent: 500, cap: 500, unit: 'USDC' },
    caption: '500 of 500 USDC paid out',
    body: 'Your tutorial is still verified and shows as brand-approved on the public check. It just can\'t be paid from this campaign.',
    optInLabel: 'Pay me if aDNA adds budget',
    optedInLabel: "You'll be paid if aDNA adds budget",
  },
};

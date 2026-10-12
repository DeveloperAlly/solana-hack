// Sample data for the Ambassador screens (issue #53). Every string is the canvas's own sample text, from the wireframe canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn (page "Ambassador"), on the board named beside each fixture. Anything the
// canvas brackets stays bracketed: those values are not sourced yet (canvas legend n-legend). Shapes: ./types.ts.
// Backend map rows (.agentic/what/context/backend_map.md §4): "Amb-1, Amb-1b, M-1", "Amb-2, M-2", "Amb-3, M-3", "Amb-4, M-4"
// and "Amb-5a, 5b, 5c, 5d, M-5".
import type { Account, CampaignDetailData, CampaignRef, CampaignsData, CampaignSummary, GenerateData, PieceFormat, PostStatusData, PublishData } from './types';

/** Board Amb-1-Campaigns nav chip "Mai T. · 15 USDC". */
export const mai: Account = { name: 'Mai T.', balance: '15 USDC' };

/** Board Amb-2-Detail "What you can make" (Blog post 5, LinkedIn post 10, Tutorial 50 USDC); Amb-3 marks the blog post done. */
export const adnaFormats: PieceFormat[] = [
  { id: 'blog', name: 'Blog post', noun: 'blog post', where: 'Your blog', channel: 'blog', payout: '5 USDC', done: true },
  { id: 'linkedin', name: 'LinkedIn post', noun: 'LinkedIn post', where: 'LinkedIn', channel: 'linkedin', payout: '10 USDC' },
  { id: 'tutorial', name: 'Tutorial', noun: 'tutorial', where: 'Your blog', channel: 'blog', payout: '50 USDC' },
];
const [, linkedinPost, tutorial] = adnaFormats;

/** The campaign every later board is about (boards Amb-2 to Amb-5d). */
const adnaRef: CampaignRef = { title: 'aDNA launch week', brand: 'aDNA' };

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

/** Board Amb-1-Campaigns: the film.fun card is bracketed on the canvas. The third card's sample brand is replaced with a listed demo brand (GamersLab) with bracketed details. */
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
    brand: 'GamersLab',
    brandLine: 'GamersLab · [one-line description]',
    title: '[GamersLab campaign name]',
    channels: ['linkedin', 'blog'],
    payoutRange: '[payout] USDC',
    daysLeft: null,
    maxPayout: null,
    budgetReached: true,
    hasDetail: false,
  },
];

export const campaignsData: CampaignsData = { account: mai, campaigns, notifyBrands: ['JamJam', 'aDNA', 'film.fun', 'GamersLab'] };

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
  formats: adnaFormats,
  formatsNote: 'Up to 3 pieces, one per channel.',
  rules: [
    'Disclose the sponsorship: "Sponsored by aDNA" or #ad',
    'Publish from your own account by 12 Oct, 23:59',
    'Keep it on-brand: JamJam flags drift and banned claims as you edit',
    'aDNA reviews each verified post within 48 hours',
  ],
  // "305 of 500 USDC left"; the bar draws 27% spent and 12% committed.
  budget: { spent: 135, committed: 60, cap: 500, unit: 'USDC' },
  // Canvas text corrected to the backend map row "Amb-5a, 5b, 5c, 5d, M-5" and ADR-006: payouts go to the ambassador's own wallet.
  howPaid: 'USDC goes to your own wallet once aDNA approves your verified post.',
  joinEmail: 'mai@[email]',
};

/** Board Amb-3-Generate (desktop) and M-3-Generate (mobile). Score 74% as generated, 91% with flags fixed (board Amb-4-Publish). */
export const generateData: GenerateData = {
  account: mai,
  campaign: adnaRef,
  pieceLabel: "Piece 2 of 3 · written in aDNA's kit v1 voice",
  formats: adnaFormats,
  format: linkedinPost.id,
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
      label: "aDNA doesn't allow productivity numbers without a source.",
      fixLabel: 'Remove line',
      shortFixLabel: 'Remove',
      rule: { kind: 'phrase', phrase: "10x your team's output", blocks: true, fix: { kind: 'remove-line' } },
    },
    {
      id: 'avoided',
      title: 'Avoided term',
      phrase: 'memory dump',
      label: 'aDNA says "project context".',
      fixLabel: 'Replace',
      rule: { kind: 'phrase', phrase: 'memory dump', blocks: false, fix: { kind: 'replace', with: 'project context' } },
    },
    {
      id: 'disclosure',
      title: 'Missing disclosure',
      label: 'Add "Sponsored by aDNA" or #ad.',
      fixLabel: 'Add at end',
      shortFixLabel: 'Add',
      rule: { kind: 'missing', anyOf: ['Sponsored by aDNA', '#ad'], append: 'Sponsored by aDNA', blocks: true },
    },
  ],
};

/** Board Amb-4-Publish (desktop) and M-4-Publish (mobile). No X route (ADR-002; canvas note n-a4). */
export const publishData: PublishData = {
  account: mai,
  piece: linkedinPost,
  // Canvas Amb-4 preview: the Amb-3 draft with its flags fixed (banned line removed, "project context", disclosure added).
  draft: [
    'My coding agent lost a full day of work last week. Not the code. The context.',
    "After a restart it had forgotten our API conventions, which tests were flaky, and why we'd ruled out two libraries. I explained it all again.",
    "That's the gap aDNA fills: an open standard for project context that any agent can read, version and audit. One shared file. No lock-in.",
    'Stop pasting a project context into every new session. Give your agents the context your team already has.',
    'adna.network',
    'Sponsored by aDNA',
  ].join('\n\n'),
  review: { score: 91, openFlags: 0, disclosed: true },
  connectedAs: 'Mai T.',
  routes: [
    {
      id: 'on-behalf',
      channel: 'linkedin',
      title: 'Post to LinkedIn for me',
      badge: 'Fastest · for this post',
      description: 'We publish from your LinkedIn account, so the post is verified the moment it goes live.',
      mobileDescription: 'Verified instantly.',
      submitLabel: 'Post now',
    },
    {
      id: 'paste-url',
      channel: 'linkedin',
      title: 'Posted it yourself?',
      description: 'Paste the LinkedIn post URL. We read it back and match the author and the text.',
      field: { label: 'LinkedIn post URL', placeholder: 'https://www.linkedin.com/posts/…' },
      submitLabel: 'Submit URL',
    },
    {
      id: 'blog-url',
      channel: 'blog',
      title: 'Submit blog URL',
      description: 'For tutorials. Publish on your blog, then send the link. We check the page matches your draft.',
      field: { label: 'Page URL', placeholder: 'https://yourblog.com/…' },
      submitLabel: 'Submit',
    },
  ],
  notes: [
    "X posts aren't paid: X bans paying people for posts (ADR-002).",
    'A fingerprint of this text is recorded with your payment, so anyone can check the published text matches the approved draft.',
  ],
};

/** Shared by the status boards: who, what and how it was published (boards Amb-5a to Amb-5c). */
// The balance before this payout is the canvas chip "Mai T. · 15 USDC"; Amb-5b's 25 USDC is computed from it (copy.ts).
const statusBase = {
  ambassador: { name: mai.name, startingBalance: 15, unit: 'USDC' },
  campaign: adnaRef,
  piece: linkedinPost,
  formats: adnaFormats,
  route: 'on-behalf' as const,
};

/** Board Amb-5a-Verifying (loading). */
export const statusVerifying: PostStatusData = { ...statusBase, outcome: 'verifying', times: { published: '16:21' } };

/** Board Amb-5b-Paid (success); board M-5-Status draws the same post. Balance after payout: 25 USDC. */
export const statusPaid: PostStatusData = {
  ...statusBase,
  outcome: 'paid',
  times: { published: '16:21', verified: '16:22', approved: '17:05', paid: '17:05' },
  paid: {
    receiptLink: '[onchain receipt link]',
    postLink: '[LinkedIn post link]',
  },
};

/** Board Amb-5c-VerifyFailed (error): a pasted LinkedIn URL that did not match. */
export const statusFailed: PostStatusData = {
  ...statusBase,
  route: 'paste-url',
  outcome: 'failed',
  times: { published: '16:40', failed: '16:41' },
  failure: {
    chip: 'Check failed',
    // Canvas Amb-5c draws the LinkedIn case; the blog case keeps only the reason that applies to a page.
    title: { linkedin: "The post at that link doesn't match your draft", blog: "The page at that link doesn't match your draft" },
    reasons: {
      linkedin: [
        "Text differs from your approved draft by 38%. Small edits are fine; rewrites aren't.",
        'Or the post is from a different LinkedIn account than the one on your profile (@[ambassador handle]).',
      ],
      blog: ["Text differs from your approved draft by 38%. Small edits are fine; rewrites aren't."],
    },
    held: 'Nothing has been paid. Your slot is held until 12 Oct, 23:59.',
    recoveries: [
      { id: 'link', title: 'Wrong link?', body: 'Paste the URL of the post you made from your draft.', actionLabel: 'Paste a different URL', to: 'publish' },
      { id: 'edit', title: 'Edited too much?', body: 'Edit in JamJam so the on-brand check passes, then repost.', actionLabel: 'Re-edit and repost', to: 'generate', primary: true },
      { id: 'review', title: "Think it's right?", body: 'Send it to {brand} to review by hand.', actionLabel: 'Ask {brand} to review', doneLabel: 'Sent to {brand} for review' },
    ],
  },
};

/** Board Amb-5d-BudgetReached (error): a tutorial on the blog, verified, unpaid. */
export const statusBudget: PostStatusData = {
  ...statusBase,
  piece: tutorial,
  route: 'blog-url',
  outcome: 'budget',
  times: { published: '11 Oct, 09:12' },
  verifiedNote: 'Page matches draft 96%',
  budget: {
    chip: 'Budget reached',
    budget: { spent: 500, cap: 500, unit: 'USDC' },
  },
};

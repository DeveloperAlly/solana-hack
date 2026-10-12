// M2 channel registry (component inventory §7): every place a brand can distribute to, grouped by kind, with its
// status, what JamJam plans to do there, how it connects and its posting rules (issue #82, "Platforms page").
//
// Truth rules (issue #82; AGENTS rule 6):
// - Status: nothing publishes yet. web/worker has no platform integration (no OAuth, no publish call; checked
//   2026-10-13), so no platform is Live. X and LinkedIn publishing are "coming soon" (canvas J8-Hub-FirstRun and
//   Settings-Connections; backend map §4 row "Settings › Connections"); every other platform is Planned.
// - Capabilities are plans, not facts. `today` names the one thing that works now, with its source.
// - Posting rules carry a source. A rule with no official source found stays bracketed: "[platform posting rules]".
//   Sources were found with a web search on 2026-10-13 and read from the official page.
// - Connect methods named only where a repo doc names them (X and LinkedIn OAuth: backend map §9; the Discord bot and
//   the Telegram brand bot: canvas Inbox-Connect; a feed URL for blogs: the site ingest); the rest stay bracketed.

import { platformLimit, xWeightedLength } from '../lib/xLength';

export const platformKinds = [
  { id: 'social', label: 'Social' },
  { id: 'long-form', label: 'Long-form' },
  { id: 'video', label: 'Video' },
  { id: 'community', label: 'Community' },
  { id: 'developer', label: 'Developer' },
] as const;
export type PlatformKind = (typeof platformKinds)[number]['id'];

export const platformStatuses = [
  { id: 'live', label: 'Live' },
  { id: 'soon', label: 'Coming soon' },
  { id: 'planned', label: 'Planned' },
] as const;
export type PlatformStatus = (typeof platformStatuses)[number]['id'];

/** What JamJam does on a platform (issue #82): draft, publish, read history, inbox, verify. */
export const capabilities = {
  draft: 'Draft posts in its format',
  publish: 'Publish approved posts',
  history: 'Read your post history',
  inbox: 'Bring messages into the inbox',
  verify: 'Verify posts made there',
} as const;
export type Capability = keyof typeof capabilities;

/** Short names for one-line summaries ("draft, publish, verify"). */
export const capabilityShort: Record<Capability, string> = { draft: 'draft', publish: 'publish', history: 'read history', inbox: 'inbox', verify: 'verify' };

export interface Source {
  label: string;
  href?: string;
}

export interface PostingRule {
  text: string;
  /** Null keeps the rule bracketed: no official source was found. */
  source: Source | null;
}

export interface Platform {
  id: string;
  name: string;
  kind: PlatformKind;
  status: PlatformStatus;
  /** Planned capabilities. */
  plans: Capability[];
  /** How a brand connects it; bracketed where no repo doc names the method. */
  connect: string;
  rules: PostingRule[];
  /** What works today, with its source (only where the repo shows it). */
  today?: { text: string; source: Source };
  /** The platform's hard character limit for a post, with its source; absent where it has none or none is known. */
  charLimit?: { value: number; source: Source };
}

const unsourced: PostingRule[] = [{ text: '[platform posting rules]', source: null }];
const toConfirm = '[how to connect]';

const deckWhyNow: Source = {
  label: 'Pitch deck v2, slide 05 "Why now", citing the X developer policy (Jan 2026)',
  href: 'https://docs.x.com/developer-terms/policy',
};
const backendMapApis: Source = { label: 'Backend map §9, external API facts (verified 2026-10-06)', href: 'https://docs.x.com/x-api/posts/create-post' };
const createDrafts: Source = { label: 'web/worker/posts.ts: drafts take a channel; platformLimit enforces X’s 280 characters' };

export const platforms: Platform[] = [
  {
    id: 'x',
    name: 'X',
    kind: 'social',
    status: 'soon',
    plans: ['draft', 'publish', 'history', 'inbox', 'verify'],
    connect: 'Sign in with X (OAuth 2.0 with PKCE)',
    rules: [
      { text: 'X bars apps that reward people for posting, so JamJam never pays anyone for an X post.', source: deckWhyNow },
      { text: 'A post is at most 280 characters, counted the way X counts them (weighted characters).', source: createDrafts },
      { text: 'A paid post can carry X’s paid-partnership label (the paid_partnership field).', source: backendMapApis },
    ],
    today: { text: 'Create drafts X posts and holds them to X’s 280-character limit.', source: createDrafts },
    // The Worker's own limit (lib/xLength mirrors web/worker/posts.ts platformLimit, with a parity test).
    charLimit: { value: platformLimit('x') as number, source: createDrafts },
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    kind: 'social',
    status: 'soon',
    plans: ['draft', 'publish', 'history', 'inbox', 'verify'],
    connect: 'Sign in with LinkedIn (OAuth)',
    rules: [
      {
        text: 'Posting as yourself uses self-serve access; posting as a company page needs LinkedIn’s approval.',
        source: { label: 'Backend map §9 (LinkedIn: self-serve w_member_social; organisation posting needs approval)', href: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access' },
      },
      { text: 'Reading comments on your posts is not available to apps (r_member_social is closed).', source: { label: 'Backend map §4, row "Engage-Queue"' } },
    ],
    today: { text: 'Create drafts LinkedIn posts (the default channel).', source: createDrafts },
    // Web search on 2026-10-13: third-party posting guides agree on 3,000; LinkedIn's own help page could not be read
    // (robots), so confirm it before the Worker enforces it.
    charLimit: { value: 3000, source: { label: 'Third-party posting guides (LinkedIn’s own help page not read; to confirm)', href: 'https://authoredup.com/blog/linkedin-character-limit' } },
  },
  { id: 'bluesky', name: 'Bluesky', kind: 'social', status: 'planned', plans: ['draft', 'publish', 'verify'], connect: toConfirm, rules: unsourced },
  {
    id: 'threads',
    name: 'Threads',
    kind: 'social',
    status: 'planned',
    plans: ['draft', 'publish', 'verify'],
    connect: toConfirm,
    rules: [
      { text: 'Text posts are limited to 500 characters.', source: { label: 'Meta, Threads API overview', href: 'https://developers.facebook.com/documentation/threads/overview' } },
      { text: 'A profile can publish 250 posts through the API in any 24 hours; a carousel counts as one.', source: { label: 'Meta, Threads API overview', href: 'https://developers.facebook.com/documentation/threads/overview' } },
    ],
    charLimit: { value: 500, source: { label: 'Meta, Threads API overview', href: 'https://developers.facebook.com/documentation/threads/overview' } },
  },
  { id: 'instagram', name: 'Instagram', kind: 'social', status: 'planned', plans: ['draft', 'publish', 'inbox', 'verify'], connect: toConfirm, rules: unsourced },
  { id: 'tiktok', name: 'TikTok', kind: 'social', status: 'planned', plans: ['draft', 'publish', 'verify'], connect: toConfirm, rules: unsourced },
  { id: 'facebook', name: 'Facebook', kind: 'social', status: 'planned', plans: ['draft', 'publish', 'verify'], connect: toConfirm, rules: unsourced },
  {
    id: 'mastodon',
    name: 'Mastodon',
    kind: 'social',
    status: 'planned',
    plans: ['draft', 'publish', 'verify'],
    connect: toConfirm,
    rules: [
      { text: 'Each server sets its own character limit per post (configuration.statuses.max_characters).', source: { label: 'Mastodon documentation, Instance entity', href: 'https://docs.joinmastodon.org/entities/Instance/' } },
    ],
  },
  { id: 'farcaster', name: 'Farcaster', kind: 'social', status: 'planned', plans: ['draft', 'publish', 'inbox', 'verify'], connect: toConfirm, rules: unsourced },
  { id: 'substack', name: 'Substack', kind: 'long-form', status: 'planned', plans: ['draft', 'verify'], connect: toConfirm, rules: unsourced },
  { id: 'medium', name: 'Medium', kind: 'long-form', status: 'planned', plans: ['draft', 'verify'], connect: toConfirm, rules: unsourced },
  { id: 'ghost', name: 'Ghost', kind: 'long-form', status: 'planned', plans: ['draft', 'publish', 'verify'], connect: toConfirm, rules: unsourced },
  { id: 'beehiiv', name: 'beehiiv', kind: 'long-form', status: 'planned', plans: ['draft', 'verify'], connect: toConfirm, rules: unsourced },
  { id: 'blog', name: 'Own blog or RSS', kind: 'long-form', status: 'planned', plans: ['draft', 'history', 'verify'], connect: 'Paste your feed or blog URL', rules: unsourced },
  { id: 'youtube', name: 'YouTube', kind: 'video', status: 'planned', plans: ['draft', 'publish', 'history', 'verify'], connect: toConfirm, rules: unsourced },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    kind: 'video',
    status: 'planned',
    plans: ['draft', 'publish', 'verify'],
    connect: toConfirm,
    rules: [
      { text: 'A Short is up to three minutes long, square or vertical; a wider video counts as long-form.', source: { label: 'YouTube Help, "Understand three-minute YouTube Shorts"', href: 'https://support.google.com/youtube/answer/15424877?hl=en' } },
    ],
  },
  { id: 'reddit', name: 'Reddit', kind: 'community', status: 'planned', plans: ['draft', 'verify'], connect: toConfirm, rules: unsourced },
  { id: 'discord', name: 'Discord', kind: 'community', status: 'planned', plans: ['draft', 'publish', 'inbox', 'verify'], connect: 'Add the JamJam bot to your server', rules: unsourced },
  { id: 'telegram', name: 'Telegram', kind: 'community', status: 'planned', plans: ['draft', 'publish', 'inbox', 'verify'], connect: 'Connect your brand’s Telegram bot', rules: unsourced },
  { id: 'github', name: 'GitHub', kind: 'developer', status: 'planned', plans: ['draft', 'verify'], connect: toConfirm, rules: unsourced },
  { id: 'devto', name: 'dev.to', kind: 'developer', status: 'planned', plans: ['draft', 'publish', 'verify'], connect: toConfirm, rules: unsourced },
];

export const statusLabel = (s: PlatformStatus): string => platformStatuses.find((x) => x.id === s)!.label;
export const kindLabel = (k: PlatformKind): string => platformKinds.find((x) => x.id === k)!.label;
/** A post's length as the platform counts it: X's weighted count (the Worker's rule, lib/xLength), else code points. */
export function postLength(platform: Pick<Platform, 'id'>, text: string): number {
  return platformLimit(platform.id) !== null ? xWeightedLength(text) : [...text].length;
}
export const findPlatform = (id: string | null | undefined): Platform | undefined => platforms.find((p) => p.id === id);
/** The hard character limit of a post on this platform, or null where it has none (a blog) or none is known. */
export const charLimitFor = (id: string | null | undefined): number | null => findPlatform(id)?.charLimit?.value ?? null;

// The one navigation (ADR-012 decision 2, PR #86; owner rulings in issue #90). Every shell reads its stages, tabs and
// mobile tabs from here; no nav markup is hand-written. The labels and targets are the canvas v24 boards' own nav:
// the main nav (Today · Brand · Create · Distribute · Verify · Grow · Learn | Inbox · Settings), each step's subnav,
// and the M-Today tab bar (canvas.json version 1791818793-e756, https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
//
// Each target names its canvas artboard (the gallery route) and, where one exists, the live route (config/routes.ts).
// The live hub nav (`hubNav`) and the live routes are unchanged; moving the live hub onto this nav is a later step.
import { artboardPages, type ArtboardName } from './artboards';
import type { CanvasPageId } from '../screens/registry-types';

/** Where a nav item goes: a canvas artboard in the gallery, and the live route when the product has one. */
export interface NavTarget {
  artboard: ArtboardName;
  /** Live route (config/routes.ts). Absent while the step only exists as screens on sample data. */
  live?: string;
}

export interface StageTab extends NavTarget {
  id: string;
  label: string;
  /** Other boards that show this tab as current (the canvas subnav marks it on them): steps and details of the tab. */
  also?: readonly ArtboardName[];
}

export type LoopStageId = 'brand' | 'create' | 'distribute' | 'verify' | 'grow' | 'learn';
export type UtilityId = 'inbox' | 'settings';
/** A destination in the main nav: Today, the six loop steps, then the utilities. */
export type StageId = 'today' | LoopStageId | UtilityId;

export interface Stage extends NavTarget {
  id: StageId;
  label: string;
  /** `front`: Today; `loop`: one of the six steps (numbered); `utility`: Inbox and Settings, after the divider. */
  kind: 'front' | 'loop' | 'utility';
  /** Loop step number, 1 to 6 (loop stages only). */
  step?: number;
  /** One line on what the step does: the Loop-Map board's step lines. */
  summary: string;
  /** Section tabs inside the stage, exactly as the canvas subnav draws them; the first tab is the stage's home. */
  tabs: readonly StageTab[];
}

export const stages: readonly Stage[] = [
  { id: 'today', label: 'Today', kind: 'front', summary: 'One queue of decisions', artboard: 'Today', live: '/home', tabs: [] },
  {
    id: 'brand', label: 'Brand', kind: 'loop', step: 1, summary: 'Build your brand and voice', artboard: 'Brand-Build', live: '/brand',
    tabs: [
      { id: 'kit', label: 'Kit', artboard: 'Brand-Build', live: '/brand', also: ['Kit-Export'] },
      { id: 'brain', label: 'The Brain', artboard: 'Brain' },
      { id: 'voices', label: 'Voices', artboard: 'Voice-Templates', also: ['Voice-Editor'] },
      { id: 'claims', label: 'Claims', artboard: 'Claims' },
      { id: 'founder', label: 'Founder', artboard: 'Founder-Profile' },
    ],
  },
  {
    id: 'create', label: 'Create', kind: 'loop', step: 2, summary: 'Content in your voice, every claim backed', artboard: 'Content-Dashboard', live: '/create',
    tabs: [
      { id: 'drafts', label: 'Drafts', artboard: 'Content-Dashboard', live: '/create', also: ['Content-Dashboard-Empty', 'Draft-Review', 'Draft-Review-Beautified', 'Draft-Review-PolishError'] },
      { id: 'post', label: 'Post', artboard: 'Post-Detail' },
      { id: 'media', label: 'Media', artboard: 'Media-Composer', also: ['Media-Review'] },
    ],
  },
  {
    id: 'distribute', label: 'Distribute', kind: 'loop', step: 3, summary: 'Write once, it goes everywhere', artboard: 'Platforms', live: '/distribute',
    tabs: [
      { id: 'platforms', label: 'Platforms', artboard: 'Platforms', live: '/distribute', also: ['Platform-Detail'] },
      { id: 'adapt', label: 'Adapt and schedule', artboard: 'Distribute-Adapt' },
      { id: 'calendar', label: 'Calendar', artboard: 'Publish-Calendar' },
      { id: 'connections', label: 'Connections', artboard: 'Settings-Connections' },
    ],
  },
  {
    id: 'verify', label: 'Verify', kind: 'loop', step: 4, summary: "Anyone can check it's really you", artboard: 'Verify-Home', live: '/verify-home',
    tabs: [
      { id: 'proof', label: 'Your proof', artboard: 'Verify-Home', live: '/verify-home' },
      { id: 'badge', label: 'Badge', artboard: 'Badge-Embed' },
      { id: 'tips', label: 'Tips', artboard: 'Tips-Received' },
      { id: 'ledger', label: 'Public ledger', artboard: 'Ledger', live: '/ledger' },
    ],
  },
  {
    id: 'grow', label: 'Grow', kind: 'loop', step: 5, summary: 'Ambassadors, events, campaigns', artboard: 'Grow-Home', live: '/grow',
    tabs: [
      { id: 'overview', label: 'Overview', artboard: 'Grow-Home', live: '/grow' },
      { id: 'ambassadors', label: 'Ambassadors', artboard: 'Dashboard', also: ['Dashboard-Empty', 'Quests'] },
      { id: 'campaigns', label: 'Campaigns', artboard: 'Campaign-v2-1-Goal', also: ['Campaign-v2-2-Measure', 'Campaign-v2-3-Audience', 'Campaign-v2-4-Plan', 'Campaign-v2-5-Budget', 'Campaign-v2-6-Launch'] },
      { id: 'events', label: 'Events', artboard: 'Events', also: ['Event-Detail'] },
      { id: 'engage', label: 'Engage', artboard: 'Engage-Queue', also: ['Engage-Rules'] },
      { id: 'partners', label: 'Partners', artboard: 'Partners' },
      { id: 'leads', label: 'Leads', artboard: 'Leads' },
      { id: 'influencers', label: 'Influencers', artboard: 'Influencer-Setup', also: ['Influencer-Queue'] },
      { id: 'referrals', label: 'Referrals', artboard: 'Referral' },
      { id: 'team', label: 'Team', artboard: 'Invite-Team' },
    ],
  },
  {
    id: 'learn', label: 'Learn', kind: 'loop', step: 6, summary: 'Learn from what works', artboard: 'Analytics', live: '/learn',
    tabs: [
      { id: 'results', label: 'Results', artboard: 'Analytics', live: '/learn', also: ['Analytics-Empty'] },
      { id: 'rules', label: 'Suggested rules', artboard: 'Learn-Rules' },
      { id: 'outcomes', label: 'Outcomes', artboard: 'Outcome-Log' },
    ],
  },
  {
    id: 'inbox', label: 'Inbox', kind: 'utility', summary: 'Every conversation, one place', artboard: 'Inbox-All', live: '/inbox',
    tabs: [
      { id: 'all', label: 'All', artboard: 'Inbox-All', live: '/inbox' },
      { id: 'needs-reply', label: 'Needs reply', artboard: 'Inbox-NeedsReply' },
      { id: 'sources', label: 'Sources', artboard: 'Inbox-Connect' },
    ],
  },
  {
    id: 'settings', label: 'Settings', kind: 'utility', summary: 'AI model, connections, plan and team', artboard: 'Settings-AI', live: '/settings',
    tabs: [
      { id: 'ai', label: 'AI model', artboard: 'Settings-AI', live: '/settings', also: ['Settings-GetKey'] },
      { id: 'connections', label: 'Connections', artboard: 'Settings-Connections' },
      { id: 'plan', label: 'Plan and seats', artboard: 'Settings-Plan', also: ['Upgrade'] },
      { id: 'team', label: 'Team', artboard: 'Invite-Team' },
    ],
  },
];

/** Today and the six steps, in loop order: the main nav before the divider. */
export const loopStages = stages.filter((s) => s.kind !== 'utility');
/** The six numbered steps only (Brand to Learn). */
export const loopSteps = stages.filter((s) => s.kind === 'loop');
/** Inbox and Settings: the main nav after the divider. */
export const utilityStages = stages.filter((s) => s.kind === 'utility');

export function stageById(id: StageId): Stage {
  const s = stages.find((x) => x.id === id);
  if (!s) throw new Error(`nav: no stage ${id}`);
  return s;
}

/** A stage's tab by id; throws on a tab the canvas does not draw, so a misspelt tab never renders silently. */
export function tabById(stage: StageId, tab: string): StageTab {
  const t = stageById(stage).tabs.find((x) => x.id === tab);
  if (!t) throw new Error(`nav: stage ${stage} has no tab ${tab}`);
  return t;
}

export interface MobileTab extends NavTarget {
  id: string;
  label: string;
  /** The stages this tab stands for: it is current on any of them ("More" holds the rest). */
  stages: readonly StageId[];
}

/** Mobile tab bar (canvas M-Today; at most five items, ADR-012 decision 2): Today, Create, Verify, Grow, More. */
export const mobileTabs: readonly MobileTab[] = [
  { id: 'today', label: 'Today', artboard: 'M-Today', live: '/home', stages: ['today'] },
  { id: 'create', label: 'Create', artboard: 'Content-Dashboard', live: '/create', stages: ['create'] },
  { id: 'verify', label: 'Verify', artboard: 'Verify-Home', live: '/verify-home', stages: ['verify'] },
  { id: 'grow', label: 'Grow', artboard: 'Grow-Home', live: '/grow', stages: ['grow'] },
  { id: 'more', label: 'More', artboard: 'Brand-Build', live: '/brand', stages: ['brand', 'distribute', 'learn', 'inbox', 'settings'] },
];

export function mobileTabFor(stage: StageId): MobileTab {
  const t = mobileTabs.find((x) => x.stages.includes(stage));
  if (!t) throw new Error(`nav: no mobile tab holds ${stage}`);
  return t;
}

/**
 * A screen's home (ADR-012, "every screen has exactly one home and one shell"): a nav stage (Today, a loop step, or
 * a utility), or the first run (the landing and the Journey, which ends on Today; ADR-012 decision 6).
 */
export type HomeId = StageId | 'first-run';

/** Pages in the product: every canvas page except the Archive ("licensee"), whose boards have no home. */
export type ProductPageId = Exclude<CanvasPageId, 'licensee'>;

/** The home of each single-home page. */
const pageHome: Record<Exclude<ProductPageId, 'utilities'>, HomeId> = {
  loop: 'today',
  journey: 'first-run',
  brand: 'brand',
  create: 'create',
  distribute: 'distribute',
  public: 'verify',
  grow: 'grow',
  learn: 'learn',
};

/**
 * The home of a canvas board, from its canvas page (ADR-012). Each page is one home (`loop` is Today, `public` is
 * Verify); the utilities page splits by board: Inbox-* boards are Inbox, the rest Settings. Public screens keep the
 * home of their step's page (Verify-1 is Verify; Events-Board and Referral-Landing are Grow). Invite-Accept and
 * Invite-Team are on the Grow page in canvas v24, so their home is Grow; a different home is a canvas move, never an
 * override here. The nav stage a screen highlights is its own (AppShell `stage`) and can differ from its home: the
 * Brain is on the loop page (home Today) and is drawn as Brand's tab.
 */
export function homeForPage(page: ProductPageId, artboard: ArtboardName): HomeId {
  if (page === 'utilities') return artboard.startsWith('Inbox-') ? 'inbox' : 'settings';
  return pageHome[page];
}

/** The home of a canvas artboard, from its page in config/artboards.ts; undefined for an archived board. */
export function homeForArtboard(artboard: ArtboardName): HomeId | undefined {
  const page = artboardPages[artboard] as CanvasPageId; // widened: a regenerated canvas may put boards on any page
  return page === 'licensee' ? undefined : homeForPage(page, artboard);
}

/** Who a screen is for, and so which shell frames it (ADR-012 decision 7): owner and team, ambassador, or public. */
export const shells = ['app', 'ambassador', 'public'] as const;
export type ShellId = (typeof shells)[number];

/** Whether a tab opens this board, or shows as current on it. */
const tabHolds = (tab: StageTab, artboard: ArtboardName) => tab.artboard === artboard || Boolean(tab.also?.includes(artboard));

/**
 * Boards with no stage home that still draw the signed-in nav, and the stage they mark (their canvas boards' own nav):
 * the first-run hub J8 and Hub-Home, which Today replaced (ADR-012).
 */
const shownUnder: Partial<Record<ArtboardName, StageId>> = { 'J8-Hub-FirstRun': 'today', 'Hub-Home': 'today' };

/** Where a signed-in board sits in the one nav: the stage it marks current, and its tab when it has one. */
export interface BoardNav {
  stage: StageId;
  tab?: string;
}

/**
 * The stage and tab a signed-in board shows as current, derived from this file and the board's home; frames read it,
 * none hard-codes a stage. The board's home stage wins when one of its tabs holds the board (Invite-Team is Grow's
 * Team tab); otherwise the stage whose tab holds it (the Brain, home Today, is Brand's "The Brain" tab; Post-Detail is
 * Create's "Post"); otherwise the home stage with no tab. `under` names the board whose tab to mark, for a board the
 * canvas draws under another. Throws for a board that draws no signed-in nav (the Journey steps).
 */
export function navForArtboard(artboard: ArtboardName, under: ArtboardName = artboard): BoardNav {
  const home = homeForArtboard(artboard);
  const homeStage = home && home !== 'first-run' ? home : shownUnder[artboard];
  if (!homeStage) throw new Error(`nav: ${artboard} draws no signed-in nav (home ${home ?? 'none'})`);
  const homeTab = stageById(homeStage).tabs.find((t) => tabHolds(t, under));
  if (homeTab) return { stage: homeStage, tab: homeTab.id };
  const owner = stages.find((s) => s.tabs.some((t) => tabHolds(t, under)));
  if (owner) return { stage: owner.id, tab: owner.tabs.find((t) => tabHolds(t, under))?.id };
  return { stage: homeStage };
}

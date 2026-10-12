// Shared data shapes for the Ambassador page (issue #53). Fixtures, screens and the data contracts import from here.
// Sources: wireframe canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn (page "Ambassador", boards Amb-* and M-*);
// backend map rows "Amb-1, Amb-1b, M-1" to "Amb-5a, 5b, 5c, 5d, M-5" (.agentic/what/context/backend_map.md §4).
import type { AmbBudget } from '../../ui/domain/AmbBudgetBar';
import type { AmbCheck } from '../../ui/domain/AmbChecksList';
import type { AmbTimelineStep } from '../../ui/domain/AmbStatusTimeline';

export type { AmbBudget, AmbCheck, AmbTimelineStep };

/** Desktop (Amb-*) or mobile (M-*) artboard. One screen component renders both. */
export type Device = 'desktop' | 'mobile';

/** Paid ambassador channels. X is never one: X bans paying for posts (ADR-002); the API rejects a paid X format. */
export type Channel = 'linkedin' | 'blog';

/** The signed-in ambassador's chip ("Mai T. · 15 USDC"); null when signed out ("Sign in"). */
export interface Account {
  name: string;
  balance: string;
}

/** One card in the open-campaigns list (GET /api/campaigns/open). */
export interface CampaignSummary {
  id: string;
  brand: string;
  /** Brand and its one-line description, e.g. "aDNA · open standard for agentic project context". */
  brandLine: string;
  title: string;
  channels: Channel[];
  /** "5–50 USDC" or the canvas's bracketed "[payout] USDC". */
  payoutRange: string;
  payoutBreakdown?: string;
  /** "6 days left"; absent once the budget is reached. */
  timeLeft?: string;
  endsOn?: string;
  /** Days left, for "Ending soonest"; null when unknown or closed. */
  daysLeft: number | null;
  /** Highest payout per piece in USDC, for "Highest payout"; null when the canvas brackets it. */
  maxPayout: number | null;
  slots?: string;
  budgetUsedPct?: number;
  /** Closed campaigns stay visible so people see why (canvas note n-a1). */
  budgetReached: boolean;
  /** Only campaigns with a built detail screen link to it; the rest show View without a target. */
  hasDetail: boolean;
}

export interface CampaignsData {
  account: Account | null;
  campaigns: CampaignSummary[];
  /** Brands offered "Notify me" when nothing is open (canvas Amb-1b). */
  notifyBrands: string[];
}

/** One piece a campaign pays for (canvas Amb-2 "What you can make"). The chosen one flows from Generate to Status. */
export interface PieceFormat {
  id: string;
  /** "LinkedIn post", "Blog post", "Tutorial". */
  name: string;
  where: string;
  channel: Channel;
  /** "10 USDC". */
  payout: string;
  /** Already written for this campaign (canvas Amb-3: "Blog post · 5 USDC (done)"). */
  done?: boolean;
}

/** The campaign a piece is written for, carried from Detail into Generate, Publish and Status. */
export interface CampaignRef {
  title: string;
  brand: string;
}

export interface CampaignDetailData {
  account: Account | null;
  campaign: CampaignSummary;
  brandVerified: string;
  reviewNote: string;
  brief: string;
  formats: PieceFormat[];
  formatsNote: string;
  rules: string[];
  budget: AmbBudget;
  howPaid: string;
  joinEmail: string;
}

export interface GenerateData {
  account: Account | null;
  campaign: CampaignRef;
  pieceLabel: string;
  formats: PieceFormat[];
  /** Default format id. */
  format: string;
  angle: string;
  draft: string;
  generatedNote: string;
  charLimit: number;
  /** On-brand score of `draft` as generated (74% on the canvas). */
  score: number;
  /** Score once every flag is fixed (91% on canvas Amb-4). */
  scoreWhenClean: number;
  /** Publish unlocks at this score with no banned claims and the disclosure present (canvas note n-a3). */
  threshold: number;
  checks: DraftCheck[];
}

/** How a flag is detected and fixed locally. INTEGRATION: GET /api/drafts/:id/checks returns these. */
export type DraftRule =
  | { kind: 'phrase'; phrase: string; blocks: boolean; fix: { kind: 'remove-line' } | { kind: 'replace'; with: string } }
  | { kind: 'missing'; anyOf: string[]; append: string; blocks: boolean };

/** One flag on a draft: what AmbChecksList shows, plus its rule. */
export interface DraftCheck extends AmbCheck {
  rule: DraftRule;
}

export type PublishRouteId = 'on-behalf' | 'paste-url' | 'blog-url';

/** The draft's check results as it left Generate: what Publish shows in its chips. */
export interface DraftReview {
  score: number;
  openFlags: number;
  disclosed: boolean;
}

/** One publish route (canvas note n-a4: one route per piece). URL routes carry their field. */
export interface PublishRoute {
  id: PublishRouteId;
  /** Routes offered for a piece on this channel (one route per piece, canvas note n-a4). */
  channel: Channel;
  title: string;
  badge?: string;
  description: string;
  /** Shorter line on mobile (canvas M-4). */
  mobileDescription?: string;
  field?: { label: string; placeholder: string };
  submitLabel: string;
}

export interface PublishData {
  account: Account | null;
  /** Defaults until Generate hands over the real piece, draft and review (canvas Amb-4: LinkedIn post, 91%, no flags). */
  piece: PieceFormat;
  draft: string;
  review: DraftReview;
  connectedAs: string;
  routes: PublishRoute[];
  notes: string[];
}

/** Which outcome a submission is in (Realtime on `submissions`). */
export type PostOutcome = 'verifying' | 'paid' | 'failed' | 'budget';

/** A plain label / value row (receipt details). */
export interface TextRow {
  label: string;
  value: string;
}

/** A recovery option after a failed check (canvas Amb-5c): where its action goes, or a local request. */
export interface Recovery {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  /** A flow step to open; absent for "Ask aDNA to review", which sends a request instead. */
  to?: 'publish' | 'generate';
  primary?: boolean;
  /** Shown once the request is sent. */
  doneLabel?: string;
}

export interface PostStatusData {
  account: Account | null;
  /** Defaults until the flow hands over the real campaign, piece, route and link (canvas Amb-5*). */
  campaign: CampaignRef;
  piece: PieceFormat;
  route: PublishRouteId;
  submittedUrl?: string;
  outcome: PostOutcome;
  /** Step times ("16:21") and the verified note, from the submission row. */
  times: { published?: string; verified?: string; approved?: string; paid?: string; failed?: string };
  verifiedNote?: string;
  paid?: {
    /** Receipt link, bracketed until wired (canvas note n-a5b). */
    receiptLink: string;
    postLink: string;
    balance: string;
    progress: string;
    /** The next piece's button label, mobile and desktop. */
    nextLabel: { desktop: string; mobile: string };
  };
  failure?: { chip: string; title: string; reasons: string[]; held: string; recoveries: Recovery[] };
  budget?: { chip: string; budget: AmbBudget; caption: string; optInLabel: string; optedInLabel: string };
}

// Shared data shapes for the Ambassador page (issue #53). Fixtures, screens and the data contracts import from here.
// Sources: wireframe canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn (page "Ambassador", boards Amb-* and M-*);
// backend map rows "Amb-1, Amb-1b, M-1" to "Amb-5a, 5b, 5c, 5d, M-5" (.agentic/what/context/backend_map.md §4).
import type { AmbBudget } from '../../ui/domain/AmbBudgetBar';
import type { AmbCheck } from '../../ui/domain/AmbChecksList';
import type { AmbTimelineStep } from '../../ui/domain/AmbStatusTimeline';
import type { KeyValueItem } from '../../ui/composites/KeyValueList';

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

export interface PayoutFormat {
  id: string;
  format: string;
  where: string;
  payout: string;
}

export interface CampaignDetailData {
  account: Account | null;
  campaign: CampaignSummary;
  brandVerified: string;
  reviewNote: string;
  brief: string;
  formats: PayoutFormat[];
  formatsNote: string;
  rules: string[];
  budget: AmbBudget;
  howPaid: string;
  joinEmail: string;
}

export interface GenerateData {
  account: Account | null;
  campaignTitle: string;
  pieceLabel: string;
  formatLabel: string;
  formats: { id: string; label: string }[];
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
  checks: AmbCheck[];
}

export type PublishRouteId = 'on-behalf' | 'paste-url' | 'blog-url';

export interface PublishData {
  account: Account | null;
  formatLabel: string;
  chips: string[];
  postPreview: string;
  postLength: number;
  connectedAs: string;
  notes: string[];
}

/** Which outcome a submission is in (Realtime on `submissions`). */
export type PostOutcome = 'verifying' | 'paid' | 'failed' | 'budget';

export interface PostStatusData {
  account: Account | null;
  context: string;
  title: string;
  outcome: PostOutcome;
  steps: AmbTimelineStep[];
  message?: string;
  receipt?: KeyValueItem[];
  receiptDetails?: KeyValueItem[];
  balance?: string;
  progress?: string;
  nextPiece?: string;
  failure?: { chip: string; title: string; reasons: string[]; held: string };
  budget?: { chip: string; title: string; budget: AmbBudget; body: string };
}

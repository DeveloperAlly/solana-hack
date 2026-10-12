// Data shapes for the "Coming soon" canvas page (issue #51). Screens, fixtures and data contracts import from here.
// Field sources are in each screen's Data contract comment (backend map §4, .agentic/what/context/backend_map.md).
import type { SoonStatusId } from './status';

/** A placeholder the canvas brackets, e.g. "[amount]": kept as text until the integration fills it. */
export type Bracketed = string;

/** One row with a status chip (model source, publishing connection, brand, founder source). */
export interface StatusRowItem {
  id: string;
  name: string;
  detail?: string;
  status: SoonStatusId;
}

/* Settings › AI (D54) */
export interface StoredKey { last4: Bracketed; addedOn: Bracketed }
export interface SettingsAIData {
  sources: StatusRowItem[];
  storedKey: StoredKey | null;
  usage: { calls: Bracketed; spend: Bracketed };
  /** The key test's failure message, shown in the error state. */
  keyError: string;
}

/* Settings › Get a key */
export interface SettingsGetKeyData {
  connectNote: string;
  whyOwnKey: string;
  keyError: string;
}

/* Settings › Connections (D52) */
export interface SettingsConnectionsData {
  connections: StatusRowItem[];
  fallback: StatusRowItem;
  wallet: { address: Bracketed; status: SoonStatusId };
}

/* Settings › Plan (D55) */
export interface Invoice { id: string; date: Bracketed; amount: Bracketed }
export interface SettingsPlanData {
  plan: Bracketed;
  planNames: PlanNames;
  seats: Bracketed;
  nextBill: Bracketed;
  billingProvider: string;
  invoices: Invoice[];
}

/* Pricing and Upgrade (G-BILLING) */
export interface PlanTier {
  id: 'free' | 'solo' | 'team';
  name: string;
  price: Bracketed;
  features: string;
  cta: string;
  /** Market band note from research 10 §6, where the canvas gives one. */
  note?: string;
}
export type PaidPlan = Exclude<PlanTier['id'], 'free'>;
/** Paid tier names (canvas Pricing), shown on Upgrade and Settings-Plan for the plan chosen on Pricing. */
export type PlanNames = Record<PaidPlan, string>;
export interface PricingData { tiers: PlanTier[]; footnote: string }
export interface UpgradeTier { name: string; price: Bracketed }
export interface UpgradeData {
  /** Checkout data per paid tier; the tier chosen on Pricing (session) picks one. */
  tiers: Record<PaidPlan, UpgradeTier>;
  /** The tier shown when none was chosen on Pricing in this session. */
  defaultPlan: PaidPlan;
  cardForm: string;
  keepNote: string;
  failure: string;
}

/* Media */
export interface Slide { id: string; label: string; text: string }
export type MediaKind = 'carousel' | 'card' | 'video';
export interface MediaFormat { id: MediaKind; label: string; slides: Slide[]; hint: string }
export interface ExportOption { value: string; label: string; /** What choosing it produces, shown once chosen. */ detail: string }
export interface MediaComposerData { formats: MediaFormat[]; exportOptions: ExportOption[] }
export type CheckResult = 'backed' | 'none' | 'unsupported' | 'passed' | 'failed';
/** Check results for one slide, before they are matched to the draft's slides. */
export interface SlideCheckDefaults { claims: CheckResult; slop: CheckResult; alt: Bracketed; /** The Claims row this slide's claim maps to. */ claimId?: string }
export interface SlideCheck extends SlideCheckDefaults { id: string; slide: number; text: string }
export interface MediaReviewData {
  /** The media draft's default formats (Media-Composer's fixtures) until the person edits them. */
  formats: MediaFormat[];
  /** Check results by slide number; a slide without an entry has no claims and passed the slop check. */
  checks: Record<number, SlideCheckDefaults>;
}

/* Campaign v2 (steps 2, 4, 5, 6 on this page; 1 and 3 on Superhub) */
export interface AudienceSegment { id: string; label: Bracketed; tag: string }
export interface CampaignAudienceData { source: string; segments: AudienceSegment[] }
export interface PlanItem { id: string; day: string; brandPosts: string; ambassadorPieces: string; slot: string }
export interface CampaignPlanData { items: PlanItem[]; rule: string }
export interface PayoutRow { id: string; format: string; where: string; payout: string }
export interface CampaignBudgetData {
  payouts: PayoutRow[];
  noXNote: string;
  cap: string;
  balance: Bracketed;
  /** Server check: the cap is above the brand wallet's USDC balance (D31 over-balance). */
  overBalance: boolean;
}
export interface CampaignLaunchData {
  goal: Bracketed;
  audience: Bracketed;
  metric: Bracketed;
  plan: Bracketed;
  cap: string;
  balance: Bracketed;
  overBalance: boolean;
}

/* Publishing calendar (D8) */
export type SlotStatus = 'failed' | 'scheduled' | 'open';
export interface CalendarSlot { id: string; day: string; time?: string; channel?: string; status: SlotStatus; title?: string }
export interface FailedPublish { slotId: string; title: Bracketed; channel: string; time: string; reason: string; text: string }
export interface PublishCalendarData {
  days: string[];
  slots: CalendarSlot[];
  failed: FailedPublish | null;
  approvedPosts: { id: string; title: string }[];
}

/* Claims (D19) */
export type ClaimStatus = 'approved' | 'pending' | 'expired';
export interface Claim { id: string; text: string; evidence: string; owner: Bracketed; expires: Bracketed; status: ClaimStatus; registered?: boolean }
export interface ClaimsData { claims: Claim[] }

/* Brands (D48, D36) and founder profile */
export interface BrandSwitcherData { brands: StatusRowItem[]; currentId: string; founderId: string }
export interface FounderProfileData { name: string; sources: StatusRowItem[]; linkedTo: string; sharedStories: boolean }

/* Outcome log */
export type AudienceFit = 'yes' | 'unsure' | 'no';
export interface Outcome { id: string; date: Bracketed; who: Bracketed; foundVia: string; fit: AudienceFit; repliedIn: Bracketed; outcome: Bracketed }
export interface OutcomeLogData { outcomes: Outcome[] }

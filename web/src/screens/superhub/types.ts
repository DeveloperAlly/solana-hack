/**
 * Data shapes for the Superhub screens (issue #52). Fixtures and screens import from here; each screen's
 * `Data contract` comment says where every field comes from (backend map rows, .agentic/what/context/backend_map.md §4).
 */
import type { HubThreadMessage } from '../../ui/domain/HubThread';
import type { CoverageStatus } from '../../ui/domain/HubCoverageBadge';
import type { HubBarItem } from '../../ui/domain/HubBarList';
import type { SelectOption as FieldOption } from '../../ui/primitives/SelectField';
import type { HubPath } from './paths';

/** A KPI tile (C12 StatTile). */
export interface Kpi {
  label: string;
  value: string;
  sub?: string;
  href?: HubPath;
}

/** A labelled option with a count (rails, tabs, filters). */
export interface CountedOption {
  id: string;
  label: string;
  count?: number;
}

// Hub-Home ------------------------------------------------------------------------------------------------------
export interface NeedsItem {
  id: string;
  chip: string;
  text: string;
  href: HubPath;
}

export interface HubHomeData {
  greeting: string;
  status: string;
  reviewCount: number;
  kpis: Kpi[];
  needs: NeedsItem[];
  campaign: { name: string; goal: string; done: number; target: number; caption: string };
  brandPack: { title: string; missing: string };
  week: { best: string; weakest: string };
}

// Inbox ---------------------------------------------------------------------------------------------------------
export interface InboxMessage {
  id: string;
  source: string;
  sourceLabel: string;
  from: string;
  preview: string;
  time: string;
  unread: boolean;
  labels: string[];
  thread: HubThreadMessage[];
  replyNote: string;
  reply: string;
  linked?: string;
}

export interface InboxData {
  folders: (CountedOption & { href: HubPath })[];
  sources: CountedOption[];
  labels: CountedOption[];
  assignees: string[];
  messages: InboxMessage[];
}

export interface NeedsReplyItem {
  id: string;
  group: string;
  due: string;
  overdue: boolean;
  source: string;
  from: string;
  label?: string;
  quote: string;
  why: string;
  canSnooze: boolean;
  canDismiss: boolean;
}

export interface NeedsReplyData {
  folders: (CountedOption & { href: HubPath })[];
  targets: { label: string; value: string }[];
  items: NeedsReplyItem[];
  footnote: string;
}

export type ConnectionStatus = 'connected' | 'connected-bot' | 'collecting' | 'sync-error' | 'not-connected' | 'default-on';

export interface SourceConnection {
  id: string;
  name: string;
  sees?: string;
  status: ConnectionStatus;
  note?: string;
}

export interface InboxConnectData {
  error?: string;
  sources: SourceConnection[];
}

// Brand kit and voices ------------------------------------------------------------------------------------------
export interface KitSection {
  id: string;
  num: number;
  title: string;
  gate?: string;
  status: CoverageStatus;
  body?: string;
  source?: string;
  personas?: { name: string; detail: string }[];
}

export interface BrandBuildData {
  brand: string;
  intro: string;
  kit: { version: string; approved: string; approver: string; hash: string };
  sections: KitSection[];
}

export interface VoiceSummary {
  id: string;
  name: string;
  detail: string;
  status: string;
}

export interface VoiceTemplate {
  id: string;
  name: string;
  description: string;
  claimsGate: number;
  contentPolicy?: boolean;
  /** Preset values, in `dimensions` order (8 dials, then claims gate). */
  values: number[];
}

export interface VoiceTemplatesData {
  brand: string;
  kitVersion: string;
  voices: VoiceSummary[];
  selectedTemplate: string;
  dimensions: string[];
  templates: VoiceTemplate[];
  matrixCaption: string;
  flirtyNote: string;
}

export interface VoiceDimension {
  id: string;
  legend: string;
  start: string;
  end: string;
}

export interface ClaimsRule {
  id: string;
  label: string;
  /** Plain rule the writer gets when the box is not ticked. */
  offRule: string;
}

export interface VoiceEditorData {
  name: string;
  basedOn: string;
  intro: string;
  dimensions: VoiceDimension[];
  preset: Record<string, number>;
  values: Record<string, number>;
  claimsLevel: string;
  claimsRules: ClaimsRule[];
  claimsChecked: string[];
  overrides: { channel: string; overrides: string; action: string }[];
  previewNote: string;
  samples: string[];
}

// Create --------------------------------------------------------------------------------------------------------
export type DraftStatus = 'approval' | 'scheduled' | 'posted' | 'rejected';

export interface DraftSummary {
  id: string;
  channel: string;
  format: string;
  title: string;
  meta: string;
  onBrand: string;
  slop: string;
  slot: string;
  status: DraftStatus;
}

export interface ContentDashboardData {
  pipeline: string[];
  channels: CountedOption[];
  tabs: (CountedOption & { status?: DraftStatus; href?: HubPath })[];
  drafts: DraftSummary[];
  calendar: { day: string; text: string; note?: string }[];
  calendarNote: string;
  starts: { id: string; title: string; body: string; action: string; href: HubPath }[];
}

export type PolishAction = 'review' | 'shorten' | 'clarify' | 'beautify';

export interface DraftVersion {
  id: string;
  label: string;
  text: string;
  action?: PolishAction | 'slop';
}

export interface DraftCheck {
  label: string;
  result: string;
}

export interface DraftReviewData {
  title: string;
  context: string;
  charLimit: number;
  versions: DraftVersion[];
  slopFixes: { removed: string; added?: string }[];
  slopPhrases: string[];
  approvedNumbers: string[];
  polishResults: Record<PolishAction, string>;
  beautifyNotes: string[];
  scores: DraftCheck[];
  scoresNote: string;
  publishOptions: FieldOption[];
  approvalNote: string;
  /** Opens with a failed polish action (artboard Draft-Review-PolishError). */
  failedAction?: PolishAction;
  failureReason?: string;
}

export interface CampaignMetric {
  id: string;
  metric: string;
  target: string;
  source: string;
  /** False when the platform does not share the number: no target input. */
  measurable: boolean;
}

export interface CampaignData {
  steps: string[];
  purposes: { id: string; label: string; description: string }[];
  platforms: { id: string; label: string; detail?: string }[];
  posterOptions: FieldOption[];
  name: string;
  dates: string;
  purpose: string;
  selectedPlatforms: string[];
  poster: string;
  mediaNote: string;
  metrics: CampaignMetric[];
  mainMetric: string;
  supporting: string[];
  plan: { day: string; brand: string; ambassadors: string }[];
  budget: { line: string; note: string };
  unavailableNote: string;
}

// Grow ----------------------------------------------------------------------------------------------------------
export interface ReplyItem {
  id: string;
  channel: string;
  author: string;
  ago: string;
  incoming: string;
  note: string;
  draft?: string;
}

export interface EngageQueueData {
  intro: string;
  queue: ReplyItem[];
  suggestions: { id: string; who: string; what: string }[];
  suggestionsNote: string;
  listsCount: number;
  never: string;
}

export interface EngageRule {
  id: string;
  when: string;
  where: string;
  then: string;
  on: boolean;
}

export interface EngageRulesData {
  rules: EngageRule[];
  autoReply: { keyword: string; where: string; wording: string; approved: string };
  lists: { id: string; name: string; accounts: number; why: string }[];
  windows: string;
}

export interface PartnersData {
  intro: string;
  voiceOptions: FieldOption[];
  approvalOptions: FieldOption[];
  seatsUsed: number;
  seatsTotal: number;
  defaultEmail: string;
  partners: { id: string; name: string; voices: string; pieces: string; status: string }[];
  pricingNote: string;
}

export interface Lead {
  id: string;
  name: string;
  fit: string;
  why: string;
  status: 'new' | 'queued';
}

export interface LeadsData {
  banner: string;
  intro: string;
  query: { who: string; size: string; signals: string; sources: string };
  prefillNote: string;
  total: number;
  leads: Lead[];
  outreachNote: string;
}

export interface InfluencerSetupData {
  banner: string;
  name: string;
  brandOptions: FieldOption[];
  voiceOptions: FieldOption[];
  pillars: string;
  avatarFrom: string;
  avatarTotal: string;
  disclosures: { id: string; label: string; detail?: string }[];
  channels: string;
  preview: { image: string; persona: string; caption: string };
}

export interface InfluencerPost {
  id: string;
  image: string;
  stamped: boolean;
  channel: string;
  when: string;
  caption: string;
  checks: string;
}

export interface InfluencerQueueData {
  banner: string;
  title: string;
  subtitle: string;
  posts: InfluencerPost[];
}

// Analytics -----------------------------------------------------------------------------------------------------
export interface AnalyticsData {
  ranges: FieldOption[];
  kpis: Kpi[];
  byVoice: HubBarItem[];
  byFormat: HubBarItem[];
  top: { id: string; post: string; rate: string }[];
  notWorking: { id: string; what: string; rate: string; posts: string }[];
  suggestions: { id: string; text: string; action: string; href?: HubPath }[];
  suggestionsNote: string;
  connect: { intro: string; sources: SourceConnection[]; error: string };
}

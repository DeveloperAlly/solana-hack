// Data shapes for the Brand Builder page (issue #50). Screens, fixtures and the flow hook import from here.
// Field sources are in each screen's "Data contract" comment, against the backend map (.agentic/what/context/backend_map.md §4).
import type { ChoiceCardOption } from '../../ui/domain/BuilderChoiceCards';
import type { CoverageRow } from '../../ui/domain/BuilderCoverageMap';
import type { DnsCheckStatus, DnsRecord } from '../../ui/domain/BuilderDnsRecord';
import type { KitIncludeOption, KitVersion } from '../../ui/domain/BuilderKitExport';
import type { Persona } from '../../ui/domain/BuilderPersonaCard';
import type { RegistrationStatus } from '../../ui/domain/BuilderRegistrationResult';
import type { SourceRow } from '../../ui/domain/BuilderSourceList';
import type { AmbassadorSubmission } from '../../ui/domain/BuilderApprovalItem';
import type { StatTileProps } from '../../ui/composites/StatTile';
import type { BoardKey } from './paths';

export type { GateDecision, GateStatus } from '../../ui/domain/BuilderDecisionGate';
export type { ChoiceCardOption, CoverageRow, DnsRecord, KitIncludeOption, Persona, SourceRow, AmbassadorSubmission };

export type GateId = 'purpose' | 'positioning' | 'voice';

/** The brand being built and who is signed in (brands, profiles). */
export interface BuilderBrand {
  name: string;
  /** brands.domain_verified; false shows the Unverified flag (note n-ob2.2). */
  verified: boolean;
  /** The signed-in owner, recorded on gate decisions. */
  approver: string;
}

/** A labelled free-text answer (interview answers; evidence "owner answer, [date]"). */
export interface Answer {
  id: string;
  label: string;
  value: string;
  rows?: number;
  hint?: string;
}

export interface VoicePick {
  round1: string;
  round2: string;
}

export interface DialValues {
  formality: number;
  energy: number;
  humour: number;
}

export interface DialSpec {
  key: keyof DialValues;
  legend: string;
  low: string;
  high: string;
}

export interface SignInData {
  email: string;
  resendNote: string;
  /** Shown on the code field in the error state (wrong code). */
  codeError?: string;
}

export interface DomainData {
  brand: BuilderBrand;
  domain: string;
  record: DnsRecord;
  check: DnsCheckStatus;
  causes: string[];
  /** Steps the owner can send to a developer (mailto body). */
  developerSteps: string;
}

export interface SourcesData {
  brand: BuilderBrand;
  links: SourceRow[];
  accounts: SourceRow[];
}

export interface ProfilingData {
  brand: BuilderBrand;
  /** 0–100, from jobs.progress. */
  progress: number;
  rows: SourceRow[];
}

export interface BasicsData {
  brand: BuilderBrand;
  description: string;
  type: string;
  typeOptions: ChoiceCardOption[];
  /** One link per line. */
  links: string;
  goal: string;
  channel: string;
  channels: string[];
}

export interface OriginData {
  brand: BuilderBrand;
  /** A fact found in the sources, shown for confirmation first; absent when nothing was found. */
  fact?: { source: string; text: string };
  answers: Answer[];
}

export interface GoldenCircleData {
  brand: BuilderBrand;
  questions: Answer[];
}

export interface AlternativesData {
  brand: BuilderBrand;
  questions: Answer[];
  /** Sets of three AI positioning options; "Show three different options" moves to the next set. */
  optionSets: ChoiceCardOption[][];
  sourcesNote: string;
}

export interface AudienceData {
  brand: BuilderBrand;
  opinion: string;
  /** Up to three real people, private, never contacted. */
  people: string[];
  personas: Persona[];
}

export interface VoiceData {
  brand: BuilderBrand;
  round1: ChoiceCardOption[];
  /** Round 2 options keyed by the round 1 pick (narrows around it). */
  round2: Record<string, ChoiceCardOption[]>;
  /** Template matched by each round 1 pick. */
  templates: Record<string, string>;
  dials: DialSpec[];
}

export interface GatePurposeData {
  brand: BuilderBrand;
  draft: string;
  /** Alternative drafts for "Try another draft"; `shorter` replaces the draft on "Make it shorter". */
  alternatives: string[];
  shorter: string;
  /** "Drafted from 4 sources". */
  draftMeta: string;
  basedOn: string[];
}

export interface GatePositioningData {
  brand: BuilderBrand;
  draft: string;
  alternative: string;
  edge: string;
  sourcesNote: string;
}

export interface GateVoiceData {
  brand: BuilderBrand;
  templates: Record<string, string>;
  /** The five dimensions not set by the intake dials, in canvas order after Humour. */
  otherDimensions: { name: string; value: number }[];
  sample: string;
  strictness: string;
  claims: { id: string; label: string; checked: boolean }[];
}

export interface CoverageData {
  brand: BuilderBrand;
  caption: string;
  brands: string[];
  rows: CoverageRow[];
}

export interface PublishedData {
  brand: BuilderBrand;
  status: RegistrationStatus;
  version: string;
  hash: string;
  approvedBy: string;
  sections: string;
  /** Transaction signature once registered. */
  tx?: string;
  /** When registration was last tried (failed). */
  lastTry?: string;
  reason?: string;
  errorDetails?: string;
}

export interface KitExportData {
  brandId: string;
  /** Approved versions, current first; each carries its hash, file name and tree. */
  versions: KitVersion[];
  includes: KitIncludeOption[];
}

/** A submission awaiting approval; its link names a board, resolved to a theme-keeping href by the screen. */
export type PendingSubmission = Omit<AmbassadorSubmission, 'link'> & { link: { label: string; board: BoardKey } };

export interface CampaignRow {
  id: string;
  name: string;
  channels: string;
  ends: string;
  spent: number;
  committed: number;
  cap: number;
  paid: string;
  pending: string;
}

export interface PayoutRow {
  id: string;
  date: string;
  piece: string;
  ambassador: string;
  paid: string;
  /** Receipt screen (the Ledger in the prototype). */
  receiptBoard: BoardKey;
}

export interface DashboardData {
  brandId: string;
  title: string;
  meta: string;
  kpis: StatTileProps[];
  pending: PendingSubmission[];
  campaigns: CampaignRow[];
  recent: PayoutRow[];
  kit: { summary: string; usage?: string };
  publicPageUrl: string;
}

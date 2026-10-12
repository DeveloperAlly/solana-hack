/*
 * Data shapes for the Journey (v3) screens: canvas page "Journey (v3): first run"
 * (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), built in issue #48. Each screen's data contract (its file header)
 * says which endpoint and backend-map row fills each field (.agentic/what/context/backend_map.md §4).
 * Fixtures and screens import from here; nothing else defines these shapes.
 */
import type { JourneyFact } from '../../ui/domain/JourneyFactCard';
import type { JourneyChoiceOption } from '../../ui/domain/JourneyChoiceCards';
import type { JourneyClaimSegment } from '../../ui/domain/JourneyClaimText';
import type { JourneyChecklistItem } from '../../ui/domain/JourneyChecklist';
import type { JourneyStepCard } from '../../ui/domain/JourneyStepCards';
import type { DiffSegment } from '../../ui/composites/DiffView';
import type { EvidenceStatus } from '../../ui/domain/EvidenceChip';
import type { JourneyStatusRow } from '../../ui/domain/JourneyStatusList';
import type { JourneyGateDecision } from '../../ui/domain/JourneyGateCard';

export type { JourneyFact, JourneyChoiceOption, JourneyClaimSegment, JourneyChecklistItem, JourneyStepCard, DiffSegment, EvidenceStatus, JourneyStatusRow };

/** A page or file being read (the `sources` row). */
export type SourceStatus = 'read' | 'reading' | 'queued' | 'blocked' | 'skipped';
export interface JourneySource {
  id: string;
  label: string;
  status: SourceStatus;
  /** Facts found on it, once read. */
  facts?: number;
  /** Plain reason a source could not be read, e.g. "its robots.txt says no". */
  reason?: string;
}

/** Coverage over the six kit sections (Found / Partly found / Needs you). */
export interface JourneyCoverage {
  found: number;
  partly: number;
  needsYou: number;
  /** Readiness, 0 to 100. */
  percent: number;
}

/** One row of a short summary: a kit section and its evidence status (J2 "You're saving"). */
export interface JourneySectionStatus {
  section: string;
  status: EvidenceStatus;
}

/** The person's decision on a found fact (J3). */
export type FactDecision = 'accepted' | 'edited' | 'rejected';

/** A kit gate on J5 (the `gates` and `kit_sections` rows). */
export interface JourneyGate {
  id: 'purpose' | 'positioning' | 'voice';
  gate: 1 | 2 | 3;
  title: string;
  draft: string;
  builtFrom: string;
  /** Facts and answers the draft cites. */
  evidence: JourneyFact[];
  /** Set when the gate was already approved (who, when, why). */
  decision?: JourneyGateDecision;
}

/** A claim in a draft and the evidence that backs it (J6). */
export interface JourneyClaim {
  id: string;
  text: string;
  evidence?: JourneyFact;
}

export type JourneyChannel = 'linkedin' | 'x';

/* ---------- Per-screen data (one interface per board; the screen's data contract maps each field to its source) ---------- */

/** Main (landing v3). `example` is null until JamJam's own kit v1 and launch post are registered (#36): hidden, never faked. */
export interface MainData {
  chip: string;
  headline: string;
  intro: string;
  siteDefault: string;
  example: MainExample | null;
  howSteps: JourneyStepCard[];
  features: { title: string; body: string; quote?: string }[];
  builtInPublic: string;
}
export interface MainExample {
  title: string;
  kitChip: string;
  /** Kit facts, each with the person's decision when it was approved rather than found. */
  facts: { fact: JourneyFact; decision?: string }[];
  post: { title: string; text: string; badges: { label: string; solid?: boolean }[] };
}

/** J1-Read. */
export interface ReadData {
  site: string;
  sources: JourneySource[];
  facts: JourneyFact[];
  coverage: JourneyCoverage;
}

/** J2-Save. `linkError` is set when the emailed link came back expired or used. */
export interface SaveData {
  brandName: string;
  summary: string;
  saving: JourneySectionStatus[];
  linkError?: string;
}

/** J3-Confirm. */
export interface ConfirmData {
  /** Cards with a quote that the person can accept, edit or reject. */
  facts: JourneyFact[];
  /** Partly found, picked by example on J4. */
  voice: JourneyFact;
  /** Sections nothing on the pages supports; asked on J4. */
  missing: JourneyFact;
  /** Readiness before any card is confirmed (coverage from J1). */
  readinessBase: number;
  questionsLeft: number;
  timeLeft: string;
  deferredNote: string;
}

/** J4-Gaps-Voice. */
export interface GapsVoiceData {
  brandName: string;
  alternatives: { question: string; hint: string; options: string[]; selected: string[]; source: string };
  edgeQuestion: string;
  originQuestion: string;
  originNote: string;
  voice: { rounds: [JourneyChoiceOption[], JourneyChoiceOption[]]; defaultPick: string; intro: string };
}

/** J5-Approve-Kit. `registration` is set when registering kit v1 failed (Kit-RegisterFailed). */
export interface ApproveKitData {
  approver: string;
  gates: JourneyGate[];
  alsoDrafted: JourneyStatusRow[];
  onChain: string;
  registration?: { reason: string; hash: string; lastTry: string };
}

/** J6-First-Post. */
export interface FirstPostData {
  channels: { id: JourneyChannel; label: string; segments: JourneyClaimSegment[] }[];
  claims: JourneyClaim[];
  checks: JourneyStatusRow[];
  blocked: { claim: string; message: string };
  polishActions: string[];
}

/** J7-Proof. `signature` is null until the registration has a transaction. */
export interface ProofData {
  record: { label: string; value: string }[];
  signature: string | null;
  network: string;
  postText: string;
  checkLink: string;
  officialNote: string;
  edited: { note: string; diff: DiffSegment[] };
}

/** J8-Hub-FirstRun. */
export interface HubFirstRunData {
  brandName: string;
  status: string;
  checklist: JourneyChecklistItem[];
  nextPost: string;
  publicRecord: JourneyStatusRow[];
  comingSoon: string;
}

// The Journey data contract, as the Worker serves it (issue #34). These types are structurally identical to the UI's
// in PR #75 (branch ui/48-journey): web/src/screens/journey/types.ts (ReadData, ConfirmData, GapsVoiceData,
// JourneySource, JourneyCoverage, SourceStatus, FactRecord, FactDecision), web/src/ui/domain/JourneyFactCard.tsx
// (JourneyFact, JourneyFactSource) and web/src/ui/domain/EvidenceChip.tsx (EvidenceStatus). The coordination comment
// on #38 makes those screens the shape this API serves:
// https://github.com/DeveloperAlly/solana-hack/issues/38#issuecomment-6126640625
// They are declared again here because the Worker cannot import React component modules. prefill-contract.test.ts
// type-checks the UI's own fixture objects against these, so a change on either side fails CI.

/** EvidenceChip.tsx: Found (solid), Partly found (grey), Needs you (dashed). */
export type EvidenceStatus = 'found' | 'partly' | 'needs-you';

/** JourneyFactCard.tsx: where a fact was read; `url` is the page itself. */
export interface JourneyFactSource {
  label: string;
  url?: string;
}

/** JourneyFactCard.tsx: a fact found on the brand's own pages (the `evidence` rows a kit section cites). */
export interface JourneyFact {
  id: string;
  /** Kit section label, with its gate if it has one, e.g. "Positioning · Gate 2". */
  section: string;
  status: EvidenceStatus;
  statement: string;
  /** The exact line on the page. Absent for inferred facts, which carry a `note` instead. */
  quote?: string;
  source?: JourneyFactSource;
  note?: string;
}

/** types.ts: a page or file being read (the `sources` row). */
export type SourceStatus = 'read' | 'reading' | 'queued' | 'blocked' | 'skipped';
export interface JourneySource {
  id: string;
  label: string;
  status: SourceStatus;
  facts?: number;
  reason?: string;
}

/** types.ts: coverage over the six kit sections (Found / Partly found / Needs you). */
export interface JourneyCoverage {
  found: number;
  partly: number;
  needsYou: number;
  /** Readiness, 0 to 100. */
  percent: number;
}

/** types.ts: the person's decision on a found fact (J3). */
export type FactDecision = 'accepted' | 'edited' | 'rejected';
export type FactRecord = { decision: Exclude<FactDecision, 'edited'>; edit?: undefined } | { decision: 'edited'; edit: string };

/** types.ts J1-Read. */
export interface ReadData {
  site: string;
  sources: JourneySource[];
  facts: JourneyFact[];
  coverage: JourneyCoverage;
}

/** types.ts J3-Confirm. */
export interface ConfirmData {
  facts: JourneyFact[];
  voice: JourneyFact;
  missing: JourneyFact;
  readinessBase: number;
  questionsLeft: number;
  timeLeft: string;
  deferredNote: string;
}

/**
 * ui/composites/ChoiceCards.tsx ChoiceCardOption, which GapsVoiceData's voice rounds use. `body` and `meta` are
 * ReactNode on the screen; the Worker only ever sends strings, which are ReactNode.
 */
export interface JourneyChoiceOption {
  value: string;
  title: string;
  tag?: string;
  body?: string;
  meta?: string;
  disabled?: boolean;
}

/** types.ts J4-Gaps-Voice. */
export interface GapsVoiceData {
  brandName: string;
  alternatives: { question: string; hint: string; options: string[]; source: string };
  edgeQuestion: string;
  originQuestion: string;
  originNote: string;
  voice: { rounds: [JourneyChoiceOption[], JourneyChoiceOption[]]; intro: string };
}

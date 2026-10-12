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

export type { JourneyFact, JourneyChoiceOption, JourneyClaimSegment, JourneyChecklistItem, JourneyStepCard, DiffSegment, EvidenceStatus };

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

/** A label with a short value chip (checks, records, drafted sections). */
export interface JourneyRow {
  label: string;
  value: string;
  /** The value is a pass or a registered state (solid chip). */
  solid?: boolean;
  /** Links the value, e.g. "Registered" to the ledger. */
  href?: string;
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
}

/** A claim in a draft and the evidence that backs it (J6). */
export interface JourneyClaim {
  id: string;
  text: string;
  evidence?: JourneyFact;
}

export type JourneyChannel = 'linkedin' | 'x';

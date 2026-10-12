// The coverage map (issue #34; backlog B4, B5, B6; architecture §6.1 rows "Coverage map" and "Guided interview").
// Pure and deterministic: no database, no model. From the brand's facts, its owner answers and its open conflicts it
// computes a status per interview field and per kit section, the readiness figure, which interview steps can become
// "confirm", and the questions still worth asking, ranked. Confidence is only ever the one fact extraction computed
// from match type and independent sources (extract/facts.ts confidenceOf, issue #64); nothing here asks a model.
// Architecture: https://github.com/DeveloperAlly/solana-hack/blob/main/.agentic/what/context/brand_builder_architecture.md
import { GATES, SECTIONS, type SectionId } from '../kit';
import { usableFact } from '../sources/registry';
import type { EvidenceStatus, JourneyCoverage } from './contract';
import { FIELDS, readers, sectionFields, VOICE_MIN_WORDS, type FieldSpec, type StepId } from './fields';

/** A stored fact as the coverage map reads it (evidence rows; columns from spec/db/009, 011 and 012). */
export interface CoverageFact {
  id: string;
  source_id: string | null;
  section: string;
  claim: string;
  quote: string | null;
  origin: string;
  trust: string | null;
  review_status: string | null;
  match?: string | null;
  confidence?: string | null;
  slot?: string | null;
  slot_value?: string | null;
  quote_start?: number | null;
  quote_end?: number | null;
  /** The interview field the fact answers (spec/db/012), 'none', or null when not yet routed. */
  field?: string | null;
  /** The owner's decision on the fact (spec/db/012): accepted, edited or rejected. */
  decision?: string | null;
}
export interface CoverageAnswer { step: string; data: Record<string, string>; skipped: boolean }
/** An open fact_conflicts row (spec/db/011): one owner question per contradicted slot. */
export interface CoverageConflict { id: string; slot: string; evidence_ids: string[]; question: string }
export interface CoverageInput {
  facts: CoverageFact[];
  answers: CoverageAnswer[];
  conflicts: CoverageConflict[];
  /** Words of text read from the brand's own sources (owned trust), for the voice field. */
  ownedWords: number;
}

export interface FieldCoverage {
  id: string;
  step: StepId;
  key: string;
  question: string;
  status: EvidenceStatus;
  /** The owner has answered the field, or accepted a fact for it: nothing left to confirm. */
  confirmed: boolean;
  /** The owner skipped this step; it is not asked again unless they come back to it. */
  skipped: boolean;
  optional: boolean;
  /** The owner's own answer, when there is one. */
  answer?: string;
  /** Facts routed to the field, best first (live: usable, or awaiting the owner's review). */
  factIds: string[];
  /** Open conflicts touching the field's facts. */
  conflictIds: string[];
  /** Filled from evidence rather than by the owner (found or partly, with no owner answer). */
  prefilled: boolean;
}
export interface SectionCoverage { id: SectionId; title: string; gate: string | null; status: EvidenceStatus; fields: string[] }
/**
 * How the interview treats a step: 'ask' when a required question has nothing behind it, 'confirm' when every
 * question is prefilled and the owner only confirms (#34: "fully found steps become confirm"), 'done' when the owner
 * has answered or confirmed every question.
 */
export interface StepCoverage { step: StepId; mode: 'ask' | 'confirm' | 'done'; fields: string[] }
export type GapKind = 'missing' | 'conflict' | 'weak';
export interface GapQuestion {
  /** The field id, or `conflict:<id>`. */
  id: string;
  kind: GapKind;
  question: string;
  field?: string;
  step?: StepId;
  optional: boolean;
  minutes: number;
  /** Expected information gain per owner minute (see rankScore). */
  score: number;
  /** Facts behind the question: candidates awaiting review, weak facts, or both sides of a conflict. */
  factIds: string[];
  conflictId?: string;
  sides?: { value: string; ids: string[] }[];
}
export interface CoverageMap {
  fields: FieldCoverage[];
  sections: SectionCoverage[];
  steps: StepCoverage[];
  coverage: JourneyCoverage;
  /** Ranked, highest expected information gain per minute first. */
  questions: GapQuestion[];
  /** Questions that block kit v1 (missing required fields and conflicts), and the owner minutes they take. */
  questionsLeft: number;
  minutesLeft: number;
  /** #34's measure: question fields facts can fill, and how many are prefilled from evidence. */
  prefill: { fields: number; prefilled: number; percent: number };
}

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
const rank = (c: string | null | undefined) => CONFIDENCE_RANK[c ?? ''] ?? 0;

/** A fact read from a source (not an owner answer) that has not been rejected. */
export const liveSourceFact = (f: CoverageFact) => f.origin !== 'owner_answer' && f.trust !== 'owner_answer' && f.review_status !== 'rejected' && !!f.quote;

/**
 * Whether the owner has decided on this fact. The decision column (spec/db/012) records it; before that, an approval
 * is still visible where the system never approves on its own: a third-party fact (always starts proposed, ADR-011)
 * or a fuzzily located owned fact (extract/save.ts initialReviewFor holds it for review).
 */
export function ownerApproved(f: CoverageFact): boolean {
  if (f.review_status !== 'approved') return false;
  if (f.decision === 'accepted') return true;
  return f.trust === 'third_party' || (f.trust === 'owned' && f.match === 'fuzzy');
}

/**
 * The evidence status of one fact, from architecture §12.3 rule 1 (proposed): Evidenced with a high-confidence fact
 * from an owned source or a direct owner answer, Inferred with only medium or low confidence. A fact the owner
 * accepted counts as their answer. A fact outside the allow-list (usableFact, ADR-011) is shown for review as partly
 * found but backs nothing; a fact in an open conflict needs the owner (backlog B3a).
 */
export function factStatus(f: CoverageFact, contested: ReadonlySet<string>): EvidenceStatus {
  if (contested.has(f.id)) return 'needs-you';
  if (!usableFact(f)) return 'partly';
  if (ownerApproved(f)) return 'found';
  return f.trust === 'owned' && f.confidence === 'high' ? 'found' : 'partly';
}

/** Best fact first: found before partly, then confidence, an exact quote, an owner decision, then source order. */
export function compareFacts(contested: ReadonlySet<string>) {
  const statusRank = (f: CoverageFact) => ({ found: 2, partly: 1, 'needs-you': 0 })[factStatus(f, contested)] + (usableFact(f) ? 0.5 : 0);
  return (a: CoverageFact, b: CoverageFact) =>
    statusRank(b) - statusRank(a)
    || rank(b.confidence) - rank(a.confidence)
    || Number(b.match === 'exact') - Number(a.match === 'exact')
    || Number(b.decision === 'accepted') - Number(a.decision === 'accepted')
    || (a.quote_start ?? Number.MAX_SAFE_INTEGER) - (b.quote_start ?? Number.MAX_SAFE_INTEGER)
    || a.id.localeCompare(b.id);
}

const gateWeight = (s: SectionId) => (SECTIONS[s].gate ? 2 : 1);

/**
 * The value of answering a field: the kit sections whose drafter reads it (kit.ts SECTIONS.from), a gated section
 * counting twice because nothing past a gate is generated until it is approved (architecture §1 principle 4, §12.3
 * rule 2). An optional question counts half.
 */
export const fieldValue = (f: FieldSpec) => readers(f).reduce((n, s) => n + gateWeight(s), 0) * (f.optional ? 0.5 : 1);

/** How unsure the system is about a slot: nothing at all, or sources that disagree, is total; a weak fact is half. */
export const UNCERTAINTY: Record<GapKind, number> = { missing: 1, conflict: 1, weak: 0.5 };
/** Owner minutes to settle a conflict: one pick between quoted sides. */
export const CONFLICT_MINUTES = 0.5;

/**
 * The ranking score: a stand-in for expected information gain per owner minute. Architecture §6.1 ("Coverage map")
 * asks for questions only about missing, weak or conflicting slots, "ranked by a simple stand-in for expected
 * information gain", citing MediQ (https://arxiv.org/abs/2406.00922): asking only when unsure improved accuracy, while
 * prompting a model to ask made it worse. So no model picks the questions. Gain is uncertainty (UNCERTAINTY) times
 * value (fieldValue); dividing by the question's minutes (§5) spends the owner's time where it buys the most, which
 * is what #34's "under 5 minutes to kit v1" measures.
 */
export const rankScore = (kind: GapKind, value: number, minutes: number) => Math.round((UNCERTAINTY[kind] * value / Math.max(minutes, 0.1)) * 1000) / 1000;

const answerOf = (answers: CoverageAnswer[], f: FieldSpec) => {
  const a = answers.find((x) => x.step === f.step);
  if (!a || a.skipped) return { text: '', skipped: !!a?.skipped };
  return { text: (a.data?.[f.key] ?? '').trim(), skipped: false };
};

export function coverageMap(input: CoverageInput): CoverageMap {
  const live = input.facts.filter(liveSourceFact);
  const byId = new Map(live.map((f) => [f.id, f]));
  const conflicts = input.conflicts.filter((c) => c.evidence_ids.some((id) => byId.has(id)));
  const contested = new Set(conflicts.flatMap((c) => c.evidence_ids));
  const order = compareFacts(contested);

  const fields: FieldCoverage[] = FIELDS.map((f) => {
    const { text: answer, skipped } = answerOf(input.answers, f);
    const facts = live.filter((x) => x.field === f.id).sort(order);
    const usable = facts.filter((x) => usableFact(x) && !contested.has(x.id));
    const conflictIds = conflicts.filter((c) => c.evidence_ids.some((id) => facts.some((x) => x.id === id))).map((c) => c.id);
    let status: EvidenceStatus;
    if (f.id === 'voice.template') {
      // Voice is picked by example (§1 principle 5): the owner's pick finds it; enough of the brand's own words to
      // profile makes it partly found (§4 row 9); a voice-section fact on its own is evidence for the pick, not one.
      const voiceFacts = live.filter((x) => x.section === 'voice' && usableFact(x) && !contested.has(x.id));
      status = answer ? 'found' : !skipped && (input.ownedWords >= VOICE_MIN_WORDS || voiceFacts.length) ? 'partly' : 'needs-you';
      return { id: f.id, step: f.step, key: f.key, question: f.question, status, confirmed: !!answer, skipped, optional: f.optional, ...(answer ? { answer } : {}), factIds: voiceFacts.sort(order).map((x) => x.id), conflictIds: [], prefilled: false };
    }
    if (answer) status = 'found';
    else if (conflictIds.length && !usable.length) status = 'needs-you';
    else if (usable.some((x) => factStatus(x, contested) === 'found')) status = 'found';
    else status = usable.length ? 'partly' : 'needs-you';
    const confirmed = !!answer || usable.some((x) => x.decision === 'accepted');
    return { id: f.id, step: f.step, key: f.key, question: f.question, status, confirmed, skipped: skipped && !answer, optional: f.optional, ...(answer ? { answer } : {}), factIds: facts.map((x) => x.id), conflictIds, prefilled: !answer && status !== 'needs-you' };
  });
  const fieldMap = new Map(fields.map((f) => [f.id, f]));

  const sections: SectionCoverage[] = (Object.keys(SECTIONS) as SectionId[]).map((s) => {
    const own = sectionFields(s).map((f) => fieldMap.get(f.id)!);
    const required = own.filter((f) => !f.optional);
    const sectionFacts = live.filter((x) => x.section === s && usableFact(x) && !contested.has(x.id));
    const disputed = live.some((x) => x.section === s && contested.has(x.id));
    let status: EvidenceStatus;
    if (required.length && required.every((f) => f.status === 'found') && !disputed) status = 'found';
    else if (own.some((f) => f.status !== 'needs-you') || sectionFacts.length) status = 'partly';
    else status = 'needs-you';
    return { id: s, title: SECTIONS[s].title, gate: SECTIONS[s].gate, status, fields: own.map((f) => f.id) };
  });
  const found = sections.filter((s) => s.status === 'found').length;
  const partly = sections.filter((s) => s.status === 'partly').length;
  // Readiness: a found section counts whole and a partly found one half (it still needs the owner's confirmation).
  // On the J1-Read board's sample, 3 found and 1 partly of 6 gives the 58% drawn there (J1-Read.fixtures.ts, #75).
  const coverage: JourneyCoverage = { found, partly, needsYou: sections.length - found - partly, percent: Math.round((100 * (found + partly / 2)) / sections.length) };

  const steps: StepCoverage[] = [...new Set(FIELDS.map((f) => f.step))].map((step) => {
    const own = fields.filter((f) => f.step === step);
    const mode = own.some((f) => !f.optional && f.status === 'needs-you') ? 'ask' : own.every((f) => f.confirmed || (f.optional && f.status === 'needs-you')) ? 'done' : 'confirm';
    return { step, mode, fields: own.map((f) => f.id) };
  });

  const questions: GapQuestion[] = [];
  for (const f of fields) {
    const spec = FIELDS.find((x) => x.id === f.id)!;
    const weak = f.status === 'partly' && !f.confirmed && f.id !== 'voice.template'
      && !f.factIds.some((id) => { const x = byId.get(id)!; return usableFact(x) && !contested.has(id) && (rank(x.confidence) >= 2 || ownerApproved(x)); });
    const kind: GapKind | null = f.status === 'needs-you' && !f.skipped && !f.conflictIds.length ? 'missing' : weak ? 'weak' : null;
    if (!kind) continue;
    questions.push({ id: f.id, kind, question: f.question, field: f.id, step: f.step, optional: f.optional, minutes: spec.minutes, score: rankScore(kind, fieldValue(spec), spec.minutes), factIds: f.factIds });
  }
  for (const c of conflicts) {
    const facts = c.evidence_ids.map((id) => byId.get(id)).filter((x): x is CoverageFact => !!x);
    const routed = [...new Set(facts.map((x) => x.field).filter((x): x is string => !!x && x !== 'none'))];
    const spec = FIELDS.find((x) => routed.includes(x.id));
    const value = spec ? fieldValue(spec) : [...new Set(facts.map((x) => x.section).filter((s): s is SectionId => s in SECTIONS))].reduce((n, s) => n + gateWeight(s), 0) || 1;
    const sides = new Map<string, { value: string; ids: string[] }>();
    for (const x of facts.sort(order)) {
      const v = (x.slot_value ?? '').trim();
      const side = sides.get(v.toLowerCase()) ?? { value: v, ids: [] };
      side.ids.push(x.id);
      sides.set(v.toLowerCase(), side);
    }
    questions.push({ id: `conflict:${c.id}`, kind: 'conflict', question: c.question, ...(spec ? { field: spec.id, step: spec.step } : {}), optional: false, minutes: CONFLICT_MINUTES, score: rankScore('conflict', value, CONFLICT_MINUTES), factIds: facts.map((x) => x.id), conflictId: c.id, sides: [...sides.values()] });
  }
  // Highest gain per minute first; ties in interview order (§12.3 rule 2), so the order never depends on input order.
  const pos = (q: GapQuestion) => (q.field ? FIELDS.findIndex((f) => f.id === q.field) : FIELDS.length);
  questions.sort((a, b) => b.score - a.score || pos(a) - pos(b) || a.id.localeCompare(b.id));
  const blocking = questions.filter((q) => q.kind !== 'weak' && !q.optional);

  const routable = fields.filter((f) => FIELDS.find((x) => x.id === f.id)!.routable);
  const prefilled = routable.filter((f) => f.prefilled).length;
  return {
    fields, sections, steps, coverage, questions,
    questionsLeft: blocking.length,
    minutesLeft: Math.round(blocking.reduce((n, q) => n + q.minutes, 0) * 10) / 10,
    prefill: { fields: routable.length, prefilled, percent: routable.length ? Math.round((100 * prefilled) / routable.length) : 0 },
  };
}

/** Gated sections in gate order, for drafting (purpose, positioning, voice). */
export const GATED: readonly SectionId[] = GATES;

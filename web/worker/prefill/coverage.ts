// The coverage map (issue #34; backlog B4, B5, B6; architecture §6.1 rows "Coverage map" and "Guided interview").
// One pure implementation, for every caller (GET /api/brands/:id, the Journey screens, the Build screen): no database,
// no model. From the brand's evidence rows, its interview answers and its open conflicts it computes a status per kit
// section and per interview question, readiness, which interview steps can become "confirm", and the questions still
// worth asking, ranked. Statuses are exactly PR #75's EvidenceStatus ('found' | 'partly' | 'needs-you',
// web/src/ui/domain/EvidenceChip.tsx). Confidence is only ever the one fact extraction stored, computed from match type
// and independent sources (extract/facts.ts confidenceOf, issue #64); nothing here asks a model or rates a fact itself.
// Architecture: https://github.com/DeveloperAlly/solana-hack/blob/main/.agentic/what/context/brand_builder_architecture.md
import { SECTIONS, type SectionId } from '../kit';
import { usableFact } from '../sources/registry';
import type { EvidenceStatus, JourneyCoverage } from './contract';
import { FIELDS, readers, type FieldSpec, type StepId } from './fields';

/** An evidence row as the coverage map reads it (spec/db/001, 009 and 011; edited_from from PR #96's migration). */
export interface CoverageFact {
  id: string;
  source_id?: string | null;
  section: string;
  claim: string;
  quote?: string | null;
  origin?: string | null;
  trust?: string | null;
  review_status?: string | null;
  match?: string | null;
  confidence?: string | null;
  slot?: string | null;
  slot_value?: string | null;
}
/** An answers row (spec/db/001): one per interview step. */
export interface CoverageAnswer { step: string; data: Record<string, string>; skipped: boolean }
/** A fact_conflicts row (spec/db/011): one owner question per contradicted slot. Only open ones count. */
export interface CoverageConflict { id: string; slot: string; evidence_ids: string[]; question: string; status?: string }
export interface CoverageInput { evidence: CoverageFact[]; answers: CoverageAnswer[]; conflicts: CoverageConflict[] }

export interface SectionCoverage {
  section: SectionId;
  title: string;
  gate: string | null;
  status: EvidenceStatus;
  /** Facts in the section that are not rejected (waiting for review included). */
  facts: number;
  /** Of those, facts the allow-list lets into a kit (usableFact, ADR-011). */
  usable: number;
  /** Why the section has its status, in a few words, for the screen and the logs. */
  basis: 'owner answer' | 'high-confidence fact' | 'owner-approved fact' | 'facts to confirm' | 'drafted from other sections' | 'disputed' | 'nothing yet';
}
export interface FieldCoverage {
  id: string;
  step: StepId;
  key: string;
  question: string;
  status: EvidenceStatus;
  /** The owner answered it: nothing left to confirm. */
  confirmed: boolean;
  /** The owner skipped this step; it is not asked again unless they come back to it. */
  skipped: boolean;
  optional: boolean;
  answer?: string;
  /** Facts that stand in for the answer, best first: usable, not disputed, in a section that answers the question. */
  factIds: string[];
  /** Filled from evidence rather than by the owner. */
  prefilled: boolean;
}
/**
 * How the interview treats a step: 'ask' when a required question has nothing behind it, 'confirm' when every
 * question is prefilled or answered and the owner only confirms (#34: "fully found steps become confirm"), 'done' when
 * the owner has answered every question.
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
  /** For a conflict: the kit sections its facts are in. */
  sections: SectionId[];
  optional: boolean;
  minutes: number;
  /** Expected information gain per owner minute (rankScore). */
  score: number;
  /** Facts behind the question: weak stand-ins, or every fact on every side of a conflict. */
  factIds: string[];
  conflictId?: string;
  sides?: { value: string; ids: string[] }[];
}
export interface CoverageMap extends JourneyCoverage {
  sections: SectionCoverage[];
  /** PR #96's summary fields, kept so its callers read the same names: sections not 'needs-you', of all six. */
  covered: number;
  total: number;
  ratio: number;
  fields: FieldCoverage[];
  steps: StepCoverage[];
  /** Ranked, highest expected information gain per minute first. */
  questions: GapQuestion[];
  /** Questions that block kit v1 (missing required questions and conflicts), and the owner minutes they take. */
  questionsLeft: number;
  minutesLeft: number;
  /** §6.1's measure for #34: text questions, how many are prefilled from evidence, and the share. */
  prefill: { fields: number; prefilled: number; percent: number };
}

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
const rank = (c: string | null | undefined) => CONFIDENCE_RANK[c ?? ''] ?? 0;
const isOwnerRow = (f: CoverageFact) => f.trust === 'owner_answer' || f.origin === 'owner_answer';

/**
 * Whether the owner has approved this fact themselves. Visible where the system never approves on its own: a
 * third-party fact always starts proposed (ADR-011, sources/registry.ts initialReview), and so does a fuzzily located
 * owned fact (extract/save.ts initialReviewFor).
 */
export const ownerApproved = (f: CoverageFact) => f.review_status === 'approved' && (f.trust === 'third_party' || (f.trust === 'owned' && f.match === 'fuzzy'));

/**
 * A fact that makes its section Evidenced under architecture §12.3 rule 1 (proposed): "at least one high-confidence
 * fact from an owned source, or a direct owner answer". Usable (the allow-list) and not disputed, and one of: an owned
 * fact at high confidence (an exact quote stated by two or more independent sources, extract/facts.ts confidenceOf);
 * the owner's own statement in that section (an edit of a fact, PR #96); or a fact the owner approved.
 */
export function evidences(f: CoverageFact, contested: ReadonlySet<string>): boolean {
  if (!usableFact(f) || contested.has(f.id)) return false;
  if (isOwnerRow(f)) return f.section in SECTIONS;
  return (f.trust === 'owned' && f.confidence === 'high') || ownerApproved(f);
}

/** Best first: Evidenced, then confidence, an exact quote, then id, so the order never depends on input order. */
export function compareFacts(contested: ReadonlySet<string>) {
  return (a: CoverageFact, b: CoverageFact) =>
    Number(evidences(b, contested)) - Number(evidences(a, contested))
    || rank(b.confidence) - rank(a.confidence)
    || Number(b.match === 'exact') - Number(a.match === 'exact')
    || a.id.localeCompare(b.id);
}

const gateWeight = (s: SectionId) => (SECTIONS[s].gate ? 2 : 1);

/**
 * The value of answering a question: the kit sections whose drafter reads it (kit.ts SECTIONS.from), a gated section
 * counting twice because nothing past a gate is generated until it is approved (architecture §1 principle 4, §12.3
 * rule 2). An optional question counts half.
 */
export const fieldValue = (f: FieldSpec) => readers(f).reduce((n, s) => n + gateWeight(s), 0) * (f.optional ? 0.5 : 1);

/** How unsure the system is: nothing at all, or sources that disagree, is total; a weak stand-in is half. */
export const UNCERTAINTY: Record<GapKind, number> = { missing: 1, conflict: 1, weak: 0.5 };
/** Owner minutes to settle a conflict: one pick between quoted passages. */
export const CONFLICT_MINUTES = 0.5;

/**
 * The ranking score, a stand-in for expected information gain per owner minute. Architecture §6.1 ("Coverage map")
 * asks for questions only about missing, weak or conflicting slots, "ranked by a simple stand-in for expected
 * information gain", citing MediQ (https://arxiv.org/abs/2406.00922): asking only when unsure improved accuracy, while
 * prompting a model to ask made it worse. So no model picks the questions. Gain is uncertainty (UNCERTAINTY) times
 * value (fieldValue); dividing by the question's minutes (§5) spends the owner's time where it buys the most, which is
 * what #34's "under 5 minutes to kit v1" measures.
 */
export const rankScore = (kind: GapKind, value: number, minutes: number) => Math.round((UNCERTAINTY[kind] * value / Math.max(minutes, 0.1)) * 1000) / 1000;

const answerOf = (answers: CoverageAnswer[], f: FieldSpec) => {
  const a = answers.find((x) => x.step === f.step);
  if (!a || a.skipped) return { text: '', skipped: !!a?.skipped };
  return { text: (a.data?.[f.key] ?? '').trim(), skipped: false };
};

export function coverageMap(input: CoverageInput): CoverageMap {
  const live = input.evidence.filter((f) => f.review_status !== 'rejected');
  const liveIds = new Set(live.map((f) => f.id));
  const conflicts = input.conflicts.filter((c) => (c.status ?? 'open') === 'open' && c.evidence_ids.some((id) => liveIds.has(id)));
  const contested = new Set(conflicts.flatMap((c) => c.evidence_ids));
  const order = compareFacts(contested);
  // Facts that can stand in for an answer: usable, read from a source (an owner statement is not a stand-in for a
  // particular question), and not disputed.
  const standIns = live.filter((f) => usableFact(f) && !isOwnerRow(f) && !contested.has(f.id) && !!f.quote).sort(order);

  const fields: FieldCoverage[] = FIELDS.map((f) => {
    const { text: answer, skipped } = answerOf(input.answers, f);
    const facts = standIns.filter((x) => (f.answeredBy as readonly string[]).includes(x.section));
    const status: EvidenceStatus = answer ? 'found' : !skipped && facts.length ? 'partly' : 'needs-you';
    return {
      id: f.id, step: f.step, key: f.key, question: f.question, status, confirmed: !!answer, skipped: skipped && !answer, optional: f.optional,
      ...(answer ? { answer } : {}), factIds: answer ? [] : facts.map((x) => x.id), prefilled: !answer && status === 'partly',
    };
  });
  const fieldOf = new Map(fields.map((f) => [f.id, f]));

  const sectionIds = Object.keys(SECTIONS) as SectionId[];
  const base = new Map<SectionId, SectionCoverage>();
  for (const s of sectionIds) {
    const own = live.filter((x) => x.section === s);
    const usable = own.filter((x) => usableFact(x));
    const answered = FIELDS.some((f) => f.asks === s && fieldOf.get(f.id)!.confirmed);
    const disputed = own.some((x) => contested.has(x.id));
    const evidenced = own.find((x) => evidences(x, contested));
    let status: EvidenceStatus;
    let basis: SectionCoverage['basis'];
    if ((answered || evidenced) && !disputed) {
      status = 'found';
      basis = answered ? 'owner answer' : isOwnerRow(evidenced!) ? 'owner answer' : ownerApproved(evidenced!) ? 'owner-approved fact' : 'high-confidence fact';
    } else if (usable.some((x) => !contested.has(x.id)) || answered || evidenced) {
      status = 'partly';
      basis = disputed ? 'disputed' : 'facts to confirm';
    } else if (disputed) {
      status = 'partly';
      basis = 'disputed';
    } else {
      status = 'needs-you';
      basis = 'nothing yet';
    }
    base.set(s, { section: s, title: SECTIONS[s].title, gate: SECTIONS[s].gate, status, facts: own.length, usable: usable.length, basis });
  }
  // Messaging has no question of its own: with no messaging facts it is drafted from purpose and positioning (§4 row 8,
  // zero-data fallback "Draft from 2–7"), so it is inferred once both have something behind them (§12.3 rule 1:
  // "I if ... derived").
  const messaging = base.get('messaging')!;
  if (messaging.status === 'needs-you' && base.get('purpose')!.status !== 'needs-you' && base.get('positioning')!.status !== 'needs-you') {
    base.set('messaging', { ...messaging, status: 'partly', basis: 'drafted from other sections' });
  }
  const sections = sectionIds.map((s) => base.get(s)!);
  const found = sections.filter((s) => s.status === 'found').length;
  const partly = sections.filter((s) => s.status === 'partly').length;
  const covered = found + partly;

  const steps: StepCoverage[] = [...new Set(FIELDS.map((f) => f.step))].map((step) => {
    const own = fields.filter((f) => f.step === step);
    const mode = own.some((f) => !f.optional && f.status === 'needs-you' && !f.skipped) ? 'ask' : own.every((f) => f.confirmed || f.optional || f.skipped) ? 'done' : 'confirm';
    return { step, mode, fields: own.map((f) => f.id) };
  });

  const byId = new Map(live.map((f) => [f.id, f]));
  const questions: GapQuestion[] = [];
  for (const f of fields) {
    const spec = FIELDS.find((x) => x.id === f.id)!;
    // Weak: the only stand-ins are fuzzily located or never support-checked (read before #64), so the owner is asked
    // rather than shown a card to confirm.
    const weak = f.status === 'partly' && f.factIds.every((id) => rank(byId.get(id)!.confidence) < 2);
    const kind: GapKind | null = f.status === 'needs-you' && !f.skipped ? 'missing' : weak ? 'weak' : null;
    if (!kind) continue;
    questions.push({ id: f.id, kind, question: f.question, field: f.id, step: f.step, sections: [spec.asks], optional: f.optional, minutes: spec.minutes, score: rankScore(kind, fieldValue(spec), spec.minutes), factIds: kind === 'weak' ? f.factIds : [] });
  }
  for (const c of conflicts) {
    const facts = c.evidence_ids.map((id) => byId.get(id)).filter((x): x is CoverageFact => !!x).sort(order);
    const secs = [...new Set(facts.map((x) => x.section).filter((s): s is SectionId => s in SECTIONS))];
    const value = secs.reduce((n, s) => n + gateWeight(s), 0) || 1;
    const sides = new Map<string, { value: string; ids: string[] }>();
    for (const x of facts) {
      const v = (x.slot_value ?? '').trim();
      const side = sides.get(v.toLowerCase()) ?? { value: v, ids: [] };
      side.ids.push(x.id);
      sides.set(v.toLowerCase(), side);
    }
    questions.push({ id: `conflict:${c.id}`, kind: 'conflict', question: c.question, sections: secs, optional: false, minutes: CONFLICT_MINUTES, score: rankScore('conflict', value, CONFLICT_MINUTES), factIds: facts.map((x) => x.id), conflictId: c.id, sides: [...sides.values()] });
  }
  // Highest gain per minute first; ties in interview order (§12.3 rule 2), conflicts after questions on equal score.
  const pos = (q: GapQuestion) => (q.field ? FIELDS.findIndex((f) => f.id === q.field) : FIELDS.length);
  questions.sort((a, b) => b.score - a.score || pos(a) - pos(b) || a.id.localeCompare(b.id));
  const blocking = questions.filter((q) => q.kind !== 'weak' && !q.optional);

  const text = fields.filter((f) => FIELDS.find((x) => x.id === f.id)!.textAnswer);
  const prefilled = text.filter((f) => f.prefilled).length;
  return {
    sections,
    found,
    partly,
    needsYou: sections.length - covered,
    // Readiness: a found section counts whole and a partly found one half, since it still needs the owner's
    // confirmation. On the J1-Read board's sample, 3 found and 1 partly of 6 is the 58% drawn there (#75 fixtures).
    percent: Math.round((100 * (found + partly / 2)) / sections.length),
    covered,
    total: sections.length,
    ratio: covered / sections.length,
    fields,
    steps,
    questions,
    questionsLeft: blocking.length,
    minutesLeft: Math.round(blocking.reduce((n, q) => n + q.minutes, 0) * 10) / 10,
    prefill: { fields: text.length, prefilled, percent: text.length ? Math.round((100 * prefilled) / text.length) : 0 },
  };
}

/** The JourneyCoverage numbers alone (PR #75 types.ts), for ReadData. */
export const journeyCoverage = (m: Pick<CoverageMap, 'found' | 'partly' | 'needsYou' | 'percent'>): JourneyCoverage => ({ found: m.found, partly: m.partly, needsYou: m.needsYou, percent: m.percent });

/**
 * Field-status accuracy against gold labels (architecture §13.2, "Coverage field accuracy (F2) >= 90%", a hard gate).
 * `gold` maps a field id or kit section to its labelled status; anything unlabelled is not scored. The F2 labels are the
 * owner's to write (issue #65), so this is measured only once they exist.
 */
export function statusAccuracy(m: CoverageMap, gold: Record<string, EvidenceStatus>) {
  const got = new Map<string, EvidenceStatus>([...m.fields.map((f) => [f.id, f.status] as const), ...m.sections.map((s) => [s.section, s.status] as const)]);
  const scored = Object.entries(gold).filter(([k]) => got.has(k));
  const correct = scored.filter(([k, v]) => got.get(k) === v).length;
  return { scored: scored.length, correct, accuracy: scored.length ? correct / scored.length : null, wrong: scored.filter(([k, v]) => got.get(k) !== v).map(([k, v]) => ({ id: k, gold: v, got: got.get(k)! })) };
}

import { describe, expect, it } from 'vitest';
import { STEPS as SCREEN_STEPS } from '../screens/build/steps';
import { SECTIONS } from '../../worker/kit';
import { coverageMap, factStatus, fieldValue, rankScore, type CoverageFact, type CoverageInput } from '../../worker/prefill/coverage';
import { FIELDS, fieldById, readers, sectionLabel } from '../../worker/prefill/fields';
import { applyRoutes, FACT_FIELDS, quoteChecks, routeBatches } from '../../worker/prefill/route';
import { schemaError } from '../../worker/schema';

// The coverage map and its ranking (issue #34; architecture §6.1 "Coverage map", §12.3 rule 1). Pure functions, so
// every case is built by hand: a fact is owned or third-party, approved or proposed, exact or fuzzy, and routed to a
// question (spec/db/012 evidence.field) or not.

let n = 0;
const fact = (over: Partial<CoverageFact> = {}): CoverageFact => ({
  id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
  source_id: 's1', section: 'origin', claim: `claim ${n}`, quote: `quote ${n}`, origin: 'source', trust: 'owned',
  review_status: 'approved', match: 'exact', confidence: 'medium', slot: null, slot_value: null, quote_start: n * 10, quote_end: n * 10 + 5,
  field: null, decision: null, ...over,
});
const input = (over: Partial<CoverageInput> = {}): CoverageInput => ({ facts: [], answers: [], conflicts: [], ownedWords: 0, ...over });
const field = (m: ReturnType<typeof coverageMap>, id: string) => m.fields.find((f) => f.id === id)!;
const section = (m: ReturnType<typeof coverageMap>, id: string) => m.sections.find((s) => s.id === id)!;

describe('interview fields (prefill/fields.ts)', () => {
  it('are exactly the Build screen\'s questions, keyed as the screen saves them, plus the voice step', () => {
    const screen = SCREEN_STEPS.filter((s) => s.kind === 'questions' && s.questions).flatMap((s) => s.questions!.map((q) => `${s.answerStep}.${q.key}`));
    expect(FIELDS.filter((f) => f.routable).map((f) => f.id)).toEqual(screen);
    expect(FIELDS.map((f) => f.id)).toContain('voice.template');
    expect(fieldById('audience.real_people')!.optional).toBe(true);
    // Minutes come from the screen's step minutes (architecture §5), shared between the step's questions.
    expect(fieldById('origin.why')!.minutes).toBe(1);
    expect(fieldById('alternatives.edge')!.minutes).toBe(1.5);
  });
  it('only lets a question be answered by kit sections that exist, and names the sections that read it', () => {
    for (const f of FIELDS) for (const s of f.answeredBy) expect(Object.keys(SECTIONS)).toContain(s);
    expect(readers(fieldById('golden_circle.what')!)).toEqual(['purpose', 'positioning', 'messaging']);
    expect(readers(fieldById('origin.why')!)).toEqual(['origin', 'purpose']);
    expect(sectionLabel('positioning')).toBe('Positioning · Gate 2');
    expect(sectionLabel('origin')).toBe('Origin story');
  });
});

describe('fact status (architecture §12.3 rule 1)', () => {
  const none = new Set<string>();
  it('an owned fact is found only at high confidence (exact, two independent sources); one source is partly found', () => {
    expect(factStatus(fact({ confidence: 'high' }), none)).toBe('found');
    expect(factStatus(fact({ confidence: 'medium' }), none)).toBe('partly');
    expect(factStatus(fact({ confidence: 'low', match: 'fuzzy', review_status: 'proposed' }), none)).toBe('partly');
  });
  it('the owner\'s acceptance counts as their answer; a fact outside the allow-list is only shown for review', () => {
    expect(factStatus(fact({ decision: 'accepted' }), none)).toBe('found');
    expect(factStatus(fact({ trust: 'third_party', review_status: 'approved' }), none)).toBe('found');
    expect(factStatus(fact({ trust: 'third_party', review_status: 'proposed', confidence: 'high' }), none)).toBe('partly');
  });
  it('a fact in an open conflict needs the owner', () => {
    const f = fact({ confidence: 'high' });
    expect(factStatus(f, new Set([f.id]))).toBe('needs-you');
  });
});

describe('coverage map', () => {
  it('with nothing read, every question needs the owner and readiness is 0', () => {
    const m = coverageMap(input());
    expect(m.fields.every((f) => f.status === 'needs-you')).toBe(true);
    expect(m.coverage).toEqual({ found: 0, partly: 0, needsYou: 6, percent: 0 });
    expect(m.steps.every((s) => s.mode === 'ask')).toBe(true);
    expect(m.prefill).toEqual({ fields: 10, prefilled: 0, percent: 0 });
  });
  it('a routed, usable fact prefills its question; only the allow-list counts (ADR-011)', () => {
    const owned = fact({ field: 'origin.why' });
    const proposed = fact({ field: 'origin.broken', trust: 'third_party', review_status: 'proposed' });
    const m = coverageMap(input({ facts: [owned, proposed] }));
    expect(field(m, 'origin.why')).toMatchObject({ status: 'partly', prefilled: true, factIds: [owned.id] });
    // The third-party fact is a candidate the owner can accept, but backs nothing yet.
    expect(field(m, 'origin.broken')).toMatchObject({ status: 'needs-you', prefilled: false, factIds: [proposed.id] });
    expect(m.questions.find((q) => q.id === 'origin.broken')).toMatchObject({ kind: 'missing', factIds: [proposed.id] });
  });
  it('rejected facts, owner-answer rows and facts with no quote never prefill', () => {
    const m = coverageMap(input({ facts: [
      fact({ field: 'origin.why', review_status: 'rejected' }),
      fact({ field: 'origin.why', origin: 'owner_answer', trust: 'owner_answer' }),
      fact({ field: 'origin.why', quote: null }),
    ] }));
    expect(field(m, 'origin.why')).toMatchObject({ status: 'needs-you', factIds: [] });
  });
  it('the owner\'s answer finds a question and confirms it; a fully answered step is done', () => {
    const m = coverageMap(input({ answers: [{ step: 'origin', data: { why: 'a', broken: 'b', first_win: 'c' }, skipped: false }] }));
    expect(field(m, 'origin.why')).toMatchObject({ status: 'found', confirmed: true, answer: 'a', prefilled: false });
    expect(m.steps.find((s) => s.step === 'origin')!.mode).toBe('done');
    expect(section(m, 'origin').status).toBe('found');
  });
  it('a step whose every question is prefilled becomes "confirm"; one with a gap stays "ask"', () => {
    const facts = ['origin.why', 'origin.broken', 'origin.first_win', 'alternatives.instead'].map((f) => fact({ field: f }));
    const m = coverageMap(input({ facts }));
    expect(m.steps.find((s) => s.step === 'origin')!.mode).toBe('confirm');
    expect(m.steps.find((s) => s.step === 'alternatives')!.mode).toBe('ask');
    // Accepting every prefilled fact of a step finishes it.
    const accepted = coverageMap(input({ facts: facts.map((f) => ({ ...f, decision: 'accepted' })) }));
    expect(accepted.steps.find((s) => s.step === 'origin')!.mode).toBe('done');
  });
  it('a skipped step is not asked again, and an optional question never blocks', () => {
    const m = coverageMap(input({ answers: [{ step: 'origin', data: {}, skipped: true }] }));
    expect(field(m, 'origin.why')).toMatchObject({ status: 'needs-you', skipped: true });
    expect(m.questions.some((q) => q.step === 'origin')).toBe(false);
    const real = m.questions.find((q) => q.id === 'audience.real_people')!;
    expect(real.optional).toBe(true);
    expect(m.questionsLeft).toBe(m.questions.filter((q) => q.kind !== 'weak' && !q.optional).length);
  });
  it('sections roll up from the questions their drafter reads; readiness counts partly as half (J1 board: 3, 1, 2 -> 58%)', () => {
    const answers: CoverageInput['answers'] = [
      { step: 'origin', data: { why: 'a', broken: 'b', first_win: 'c' }, skipped: false },
      { step: 'golden_circle', data: { what: 'a', how: 'b', why: 'c' }, skipped: false },
      { step: 'alternatives', data: { instead: 'a', edge: 'b' }, skipped: false },
    ];
    const m = coverageMap(input({ answers }));
    // origin, purpose and positioning are found; messaging reads the audience and voice steps too, so it is partly.
    expect(m.sections.map((s) => [s.id, s.status])).toEqual([
      ['origin', 'found'], ['purpose', 'found'], ['positioning', 'found'], ['audience', 'needs-you'], ['voice', 'needs-you'], ['messaging', 'partly'],
    ]);
    expect(m.coverage).toEqual({ found: 3, partly: 1, needsYou: 2, percent: 58 });
  });
  it('a section with usable facts but no routed question is partly found, not missing', () => {
    const m = coverageMap(input({ facts: [fact({ section: 'messaging', field: 'none' })] }));
    expect(section(m, 'messaging').status).toBe('partly');
  });
  it('voice: the owner\'s pick finds it; 300 words of the brand\'s own text make it partly found (§4 row 9)', () => {
    expect(field(coverageMap(input({ ownedWords: 299 })), 'voice.template').status).toBe('needs-you');
    expect(field(coverageMap(input({ ownedWords: 300 })), 'voice.template').status).toBe('partly');
    expect(field(coverageMap(input({ answers: [{ step: 'voice', data: { template: 'plainspoken' }, skipped: false }] })), 'voice.template')).toMatchObject({ status: 'found', confirmed: true });
  });
  it('a conflict (B3a) makes its question need the owner, with both sides and every fact on each', () => {
    const a = fact({ field: 'origin.first_win', slot: 'founded', slot_value: '2019', review_status: 'proposed' });
    const b = fact({ field: 'origin.first_win', slot: 'founded', slot_value: '2020', trust: 'third_party', review_status: 'proposed', source_id: 's2' });
    const c = fact({ field: 'origin.first_win', slot: 'founded', slot_value: '2020', trust: 'third_party', review_status: 'proposed', source_id: 's3' });
    const m = coverageMap(input({ facts: [a, b, c], conflicts: [{ id: 'c1', slot: 'founded', evidence_ids: [a.id, b.id, c.id], question: 'Your sources disagree. Which is right?' }] }));
    expect(field(m, 'origin.first_win')).toMatchObject({ status: 'needs-you', conflictIds: ['c1'] });
    const q = m.questions.find((x) => x.kind === 'conflict')!;
    expect(q).toMatchObject({ id: 'conflict:c1', field: 'origin.first_win', conflictId: 'c1', question: 'Your sources disagree. Which is right?' });
    expect(q.sides).toEqual([{ value: '2019', ids: [a.id] }, { value: '2020', ids: [b.id, c.id] }]);
    // Not asked twice: the conflict replaces the "missing" question for that field.
    expect(m.questions.filter((x) => x.field === 'origin.first_win')).toHaveLength(1);
    expect(section(m, 'origin').status).not.toBe('found');
  });
  it('a conflict on facts routed to no question still reaches the owner, valued by its section', () => {
    const a = fact({ field: 'none', slot: 'founded', slot_value: '2019' });
    const b = fact({ field: 'none', slot: 'founded', slot_value: '2020', trust: 'third_party', review_status: 'proposed' });
    const m = coverageMap(input({ facts: [a, b], conflicts: [{ id: 'c2', slot: 'founded', evidence_ids: [a.id, b.id], question: 'q' }] }));
    const q = m.questions.find((x) => x.kind === 'conflict')!;
    expect(q.field).toBeUndefined();
    expect(q.score).toBe(rankScore('conflict', 1, 0.5));
    expect(m.questionsLeft).toBeGreaterThan(0);
  });
  it('a question backed only by unscored facts (read before #64) is weak, asked after the missing ones', () => {
    const weakFact = fact({ field: 'golden_circle.what', match: null, confidence: null });
    const m = coverageMap(input({ facts: [weakFact] }));
    const q = m.questions.find((x) => x.id === 'golden_circle.what')!;
    expect(q.kind).toBe('weak');
    expect(m.questionsLeft).toBe(m.questions.filter((x) => x.kind !== 'weak' && !x.optional).length);
    // An exact single-source fact is not weak: the owner confirms it on a card instead.
    expect(coverageMap(input({ facts: [fact({ field: 'golden_circle.what' })] })).questions.some((x) => x.id === 'golden_circle.what')).toBe(false);
    // A fuzzily located owned fact is approved only by the owner (extract/save.ts initialReviewFor), so it is found.
    expect(field(coverageMap(input({ facts: [fact({ field: 'golden_circle.what', match: 'fuzzy', confidence: 'low' })] })), 'golden_circle.what').status).toBe('found');
  });
  it('is deterministic: input order does not change the result', () => {
    const facts = [fact({ field: 'origin.why' }), fact({ field: 'origin.why', confidence: 'high' }), fact({ field: 'audience.who' })];
    expect(coverageMap(input({ facts: [...facts].reverse() }))).toEqual(coverageMap(input({ facts })));
    // Best fact first: the high-confidence one.
    expect(field(coverageMap(input({ facts })), 'origin.why').factIds[0]).toBe(facts[1].id);
  });
});

describe('ranking: expected information gain per owner minute (§6.1, MediQ)', () => {
  it('values a question by the sections that read it, gated sections twice, optional ones half', () => {
    // golden_circle is read by purpose (gate), positioning (gate) and messaging: 2 + 2 + 1.
    expect(fieldValue(fieldById('golden_circle.what')!)).toBe(5);
    // origin is read by origin and purpose (gate): 1 + 2.
    expect(fieldValue(fieldById('origin.why')!)).toBe(3);
    expect(fieldValue(fieldById('audience.real_people')!)).toBe(fieldValue(fieldById('audience.who')!) / 2);
  });
  it('asks the questions with the most gain per minute first, ties in interview order', () => {
    const m = coverageMap(input());
    const scores = m.questions.map((q) => q.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    // Golden Circle questions feed two gates and take 40 seconds each: asked first.
    expect(m.questions.slice(0, 3).map((q) => q.id)).toEqual(['golden_circle.what', 'golden_circle.how', 'golden_circle.why']);
    expect(m.questions[3].id).toBe('origin.why');
    // The optional question (half value) and the voice pick (three minutes) tie at 1; interview order puts voice last.
    expect(m.questions.slice(-2).map((q) => q.id)).toEqual(['audience.real_people', 'voice.template']);
  });
  it('asks only about missing, weak or conflicting questions: a found one is never asked', () => {
    const m = coverageMap(input({ facts: [fact({ field: 'origin.why', confidence: 'high' })] }));
    expect(field(m, 'origin.why').status).toBe('found');
    expect(m.questions.some((q) => q.field === 'origin.why')).toBe(false);
  });
});

describe('routing facts to questions (prefill/route.ts)', () => {
  const text = 'We started because margins were thin. Cafes waited two weeks.';
  const a = { id: 'e1', source_id: 's1', section: 'origin', claim: 'Margins were thin.', quote: 'We started because margins were thin.', quote_start: 0, quote_end: 37 };
  const b = { id: 'e2', source_id: 's1', section: 'audience', claim: 'Cafes waited.', quote: 'Cafes waited two weeks.', quote_start: 38, quote_end: 61 };
  it('sends the model local ids, sections and claims only, in batches, and reports what it could not fit', () => {
    const out = routeBatches([a, b], 1, 1);
    expect(out.count).toBe(1);
    expect(out.skipped).toBe(1);
    expect(JSON.parse(out.batches[0].text)).toEqual([{ id: 'f1', section: 'origin', claim: 'Margins were thin.' }]);
    expect(out.batches[0].text).not.toContain('e1');
  });
  it('keeps a route only to a question the fact\'s section can answer, with a quote that checks', () => {
    const { batches } = routeBatches([a, b], 5, 2);
    const out = applyRoutes([a, b], batches, [{ routes: [{ id: 'f1', field: 'origin.why' }, { id: 'f2', field: 'origin.why' }] }], () => text);
    expect(out.routes).toEqual([{ id: 'e1', field: 'origin.why' }, { id: 'e2', field: 'none' }]);
    expect(out.dropped).toEqual({ wrong_section: 1 });
    // The stored quote no longer matches its source text: never routed.
    const moved = applyRoutes([a], batches, [{ routes: [{ id: 'f1', field: 'origin.why' }] }], () => `x${text}`);
    expect(moved.routes).toEqual([{ id: 'e1', field: 'none' }]);
    expect(moved.dropped).toEqual({ quote_failed: 1 });
  });
  it('leaves a fact with no verdict, or two different ones, unrouted for the next read', () => {
    const { batches } = routeBatches([a, b], 5, 2);
    const out = applyRoutes([a, b], batches, [{ routes: [{ id: 'f1', field: 'origin.why' }, { id: 'f1', field: 'origin.broken' }, { id: 'f9', field: 'origin.why' }] }], () => text);
    expect(out.routes).toEqual([]);
    expect(out.dropped).toEqual({ not_routed: 2 });
  });
  it('checks quotes by their stored offsets, or through the shared normaliser when there are none', () => {
    expect(quoteChecks(a, text)).toBe(true);
    expect(quoteChecks({ ...a, quote_start: 1 }, text)).toBe(false);
    expect(quoteChecks({ quote: 'We STARTED because margins were thin', quote_start: null, quote_end: null }, text)).toBe(true);
    expect(quoteChecks({ quote: 'we started because margins were fat', quote_start: null, quote_end: null }, text)).toBe(false);
    expect(quoteChecks(a, null)).toBe(false);
  });
  it('the reply schema allows only real question ids or none', () => {
    expect(schemaError(FACT_FIELDS.schema, { routes: [{ id: 'f1', field: 'origin.why' }] })).toBeNull();
    expect(schemaError(FACT_FIELDS.schema, { routes: [{ id: 'f1', field: 'voice.template' }] })).toMatch(/not one of the allowed/);
    expect(schemaError(FACT_FIELDS.schema, { routes: [{ id: 'f1', field: 'none', confidence: 1 }] })).toMatch(/not allowed/);
  });
});

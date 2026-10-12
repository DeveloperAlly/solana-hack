import { describe, expect, it } from 'vitest';
import { STEPS as SCREEN_STEPS } from '../screens/build/steps';
import { SECTIONS } from '../../worker/kit';
import { coverageMap, evidences, fieldState, fieldValue, rankScore, statusAccuracy, type CoverageFact, type CoverageInput } from '../../worker/prefill/coverage';
import { FIELDS, fieldById, readers } from '../../worker/prefill/fields';

// The coverage map and its ranking (issue #34; architecture §6.1 "Coverage map", §12.3 rule 1). Pure functions, so
// every case is built by hand from evidence rows as they are stored (spec/db/001, 009, 011).

let n = 0;
const fact = (over: Partial<CoverageFact> = {}): CoverageFact => ({
  id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
  source_id: 's1', section: 'origin', claim: `claim ${n}`, quote: `quote ${n}`, origin: 'source', trust: 'owned',
  review_status: 'approved', match: 'exact', confidence: 'medium', slot: null, slot_value: null, ...over,
});
const input = (over: Partial<CoverageInput> = {}): CoverageInput => ({ evidence: [], answers: [], conflicts: [], ...over });
type Cov = ReturnType<typeof coverageMap>;
const field = (m: Cov, id: string) => m.fields.find((f) => f.id === id)!;
const section = (m: Cov, id: string) => m.sections.find((s) => s.section === id)!;
const ALL_ANSWERS: CoverageInput['answers'] = [
  { step: 'origin', data: { why: 'a', broken: 'b', first_win: 'c' }, skipped: false },
  { step: 'golden_circle', data: { what: 'a', how: 'b', why: 'c' }, skipped: false },
  { step: 'alternatives', data: { instead: 'a', edge: 'b' }, skipped: false },
];

describe('interview fields (prefill/fields.ts)', () => {
  it('are exactly the Build screen\'s questions, keyed as the screen saves them, plus the voice step', () => {
    const screen = SCREEN_STEPS.filter((s) => s.kind === 'questions' && s.questions).flatMap((s) => s.questions!.map((q) => `${s.answerStep}.${q.key}`));
    expect(FIELDS.filter((f) => f.textAnswer).map((f) => f.id)).toEqual(screen);
    expect(FIELDS.map((f) => f.id)).toContain('voice.template');
    expect(fieldById('audience.real_people')!.optional).toBe(true);
    // Minutes come from the screen's step minutes (architecture §5), shared between the step's questions.
    expect(fieldById('origin.why')!.minutes).toBe(1);
    expect(fieldById('alternatives.edge')!.minutes).toBe(1.5);
  });
  it('names real kit sections, and the sections that read each question (kit.ts SECTIONS.from)', () => {
    for (const f of FIELDS) for (const s of [...f.answeredBy, f.asks]) expect(Object.keys(SECTIONS)).toContain(s);
    expect(readers(fieldById('golden_circle.what')!)).toEqual(['purpose', 'positioning', 'messaging']);
    expect(readers(fieldById('origin.why')!)).toEqual(['origin', 'purpose']);
    // Never inferred: alternatives come from competitor research or the owner, real people only from the owner (§4).
    expect(fieldById('alternatives.instead')!.answeredBy).toEqual([]);
    expect(fieldById('audience.real_people')!.answeredBy).toEqual([]);
  });
});

describe('§12.3 rule 1: Evidenced is a high-confidence owned fact or a direct owner answer', () => {
  const none = new Set<string>();
  it('an owned fact evidences its section only at high confidence (an exact quote from two independent sources)', () => {
    expect(evidences(fact({ confidence: 'high' }), none)).toBe(true);
    expect(evidences(fact({ confidence: 'medium' }), none)).toBe(false);
    expect(evidences(fact({ trust: 'third_party', confidence: 'high', review_status: 'proposed' }), none)).toBe(false);
  });
  it('the owner\'s own statement in a kit section, and a fact the owner approved, count as the owner\'s answer', () => {
    expect(evidences(fact({ origin: 'owner_answer', trust: 'owner_answer', section: 'positioning', quote: null }), none)).toBe(true);
    // An interview answer row is filed under its step, not a kit section: it counts through the answers, not here.
    expect(evidences(fact({ origin: 'owner_answer', trust: 'owner_answer', section: 'golden_circle' }), none)).toBe(false);
    expect(evidences(fact({ trust: 'third_party', review_status: 'approved' }), none)).toBe(true);
    expect(evidences(fact({ match: 'fuzzy', confidence: 'low', review_status: 'approved' }), none)).toBe(true);
  });
  it('nothing outside the allow-list (ADR-011) and nothing disputed evidences anything', () => {
    expect(evidences(fact({ confidence: 'high', review_status: 'rejected' }), none)).toBe(false);
    expect(evidences(fact({ confidence: 'high', review_status: null }), none)).toBe(false);
    const f = fact({ confidence: 'high' });
    expect(evidences(f, new Set([f.id]))).toBe(false);
  });
});

describe('one rule for a question\'s state (fieldState, PR #101 review)', () => {
  const ev = { trust: 'owned', review_status: 'approved', confidence: 'high' } as const;
  // Every combination: answer, skipped, and candidates that are Evidenced, usable, proposed, disputed, or none.
  const cases: [string, Partial<CoverageFact>[], boolean, string, string, string][] = [
    // name, candidates (disputed: the first one listed when the flag is set), dispute first, answer, expected status, basis
    ['nothing', [], false, '', 'needs-you', 'none'],
    ['an Evidenced fact', [ev], false, '', 'found', 'evidence'],
    ['a usable fact, medium', [{ confidence: 'medium' }], false, '', 'partly', 'pending confirmation'],
    ['a usable fact, unscored', [{ confidence: null, match: null }], false, '', 'partly', 'pending confirmation'],
    ['a proposed third-party fact', [{ trust: 'third_party', review_status: 'proposed' }], false, '', 'partly', 'pending confirmation'],
    ['a proposed fuzzy owned fact', [{ review_status: 'proposed', match: 'fuzzy', confidence: 'low' }], false, '', 'partly', 'pending confirmation'],
    ['an owner-approved third-party fact', [{ trust: 'third_party', review_status: 'approved' }], false, '', 'found', 'evidence'],
    ['only a disputed fact', [{ confidence: 'high' }], true, '', 'partly', 'pending conflict'],
    ['a disputed and a free fact', [{ confidence: 'high' }, { confidence: 'medium' }], true, '', 'partly', 'pending confirmation'],
    ['an answer, whatever the facts', [ev], true, 'x', 'found', 'answer'],
  ];
  it.each(cases)('%s', (_name, over, dispute, answer, status, basis) => {
    const facts = over.map((o) => fact(o));
    const contested = new Set(dispute ? [facts[0].id] : []);
    expect(fieldState(answer, false, facts, contested)).toMatchObject({ status, basis });
  });
  it('a skipped step needs the owner and is not asked, whatever the facts', () => {
    expect(fieldState('', true, [fact(ev)], new Set())).toEqual({ status: 'needs-you', basis: 'skipped', factIds: [], conflictFactIds: [] });
  });
  it('every question is counted once: missing, pending a card, or pending a conflict, never two of these', () => {
    const a = fact({ section: 'origin', slot: 'founded', slot_value: '1', review_status: 'proposed' });
    const b = fact({ section: 'origin', slot: 'founded', slot_value: '2', review_status: 'proposed' });
    const m = coverageMap(input({
      evidence: [a, b, fact({ section: 'audience', trust: 'third_party', review_status: 'proposed' }), fact({ section: 'positioning' })],
      conflicts: [{ id: 'c', slot: 'founded', evidence_ids: [a.id, b.id], question: 'q' }],
    }));
    for (const f of m.fields) {
      const asked = m.questions.filter((q) => q.field === f.id && q.kind !== 'weak');
      expect(asked.length).toBe(f.basis === 'none' ? 1 : 0);
    }
    expect(m.questionsLeft).toBe(m.fields.filter((f) => f.basis === 'none' && !f.optional).length + 1);
  });
});

describe('coverage map', () => {
  it('with nothing read, every section and question needs the owner and readiness is 0', () => {
    const m = coverageMap(input());
    expect(m.sections.every((s) => s.status === 'needs-you')).toBe(true);
    expect(m.fields.every((f) => f.status === 'needs-you')).toBe(true);
    expect([m.found, m.partly, m.needsYou, m.percent]).toEqual([0, 0, 6, 0]);
    expect(m.steps.every((s) => s.mode === 'ask')).toBe(true);
    expect(m.prefill).toEqual({ fields: 10, prefilled: 0, percent: 0 });
  });
  it('statuses are exactly #75\'s EvidenceStatus values', () => {
    const m = coverageMap(input({ evidence: [fact()], answers: ALL_ANSWERS }));
    for (const x of [...m.sections, ...m.fields]) expect(['found', 'partly', 'needs-you']).toContain(x.status);
  });
  it('one exact quote from one site is partly found: a section is found at high confidence or with an owner answer', () => {
    const m = coverageMap(input({ evidence: [fact({ section: 'origin' })] }));
    expect(section(m, 'origin')).toMatchObject({ status: 'partly', basis: 'facts to confirm', facts: 1, usable: 1 });
    expect(section(coverageMap(input({ evidence: [fact({ section: 'origin', confidence: 'high' })] })), 'origin')).toMatchObject({ status: 'found', basis: 'high-confidence fact' });
    const answered = coverageMap(input({ answers: [{ step: 'origin', data: { why: 'a' }, skipped: false }] }));
    expect(section(answered, 'origin')).toMatchObject({ status: 'found', basis: 'owner answer' });
  });
  it('a section\'s facts stand in for the questions they can answer, as prefilled, never as found', () => {
    const f = fact({ section: 'positioning' });
    const m = coverageMap(input({ evidence: [f] }));
    for (const id of ['golden_circle.what', 'golden_circle.how', 'alternatives.edge']) expect(field(m, id)).toMatchObject({ status: 'partly', prefilled: true, factIds: [f.id] });
    // Never inferred from the brand's own copy.
    expect(field(m, 'alternatives.instead')).toMatchObject({ status: 'needs-you', prefilled: false });
  });
  it('rejected and unquoted facts and owner rows never answer a question; a proposed fact is pending, never usable', () => {
    const proposed = fact({ trust: 'third_party', review_status: 'proposed' });
    const m = coverageMap(input({ evidence: [
      proposed,
      fact({ review_status: 'rejected' }),
      fact({ quote: null }),
      fact({ origin: 'owner_answer', trust: 'owner_answer', section: 'origin', quote: null }),
    ] }));
    // Only the proposed fact answers: pending the owner's confirmation on its card, counted once, not asked as missing.
    expect(field(m, 'origin.broken')).toMatchObject({ status: 'partly', basis: 'pending confirmation', factIds: [proposed.id] });
    expect(m.questions.some((q) => q.step === 'origin')).toBe(false);
    // The proposed fact counts in the section's facts but is not usable: the allow-list still gates drafting.
    expect(section(m, 'origin')).toMatchObject({ facts: 3, usable: 2 });
  });
  it('the owner\'s answer finds a question and confirms it; a fully answered step is done', () => {
    const m = coverageMap(input({ answers: [{ step: 'origin', data: { why: 'a', broken: 'b', first_win: 'c' }, skipped: false }] }));
    expect(field(m, 'origin.why')).toMatchObject({ status: 'found', confirmed: true, answer: 'a', prefilled: false });
    expect(m.steps.find((s) => s.step === 'origin')!.mode).toBe('done');
  });
  it('a step whose every question is prefilled or answered becomes "confirm"; one with a gap stays "ask"', () => {
    const m = coverageMap(input({ evidence: [fact({ section: 'origin' })] }));
    expect(m.steps.find((s) => s.step === 'origin')!.mode).toBe('confirm');
    // alternatives.instead is never inferred, so that step is asked.
    expect(coverageMap(input({ evidence: [fact({ section: 'positioning' })] })).steps.find((s) => s.step === 'alternatives')!.mode).toBe('ask');
  });
  it('a skipped step is not asked again, and an optional question never blocks', () => {
    const m = coverageMap(input({ answers: [{ step: 'origin', data: {}, skipped: true }] }));
    expect(field(m, 'origin.why')).toMatchObject({ status: 'needs-you', skipped: true });
    expect(m.questions.some((q) => q.step === 'origin')).toBe(false);
    expect(m.questions.find((q) => q.id === 'audience.real_people')!.optional).toBe(true);
    expect(m.questionsLeft).toBe(m.questions.filter((q) => q.kind !== 'weak' && !q.optional).length);
  });
  it('readiness counts partly as half (J1 board: 3 found, 1 partly, 2 needs you -> 58%)', () => {
    const m = coverageMap(input({ answers: ALL_ANSWERS }));
    // origin, purpose and positioning are answered; messaging is drafted from purpose and positioning (§4 row 8).
    expect(m.sections.map((s) => [s.section, s.status])).toEqual([
      ['origin', 'found'], ['purpose', 'found'], ['positioning', 'found'], ['audience', 'needs-you'], ['voice', 'needs-you'], ['messaging', 'partly'],
    ]);
    expect(section(m, 'messaging').basis).toBe('drafted from other sections');
    expect([m.found, m.partly, m.needsYou, m.percent]).toEqual([3, 1, 2, 58]);
    expect([m.covered, m.total, m.ratio]).toEqual([4, 6, 4 / 6]);
  });
  it('a conflict (B3a) keeps its section from found and becomes one question with both sides', () => {
    const a = fact({ slot: 'founded', slot_value: '2019', confidence: 'high', review_status: 'proposed' });
    const b = fact({ slot: 'founded', slot_value: '2020', trust: 'third_party', review_status: 'proposed', source_id: 's2' });
    const c = fact({ slot: 'founded', slot_value: '2020', trust: 'third_party', review_status: 'proposed', source_id: 's3' });
    const m = coverageMap(input({ evidence: [a, b, c], conflicts: [{ id: 'c1', slot: 'founded', evidence_ids: [a.id, b.id, c.id], question: 'Your sources disagree. Which is right?', status: 'open' }] }));
    expect(section(m, 'origin')).toMatchObject({ status: 'partly', basis: 'disputed' });
    const q = m.questions.find((x) => x.kind === 'conflict')!;
    expect(q).toMatchObject({ id: 'conflict:c1', conflictId: 'c1', sections: ['origin'], question: 'Your sources disagree. Which is right?' });
    expect(q.sides).toEqual([{ value: '2019', ids: [a.id] }, { value: '2020', ids: [b.id, c.id].sort() }]);
    expect(m.questionsLeft).toBeGreaterThan(0);
    // Even an owner answer does not make a disputed section found until the owner settles the dispute.
    const answered = coverageMap(input({ evidence: [a, b], answers: [{ step: 'origin', data: { why: 'x' }, skipped: false }], conflicts: [{ id: 'c1', slot: 'founded', evidence_ids: [a.id, b.id], question: 'q' }] }));
    expect(section(answered, 'origin')).toMatchObject({ status: 'partly', basis: 'disputed' });
    // A resolved conflict asks nothing.
    const done = coverageMap(input({ evidence: [a, b, c], conflicts: [{ id: 'c1', slot: 'founded', evidence_ids: [a.id, b.id, c.id], question: 'q', status: 'resolved' }] }));
    expect(done.questions.some((x) => x.kind === 'conflict')).toBe(false);
  });
  it('a brand whose only origin facts disagree gets exactly one origin question, the conflict (PR #101 review)', () => {
    const a = fact({ section: 'origin', slot: 'founded', slot_value: '2019', review_status: 'proposed' });
    const b = fact({ section: 'origin', slot: 'founded', slot_value: '2020', trust: 'third_party', review_status: 'proposed' });
    const m = coverageMap(input({ evidence: [a, b], conflicts: [{ id: 'c1', slot: 'founded', evidence_ids: [a.id, b.id], question: 'q' }] }));
    // Answered pending the conflict: partly found, not prefilled (no fact stands in until the owner picks a side).
    for (const id of ['origin.why', 'origin.broken', 'origin.first_win']) expect(field(m, id)).toMatchObject({ status: 'partly', conflictIds: ['c1'], prefilled: false, factIds: [] });
    expect(m.questions.filter((q) => q.step === 'origin' || q.sections.includes('origin'))).toEqual([expect.objectContaining({ kind: 'conflict', conflictId: 'c1' })]);
    expect(m.steps.find((s) => s.step === 'origin')!.mode).toBe('confirm');
    // The same brand with no conflict open would be asked each origin question.
    expect(coverageMap(input()).questions.filter((q) => q.step === 'origin')).toHaveLength(3);
    // Counted once in questions left and owner time: three missing questions (3 minutes) became one pick (half a minute).
    expect(m.questionsLeft).toBe(coverageMap(input()).questionsLeft - 3 + 1);
    expect(m.minutesLeft).toBe(Math.round((coverageMap(input()).minutesLeft - 3 + 0.5) * 10) / 10);
  });
  it('a question whose only stand-ins were never support-checked or only fuzzily located is weak, asked after the missing ones', () => {
    const m = coverageMap(input({ evidence: [fact({ section: 'audience', match: null, confidence: null })] }));
    expect(m.questions.find((x) => x.id === 'audience.who')!.kind).toBe('weak');
    expect(m.questionsLeft).toBe(m.questions.filter((x) => x.kind !== 'weak' && !x.optional).length);
    // An exact, support-checked fact is not weak: the owner confirms it on a card instead of being asked.
    expect(coverageMap(input({ evidence: [fact({ section: 'audience' })] })).questions.some((x) => x.id === 'audience.who')).toBe(false);
    // Nor is a fuzzily located fact the owner has approved.
    expect(coverageMap(input({ evidence: [fact({ section: 'audience', match: 'fuzzy', confidence: 'low' })] })).questions.some((x) => x.id === 'audience.who')).toBe(false);
  });
  it('is deterministic: input order does not change the result, and the best stand-in comes first', () => {
    const facts = [fact({ section: 'audience' }), fact({ section: 'audience', confidence: 'high' }), fact({ section: 'purpose' })];
    expect(coverageMap(input({ evidence: [...facts].reverse() }))).toEqual(coverageMap(input({ evidence: facts })));
    expect(field(coverageMap(input({ evidence: facts })), 'audience.who').factIds[0]).toBe(facts[1].id);
  });
});

describe('ranking: expected information gain per owner minute (§6.1, MediQ)', () => {
  it('values a question by the sections that read it, gated sections twice, optional ones half', () => {
    expect(fieldValue(fieldById('golden_circle.what')!)).toBe(5);
    expect(fieldValue(fieldById('origin.why')!)).toBe(3);
    expect(fieldValue(fieldById('audience.real_people')!)).toBe(fieldValue(fieldById('audience.who')!) / 2);
  });
  it('asks the questions with the most gain per minute first, ties in interview order', () => {
    const m = coverageMap(input());
    const scores = m.questions.map((q) => q.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    // Golden Circle questions feed two gates and take 40 seconds each: asked first.
    expect(m.questions.slice(0, 4).map((q) => q.id)).toEqual(['golden_circle.what', 'golden_circle.how', 'golden_circle.why', 'origin.why']);
    // The optional question (half value) and the voice pick (three minutes) tie at 1; interview order puts voice last.
    expect(m.questions.slice(-2).map((q) => q.id)).toEqual(['audience.real_people', 'voice.template']);
  });
  it('asks only about missing, weak or conflicting questions: an answered or prefilled one is not asked', () => {
    const m = coverageMap(input({ evidence: [fact({ section: 'origin' })], answers: [{ step: 'audience', data: { who: 'x' }, skipped: false }] }));
    expect(m.questions.some((q) => q.field === 'origin.why' || q.field === 'audience.who')).toBe(false);
  });
  it('a conflict is valued by its sections and takes half a minute', () => {
    const a = fact({ section: 'purpose', slot: 'founded', slot_value: '1' });
    const b = fact({ section: 'purpose', slot: 'founded', slot_value: '2' });
    const m = coverageMap(input({ evidence: [a, b], conflicts: [{ id: 'c', slot: 'founded', evidence_ids: [a.id, b.id], question: 'q' }] }));
    expect(m.questions.find((q) => q.kind === 'conflict')!.score).toBe(rankScore('conflict', 2, 0.5));
  });
});

describe('measures (architecture §6.1 and §13.2)', () => {
  it('prefill: the share of text questions filled from evidence (#34 gate: >= 70% on aDNA)', () => {
    const m = coverageMap(input({ evidence: ['origin', 'purpose', 'positioning', 'audience'].map((s) => fact({ section: s })) }));
    // Everything but the two questions only the owner can answer: 8 of 10.
    expect(m.prefill).toEqual({ fields: 10, prefilled: 8, percent: 80 });
  });
  it('field-status accuracy against gold labels (F2 gate: >= 90%), scoring only what is labelled', () => {
    const m = coverageMap(input({ evidence: [fact({ section: 'origin' })] }));
    const acc = statusAccuracy(m, { 'origin.why': 'partly', 'alternatives.instead': 'needs-you', origin: 'found', 'not.a.field': 'found' });
    expect(acc).toMatchObject({ scored: 3, correct: 2, accuracy: 2 / 3, wrong: [{ id: 'origin', gold: 'found', got: 'partly' }] });
    expect(statusAccuracy(m, {}).accuracy).toBeNull();
  });
});

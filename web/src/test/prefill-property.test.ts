import { describe, expect, it } from 'vitest';
import { aggregate, coverageMap, type CoverageFact } from '../../worker/prefill/coverage';
import { confirmData, readData } from '../../worker/prefill/journey';
import { FIELDS } from '../../worker/prefill/fields';
import { SECTIONS } from '../../worker/kit';
import { reviewable } from '../../worker/sources/registry';

// Properties of the coverage map and the Journey cards over generated evidence (issue #34; PR #101 review). A seeded
// generator (mulberry32, https://gist.github.com/tommyettinger/46a874533244883189143505d203312c) makes every run the
// same, so a failure names a reproducible case.

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SECTION_IDS = Object.keys(SECTIONS);
const TRUSTS = ['owned', 'third_party', 'owner_answer', 'assumption', null];
const REVIEWS = ['approved', 'proposed', 'rejected', null];
const CONFIDENCE = ['high', 'medium', 'low', null];
const MATCH = ['exact', 'fuzzy', null];

function brandCase(seed: number) {
  const r = mulberry32(seed);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const evidence: CoverageFact[] = Array.from({ length: Math.floor(r() * 14) }, (_, i) => {
    const trust = pick(TRUSTS);
    const owner = trust === 'owner_answer';
    return {
      id: `00000000-0000-4000-8000-${String(seed * 100 + i).padStart(12, '0')}`,
      source_id: owner ? null : 's1', section: pick([...SECTION_IDS, 'golden_circle']), claim: `claim ${i}`,
      quote: r() < 0.85 ? `quote ${i}` : null, origin: owner ? 'owner_answer' : trust === 'assumption' ? 'assumption' : 'source', trust,
      review_status: pick(REVIEWS), match: pick(MATCH), confidence: pick(CONFIDENCE),
      slot: r() < 0.3 ? 'founded' : null, slot_value: String(2018 + Math.floor(r() * 3)), edited_from: owner && r() < 0.5 ? 'x' : null,
      owner_decision: r() < 0.25 ? pick(['confirmed', 'rejected', 'edited']) : null,
    };
  });
  const slotted = evidence.filter((e) => e.slot && e.review_status !== 'rejected');
  const conflicts = slotted.length >= 2 && r() < 0.6 ? [{ id: `c${seed}`, slot: 'founded', evidence_ids: slotted.map((e) => e.id), question: 'q', status: 'open' }] : [];
  const answers = FIELDS.filter(() => r() < 0.2).map((f) => ({ step: f.step, data: { [f.key]: 'answer' }, skipped: r() < 0.1 }));
  return { brand: { name: 'B', website: null }, sources: [{ id: 's1', url: 'https://b.example', title: null, status: 'read' }], runs: [], answers, evidence: evidence as never[], conflicts };
}

describe('properties over generated brands (PR #101 review)', () => {
  const CASES = 400;
  it('a section\'s state is always the aggregation of its questions\' states, and readiness comes from those states', () => {
    for (let seed = 1; seed <= CASES; seed++) {
      const s = brandCase(seed);
      const m = coverageMap(s);
      for (const sec of m.sections) {
        expect(sec.status, `seed ${seed} ${sec.section}`).toBe(aggregate(sec.fields.map((id) => m.fields.find((f) => f.id === id)!.status)));
      }
      const found = m.sections.filter((x) => x.status === 'found').length;
      const partly = m.sections.filter((x) => x.status === 'partly').length;
      expect(readData(s).coverage, `seed ${seed}`).toEqual({ found, partly, needsYou: 6 - found - partly, percent: Math.round((100 * (found + partly / 2)) / 6) });
    }
  });
  it('no card or voice item is ever a fact the review route would refuse, every card is undecided by the owner, and conflict sides are live facts on their conflict', () => {
    for (let seed = 1; seed <= CASES; seed++) {
      const s = brandCase(seed);
      const byId = new Map((s.evidence as CoverageFact[]).map((e) => [e.id, e]));
      const c = confirmData(s);
      const shown = [...c.facts, c.voice].map((f) => f.id).filter((id) => byId.has(id));
      for (const id of shown) expect(reviewable(byId.get(id)!), `seed ${seed} ${id}`).toBe(true);
      // The card queue holds only facts the owner has not decided.
      for (const f of c.facts) if (byId.has(f.id)) expect(byId.get(f.id)!.owner_decision ?? null, `seed ${seed} ${f.id}`).toBeNull();
      // Sides are decided through the conflict route (resolve_fact_conflict), which takes any live fact on the conflict.
      for (const x of c.conflicts) for (const side of x.sides) {
        expect(s.conflicts.find((k) => k.id === x.question.id)!.evidence_ids, `seed ${seed}`).toContain(side.id);
        expect(byId.get(side.id)!.review_status, `seed ${seed}`).not.toBe('rejected');
      }
      for (const f of readData(s).facts) if (byId.has(f.id)) expect(reviewable(byId.get(f.id)!), `seed ${seed} ${f.id}`).toBe(true);
    }
  });
  it('no question is both asked and carded, and the "every question is answered" summary matches the derived states (PR #101 review)', () => {
    for (let seed = 1; seed <= CASES; seed++) {
      const s = brandCase(seed);
      const m = coverageMap(s);
      const c = confirmData(s);
      const byId = new Map((s.evidence as CoverageFact[]).map((e) => [e.id, e]));
      const carded = c.facts.filter((f) => byId.has(f.id)).map((f) => byId.get(f.id)!);
      for (const q of m.questions.filter((x) => x.kind !== 'conflict')) {
        const spec = FIELDS.find((f) => f.id === q.field)!;
        expect(carded.filter((e) => (spec.answeredBy as readonly string[]).includes(e.section)).map((e) => e.id), `seed ${seed} ${q.field}`).toEqual([]);
      }
      for (const q of m.questions.filter((x) => x.kind === 'conflict')) for (const id of q.factIds) expect(carded.some((e) => e.id === id), `seed ${seed}`).toBe(false);
      const missingRequired = m.questions.filter((x) => x.kind === 'missing' && !x.optional).length;
      expect(c.missing.status === 'found', `seed ${seed}`).toBe(missingRequired === 0);
      expect(c.questionsLeft, `seed ${seed}`).toBe(m.questionsLeft);
    }
  });
  it('an assumption never stands in for a question: removing every assumption changes no question\'s state', () => {
    for (let seed = 1; seed <= CASES; seed++) {
      const s = brandCase(seed);
      const without = { ...s, evidence: (s.evidence as CoverageFact[]).filter((e) => e.trust !== 'assumption') as never[] };
      expect(coverageMap(s).fields.map((f) => [f.id, f.status, f.basis]), `seed ${seed}`).toEqual(coverageMap(without).fields.map((f) => [f.id, f.status, f.basis]));
    }
  });
});

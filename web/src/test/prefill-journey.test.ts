import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND, db, env, fakeDbResponse, fakeStep, seedTables, type Row } from './engine-harness';
import { ABOUT, HOME, NEWS, PAGES, PROPOSALS, ROBOTS, SITE, SUPPORT, TRUE_CLAIMS } from './prefill-fixtures';
import type { ConfirmData, GapsVoiceData, ReadData } from '../../worker/prefill/contract';

// The prefill module wired to the routes (issue #34). A brand's site is read by fact extraction's own run
// (POST /api/brands/:id/runs {kind: 'extract_facts'}, PR #91), the brand is read back with GET /api/brands/:id (the
// route PR #96 adds `coverage` to), and the module turns those rows into PR #75's shapes. Decisions run through
// api.ts reviewEvidence and, for edits, PR #96's editFact rule; conflicts through spec/db/011 resolve_fact_conflict.
// Supabase is the in-memory PostgREST in engine-harness.ts; pages and OpenRouter are stubbed fetches, so every model is
// mocked: extraction proposes the fixture facts and the support judge answers from hand labels (it throws on any
// claim without one).
const { handleApi, reviewEvidence } = await import('../../worker/api');
const { HttpError } = await import('../../worker/env');
const { runWorkflow } = await import('../../worker/engine/runner');
const { localDeps } = await import('../../worker/engine/executor');
const { db: rest } = await import('../../worker/db');
const { coverageMap } = await import('../../worker/prefill/coverage');
const { FIELDS } = await import('../../worker/prefill/fields');
const { readData, confirmData, gapsData, journeySources, sourceStatus } = await import('../../worker/prefill/journey');
const { decideFact, parseRecord, resolveConflict } = await import('../../worker/prefill/decide');
const { quoteOnPage, normalisePage } = await import('../../worker/quote');

function propose(user: string) {
  return JSON.stringify({ facts: PROPOSALS.filter((p) => user.includes(p.when)).map(({ when: _w, ...f }) => f) });
}
function judge(user: string) {
  const items = JSON.parse(user) as { id: string; claim: string }[];
  return JSON.stringify({ verdicts: items.map((i) => {
    if (!(i.claim in SUPPORT)) throw new Error(`no support label for "${i.claim}"`);
    return { id: i.id, supported: SUPPORT[i.claim] };
  }) });
}

beforeEach(async () => {
  await seedTables({ answers: [], kit_sections: [], gates: [], kits: [] });
  db.tables.brands[0].website = SITE;
  db.tables.brands[0].name = 'Tidewater';
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u', email: 'o@example.com' }));
    // A refused database function answers with PostgREST's error body and status (engine-harness.ts fakeDbResponse).
    if (url.startsWith('https://db.test')) return fakeDbResponse(url, init);
    if (url.endsWith('/robots.txt')) {
      const body = ROBOTS[new URL(url).origin];
      return body ? new Response(body, { headers: { 'content-type': 'text/plain' } }) : new Response('', { status: 404 });
    }
    if (url.startsWith('https://openrouter.ai')) {
      const body = JSON.parse(String(init!.body)) as { messages: { content: string }[]; models?: string[]; response_format?: { json_schema?: { name?: string } } };
      const schema = body.response_format?.json_schema?.name;
      const user = body.messages[1].content;
      const content = schema === 'extracted_facts' ? propose(user) : schema === 'support_verdicts' ? judge(user) : '{}';
      return new Response(JSON.stringify({ model: body.models?.[0] ?? `test/${schema}`, usage: { prompt_tokens: 10, completion_tokens: 5 }, choices: [{ message: { content } }] }));
    }
    const html = PAGES[url];
    return html ? new Response(html, { headers: { 'content-type': 'text/html' } }) : new Response('', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const envWith = {
  ...env,
  RUN_WORKFLOW: {
    async create(o: { id?: string }) { await runWorkflow(envWith, o.id!, fakeStep().api, localDeps); return { id: o.id! }; },
    async get() { return { status: async () => ({ status: 'complete' }) }; },
  },
};
const call = async (method: string, path: string, body?: unknown) => {
  const req = new Request(`https://jamjam.tech/api${path}`, { method, headers: { authorization: 'Bearer t', 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  try {
    const res = (await handleApi(req, envWith, new URL(req.url), { waitUntil: () => undefined }))!;
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: { error: e.message } as Record<string, unknown> };
    throw e;
  }
};
/** Reads a link with fact extraction's run (PR #91) and returns the finished run row. */
async function read(url: string) {
  const r = await call('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', url });
  expect(r.status).toBe(202);
  const run = db.tables.runs.find((x) => x.id === (r.body.run as Row).id)!;
  expect(run.status).toBe('done');
  return run;
}
type Ev = Row & { id: string; claim: string; quote: string; review_status: string; trust: string; source_id: string; quote_start: number; quote_end: number; section: string };
const evidence = () => db.tables.evidence as Ev[];
const byClaim = (c: string) => evidence().find((e) => e.claim === c)!;

/**
 * What the Journey routes have to hand: GET /api/brands/:id (brand, answers, sources, evidence; the route #96 adds
 * coverage to), plus the brand's open conflicts and its runs, the two reads INTEGRATION in the PR adds beside it.
 */
async function state() {
  const r = await call('GET', `/brands/${BRAND}`);
  expect(r.status).toBe(200);
  const s = r.body as { brand: { name: string; website: string | null }; answers: never[]; sources: never[]; evidence: never[] };
  const conflicts = await rest.select<never>(envWith, 'fact_conflicts', `${rest.eq('brand_id', BRAND)}&status=eq.open&select=id,slot,evidence_ids,question,status`);
  const runs = await rest.select<never>(envWith, 'runs', `${rest.eq('brand_id', BRAND)}&status=in.(running,paused)&select=status,progress,input`);
  return { brand: s.brand, answers: s.answers, sources: s.sources, evidence: s.evidence, conflicts, runs };
}

/** PR #96's editFact (web/worker/journey.ts on feat/journey-backend at the time of writing), the edit rule decideFact
 * keeps: the source fact is rejected; the owner's wording becomes an approved owner statement with no quote, linked by
 * edited_from. Copied here because #96 is not on this branch; INTEGRATION in the PR passes the real one. */
async function editFact(e: typeof envWith, brandId: string, id: string, claim: string) {
  const f = `${rest.eq('brand_id', brandId)}&${rest.eq('id', id)}`;
  const [row] = await rest.select<{ section: string; trust: string }>(e, 'evidence', f);
  if (!row) throw new HttpError(404, 'fact not found');
  if (row.trust === 'owner_answer') throw new HttpError(409, 'this fact is your own answer; change the answer instead');
  await rest.update(e, 'evidence', f, { review_status: 'rejected' });
  const [edited] = await rest.insert(e, 'evidence', { brand_id: brandId, source_id: null, section: row.section, claim: claim.trim().slice(0, 500), quote: null, edited_from: id, origin: 'owner_answer', trust: 'owner_answer', review_status: 'approved' });
  return { evidence: edited, replaced: id, stale: [] as string[] };
}
const ops = { review: reviewEvidence as never, edit: editFact as never };
const brand = { id: BRAND };
const user = { id: 'u' };

describe('the routes return #75\'s shapes when wired to the prefill module', () => {
  beforeEach(async () => { await read(SITE); });

  it('ReadData: sources with their state and fact counts, facts with quote and page, coverage', async () => {
    const r: ReadData = readData(await state());
    expect(r.site).toBe('tidewater.example');
    expect(r.sources).toEqual([{ id: db.tables.sources[0].id, label: 'tidewater.example', status: 'read', facts: evidence().length }]);
    const what = r.facts.find((f) => f.quote === HOME[0])!;
    expect(what).toMatchObject({ section: 'Positioning · Gate 2', status: 'found', statement: 'Tidewater helps small coffee roasters sell direct to cafes.', source: { label: 'tidewater.example · home page', url: `${SITE}/` } });
    expect(r.facts.find((f) => f.quote === ABOUT[0])!.source).toEqual({ label: 'tidewater.example · About Tidewater', url: `${SITE}/about` });
    // One site is one independent source: its exact facts are medium confidence, so each section is partly found
    // (§12.3 rule 1) until a second source or the owner backs it. Voice has no facts.
    expect(r.coverage).toEqual({ found: 0, partly: 5, needsYou: 1, percent: 42 });
  });

  it('gates from #34 on the fixture: >= 70% of question fields prefilled, every prefilled fact carries a checked quote, 0 invented facts', async () => {
    const s = await state();
    const m = coverageMap(s);
    expect(m.prefill.percent).toBeGreaterThanOrEqual(70);
    expect(m.prefill).toEqual({ fields: 10, prefilled: 8, percent: 80 });
    for (const f of m.fields.filter((x) => x.prefilled)) {
      expect(f.factIds.length).toBeGreaterThan(0);
      for (const id of f.factIds) {
        const e = evidence().find((x) => x.id === id)!;
        const text = (db.tables.sources.find((x) => x.id === e.source_id) as { source_text: string }).source_text;
        // The quote is the exact source text at its offsets, and passes the shared check.
        expect(text.slice(e.quote_start, e.quote_end)).toBe(e.quote);
        expect(quoteOnPage(normalisePage(text), e.quote)).toBe(true);
      }
    }
    // 0 invented facts: nothing stored or shown that the fixture's pages do not state and support.
    for (const e of evidence()) expect(TRUE_CLAIMS.has(e.claim)).toBe(true);
    expect(evidence().some((e) => /500 cafes|leading coffee marketplace/.test(e.claim))).toBe(false);
    for (const f of [...readData(s).facts, ...confirmData(s).facts]) {
      expect(TRUE_CLAIMS.has(f.statement)).toBe(true);
      expect(Object.values(PAGES).some((html) => html.includes(f.quote!))).toBe(true);
    }
  });

  it('ConfirmData: one card to confirm per kit section, the voice card, what is missing, and what is left', async () => {
    const c: ConfirmData = confirmData(await state());
    expect(c.facts.map((f) => f.section)).toEqual(['Origin story', 'Purpose · Gate 1', 'Positioning · Gate 2', 'Audience', 'Messaging']);
    expect(c.facts.every((f) => f.quote && f.source?.url)).toBe(true);
    expect(c.voice).toMatchObject({ id: 'voice', section: 'Voice · Gate 3', status: 'needs-you' });
    expect(c.readinessBase).toBe(42);
    // Asked: what people use instead (never inferred) and the voice pick.
    expect(c.missing).toMatchObject({ status: 'needs-you', note: '2 short questions next.' });
    expect(c.missing.statement).toContain('What do people use instead of you today?');
    expect(c.questionsLeft).toBe(2);
    expect(c.timeLeft).toBe('about 5 minutes');
    expect(c.deferredNote).toMatch(/11 kit sections/);
  });

  it('a proposed voice fact (an owned passage matched fuzzily) is the voice item, with the owner\'s accept / reject path (PR #101 review)', async () => {
    const src = db.tables.sources[0].id as string;
    const voiceFact = (id: string, claim: string) => ({ id, brand_id: BRAND, source_id: src, section: 'voice', claim, quote: HOME[4], origin: 'source', trust: 'owned', review_status: 'proposed', match: 'fuzzy', confidence: 'low' });
    db.tables.evidence.push(voiceFact('a1000000-0000-4000-8000-000000000001', 'Tidewater writes in short, plain phrases.'), voiceFact('a1000000-0000-4000-8000-000000000002', 'Tidewater pairs two short claims.'));
    let c = confirmData(await state());
    expect(c.voice).toMatchObject({ id: 'a1000000-0000-4000-8000-000000000001', section: 'Voice · Gate 3', status: 'partly', statement: 'Tidewater writes in short, plain phrases.', quote: HOME[4] });
    expect(c.voice.note).toMatch(/closest passage/);
    // The other proposed voice fact is an ordinary card, so it too can be decided.
    expect(c.facts.map((f) => f.id)).toContain('a1000000-0000-4000-8000-000000000002');
    // The voice item is decided through the same route as any card.
    await decideFact(envWith, user, brand, c.voice.id, { decision: 'rejected' }, ops);
    c = confirmData(await state());
    expect(c.voice.id).toBe('a1000000-0000-4000-8000-000000000002');
    expect(c.facts.some((f) => f.id === 'a1000000-0000-4000-8000-000000000002')).toBe(false);
    await decideFact(envWith, user, brand, c.voice.id, { decision: 'rejected' }, ops);
    // Only with no live voice fact left does the "nothing says how you sound" item appear.
    expect(confirmData(await state()).voice).toMatchObject({ id: 'voice', status: 'needs-you' });
  });

  it('a proposed third-party fact gives one card and no missing question for what it answers (PR #101 review)', async () => {
    await decideFact(envWith, user, brand, byClaim('Tidewater is built for independent roasters with fewer than ten staff.').id, { decision: 'rejected' }, ops);
    db.tables.evidence.push({ id: 'a2000000-0000-4000-8000-000000000001', brand_id: BRAND, source_id: db.tables.sources[0].id, section: 'audience', claim: 'Tidewater is for small-batch roasters.', quote: 'Note 1 on roasting', origin: 'source', trust: 'third_party', review_status: 'proposed', match: 'exact', confidence: 'medium' });
    const s = await state();
    const c = confirmData(s);
    expect(c.facts.filter((f) => f.id === 'a2000000-0000-4000-8000-000000000001')).toHaveLength(1);
    expect(c.missing.statement).not.toContain('Whose opinion matters most?');
    expect(coverageMap(s).fields.find((f) => f.id === 'audience.who')).toMatchObject({ status: 'partly', basis: 'pending confirmation' });
  });

  it('ConfirmData and the coverage map agree on every question', async () => {
    // The fixture brand, with a disagreement and a fact waiting for review added.
    await read('https://news.example/tidewater');
    // The audience question's only evidence becomes a fact waiting for review.
    await decideFact(envWith, user, brand, byClaim('Tidewater is built for independent roasters with fewer than ten staff.').id, { decision: 'rejected' }, ops);
    db.tables.evidence.push({ id: 'a2000000-0000-4000-8000-000000000002', brand_id: BRAND, source_id: db.tables.sources[0].id, section: 'audience', claim: 'Tidewater wants roasters to keep their margin.', quote: 'Note 2 on roasting', origin: 'source', trust: 'third_party', review_status: 'proposed', match: 'exact', confidence: 'medium' });
    const s = await state();
    const m = coverageMap(s);
    const c = confirmData(s);
    const shown = new Set([...c.facts.map((f) => f.id), c.voice.id]);
    const sides = new Set(c.conflicts.flatMap((x) => x.sides.map((y) => y.id)));
    const byId = new Map(evidence().map((e) => [e.id, e]));
    const asked = new Set(m.questions.filter((q) => q.kind === 'missing').map((q) => q.field));
    for (const f of m.fields.filter((x) => x.id !== 'voice.template')) {
      // Pending a card: one of its facts is on a card. Pending a conflict: its facts are sides. Missing: in the
      // missing card, and no card holds a fact that answers it.
      if (f.basis === 'pending confirmation' || f.basis === 'evidence') expect(f.factIds.some((id) => shown.has(id))).toBe(true);
      if (f.basis === 'pending conflict') expect(f.conflictIds.length).toBeGreaterThan(0);
      const answering = [...shown, ...sides].filter((id) => byId.has(id) && (FIELDS.find((x) => x.id === f.id)!.answeredBy as readonly string[]).includes(byId.get(id)!.section));
      if (asked.has(f.id)) {
        expect(answering).toEqual([]);
        if (!f.optional) expect(c.missing.statement).toContain(f.question);
      }
    }
    // Every card is a fact some question or section counts.
    for (const id of shown) if (byId.has(id)) expect(m.sections.find((x) => x.section === byId.get(id)!.section)!.facts).toBeGreaterThan(0);
    expect(c.questionsLeft).toBe(m.questionsLeft);
  });

  it('the gaps: J4\'s questions for the brand, with the ranked list', async () => {
    const g: Omit<GapsVoiceData, 'voice'> = gapsData(await state(), '2026-10-13');
    expect(g).toMatchObject({ brandName: 'Tidewater', edgeQuestion: 'What can only you do?', originQuestion: 'Why does it exist?', originNote: 'Saved as evidence: "owner answer, 2026-10-13".' });
    expect(g.alternatives).toEqual({ question: 'What do people use instead of Tidewater today?', hint: 'Name what people use instead today, or add your own.', options: [], source: 'Source: your own answer.' });
    expect(gapsData(await state(), '2026-10-13').questions.map((q) => q.id)).toEqual(['alternatives.instead', 'audience.real_people', 'voice.template']);
  });

  it('an answer raises coverage: the owner\'s answers make their sections found and finish their steps', async () => {
    await call('PUT', `/brands/${BRAND}/answers/origin`, { data: { why: 'a', broken: 'b', first_win: 'c' } });
    const m = coverageMap(await state());
    expect(m.sections.find((s) => s.section === 'origin')).toMatchObject({ status: 'found', basis: 'owner answer' });
    expect(m.steps.find((s) => s.step === 'origin')!.mode).toBe('done');
    expect(readData(await state()).coverage.percent).toBe(50);
  });
});

describe('the owner decides each fact (FactRecord) through the review path', () => {
  beforeEach(async () => { await read(SITE); });

  it('parses exactly the FactRecord shapes', () => {
    expect(parseRecord({ decision: 'accepted' })).toEqual({ decision: 'accepted' });
    expect(parseRecord({ decision: 'edited', edit: '  New wording. ' })).toEqual({ decision: 'edited', edit: 'New wording.' });
    expect(() => parseRecord({ decision: 'edited', edit: ' ' })).toThrow(/new wording/);
    expect(() => parseRecord({ decision: 'edited', edit: 'x'.repeat(501) })).toThrow(/under 500/);
    expect(() => parseRecord({ decision: 'maybe' })).toThrow(/accepted, edited or rejected/);
    expect(() => parseRecord({ review_status: 'approved' })).toThrow();
    expect(parseRecord({ decision: 'edited', edit: 'Founded in 2018.', value: ' 2018 ' })).toEqual({ decision: 'edited', edit: 'Founded in 2018.', value: '2018' });
    expect(() => parseRecord({ decision: 'edited', edit: 'x', value: 'y'.repeat(121) })).toThrow(/under 120/);
  });
  it('accepted: approved through reviewEvidence', async () => {
    const e = byClaim('Tidewater helps small coffee roasters sell direct to cafes.');
    e.review_status = 'proposed';
    await decideFact(envWith, user, brand, e.id, { decision: 'accepted' }, ops);
    expect(byClaim(e.claim).review_status).toBe('approved');
  });
  it('edited: #96\'s rule; the source fact is rejected and the owner\'s wording is an approved owner statement, which evidences its section', async () => {
    const e = byClaim('Tidewater helps small coffee roasters sell direct to cafes.');
    const out = await decideFact(envWith, user, brand, e.id, { decision: 'edited', edit: 'Tidewater lets roasters sell to cafes with no broker.' }, ops) as unknown as { replaced: string };
    expect(out.replaced).toBe(e.id);
    expect(byClaim(e.claim).review_status).toBe('rejected');
    expect(byClaim('Tidewater lets roasters sell to cafes with no broker.')).toMatchObject({ trust: 'owner_answer', review_status: 'approved', section: 'positioning', edited_from: e.id });
    expect(coverageMap(await state()).sections.find((s) => s.section === 'positioning')).toMatchObject({ status: 'found', basis: 'owner answer' });
  });
  it('rejected: rejected, and the card leaves the confirm list', async () => {
    const e = byClaim('Tidewater is built for independent roasters with fewer than ten staff.');
    await decideFact(envWith, user, brand, e.id, { decision: 'rejected' }, ops);
    expect(byClaim(e.claim).review_status).toBe('rejected');
    const c = confirmData(await state());
    expect(c.facts.some((f) => f.id === e.id)).toBe(false);
    // Nothing else answers the audience question now, so it is asked.
    expect(c.missing.statement).toContain('Whose opinion matters most?');
  });
});

describe('conflicts (B3a) reach the owner with both quotes, and the owner resolves them', () => {
  beforeEach(async () => {
    await read(SITE);
    await read('https://news.example/tidewater');
  });
  const site2019 = () => byClaim('Tidewater was founded in 2019.');
  const news2020 = () => byClaim('Tidewater was founded in 2020.');
  const cid = () => db.tables.fact_conflicts[0].id as string;

  it('ConfirmData carries each conflict as its question and every side with its own quote and page', async () => {
    expect(db.tables.fact_conflicts).toHaveLength(1);
    const c = confirmData(await state());
    expect(c.conflicts).toHaveLength(1);
    expect(c.conflicts[0].question).toMatchObject({ id: cid(), status: 'needs-you', section: 'Origin story' });
    expect(c.conflicts[0].sides.map((s) => [s.quote, s.status]).sort()).toEqual([[ABOUT[3], 'needs-you'], ['Tidewater, founded in 2020', 'needs-you']]);
    expect(NEWS).toContain('Tidewater, founded in 2020');
    // Disputed facts are not ordinary cards, and the conflict is a ranked question that blocks kit v1.
    expect(c.facts.some((f) => f.id === site2019().id || f.id === news2020().id)).toBe(false);
    const q = coverageMap(await state()).questions.find((x) => x.kind === 'conflict')!;
    expect(q.sides!.map((s) => s.value).sort()).toEqual(['2019', '2020']);
  });
  it('the owner resolves it through POST /api/brands/:id/conflicts/:cid/resolve', async () => {
    expect((await call('POST', `/brands/${BRAND}/conflicts/${cid()}/resolve`, {})).status).toBe(400);
    expect((await call('POST', `/brands/${BRAND}/conflicts/${cid()}/resolve`, { keep: 'not-an-id' })).status).toBe(400);
    expect((await call('POST', `/brands/${BRAND}/conflicts/not-an-id/resolve`, { keep: null })).status).toBe(404);
    // A drafted section citing the side that loses must be redrafted before the next kit.
    db.tables.kit_sections.push({ brand_id: BRAND, section: 'origin', citations: [site2019().id] }, { brand_id: BRAND, section: 'purpose', citations: [news2020().id] });
    const r = await call('POST', `/brands/${BRAND}/conflicts/${cid()}/resolve`, { keep: news2020().id });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ conflict: cid(), kept: [news2020().id], rejected: [site2019().id], stale: ['origin'] });
    expect([news2020().review_status, site2019().review_status]).toEqual(['approved', 'rejected']);
    expect(db.tables.fact_conflicts[0]).toMatchObject({ status: 'resolved', resolved_by: 'u' });
    expect(confirmData(await state()).conflicts).toEqual([]);
  });
  it('the owner\'s own answer through the route: every side rejected and the answer saved, in one call', async () => {
    expect((await call('POST', `/brands/${BRAND}/conflicts/${cid()}/resolve`, { answer: { claim: 'Founded in 2018.', value: '' } })).status).toBe(400);
    const r = await call('POST', `/brands/${BRAND}/conflicts/${cid()}/resolve`, { answer: { claim: 'Tidewater was founded in 2018.', value: '2018' } });
    expect(r.status).toBe(200);
    expect([site2019().review_status, news2020().review_status]).toEqual(['rejected', 'rejected']);
    expect(evidence().find((e) => e.id === r.body.answer)).toMatchObject({ claim: 'Tidewater was founded in 2018.', trust: 'owner_answer', review_status: 'approved', slot: 'founded', slot_value: '2018' });
  });
  it('two tabs resolving at once: the second gets the database\'s 409, and nothing changes (PR #101 review)', async () => {
    await resolveConflict(envWith, user, brand, cid(), { keep: site2019().id });
    const before = JSON.stringify(evidence());
    const r = await call('POST', `/brands/${BRAND}/conflicts/${cid()}/resolve`, { keep: news2020().id });
    expect(r.status).toBe(409);
    expect(JSON.stringify(evidence())).toBe(before);
    await expect(resolveConflict(envWith, user, brand, '00000000-0000-4000-8000-999999999999', { keep: null })).rejects.toMatchObject({ status: 404 });
  });
  it('a kept fact deleted in another tab is refused with 409, never turned into rejecting every side (PR #101 review)', async () => {
    const gone = news2020().id;
    // The row disappears while its id is still listed on the conflict (as a delete racing the owner's pick would leave it).
    db.tables.evidence = db.tables.evidence.filter((e) => e.id !== gone);
    await expect(resolveConflict(envWith, user, brand, cid(), { keep: gone })).rejects.toMatchObject({ status: 409 });
    expect(site2019().review_status).toBe('proposed');
    expect(db.tables.fact_conflicts[0].status).toBe('open');
  });
  it('keep must be a fact on the conflict; keep null rejects every side', async () => {
    await expect(resolveConflict(envWith, user, brand, cid(), { keep: byClaim('Tidewater says "Fresh roast, fair price."').id })).rejects.toMatchObject({ status: 400 });
    await resolveConflict(envWith, user, brand, cid(), { keep: null });
    expect([site2019().review_status, news2020().review_status]).toEqual(['rejected', 'rejected']);
  });
  it('accepting a disputed card resolves the conflict for its side', async () => {
    await decideFact(envWith, user, brand, news2020().id, { decision: 'accepted' }, ops);
    expect([news2020().review_status, site2019().review_status]).toEqual(['approved', 'rejected']);
    expect(db.tables.fact_conflicts[0].status).toBe('resolved');
  });
  it('editing a disputed card is one call: every side rejected and the wording saved with its value, linked to the fact (PR #101 review)', async () => {
    await expect(decideFact(envWith, user, brand, site2019().id, { decision: 'edited', edit: 'Tidewater was founded in 2018.' }, ops)).rejects.toMatchObject({ status: 400 });
    // Refused by the database (a value over its limit reaches it only through this stub, so the check is its own):
    // nothing changes, and the conflict is still there to answer.
    await expect(decideFact(envWith, user, brand, site2019().id, { decision: 'edited', edit: 'Tidewater was founded in 2018.', value: 'x'.repeat(121) }, ops)).rejects.toMatchObject({ status: 400 });
    expect([site2019().review_status, news2020().review_status, db.tables.fact_conflicts[0].status]).toEqual(['proposed', 'proposed', 'open']);
    const out = await decideFact(envWith, user, brand, site2019().id, { decision: 'edited', edit: 'Tidewater was founded in 2018.', value: '2018' }, ops) as unknown as { evidence: { id: string }; replaced: string };
    expect(out.replaced).toBe(site2019().id);
    expect([news2020().review_status, site2019().review_status]).toEqual(['rejected', 'rejected']);
    expect(evidence().find((e) => e.id === out.evidence.id)).toMatchObject({ trust: 'owner_answer', review_status: 'approved', slot_value: '2018', edited_from: site2019().id });
    expect(db.tables.fact_conflicts[0].status).toBe('resolved');
  });
  it('rejecting the sole fact on one side dissolves the conflict: no conflict question remains (PR #101 review)', async () => {
    await call('PATCH', `/brands/${BRAND}/evidence/${news2020().id}`, { review_status: 'rejected' });
    expect(db.tables.fact_conflicts[0].status).toBe('dissolved');
    const s = await state();
    expect(coverageMap(s).questions.some((q) => q.kind === 'conflict')).toBe(false);
    expect(confirmData(s).conflicts).toEqual([]);
    // The surviving fact is an ordinary fact again, back to the review it started with.
    expect(site2019().review_status).toBe('approved');
  });
});

describe('source progress (J1 source list)', () => {
  it('maps source rows and their runs to SourceStatus: read, reading, queued (with why), blocked (with the reason)', () => {
    const rows = journeySources({
      evidence: [],
      sources: [
        { id: 'a', url: 'https://acme.example', title: null, status: 'pending', error: null },
        { id: 'b', url: 'https://acme.example/blog', title: null, status: 'pending', error: null },
        { id: 'c', url: 'https://docs.example.com', title: null, status: 'failed', error: 'its robots.txt says no' },
        { id: 'd', url: null, title: 'Pasted notes', status: 'read', error: null },
        { id: 'e', url: 'https://acme.example/about', title: null, status: 'pending', error: null },
      ],
      runs: [{ status: 'running', input: { sourceId: 'a' } }, { status: 'paused', progress: { message: 'Waiting until 00:00 UTC.' }, input: { sourceId: 'b' } }],
    });
    expect(rows).toEqual([
      { id: 'a', label: 'acme.example', status: 'reading' },
      { id: 'b', label: 'acme.example · /blog', status: 'queued', reason: 'Waiting until 00:00 UTC.' },
      { id: 'c', label: 'docs.example.com', status: 'blocked', reason: 'its robots.txt says no' },
      { id: 'd', label: 'Pasted notes', status: 'read', facts: 0 },
      { id: 'e', label: 'acme.example · /about', status: 'queued' },
    ]);
    expect(sourceStatus({ id: 'x', url: null, title: null, status: 'failed', error: null })).toEqual({ status: 'blocked', reason: 'it could not be read' });
  });
});

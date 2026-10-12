import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND, db, env, fakeDb, fakeStep, seedTables, type Row } from './engine-harness';
import { ABOUT, HOME, NEWS, PAGES, PROPOSALS, ROBOTS, ROUTES, SITE, SUPPORT, TRUE_CLAIMS } from './prefill-fixtures';

// Prefill and the coverage map end to end (issue #34): POST /journey/read runs read_brand on the engine (#32) through
// the source adapters (#33) and fact extraction (#64), then the Journey endpoints serve ReadData, ConfirmData and the
// gaps, and the owner's decisions go through the evidence review path (ADR-011). Supabase is the in-memory PostgREST
// in engine-harness.ts; pages and OpenRouter are stubbed fetches, so every model is mocked: extraction proposes the
// fixture facts, the support judge and the router answer from hand labels and throw on anything unlabelled.
const { handleApi } = await import('../../worker/api');
const { HttpError } = await import('../../worker/env');
const { runWorkflow } = await import('../../worker/engine/runner');
const { localDeps } = await import('../../worker/engine/executor');
const { READ_BRAND, ROUTE_FACTS_PROMPT, SEEDED_BY } = await import('../../worker/engine/seed');
const { journeySources } = await import('../../worker/prefill/journey');
const { quoteChecks } = await import('../../worker/prefill/route');

type Call = { schema?: string; user: string; system: string };
let calls: Call[] = [];
let routeReply: ((user: string) => string) | null = null;

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
function route(user: string) {
  const items = JSON.parse(user) as { id: string; claim: string }[];
  return JSON.stringify({ routes: items.map((i) => {
    if (!(i.claim in ROUTES)) throw new Error(`no route label for "${i.claim}"`);
    return { id: i.id, field: ROUTES[i.claim] };
  }) });
}

beforeEach(async () => {
  await seedTables({ answers: [], kit_sections: [], gates: [] });
  db.tables.brands[0].website = SITE;
  db.tables.brands[0].name = 'Tidewater';
  calls = [];
  routeReply = null;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u', email: 'o@example.com' }));
    if (url.startsWith('https://db.test')) return new Response(JSON.stringify(fakeDb(url, init)));
    if (url.endsWith('/robots.txt')) {
      const body = ROBOTS[new URL(url).origin];
      return body ? new Response(body, { headers: { 'content-type': 'text/plain' } }) : new Response('', { status: 404 });
    }
    if (url.startsWith('https://openrouter.ai')) {
      const body = JSON.parse(String(init!.body)) as { messages: { content: string }[]; response_format?: { json_schema?: { name?: string } } };
      const schema = body.response_format?.json_schema?.name;
      const [system, user] = body.messages.map((m) => m.content);
      calls.push({ schema, user, system });
      const content = schema === 'extracted_facts' ? propose(user)
        : schema === 'support_verdicts' ? judge(user)
          : schema === 'fact_fields' ? (routeReply ?? route)(user)
            : system.startsWith('You draft one section') ? JSON.stringify({ body: `Draft: ${/Section: (.+)/.exec(user)![1]}.`, citations: [] })
              : '{}';
      return new Response(JSON.stringify({ model: `test/${schema ?? 'draft'}`, usage: { prompt_tokens: 10, completion_tokens: 5 }, choices: [{ message: { content } }] }));
    }
    const html = PAGES[url];
    return html ? new Response(html, { headers: { 'content-type': 'text/html' } }) : new Response('', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

let step = fakeStep();
const envWith = {
  ...env,
  RUN_WORKFLOW: {
    async create(o: { id?: string }) { await runWorkflow(envWith, o.id!, step.api, localDeps); return { id: o.id! }; },
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
type RunOut = Row & { status: string; output: Record<string, unknown>; error: string | null };
/** Starts read_brand (on the website, or `url`) and returns the finished run row. */
async function read(url?: string) {
  step = fakeStep();
  const r = await call('POST', `/brands/${BRAND}/journey/read`, url ? { url } : {});
  expect(r.status).toBe(202);
  return db.tables.runs.find((x) => x.id === (r.body.run as Row).id) as RunOut;
}
type Ev = Row & { id: string; claim: string; quote: string; review_status: string; trust: string; field: string | null; decision: string | null; source_id: string; quote_start: number; quote_end: number; slot: string | null; slot_value: string | null };
const evidence = () => db.tables.evidence as Ev[];
const byClaim = (c: string) => evidence().find((e) => e.claim === c)!;
const sourceText = (id: string) => (db.tables.sources.find((s) => s.id === id) as { source_text: string }).source_text;
const get = async <T>(path: string) => { const r = await call('GET', `/brands/${BRAND}${path}`); expect(r.status).toBe(200); return r.body as unknown as T; };

interface Fact { id: string; section: string; status: string; statement: string; quote?: string; source?: { label: string; url?: string }; note?: string }
interface Read { site: string; sources: { id: string; label: string; status: string; facts?: number; reason?: string }[]; facts: Fact[]; coverage: { found: number; partly: number; needsYou: number; percent: number } }
interface Confirm { facts: Fact[]; voice: Fact; missing: Fact; readinessBase: number; questionsLeft: number; timeLeft: string; deferredNote: string }
interface Coverage { fields: { id: string; status: string; prefilled: boolean; factIds: string[]; confirmed: boolean; best?: Fact }[]; steps: { step: string; mode: string }[]; prefill: { fields: number; prefilled: number; percent: number }; questions: { id: string; kind: string; sides?: { value: string; ids: string[] }[]; conflictId?: string }[] }

describe('read_brand is data (spec/db/012)', () => {
  const sql = readFileSync(resolvePath(process.cwd(), '../spec/db/012_prefill_coverage.sql'), 'utf8');
  it('migration 012 seeds exactly the read_brand definition and the routing prompt in seed.ts', () => {
    expect(JSON.parse(/\$spec\$([\s\S]*?)\$spec\$/.exec(sql)![1])).toEqual(READ_BRAND);
    expect(/\$p1\$([\s\S]*?)\$p1\$/.exec(sql)![1]).toBe(ROUTE_FACTS_PROMPT);
    expect(sql).toMatch(/\('prefill\.route_facts', 1, \$p1\$/);
    expect(SEEDED_BY['012_prefill_coverage.sql'].defs).toEqual([READ_BRAND]);
  });
  it('reuses fact extraction\'s steps unchanged, then routes, drafts, and closes only an unread source on failure', () => {
    const extract = SEEDED_BY['011_fact_extraction.sql'].defs[0];
    expect(READ_BRAND.steps.slice(0, extract.steps.length)).toEqual(extract.steps);
    expect(READ_BRAND.steps.slice(extract.steps.length).map((s) => s.id)).toEqual(['pages', 'route_input', 'route', 'route_save', 'prefill']);
    expect(READ_BRAND.onFailure).toEqual({ op: 'close_pending_source', args: { sourceId: '$input.sourceId' } });
  });
  it('refuses to start, before writing any row, on a database without migration 012', async () => {
    db.tables.workflow_defs = db.tables.workflow_defs.filter((d) => d.id !== 'read_brand');
    const r = await call('POST', `/brands/${BRAND}/journey/read`, {});
    expect(r.status).toBe(503);
    expect(r.body.error).toMatch(/migration/);
    expect(db.tables.sources).toHaveLength(0);
    expect(db.tables.runs).toHaveLength(0);
  });
  it('needs a website or a link to read', async () => {
    db.tables.brands[0].website = null;
    expect((await call('POST', `/brands/${BRAND}/journey/read`, {})).status).toBe(400);
  });
});

describe('read my brand: one run from the site to a prefilled interview', () => {
  it('reads the site, extracts and checks facts, routes them to questions and drafts the gated sections it supports', async () => {
    const run = await read();
    expect(run.error ?? null).toBeNull();
    expect(run.status).toBe('done');
    // The model saw only claims and kit sections when routing, never quotes or evidence ids.
    const routing = calls.filter((c) => c.schema === 'fact_fields');
    expect(routing.length).toBeGreaterThan(0);
    for (const c of routing) {
      for (const item of JSON.parse(c.user) as Record<string, unknown>[]) expect(Object.keys(item).sort()).toEqual(['claim', 'id', 'section']);
      for (const e of evidence()) expect(c.user).not.toContain(e.id);
    }
    // Every routed fact went where its label says.
    for (const e of evidence()) expect(e.field).toBe(ROUTES[e.claim]);
    expect(run.output).toMatchObject({ drafted: ['purpose', 'positioning'], prefill: { fields: 10, prefilled: 9, percent: 90 } });
    // Drafts exist; the gates still need a person.
    expect((db.tables.kit_sections as Row[]).map((s) => s.section).sort()).toEqual(['positioning', 'purpose']);
    expect(db.tables.gates).toHaveLength(0);
  });

  it('gates from #34 on the fixture: >= 70% of question fields prefilled, every prefilled fact carries a checked quote, 0 invented facts', async () => {
    await read();
    const cov = await get<Coverage>('/coverage');
    expect(cov.prefill.percent).toBeGreaterThanOrEqual(70);
    const prefilled = cov.fields.filter((f) => f.prefilled);
    expect(prefilled.length).toBe(cov.prefill.prefilled);
    for (const f of prefilled) {
      expect(f.factIds.length).toBeGreaterThan(0);
      for (const id of f.factIds) {
        const e = evidence().find((x) => x.id === id)!;
        // The quote is the exact source text at its offsets, and passes the shared check.
        expect(sourceText(e.source_id).slice(e.quote_start, e.quote_end)).toBe(e.quote);
        expect(quoteChecks(e, sourceText(e.source_id))).toBe(true);
      }
      expect(f.best!.quote).toBeTruthy();
    }
    // 0 invented facts: nothing stored or shown that the fixture's pages do not support.
    for (const e of evidence()) expect(TRUE_CLAIMS.has(e.claim)).toBe(true);
    expect(evidence().some((e) => /500 cafes|leading coffee marketplace/.test(e.claim))).toBe(false);
    const shown = [...(await get<Read>('/journey/read')).facts, ...(await get<Confirm>('/journey/confirm')).facts];
    for (const f of shown) {
      expect(TRUE_CLAIMS.has(f.statement)).toBe(true);
      expect(Object.values(PAGES).some((html) => html.includes(f.quote!))).toBe(true);
    }
  });

  it('serves ReadData: each page read with the facts found on it, facts with quote and page, and coverage', async () => {
    await read();
    const r = await get<Read>('/journey/read');
    expect(r.site).toBe('tidewater.example');
    const src = db.tables.sources[0].id as string;
    expect(r.sources).toEqual([
      { id: `${src}:0`, label: 'tidewater.example', status: 'read', facts: 5 },
      { id: `${src}:1`, label: '/about', status: 'read', facts: 5 },
      { id: `${src}:2`, label: '/how-it-works', status: 'read', facts: 1 },
    ]);
    // /private is linked but disallowed by robots.txt: never requested.
    expect((fetch as unknown as { mock: { calls: [string][] } }).mock.calls.some(([u]) => u === `${SITE}/private`)).toBe(false);
    const what = r.facts.find((f) => f.statement === 'Tidewater helps small coffee roasters sell direct to cafes.')!;
    expect(what).toMatchObject({ section: 'Positioning · Gate 2', status: 'partly', quote: HOME[0], source: { label: 'tidewater.example · home page', url: `${SITE}/` } });
    const why = r.facts.find((f) => f.quote === ABOUT[0])!;
    expect(why.source).toEqual({ label: 'tidewater.example · About Tidewater', url: `${SITE}/about` });
    // One site is one independent source, so its facts are partly found (§12.3 rule 1) until the owner confirms them.
    expect(r.coverage).toEqual({ found: 0, partly: 6, needsYou: 0, percent: 50 });
  });

  it('serves ConfirmData: undecided cards with quotes, the voice card, what is missing and what is left', async () => {
    await read();
    const c = await get<Confirm>('/journey/confirm');
    expect(c.facts.length).toBeGreaterThanOrEqual(9);
    expect(c.facts.every((f) => f.quote && f.source?.url)).toBe(true);
    expect(c.voice).toMatchObject({ id: 'voice', section: 'Voice · Gate 3', status: 'partly' });
    expect(c.readinessBase).toBe(50);
    // Only the optional "real people" question is open, and it does not block kit v1.
    expect(c.questionsLeft).toBe(0);
    expect(c.timeLeft).toBe('no questions left');
    expect(c.missing.status).toBe('found');
    expect(c.deferredNote).toMatch(/11 kit sections/);
  });

  it('a step whose questions are all prefilled becomes "confirm"; accepting its cards finishes it and raises readiness', async () => {
    await read();
    let cov = await get<Coverage>('/coverage');
    expect(cov.steps.find((s) => s.step === 'origin')!.mode).toBe('confirm');
    for (const claim of ['Tidewater started because roasters lost a third of their margin to middlemen.', 'Before Tidewater, cafes waited two weeks for fresh beans.', 'Harbour Lane, the first cafe customer, switched in its first month.']) {
      const r = await call('PATCH', `/brands/${BRAND}/evidence/${byClaim(claim).id}`, { decision: 'accepted' });
      expect(r.status).toBe(200);
    }
    cov = await get<Coverage>('/coverage');
    expect(cov.steps.find((s) => s.step === 'origin')!.mode).toBe('done');
    expect(cov.fields.find((f) => f.id === 'origin.why')).toMatchObject({ status: 'found', confirmed: true });
    const r = await get<Read>('/journey/read');
    expect(r.coverage).toEqual({ found: 1, partly: 5, needsYou: 0, percent: 58 });
    // Decided cards leave the confirm list.
    const c = await get<Confirm>('/journey/confirm');
    expect(c.facts.some((f) => f.quote === ABOUT[0])).toBe(false);
  });

  it('a second read keeps the owner\'s drafts and routes only facts not yet sorted', async () => {
    await read();
    (db.tables.kit_sections as Row[]).forEach((s) => { s.body = 'Owner edit.'; });
    const first = new Map(evidence().map((e) => [e.id, e.field]));
    const before = calls.length;
    const again = await read();
    expect(again.status).toBe('done');
    expect(again.output).toMatchObject({ drafted: [], notDrafted: [{ section: 'purpose', reason: 'already drafted' }, { section: 'positioning', reason: 'already drafted' }] });
    expect((db.tables.kit_sections as Row[]).every((s) => s.body === 'Owner edit.')).toBe(true);
    // Only the second read's own facts were sent for routing; the first read's routes are untouched.
    const sent = calls.slice(before).filter((c) => c.schema === 'fact_fields').flatMap((c) => JSON.parse(c.user) as unknown[]);
    const second = db.tables.sources[1].id;
    expect(sent).toHaveLength(evidence().filter((e) => e.source_id === second).length);
    for (const [id, field] of first) expect(evidence().find((e) => e.id === id)!.field).toBe(field);
    // The list shows the newest read of the link once.
    expect((await get<Read>('/journey/read')).sources.map((s) => s.label)).toEqual(['tidewater.example', '/about', '/how-it-works']);
  });

  it('a routing failure fails the run but leaves the source it already read as read', async () => {
    routeReply = () => JSON.stringify({ routes: 'not a list' });
    const run = await read();
    expect(run.status).toBe('failed');
    expect(db.tables.sources[0]).toMatchObject({ status: 'read' });
    expect(evidence().every((e) => e.field == null)).toBe(true);
  });
});

describe('the owner decides each fact (FactRecord) through the evidence review path', () => {
  beforeEach(async () => { await read(); });

  it('accepted: approved, and who decided and when is recorded', async () => {
    const e = byClaim('Tidewater helps small coffee roasters sell direct to cafes.');
    const r = await call('PATCH', `/brands/${BRAND}/evidence/${e.id}`, { decision: 'accepted' });
    expect(r.status).toBe(200);
    expect(byClaim(e.claim)).toMatchObject({ review_status: 'approved', decision: 'accepted', decided_by: 'u' });
    expect(typeof byClaim(e.claim).decided_at).toBe('string');
  });
  it('edited: the new wording becomes the owner\'s answer to that question, and the old fact is rejected', async () => {
    const e = byClaim('Roasters sell through brokers and spreadsheets today.');
    db.tables.answers.push({ brand_id: BRAND, step: 'alternatives', data: { edge: 'Same-day roasts.' }, skipped: false });
    const r = await call('PATCH', `/brands/${BRAND}/evidence/${e.id}`, { decision: 'edited', edit: 'Brokers, spreadsheets and phone orders.' });
    expect(r.status).toBe(200);
    // The other answers of the step are kept.
    expect(db.tables.answers.find((a) => a.step === 'alternatives')!.data).toEqual({ edge: 'Same-day roasts.', instead: 'Brokers, spreadsheets and phone orders.' });
    expect(evidence().some((x) => x.origin === 'owner_answer' && x.claim === 'instead: Brokers, spreadsheets and phone orders.')).toBe(true);
    expect(byClaim(e.claim)).toMatchObject({ review_status: 'rejected', decision: 'edited' });
    const cov = await get<Coverage>('/coverage');
    expect(cov.fields.find((f) => f.id === 'alternatives.instead')).toMatchObject({ status: 'found', confirmed: true, prefilled: false });
  });
  it('rejected: rejected, and the question it filled is asked again', async () => {
    const e = byClaim('Tidewater is built for independent roasters with fewer than ten staff.');
    expect((await call('PATCH', `/brands/${BRAND}/evidence/${e.id}`, { decision: 'rejected' })).status).toBe(200);
    expect(byClaim(e.claim)).toMatchObject({ review_status: 'rejected', decision: 'rejected' });
    const c = await get<Confirm>('/journey/confirm');
    expect(c.questionsLeft).toBe(1);
    expect(c.missing).toMatchObject({ status: 'needs-you', note: '1 short question next.' });
    expect(c.missing.statement).toContain('Whose opinion matters most?');
  });
  it('refuses a bad record, an edit of a fact that answers no question, and an owner answer; the ADR-011 body still works', async () => {
    const e = byClaim('Tidewater helps small coffee roasters sell direct to cafes.');
    expect((await call('PATCH', `/brands/${BRAND}/evidence/${e.id}`, { decision: 'maybe' })).status).toBe(400);
    expect((await call('PATCH', `/brands/${BRAND}/evidence/${e.id}`, { decision: 'edited', edit: ' ' })).status).toBe(400);
    const none = byClaim('Tidewater says "Fresh roast, fair price."');
    expect((await call('PATCH', `/brands/${BRAND}/evidence/${none.id}`, { decision: 'edited', edit: 'x' })).status).toBe(409);
    expect(none.review_status).toBe('approved');
    expect((await call('PATCH', `/brands/${BRAND}/evidence/${e.id}`, { review_status: 'rejected' })).status).toBe(200);
    expect(byClaim(e.claim).review_status).toBe('rejected');
    expect(byClaim(e.claim).decision ?? null).toBeNull();
  });
});

describe('conflicts (B3a) reach the owner and are resolved by the owner', () => {
  beforeEach(async () => {
    await read();
    await read('https://news.example/tidewater');
  });
  const site2019 = () => byClaim('Tidewater was founded in 2019.');
  const news2020 = () => byClaim('Tidewater was founded in 2020.');

  it('a contradiction shows as needs-you cards with both quotes, and as a conflict question', async () => {
    expect(db.tables.fact_conflicts).toHaveLength(1);
    const c = await get<Confirm>('/journey/confirm');
    const sides = c.facts.filter((f) => f.status === 'needs-you');
    expect(sides.map((f) => f.quote).sort()).toEqual([ABOUT[3], 'Tidewater, founded in 2020'].sort());
    expect(sides.every((f) => /disagree/.test(f.note!))).toBe(true);
    expect(NEWS).toContain('Tidewater, founded in 2020');
    const g = await get<{ questions: Coverage['questions'] }>('/journey/gaps');
    const q = g.questions.find((x) => x.kind === 'conflict')!;
    expect(q.sides!.map((s) => s.value).sort()).toEqual(['2019', '2020']);
  });
  it('resolve: the chosen side is approved, the other rejected, the conflict closed; a second resolve is refused', async () => {
    const cid = db.tables.fact_conflicts[0].id as string;
    const r = await call('POST', `/brands/${BRAND}/conflicts/${cid}/resolve`, { keep: site2019().id });
    expect(r.status).toBe(200);
    expect(site2019()).toMatchObject({ review_status: 'approved', decision: 'accepted' });
    expect(news2020()).toMatchObject({ review_status: 'rejected', decision: 'rejected' });
    expect(db.tables.fact_conflicts[0]).toMatchObject({ status: 'resolved', resolved_by: 'u' });
    expect((await call('POST', `/brands/${BRAND}/conflicts/${cid}/resolve`, { keep: site2019().id })).status).toBe(409);
    expect((await get<Confirm>('/journey/confirm')).facts.some((f) => f.status === 'needs-you')).toBe(false);
  });
  it('resolve with keep null rejects every side; keep must be a fact in the conflict', async () => {
    const cid = db.tables.fact_conflicts[0].id as string;
    expect((await call('POST', `/brands/${BRAND}/conflicts/${cid}/resolve`, { keep: byClaim('Tidewater says "Fresh roast, fair price."').id })).status).toBe(400);
    expect((await call('POST', `/brands/${BRAND}/conflicts/${cid}/resolve`, {})).status).toBe(400);
    expect((await call('POST', `/brands/${BRAND}/conflicts/${cid}/resolve`, { keep: null })).status).toBe(200);
    expect([site2019().review_status, news2020().review_status]).toEqual(['rejected', 'rejected']);
  });
  it('accepting a contested card keeps its side; rejecting one side of two closes the conflict', async () => {
    expect((await call('PATCH', `/brands/${BRAND}/evidence/${news2020().id}`, { decision: 'accepted' })).status).toBe(200);
    expect(news2020()).toMatchObject({ review_status: 'approved', decision: 'accepted' });
    expect(site2019().review_status).toBe('rejected');
    expect(db.tables.fact_conflicts[0].status).toBe('resolved');
  });
  it('rejecting one of two sides closes the conflict and leaves the other for the owner to accept', async () => {
    expect((await call('PATCH', `/brands/${BRAND}/evidence/${news2020().id}`, { decision: 'rejected' })).status).toBe(200);
    expect(db.tables.fact_conflicts[0].status).toBe('resolved');
    expect(site2019().review_status).toBe('proposed');
  });
});

describe('source progress (J1 source list)', () => {
  const facts = [] as never[];
  it('pending with a running run is reading, with a paused run queued (with why), failed is blocked with the reason', () => {
    const rows = journeySources({
      facts,
      sources: [
        { id: 'a', url: 'https://acme.example', title: null, status: 'pending', error: null },
        { id: 'b', url: 'https://acme.example/blog', title: null, status: 'pending', error: null },
        { id: 'c', url: 'https://docs.example.com', title: null, status: 'failed', error: 'its robots.txt says no' },
        { id: 'd', url: null, title: 'Pasted notes', status: 'read', error: null },
      ],
      runs: [{ status: 'running', input: { sourceId: 'a' } }, { status: 'paused', progress: { message: 'Waiting until 00:00 UTC.' }, input: { sourceId: 'b' } }],
    });
    expect(rows).toEqual([
      { id: 'a', label: 'acme.example', status: 'reading' },
      { id: 'b', label: 'acme.example/blog', status: 'queued', reason: 'Waiting until 00:00 UTC.' },
      { id: 'c', label: 'docs.example.com', status: 'blocked', reason: 'its robots.txt says no' },
      { id: 'd', label: 'Pasted notes', status: 'read', facts: 0 },
    ]);
  });
  it('lists the pages a site reader passed over as skipped, from its notes (sources/site.ts)', () => {
    const rows = journeySources({
      facts, runs: [],
      sources: [{ id: 'a', url: 'https://acme.example', title: null, status: 'read', error: null, read_meta: { pages: [], notes: ['2 linked page(s) not read: robots.txt disallows them, or they could not be followed', 'Exa is not configured (EXA_API_KEY); the site was read with our own reader', '1 page(s) skipped: not on the same site as the first page'] } }],
    });
    expect(rows.slice(1)).toEqual([
      { id: 'a:skipped:0', label: '2 linked pages', status: 'skipped', reason: 'robots.txt disallows them, or they could not be followed' },
      { id: 'a:skipped:2', label: '1 linked page', status: 'skipped', reason: 'not on the same site as the first page' },
    ]);
  });
});

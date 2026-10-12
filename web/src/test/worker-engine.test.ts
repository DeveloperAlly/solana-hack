import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND, db, env, Evicted, fakeDbResponse, fakeStep, seedTables, type Row } from './engine-harness';

// Workflow engine (issue #32). Supabase is the in-memory PostgREST in engine-harness.ts; the page and OpenRouter are
// stubbed fetches. Runs go through the same runner the Workflows class uses, with a stand-in step API.
const { handleApi } = await import('../../worker/api');
const { HttpError } = await import('../../worker/env');
const { runWorkflow, decodeError, nextUtcMidnight, RATE_LIMIT_DELAY_MS } = await import('../../worker/engine/runner');
const { inlineStep, localDeps, launch } = await import('../../worker/engine/executor');
const { STILL_READING, ingestSource } = await import('../../worker/engine/api');
const { INGEST_URL, EXTRACT_FACTS_PROMPT } = await import('../../worker/engine/seed');
const { render } = await import('../../worker/engine/prompts');
const { normalisePage, quoteOnPage, MAX_QUOTE } = await import('../../worker/quote');

const html = `<html><title>JamJam</title><body><p>JamJam’s mission is to help brands prove what they say on­ chain.</p><p>${'Filler text about the product. '.repeat(100)}</p></body></html>`;
const goodFacts = JSON.stringify({ facts: [
  { section: 'purpose', claim: 'Helps brands prove claims', quote: "JamJam's mission is to help brands prove what they say on chain." },
  { section: 'purpose', claim: 'Too long', quote: `JamJam's mission ${'x'.repeat(MAX_QUOTE)}` },
  { section: 'purpose', claim: 'Invented', quote: 'We have a million users' },
] });

let pageFails = 0;
let pageFetches = 0;
let llmCalls = 0;
let external: string[] = [];
type Started = { id: string; params: { runId: string } };
let started: Started[] = [];
let runOnCreate = true;
let onCreate: ((id: string) => void) | undefined;
let step = fakeStep();

beforeEach(async () => {
  await seedTables();
  db.tables.workflow_defs.find((d) => d.id === 'ingest_url')!.status = 'active';
  pageFails = 0; pageFetches = 0; llmCalls = 0; external = []; started = []; runOnCreate = true; onCreate = undefined; step = fakeStep();
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    external.push(url.split('?')[0]);
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u', email: 'o@example.com' }));
    if (url.startsWith('https://db.test')) return fakeDbResponse(url, init);
    if (url.startsWith('https://openrouter.ai')) { llmCalls++; return new Response(JSON.stringify({ model: 'test/model', choices: [{ message: { content: goodFacts } }] })); }
    pageFetches++;
    if (pageFails-- > 0) throw new TypeError('network down');
    return new Response(html, { headers: { 'content-type': 'text/html' } });
  }));
});
afterEach(() => vi.unstubAllGlobals());

/** A Workflows binding that runs the instance straight away (or only records it), with status from the run row. */
const binding = () => ({
  async create(o: { id?: string; params?: unknown }) {
    started.push(o as Started);
    onCreate?.(o.id!);
    if (runOnCreate) await runWorkflow(envWith, o.id!, step.api, localDeps).catch((e) => { if (!(e instanceof Evicted)) throw e; });
    return { id: o.id! };
  },
  async get(id: string) {
    return { status: async () => ({ status: ['done', 'failed'].includes(String(db.tables.runs.find((r) => r.id === id)?.status)) ? 'complete' : 'running' }) };
  },
});
const envWith = { ...env, RUN_WORKFLOW: binding() };

const call = async (method: string, path: string, body?: unknown) => {
  const req = new Request(`https://jamjam.tech/api${path}`, { method, headers: { authorization: 'Bearer t', 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  // index.ts turns an HttpError into {error} with its status; the same here.
  try {
    const res = (await handleApi(req, envWith, new URL(req.url), { waitUntil: () => undefined }))!;
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: { error: e.message } as Record<string, unknown> };
    throw e;
  }
};
/**
 * These tests drive the engine with ingest_url v1, its one-model-call workflow, through ingestSource (the body of POST
 * /api/brands/:id/sources). Migration 011 retires ingest_url for new runs and the route now starts extract_facts
 * (worker-extract.test.ts covers the route), so each test re-activates it here: the engine's behaviour does not depend
 * on which workflow the route starts.
 */
const addSource = async (body: Record<string, unknown>) => {
  const brand = db.tables.brands[0] as never;
  try {
    const r = await ingestSource(envWith, { waitUntil: () => undefined }, { id: 'u' }, brand, body, 'ingest_url');
    return { status: r.status, body: r.body as Record<string, unknown> };
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: { error: e.message } as Record<string, unknown> };
    throw e;
  }
};
const run = () => db.tables.runs[0] as Row & { id: string; status: string; progress: { done: number; total: number; steps: { id: string; status: string }[]; message?: string } };
const steps = (name?: string) => db.tables.run_steps.filter((s) => !name || s.step === name);

describe('definitions are data', () => {
  const sql = readFileSync(resolvePath(process.cwd(), '../spec/db/010_workflow_engine.sql'), 'utf8');
  it('migration 010 seeds exactly the definition and prompt in seed.ts', () => {
    expect(JSON.parse(/\$spec\$([\s\S]*?)\$spec\$/.exec(sql)![1])).toEqual(INGEST_URL);
    expect(/\$prompt\$([\s\S]*?)\$prompt\$/.exec(sql)![1]).toBe(EXTRACT_FACTS_PROMPT);
  });
  it('the seeded prompt renders to the exact prompt ingest used before the engine', () => {
    const before = `You extract facts about the brand "JamJam" from a web page. Each fact needs an exact quote copied character for character from the page text, at most ${MAX_QUOTE} characters. Sections: origin, purpose, positioning, audience, voice, messaging. Reply with JSON only: {"facts": [{"section": string, "claim": string, "quote": string}]}. At most 12 facts. No facts that the page does not state.`;
    expect(render(EXTRACT_FACTS_PROMPT, { brand_name: 'JamJam', max_quote: String(MAX_QUOTE), sections: 'origin, purpose, positioning, audience, voice, messaging' })).toBe(before);
  });
});

describe('ingest runs on the engine (POST /api/brands/:id/sources)', () => {
  it('answers as before, keeps only quotes it checked, and stores the full source text', async () => {
    const r = await addSource({ url: 'https://example.com' });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ facts: 1, dropped: 2, kind: 'page', needsReview: 1, sourceId: db.tables.sources[0].id, runId: run().id });
    expect(started).toEqual([{ id: run().id, params: { runId: run().id } }]);
    expect(db.tables.evidence).toHaveLength(1);
    expect(db.tables.evidence[0]).toMatchObject({ quote: "JamJam's mission is to help brands prove what they say on chain.", origin: 'source', source_id: db.tables.sources[0].id });
    const src = db.tables.sources[0] as { status: string; source_text: string; text_excerpt: string };
    expect(src.status).toBe('read');
    expect(src.source_text.length).toBeGreaterThan(src.text_excerpt.length);
    expect(quoteOnPage(normalisePage(src.source_text), db.tables.evidence[0].quote as string)).toBe(true);
    expect(run()).toMatchObject({ status: 'done', kind: 'ingest_url', workflow_version: 1, executor: 'workflows' });
    expect(run().progress).toMatchObject({ done: 4, total: 4 });
  });

  it('records the prompt key, version and hash and the model on the llm step, and never content', async () => {
    await addSource({ url: 'https://example.com' });
    const [llm] = steps('extract');
    expect(llm).toMatchObject({ type: 'llm', outcome: 'ok', prompt_key: 'ingest.extract_facts', prompt_version: 1, prompt_hash: db.tables.prompt_versions[0].hash, model: 'test/model', tokens_in: null, tokens_out: null });
    expect(steps().map((s) => s.step)).toEqual(['read', 'extract', 'check', 'save']);
    expect(JSON.stringify(db.tables.run_steps)).not.toContain('mission');
  });

  it('pins the prompt version at the start of a run, so a new version mid-run does not change it', async () => {
    runOnCreate = false;
    await call('POST', `/brands/${BRAND}/runs`, { kind: 'ingest_url', url: 'https://example.com' });
    step = fakeStep({ evictBefore: 'extract' });
    await runWorkflow(envWith, run().id, step.api, localDeps).catch((e) => { if (!(e instanceof Evicted)) throw e; });
    // The owner publishes v2 while the run is between steps.
    const v1 = db.tables.prompt_versions[0];
    v1.status = 'retired';
    db.tables.prompt_versions.push({ key: v1.key, version: 2, body: 'changed', status: 'active', hash: 'x' });
    await runWorkflow(envWith, run().id, step.api, localDeps);
    expect(run().error ?? null).toBeNull();
    expect(run().status).toBe('done');
    expect(steps('extract')[0]).toMatchObject({ prompt_version: 1 });
  });

  it('a link that cannot be read answers with the same error, and the source is marked failed', async () => {
    const r = await addSource({ url: 'ftp://example.com' });
    expect(r).toEqual({ status: 400, body: { error: 'only http and https links can be read' } });
    expect(db.tables.sources[0]).toMatchObject({ status: 'failed', error: 'only http and https links can be read' });
    expect(run()).toMatchObject({ status: 'failed', error_code: 400 });
    expect(steps('read')).toHaveLength(1); // not retried: the link will not change
  });

  it('does not wait for a run still going: answers 202 with the run to follow (PR #70 review; PR #99 review: the drafting contract)', async () => {
    runOnCreate = false;
    const r = await addSource({ url: 'https://example.com' });
    expect(r.status).toBe(202);
    expect(r.body).toMatchObject({ message: STILL_READING, runId: run().id, sourceId: db.tables.sources[0].id, status: 'running', progress: { done: 0, total: 4 } });
    expect(r.body).not.toHaveProperty('error');
    expect(r.body).not.toHaveProperty('facts');
    expect(db.tables.sources[0].status).toBe('pending');
    // The run carries on in the background, and the source is read.
    await runWorkflow(envWith, run().id, step.api, localDeps);
    expect([run().status, db.tables.sources[0].status]).toEqual(['done', 'read']);
  });

  it('a paused run answers 202 with its message', async () => {
    runOnCreate = false;
    onCreate = (id) => Object.assign(db.tables.runs.find((r) => r.id === id)!, { status: 'paused', resume_at: '2026-10-13T00:00:00.000Z', progress: { steps: [], done: 1, total: 4, message: 'This run continues at 00:00 UTC.' } });
    const r = await addSource({ url: 'https://example.com' });
    expect(r).toMatchObject({ status: 202, body: { message: 'This run continues at 00:00 UTC.', status: 'paused', resume_at: '2026-10-13T00:00:00.000Z' } });
  });

  it('a run already done answers 201 with facts, as before', async () => {
    expect((await addSource({ url: 'https://example.com' })).body).toMatchObject({ facts: 1, dropped: 2 });
  });
});

describe('evidence trust through the engine (issue #57, moved from worker-trust.test.ts)', () => {
  const add = (url: string) => addSource({ url });
  it('a page on the brand website is owned and approved', async () => {
    db.tables.brands[0].website = 'example.com';
    const r = await add('https://www.example.com/about');
    expect(r.body).toMatchObject({ kind: 'site', needsReview: 0 });
    expect(db.tables.evidence[0]).toMatchObject({ origin: 'source', trust: 'owned', review_status: 'approved' });
    expect(db.tables.sources[0]).toMatchObject({ kind: 'site' });
  });
  it('a page off the brand website is third-party and waits for the owner', async () => {
    db.tables.brands[0].website = 'jamjam.tech';
    const r = await add('https://news.example.org/jamjam');
    expect(r.body).toMatchObject({ kind: 'page', needsReview: 1 });
    expect(db.tables.evidence[0]).toMatchObject({ trust: 'third_party', review_status: 'proposed' });
    expect(db.tables.sources[0]).toMatchObject({ kind: 'page' });
  });
  it('with no website set, nothing counts as owned', async () => {
    await add('https://jamjam.tech');
    expect(db.tables.evidence[0]).toMatchObject({ trust: 'third_party', review_status: 'proposed' });
  });
  it('an on-site link that redirects off the website is third-party', async () => {
    db.tables.brands[0].website = 'jamjam.tech';
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const res = await realFetch(url, init);
      if (url.startsWith('https://jamjam.tech')) Object.defineProperty(res, 'url', { value: 'https://elsewhere.example/landing' });
      return res;
    }));
    await add('https://jamjam.tech/go');
    expect(db.tables.evidence[0]).toMatchObject({ trust: 'third_party', review_status: 'proposed' });
    expect(db.tables.sources[0]).toMatchObject({ kind: 'page', url: 'https://elsewhere.example/landing' });
  });
});

describe('a run that cannot load still closes (PR #70 review)', () => {
  const startOnly = async () => {
    runOnCreate = false;
    await addSource({ url: 'https://example.com' });
  };
  it('a missing definition marks the run and its source failed', async () => {
    await startOnly();
    db.tables.workflow_defs = [];
    await runWorkflow(envWith, run().id, step.api, localDeps);
    expect(run()).toMatchObject({ status: 'failed', error: 'workflow ingest_url v1 is missing', error_code: 500 });
    expect(db.tables.sources[0]).toMatchObject({ status: 'failed', error: 'workflow ingest_url v1 is missing' });
    expect((await call('GET', `/brands/${BRAND}`)).body.activeRun).toBeNull();
  });
  it('a missing prompt marks the run and its source failed', async () => {
    await startOnly();
    db.tables.prompt_versions = [];
    await runWorkflow(envWith, run().id, step.api, localDeps);
    expect(run()).toMatchObject({ status: 'failed', error: 'prompt ingest.extract_facts is missing' });
    expect(db.tables.sources[0].status).toBe('failed');
  });
  it('a database error that outlasts the retries marks them failed once the database answers again', async () => {
    await startOnly();
    // The definition read fails on every load attempt (4: the first and 3 retries), then the database recovers.
    let defReads = 0;
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => (url.includes('/workflow_defs') && ++defReads <= 4 ? new Response('{}', { status: 503 }) : realFetch(url, init))));
    await runWorkflow(envWith, run().id, step.api, localDeps);
    expect(defReads).toBe(4);
    expect(run()).toMatchObject({ status: 'failed', error: 'something went wrong' });
    expect(db.tables.sources[0].status).toBe('failed');
  });
});

describe('round 2 review fixes (PR #70)', () => {
  it('the read step keeps page text within the byte budget, so a large CJK page fits the 1 MiB step result', async () => {
    const { runStep, capText } = await import('../../worker/engine/steps');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(`<title>T</title><p>${'\u6f22'.repeat(450000)}</p>`, { headers: { 'content-type': 'text/html' } })));
    const read = INGEST_URL.steps[0] as Parameters<typeof runStep>[0];
    const { output } = await runStep(read, { env, run: {} as never, state: { input: { url: 'https://example.com' }, steps: {}, prompts: {} } });
    const bytes = new TextEncoder().encode(JSON.stringify(output)).length;
    expect(new TextEncoder().encode((output as { text: string }).text).length).toBeLessThanOrEqual(600000);
    expect(bytes).toBeLessThan(1024 * 1024);
    // Never splits a character: an emoji (two UTF-16 units, four UTF-8 bytes) either fits whole or is left out.
    expect(capText('ab\u{1F600}', 3, 100)).toBe('ab');
    expect(capText('ab\u{1F600}', 4, 5)).toBe('ab');
    expect(capText('ab\u{1F600}', 4, 6)).toBe('ab\u{1F600}');
  });

  it('a failed run start after prepare closes the source it prepared instead of leaving it pending', async () => {
    // The run row is written first by admit_run (spec/db/011); writing its input after prepare() is the step that fails.
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => (url.includes('/rest/v1/runs?') && init?.method === 'PATCH' ? new Response('{}', { status: 503 }) : realFetch(url, init))));
    const r = await addSource({ url: 'https://example.com' });
    expect(r).toEqual({ status: 500, body: { error: 'database error' } });
    expect(db.tables.sources[0]).toMatchObject({ status: 'failed', error: 'the run could not start' });
  });
  it('a failed admission writes nothing', async () => {
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => (url.endsWith('/rest/v1/rpc/admit_run') ? new Response('{}', { status: 503 }) : realFetch(url, init))));
    expect(await addSource({ url: 'https://example.com' })).toEqual({ status: 500, body: { error: 'database error' } });
    expect([db.tables.sources.length, db.tables.runs.length]).toEqual([0, 0]);
  });

  it('a retried save writes the same evidence ids and keeps a review made in between', async () => {
    const realFetch = globalThis.fetch;
    let failed = false;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/rpc/record_run_step') && !failed) {
        const b = JSON.parse(String(init?.body));
        if (b.p_step?.step === 'save' && b.p_step.outcome === 'ok') {
          failed = true;
          // The rows are written and visible; the owner approves the fact before the step is retried.
          db.tables.evidence[0].review_status = 'approved';
          return new Response('{}', { status: 503 });
        }
      }
      return realFetch(url, init);
    }));
    const r = await addSource({ url: 'https://example.com' });
    expect(r.status).toBe(201);
    expect(failed).toBe(true);
    expect(db.tables.evidence).toHaveLength(1);
    expect(db.tables.evidence[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(db.tables.evidence[0].review_status).toBe('approved');
    expect(steps('save').map((s) => [s.attempt, s.outcome])).toEqual([[1, 'error'], [2, 'ok']]);
  });
});

describe('durable runs', () => {
  it('a run survives a forced step failure: the step retries with backoff and the run finishes', async () => {
    pageFails = 1;
    const r = await addSource({ url: 'https://example.com' });
    expect(r.status).toBe(201);
    expect(step.delays).toEqual([{ step: 'read', ms: 5000 }]);
    expect(steps('read').map((s) => [s.attempt, s.outcome])).toEqual([[1, 'error'], [2, 'ok']]);
    expect(steps('read')[0].error).toBe('the site did not answer in time');
    expect(run().status).toBe('done');
  });

  it('progress is readable after a reload, and an interrupted run resumes without redoing finished steps', async () => {
    runOnCreate = false;
    step = fakeStep({ evictBefore: 'check' });
    expect((await call('POST', `/brands/${BRAND}/runs`, { kind: 'ingest_url', url: 'https://example.com' })).status).toBe(202);
    // The isolate is evicted after two steps.
    await runWorkflow(envWith, run().id, step.api, localDeps).catch((e) => { if (!(e instanceof Evicted)) throw e; });
    // A reload: fresh GETs read the progress from the database.
    const brand = await call('GET', `/brands/${BRAND}`);
    expect(brand.body.activeRun).toMatchObject({ id: run().id, status: 'running', progress: { done: 2, total: 4 } });
    const got = await call('GET', `/runs/${run().id}`);
    expect((got.body.run as Row).progress).toMatchObject({ done: 2, steps: [{ id: 'read', status: 'done' }, { id: 'extract', status: 'done' }, { id: 'check', status: 'running' }, { id: 'save', status: 'pending' }] });
    expect((got.body.steps as Row[]).map((s) => s.step)).toEqual(['read', 'extract']);
    expect(got.body.run).not.toHaveProperty('input');
    // Workflows replays the run: read and extract come from saved results, so the page and the model are called once.
    await runWorkflow(envWith, run().id, step.api, localDeps);
    expect([pageFetches, llmCalls]).toEqual([1, 1]);
    expect(run().status).toBe('done');
    expect((await call('GET', `/brands/${BRAND}`)).body.activeRun).toBeNull();
  });

  it('GET /api/runs/:id is for the brand owner only', async () => {
    await addSource({ url: 'https://example.com' });
    db.tables.brands[0].owner_id = 'someone-else';
    expect(await call('GET', `/runs/${run().id}`)).toEqual({ status: 404, body: { error: 'run not found' } });
  });

  it('POST /api/brands/:id/runs starts a run of a known kind and refuses others', async () => {
    const r = await call('POST', `/brands/${BRAND}/runs`, { kind: 'ingest_url', url: 'https://example.com' });
    expect(r.status).toBe(202);
    expect((r.body.run as Row).kind).toBe('ingest_url');
    expect((await call('POST', `/brands/${BRAND}/runs`, { kind: 'nope' })).status).toBe(404);
  });

  it('a superseded run stops at its next step and writes nothing more', async () => {
    runOnCreate = false;
    await call('POST', `/brands/${BRAND}/runs`, { kind: 'ingest_url', url: 'https://example.com' });
    step = fakeStep({ evictBefore: 'check' });
    await runWorkflow(envWith, run().id, step.api, localDeps).catch((e) => { if (!(e instanceof Evicted)) throw e; });
    run().status = 'superseded';
    await runWorkflow(envWith, run().id, step.api, localDeps);
    expect(run().status).toBe('superseded');
    expect(db.tables.evidence).toHaveLength(0);
  });
});

describe('subrequest budget (Workers Free: 50 per Workflow instance, https://developers.cloudflare.com/workflows/reference/limits/)', () => {
  it('an ingest_url run makes at most 45 external calls on the happy path, counted', async () => {
    await addSource({ url: 'https://example.com' });
    const inRun = external.slice(external.findIndex((u) => u.endsWith('/rest/v1/runs')) + 1);
    // Everything after the run row is created: the instance's own calls plus the request's final read of the run.
    console.log('ingest_url external calls', { request: external.length, run: inRun.length - 1 });
    expect(inRun.length - 1).toBeLessThanOrEqual(45);
    expect(external.length).toBeLessThanOrEqual(50);
  });
});

describe('inline adapter', () => {
  it('refuses a multi-step definition before writing anything', async () => {
    db.tables.engine_config.push({ key: 'executor', value: 'inline' });
    const r = await addSource({ url: 'https://example.com' });
    expect(r.status).toBe(503);
    expect(r.body.error).toMatch(/single-step workflows only/);
    expect([db.tables.sources.length, db.tables.runs.length]).toEqual([0, 0]);
  });

  it('runs a single-step definition through the same runner, with waitUntil', async () => {
    const one = { ...INGEST_URL, id: 'check_quotes', steps: [{ id: 'check', type: 'code' as const, label: 'Check', fn: 'keep_quoted_facts', args: { facts: '$input.facts', page: '$input.page' } }], output: '$steps.check', onFailure: undefined };
    db.tables.workflow_defs.push({ id: one.id, version: 1, spec: one, status: 'active' });
    db.tables.runs.push({ id: 'r1', brand_id: BRAND, kind: one.id, workflow_version: 1, executor: 'inline', status: 'running', input: { facts: JSON.parse(goodFacts).facts, page: html }, progress: {} });
    const pending: Promise<unknown>[] = [];
    await launch(env, { waitUntil: (p) => pending.push(p) }, run() as never);
    await Promise.all(pending);
    expect(run()).toMatchObject({ status: 'done', output: { dropped: 2 }, progress: { done: 1, total: 1 } });
    expect(steps('check')).toMatchObject([{ outcome: 'ok', type: 'code' }]);
  });

  it('does not wait past the waitUntil window: a retry delay over 10 s fails the step instead', async () => {
    const s = inlineStep(async () => undefined);
    let n = 0;
    const err = await s.do('x', { retries: { limit: 2, delay: () => 60_000 } }, async () => { n++; throw new Error('E502|rate|busy'); }).catch((e) => e);
    expect([n, decodeError(err).kind]).toEqual([1, 'rate']);
  });
});

describe('model rate limits', () => {
  it('waits at least a minute before retrying after a per-minute limit', async () => {
    const { retryDelay } = await import('../../worker/engine/runner');
    const d = retryDelay({ limit: 2, delay: '5 seconds', backoff: 'exponential' });
    expect(d({ ctx: { attempt: 1 }, error: new Error('E502|retry|x') })).toBe(5000);
    expect(d({ ctx: { attempt: 2 }, error: new Error('E502|retry|x') })).toBe(10000);
    expect(d({ ctx: { attempt: 1 }, error: new Error('E502|rate|busy') })).toBe(RATE_LIMIT_DELAY_MS);
    expect(d({ ctx: { attempt: 2 }, error: new Error('E502|rate|busy') })).toBe(2 * RATE_LIMIT_DELAY_MS);
  });
  it('next 00:00 UTC', () => {
    expect(new Date(nextUtcMidnight(Date.parse('2026-10-12T23:59:00Z'))).toISOString()).toBe('2026-10-13T00:00:00.000Z');
  });
});

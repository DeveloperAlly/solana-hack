import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND, db, env, fakeDb, fakeStep, seedTables, type Row } from './engine-harness';

// Create intelligence (issue #93; backlog T1, T1a, T1b, G2, G4, X16; architecture §6.1, §6.2, §13). Supabase is the
// in-memory PostgREST in engine-harness.ts and OpenRouter is a stubbed fetch, so every model is mocked: the drafter
// answers per candidate from `drafts`, the reviewer from `review`. Runs go through the same runner Workflows uses.
const { handleApi } = await import('../../worker/api');
const { HttpError } = await import('../../worker/env');
const { runWorkflow } = await import('../../worker/engine/runner');
const { localDeps, checkExecutor } = await import('../../worker/engine/executor');
const { STILL_DRAFTING } = await import('../../worker/engine/api');
const { DRAFT_POST, CREATE_DRAFT_PROMPT, CREATE_REVIEW_PROMPT, CREATE_MODELS, CREATE_CONFIG, SEEDED_BY } = await import('../../worker/engine/seed');
const { runStep, READS } = await import('../../worker/engine/steps');
const { JUDGES, taskModelsError, differentFamily } = await import('../../worker/models');
const { SLOP_RULES, SLOP_TERMS } = await import('../../worker/slop');
const { slopCheck, contentHash } = await import('../../worker/posts');
const { checkClaims, countedNouns } = await import('../../worker/create/claims');
const { bm25Scores, BM25, factDocs, passages, rankCorpus, loadCorpus, RETRIEVE_DEFAULTS } = await import('../../worker/create/retrieve');
const { measureVoice, voiceSpec, TEMPLATE_DIALS, DIALS } = await import('../../worker/create/voice');
const { lintPlatform, isBroetry } = await import('../../worker/create/platform');
const { EVALUATORS, named, runAll, verdictOf, pick } = await import('../../worker/create/evaluators');
const { draftChecks } = await import('../../worker/create/checks');
const { DRAFT_CANDIDATE, REVIEW_FINDINGS } = await import('../../worker/create/schemas');
const { VOICE_TEMPLATES } = await import('../screens/build/steps');

const ROOT = resolvePath(process.cwd(), '..');
const F = (n: number) => `aaaaaaaa-0000-4000-8000-00000000000${n}`;
const S_SITE = 'cccccccc-0000-4000-8000-000000000001';
const S_PAGE = 'cccccccc-0000-4000-8000-000000000002';
const FACTS = [
  { id: F(1), claim: 'JamJam is used by teams at 10 companies.', quote: 'JamJam is used by teams at 10 companies.', origin: 'source', trust: 'owned', review_status: 'approved' },
  { id: F(2), claim: 'JamJam registers each approved post on Solana.', quote: 'Every approved post is registered on Solana.', origin: 'source', trust: 'owned', review_status: 'approved' },
  // Never usable: a third-party fact the owner has not approved, and an assumption.
  { id: F(3), claim: 'JamJam has 10,000 users.', quote: 'JamJam has 10,000 users.', origin: 'source', trust: 'third_party', review_status: 'proposed' },
  { id: F(4), claim: 'JamJam is the leading proof tool.', quote: null, origin: 'assumption', trust: 'assumption', review_status: 'approved' },
];
const KIT = {
  brand_id: BRAND, version: 1, status: 'registered', registered_at: '2026-10-12T10:00:00Z', hash: 'sha256:k', signature: 'sig',
  payload: {
    brand: { id: BRAND, name: 'JamJam' },
    sections: [
      { section: 'voice', body: 'Candid founder voice. Short sentences. Plain words.' },
      { section: 'messaging', body: 'Build your brand, run it, prove it.' },
      { section: 'positioning', body: 'For founders who post about their product.' },
      { section: 'purpose', body: 'Brands can prove what they said.' },
    ],
    policy: { claims: '4', template: 'candid_founder' },
    evidence: FACTS,
    sources: [{ id: S_SITE }, { id: S_PAGE }],
  },
};
const SITE_TEXT = 'JamJam turns your site into a brand kit you can prove.\n\nEvery approved post is registered on Solana so anyone can check the proof later.';
const PAGE_TEXT = 'A blog says JamJam is the best tool with 10,000 users and proof for everyone.';

type Call = { schema?: string; models?: string[]; system: string; user: string };
let calls: Call[] = [];
/** The drafter's reply per candidate (1-based index from the prompt). */
let drafts: Record<number, { body: string; claims: { text: string; fact_ids: string[] }[] }>;
/** The reviewer's reply for a post. */
let review: (post: string) => Record<string, unknown>;
/** Which model the stub says answered, per schema (default: the first model the request listed). */
let answeredBy: Partial<Record<string, string>> = {};
let reviewStatus = 200;
/** Database writes matching this fail with a 500, as a failing statement would. */
let failWrites: RegExp | null = null;

const goodReview = (post: string) => ({
  // The judge answers every sentence it was asked about (the evidence-bearing ones), as the prompt requires.
  claims: post.includes('10 companies') ? [{ text: 'Teams at 10 companies use JamJam to keep their posts honest.', fact_ids: [F(1)], supported: true }] : [],
  issues: [], tone: [{ dimension: 'warmth', observed: 'on' }, { dimension: 'energy', observed: 'on' }, { dimension: 'humour', observed: 'on' }],
  sexual: false, minors: false, explicitLanguage: false,
});
const GOOD = { body: 'Teams at 10 companies use JamJam to keep their posts honest.', claims: [{ text: 'Teams at 10 companies use JamJam to keep their posts honest.', fact_ids: [F(1)] }] };
const UPGRADED = { body: 'JamJam now serves 10 enterprise customers.', claims: [{ text: 'JamJam now serves 10 enterprise customers', fact_ids: [F(1)] }] };
const SLOPPY = { body: 'We unlock proof for every post you write.', claims: [] };

let step = fakeStep();
let runOnCreate = true;
const envWith = {
  ...env,
  RUN_WORKFLOW: {
    async create(o: { id?: string }) { if (runOnCreate) await runWorkflow(envWith, o.id!, step.api, localDeps); return { id: o.id! }; },
    async get() { return { status: async () => ({ status: runOnCreate ? 'complete' : 'running' }) }; },
  },
};

beforeEach(async () => {
  await seedTables({
    kits: [structuredClone(KIT)],
    answers: [{ brand_id: BRAND, step: 'voice', data: { template: 'candid_founder', formality: '2', energy: '3', humour: '2', warmth: '3', sentence_length: '2', jargon: '2', emoji: '1', cta: '3', claims: '4', sample: 'We ship small and say what we did.' }, updated_at: '2026-10-12T09:00:00Z', skipped: false }],
    sources: [
      { id: S_SITE, brand_id: BRAND, kind: 'site', status: 'read', url: 'https://jamjam.tech', source_text: SITE_TEXT },
      { id: S_PAGE, brand_id: BRAND, kind: 'page', status: 'read', url: 'https://blog.example/jamjam', source_text: PAGE_TEXT },
    ],
    posts: [{ id: 'dddddddd-0000-4000-8000-000000000001', brand_id: BRAND, status: 'registered', body: 'We ship small. Every post we approve goes on Solana.', channel: 'LinkedIn', approved_at: '2026-10-11T00:00:00Z', checks: {} }],
    post_candidates: [], post_decisions: [],
  });
  calls = []; answeredBy = {}; reviewStatus = 200; failWrites = null; runOnCreate = true; step = fakeStep();
  drafts = { 1: GOOD, 2: UPGRADED, 3: SLOPPY };
  review = goodReview;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u', email: 'o@example.com' }));
    if (url.startsWith('https://db.test')) {
      if (failWrites && (init?.method ?? 'GET') !== 'GET' && failWrites.test(url)) return new Response('{"code":"23503"}', { status: 500 });
      return new Response(JSON.stringify(fakeDb(url, init)));
    }
    if (url.startsWith('https://openrouter.ai')) {
      const body = JSON.parse(String(init!.body)) as { models?: string[]; messages: { content: string }[]; response_format?: { json_schema?: { name?: string } } };
      const schema = body.response_format?.json_schema?.name;
      const [system, user] = body.messages.map((m) => m.content);
      calls.push({ schema, models: body.models, system, user });
      if (schema === 'review_findings' && reviewStatus !== 200) return new Response('{}', { status: reviewStatus });
      let content = '{}';
      if (schema === 'draft_candidate') content = JSON.stringify(drafts[Number(/candidate (\d) of 3/.exec(system)![1])]);
      if (schema === 'review_findings') content = JSON.stringify(review((JSON.parse(user) as { post: string }).post));
      if (schema === 'policy') content = '{}';
      // The approval check (posts.ts policyCheck) has no schema: everything supported, nothing blocked.
      if (!schema) content = JSON.stringify({ unsupported: [], sexual: false, minors: false, explicitLanguage: false });
      return new Response(JSON.stringify({ model: answeredBy[schema ?? ''] ?? body.models?.[0] ?? 'openrouter/free', usage: { prompt_tokens: 10, completion_tokens: 5 }, choices: [{ message: { content } }] }));
    }
    return new Response('', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const call = async (method: string, path: string, body?: unknown, e: typeof envWith = envWith) => {
  const req = new Request(`https://jamjam.tech/api${path}`, { method, headers: { authorization: 'Bearer t', 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  try {
    const res = (await handleApi(req, e, new URL(req.url), { waitUntil: () => undefined }))!;
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  } catch (err) {
    if (err instanceof HttpError) return { status: err.status, body: { error: err.message } as Record<string, unknown> };
    throw err;
  }
};
type PostOut = Row & { id: string; body: string; rev: number; checks: Record<string, unknown> & { draft: Record<string, unknown> & { candidates: Row[]; verdict: { passed: boolean; reasons: string[]; failedGates: string[] } } } };
const draft = async (brief = 'Why we register posts on Solana', channel = 'LinkedIn') => call('POST', `/brands/${BRAND}/posts`, { brief, channel });
const llm = (schema: string) => calls.filter((c) => c.schema === schema);

// The post fields the shipped Create screen reads (web/src/screens/create/Create.tsx interface Post), and the check
// fields it reads. The posts API may add fields; it must never rename or remove these (#38 contracts).
const OLD_POST_KEYS = ['id', 'brief', 'channel', 'body', 'status', 'kit_version', 'hash', 'checks', 'signature', 'published_url', 'rev', 'brand_id', 'model', 'created_at'];
const OLD_CHECK_KEYS = ['slop', 'voiceFit', 'platform', 'notes', 'source'];

describe('draft_post on the engine (T1, T1b): best of 3, every candidate and verdict kept', () => {
  it('returns the best candidate in the same response shape, plus candidates, verdicts, claims and why', async () => {
    const r = await draft();
    expect(r.status).toBe(201);
    const post = r.body.post as PostOut;
    for (const k of OLD_POST_KEYS) expect(post).toHaveProperty(k);
    for (const k of OLD_CHECK_KEYS) expect(post.checks).toHaveProperty(k);
    expect(post.checks.slop).toEqual({ passed: true, hits: [] });
    expect(post.status).toBe('drafted');
    expect(post.kit_version).toBe(1);
    expect(post.body).toBe(GOOD.body);
    const d = post.checks.draft;
    expect(d.chosen).toBe(0);
    expect(d.verdict.passed).toBe(true);
    expect(d.bodyHash).toBe(await contentHash(GOOD.body));
    expect(d.candidates).toHaveLength(3);
    expect(d.candidates.map((c) => c.failedGates)).toEqual([[], ['claims', 'review_claims'], ['slop', 'claims', 'review_claims']]);
    expect(d.claims).toEqual([{ text: GOOD.claims[0].text, factIds: [F(1)], ok: true }]);
    expect((d.why as { facts: unknown }).facts).toEqual([{ id: F(1), claim: FACTS[0].claim }]);
    expect(r.body.runId).toBeTruthy();
  });

  it('stores every candidate with its scores, verdict, models, prompt versions, exemplar ids and spec version (§6.2)', async () => {
    const post = (await draft()).body.post as PostOut;
    const rows = db.tables.post_candidates as (Row & { idx: number; chosen: boolean; verdict: { passed: boolean }; model: string; judge_model: string; prompt_versions: unknown; retrieved: { posts: { id: string }[] }; spec: { version: string } })[];
    expect(rows.map((x) => [x.idx, x.chosen, x.verdict.passed, x.post_id])).toEqual([[0, true, true, post.id], [1, false, false, post.id], [2, false, false, post.id]]);
    for (const x of rows) {
      expect(x.model).toBe(CREATE_MODELS['create.draft'][0]);
      expect(x.judge_model).toBe(CREATE_MODELS['create.review'][0]);
      expect(x.prompt_versions).toEqual({ draft: 1, review: 1 });
      expect(x.retrieved.posts.map((p) => p.id)).toEqual(['dddddddd-0000-4000-8000-000000000001']);
      expect(x.spec.version).toBe('voice_spec_v1');
    }
    // A retried save writes nothing twice (ids derive from the run).
    expect(db.tables.posts.filter((p) => p.id === post.id)).toHaveLength(1);
  });

  it('runs the 3 drafts and 3 reviews as parallel map items, each traced with its prompt version and model', async () => {
    await draft();
    const traces = db.tables.run_steps.filter((s) => s.type === 'llm') as (Row & { step: string; model: string; prompt_key: string; prompt_version: number })[];
    expect(traces.map((t) => t.step).sort()).toEqual(['draft[0]', 'draft[1]', 'draft[2]', 'review[0]', 'review[1]', 'review[2]']);
    for (const t of traces) expect([t.prompt_key, t.prompt_version, t.model]).toEqual(t.step.startsWith('draft') ? ['create.draft', 1, CREATE_MODELS['create.draft'][0]] : ['create.review', 1, CREATE_MODELS['create.review'][0]]);
    expect(step.ran.filter((n) => /^(draft|review)\[\d\]$/.test(n))).toHaveLength(6);
    expect(db.tables.runs[0]).toMatchObject({ status: 'done', progress: { done: DRAFT_POST.steps.length, total: DRAFT_POST.steps.length } });
  });

  it('sends each model task only its pinned models: the drafter its list, the reviewer a list of another family', async () => {
    await draft();
    for (const c of llm('draft_candidate')) expect(c.models).toEqual(CREATE_MODELS['create.draft']);
    for (const c of llm('review_findings')) expect(c.models).toEqual(CREATE_MODELS['create.review']);
    for (const j of CREATE_MODELS['create.review']) for (const g of CREATE_MODELS['create.draft']) expect(differentFamily(j, g)).toBe(true);
  });

  it('runs inline inside the request when the engine executor is inline (no waitUntil cut-off)', async () => {
    db.tables.engine_config.push({ key: 'executor', value: 'inline' });
    const r = await draft();
    expect(r.status).toBe(201);
    expect(db.tables.runs[0]).toMatchObject({ executor: 'inline', status: 'done' });
  });

  it('on Workflows, answers 202 with the run id when the run outlasts draft_wait_ms, for the screen to follow', async () => {
    runOnCreate = false;
    db.tables.engine_config.push({ key: 'draft_wait_ms', value: 0 });
    const r = await draft();
    expect(r.status).toBe(202);
    expect(r.body).toMatchObject({ post: null, runId: db.tables.runs[0].id, status: 'running', message: STILL_DRAFTING });
  });

  it('lists the brand\'s draft runs still going, so the screen can resume following them', async () => {
    runOnCreate = false;
    db.tables.engine_config.push({ key: 'draft_wait_ms', value: 0 });
    const r = await draft();
    const list = await call('GET', `/brands/${BRAND}/runs?kind=draft_post`);
    expect((list.body.runs as Row[]).map((x) => [x.id, x.status, 'input' in x])).toEqual([[r.body.runId, 'running', false]]);
    expect((await call('GET', `/brands/${BRAND}/runs?kind=extract_facts`)).body.runs).toEqual([]);
    expect((await call('GET', `/brands/${BRAND}/runs?kind=bad%20kind`)).status).toBe(400);
  });

  it('a second draft while one is running starts its own run and supersedes nothing', async () => {
    runOnCreate = false;
    db.tables.engine_config.push({ key: 'draft_wait_ms', value: 0 });
    await draft();
    await draft();
    expect(db.tables.runs.map((x) => x.status)).toEqual(['running', 'running']);
  });

  it('writes the post and its candidates in one transaction: a failed candidate write leaves no post', async () => {
    failWrites = /post_candidates|rpc\/save_draft/;
    const r = await draft();
    expect(r.status).toBeGreaterThanOrEqual(500);
    expect(db.tables.posts.filter((p) => p.status === 'drafted')).toHaveLength(0);
    expect(db.tables.post_candidates).toHaveLength(0);
  });

  it('counts against the brand\'s daily model-call budget: 6 planned calls, refused before any row when they do not fit', async () => {
    const { plannedModelCalls } = await import('../../worker/engine/guards');
    expect(plannedModelCalls(DRAFT_POST)).toBe(6);
    db.tables.engine_config.push({ key: 'model_call_budget', value: { permanent: 5 } });
    const r = await draft();
    expect(r.status).toBe(429);
    expect([db.tables.runs.length, db.tables.posts.length]).toEqual([0, 1]);
  });

  it('refuses before writing any row on a database without migration 013, or without a registered kit', async () => {
    db.tables.workflow_defs = db.tables.workflow_defs.filter((d) => d.id !== 'draft_post');
    let r = await draft();
    expect([r.status, String(r.body.error)]).toEqual([503, expect.stringMatching(/migration/)]);
    await seedTables({ kits: [] });
    r = await draft();
    expect([r.status, r.body.error]).toEqual([409, 'register your brand kit first, so posts are written to a fixed kit version']);
    expect([db.tables.runs.length, (db.tables.posts ?? []).length]).toEqual([0, 0]);
  });
});

describe('retrieval (X16): the allow-list applies before ranking, so nothing outside it reaches a prompt', () => {
  it('never puts a proposed third-party fact, an assumption or a third-party page into the drafting prompt', async () => {
    const post = (await draft('How many users does JamJam have, and is it the best?')).body.post as PostOut;
    for (const c of llm('draft_candidate')) {
      expect(c.user).toContain(F(1));
      expect(c.user).toContain(F(2));
      expect(c.user).not.toContain(F(3));
      expect(c.user).not.toContain('10,000 users');
      expect(c.user).not.toContain(F(4));
      expect(c.user).not.toContain('best tool');
    }
    const ret = (post.checks.draft.why as { retrieved: { facts: string[]; excerpts: { source: string }[] } }).retrieved;
    expect(ret.facts.sort()).toEqual([F(1), F(2)]);
    expect(ret.excerpts.every((e) => e.source === S_SITE)).toBe(true);
    // The reviewer is given the same facts and nothing else.
    for (const c of llm('review_findings')) expect((JSON.parse(c.user) as { facts: { id: string }[] }).facts.map((f) => f.id).sort()).toEqual([F(1), F(2)]);
  });

  it('factDocs keeps only usable facts with an id; legacy kit facts are read as migration 009 backfills them', () => {
    expect(factDocs([...FACTS, { claim: 'no id', trust: 'owned', review_status: 'approved' }, { id: 'x', claim: 'legacy source fact', origin: 'source' }, { id: 'y', claim: 'legacy answer', origin: 'owner_answer' }]).map((d) => d.id)).toEqual([F(1), F(2), 'y']);
  });

  it('loads approved or registered posts and passages of owned, read sources only', async () => {
    db.tables.posts.push({ id: 'dddddddd-0000-4000-8000-000000000002', brand_id: BRAND, status: 'drafted', body: 'An unapproved draft about Solana.' });
    db.tables.sources.push({ id: 'cccccccc-0000-4000-8000-000000000003', brand_id: BRAND, kind: 'site', status: 'failed', source_text: 'A failed read about Solana proof that is long enough to be a passage.' });
    const corpus = await loadCorpus(env, BRAND, { facts: FACTS, sourceIds: [S_SITE, S_PAGE, 'cccccccc-0000-4000-8000-000000000003'] });
    expect(corpus.posts.map((p) => p.id)).toEqual(['dddddddd-0000-4000-8000-000000000001']);
    expect(corpus.excerpts.map((e) => e.meta?.source)).toEqual([S_SITE]);
    expect(corpus.facts.map((f) => f.id)).toEqual([F(1), F(2)]);
  });

  it('BM25 ranks the passage that matches the query terms first, deterministically', async () => {
    const docs = [
      { id: 'a', kind: 'fact' as const, text: 'Our office is in Melbourne.' },
      { id: 'b', kind: 'fact' as const, text: 'Every approved post is registered on Solana.' },
      { id: 'c', kind: 'fact' as const, text: 'Solana registration proves each post.' },
    ];
    const s = bm25Scores(docs, 'registered on Solana');
    expect(s[0]).toBe(0);
    expect(s[1]).toBeGreaterThan(s[2]);
    expect((await BM25.rank(docs, 'registered on Solana')).map((d) => d.id)).toEqual(['b', 'c', 'a']);
  });

  it('picks posts by topic, then fills by recency for style (architecture §6.2 rung 1)', async () => {
    const posts = ['solana proof launch', 'weekend hiking', 'solana registration', 'team lunch', 'office move'].map((t, i) => ({ id: `p${i}`, kind: 'post' as const, text: t, at: `2026-10-0${i + 1}` }));
    const r = await rankCorpus({ facts: [], posts, excerpts: [] }, 'solana', RETRIEVE_DEFAULTS);
    // p2 is shorter, so BM25 ranks it above p0 for the same term (length normalisation, b = 0.75).
    expect(r.posts.map((p) => [p.id, p.meta?.why])).toEqual([['p2', 'topic'], ['p0', 'topic'], ['p4', 'recent'], ['p3', 'recent']]);
  });

  it('cuts source text into passages of whole paragraphs', () => {
    expect(passages('short\n\n' + 'A paragraph long enough to keep as a passage of the site.\n\nAnother paragraph that is also long enough to keep.')).toEqual(['A paragraph long enough to keep as a passage of the site. Another paragraph that is also long enough to keep.']);
  });
});

describe('claims gate (G2, C1): every claim resolves to usable evidence, or the draft is refused', () => {
  const fx = JSON.parse(readFileSync(resolvePath(ROOT, 'spec/evals/create/claims.json'), 'utf8')) as { facts: { id: string; claim: string; quote: string }[]; items: { id: string; kind: string; level: string; body: string; claims: { text: string; fact_ids: string[] }[]; expect: string }[] };

  it('"used by teams at 10 companies" can never be drafted as "10 enterprise customers", whatever the writer cites', () => {
    const facts = [{ id: 'f', claim: 'JamJam is used by teams at 10 companies.', quote: 'used by teams at 10 companies' }];
    expect(countedNouns('JamJam now serves 10 enterprise customers')).toEqual(['enterprise', 'customer']);
    expect(countedNouns('Founded in 2026, JamJam has 3 big teams')).toEqual(['big', 'team']);
    expect(countedNouns('We serve 10 happy enterprise customers who use it')).toEqual(['happy', 'enterprise', 'customer']);
    expect(countedNouns('Teams at 10 companies use JamJam')).toEqual(['company']);
    const r = checkClaims('JamJam now serves 10 enterprise customers.', [{ text: 'JamJam now serves 10 enterprise customers', fact_ids: ['f'] }], facts, '4', 'JamJam');
    expect(r.passed).toBe(false);
    expect(r.findings.map((f) => f.rule)).toContain('counted_noun');
    // Undeclared, it is still refused: the sentence states a number with no supported claim.
    expect(checkClaims('JamJam now serves 10 enterprise customers.', [], facts, '4', 'JamJam').findings.map((f) => f.rule)).toEqual(['uncovered']);
    // The faithful wording passes.
    expect(checkClaims('Teams at 10 companies use JamJam.', [{ text: 'Teams at 10 companies use JamJam', fact_ids: ['f'] }], facts, '4', 'JamJam').passed).toBe(true);
    // Declaring only part of the sentence (the number) leaves the rest unchecked, so it is refused (PR #99 review).
    expect(checkClaims('We serve 10 enterprise customers.', [{ text: '10', fact_ids: ['f'] }], facts, '4', 'JamJam').findings.map((f) => f.rule)).toEqual(['not_in_post', 'uncovered']);
  });

  it('end to end: a run whose every candidate upgrades the fact saves no approvable draft, and Approve refuses it', async () => {
    drafts = { 1: UPGRADED, 2: UPGRADED, 3: UPGRADED };
    // Even a reviewer that wrongly calls it supported cannot pass it: the code gate decides.
    review = (post) => ({ ...goodReview(post), claims: [{ text: 'JamJam now serves 10 enterprise customers', fact_ids: [F(1)], supported: true }] });
    const post = (await draft()).body.post as PostOut;
    expect(post.checks.draft.verdict.passed).toBe(false);
    expect(post.checks.draft.verdict.failedGates).toEqual(['claims']);
    const a = await call('POST', `/brands/${BRAND}/posts/${post.id}/approve`, { rev: post.rev ?? 0 });
    expect(a.status).toBe(409);
    expect(String(a.body.error)).toMatch(/independent checks did not pass this draft: claim "JamJam now serves 10 enterprise customers"/);
    expect(db.tables.posts.find((p) => p.id === post.id)!.status).toBe('drafted');
  });

  it('a draft with an unsupported claim shows it before Approve (backlog §15 phase 2), in the checks list', async () => {
    drafts = { 1: { body: 'JamJam has 500 brands on board.', claims: [] }, 2: { body: 'JamJam has 500 brands on board.', claims: [] }, 3: { body: 'JamJam has 500 brands on board.', claims: [] } };
    const post = (await draft()).body.post as PostOut;
    expect((post.checks.notes as string[])[0]).toMatch(/JamJam has 500 brands on board/);
    const c = await call('GET', `/drafts/${post.id}/checks`);
    expect(c.status).toBe(200);
    expect(c.body).toMatchObject({ passed: false, threshold: null, charLimit: 3000, checks: [{ title: 'Unsupported claim', phrase: 'JamJam has 500 brands on board.', blocking: true, rule: { kind: 'phrase', blocks: true, fix: { kind: 'remove-line' } } }] });
  });

  it(`F6 fixtures (spec/evals/create/claims.json): recall of unsupported claims meets the §13.2 gate (>= 95%)`, () => {
    const unsupported = fx.items.filter((i) => i.expect === 'unsupported');
    const supported = fx.items.filter((i) => i.expect === 'supported');
    const caught = unsupported.filter((i) => !checkClaims(i.body, i.claims, fx.facts, i.level, 'JamJam').passed);
    const falseAlarms = supported.filter((i) => !checkClaims(i.body, i.claims, fx.facts, i.level, 'JamJam').passed);
    expect(unsupported.length).toBeGreaterThanOrEqual(10);
    expect(caught.map((i) => i.id)).toEqual(unsupported.map((i) => i.id));
    expect(caught.length / unsupported.length).toBeGreaterThanOrEqual(0.95);
    // Precision is reported, not gated (§13.2): 26 of 26 unsupported caught, 0 of 17 supported flagged on this set (code gate alone).
    console.info(`F6 synthetic: caught ${caught.length}/${unsupported.length}, false alarms ${falseAlarms.length}/${supported.length}`);
    expect(falseAlarms.map((i) => i.id)).toEqual([]);
  });

  it('a sentence needs evidence unless it is positively not a statement of fact (inverted on PR #99 review)', async () => {
    const { needsEvidence } = await import('../../worker/create/claims');
    for (const s of ['JamJam runs on Solana.', 'The product supports teams.', 'Our customers ship faster.', 'Stripe uses JamJam.']) expect([s, needsEvidence(s, '4')]).toEqual([s, true]);
    for (const s of ['Is your brand provable?', 'Try it on your own site.', "Let's build it together.", 'We think every brand deserves proof.', "We're excited to share this.", 'We will open the beta soon.', 'jamjam.tech', '#buildinpublic']) expect([s, needsEvidence(s, '4')]).toEqual([s, false]);
    expect([needsEvidence('We think it helps.', '5'), needsEvidence('Try it.', '5')]).toEqual([true, false]);
    // The shape never exempts the content (PR #99 review): an assertion inside a question, an imperative or an opinion.
    for (const s of ['Did you know JamJam doubles revenue?', 'Try JamJam, guaranteed to double revenue.', 'We think JamJam doubles revenue.', 'Is it true that 9 of 10 founders agree?', 'Ask why Acme switched to JamJam.']) expect([s, needsEvidence(s, '4')]).toEqual([s, true]);
    expect(needsEvidence('Want to know how 40 founders use it?', '3')).toBe(true);
    expect([needsEvidence('JamJam runs on Solana.', '3'), needsEvidence('Stripe uses JamJam.', '3'), needsEvidence('We have 40 users.', '3')]).toEqual([false, true, true]);
  });

  it('refuses each rule on its own: no fact, unknown fact, changed number, superlative, guarantee, not the post\'s words', () => {
    const facts = [{ id: 'f', claim: 'Every approved post is registered on Solana.', quote: null }];
    const rule = (body: string, text: string, ids: string[]) => checkClaims(body, [{ text, fact_ids: ids }], facts, '4', 'JamJam').findings.map((f) => f.rule);
    expect(rule('We registered 12 posts on Solana.', 'We registered 12 posts on Solana', [])).toContain('no_fact');
    expect(rule('We registered posts on Solana.', 'We registered posts on Solana', ['nope'])).toEqual(['unknown_fact', 'no_fact', 'uncovered']);
    expect(rule('We registered 12 posts on Solana.', 'We registered 12 posts on Solana', ['f'])).toContain('number');
    expect(rule('The best way to register posts on Solana.', 'The best way to register posts on Solana', ['f'])).toContain('superlative');
    expect(rule('Every post is guaranteed to be registered on Solana.', 'Every post is guaranteed to be registered on Solana', ['f'])).toContain('guarantee');
    expect(rule('Posts are registered on Solana.', 'Every approved post is registered on Solana', ['f'])).toContain('not_in_post');
  });
});

describe('independent review (G4): another model family, fresh context, verdict computed from findings', () => {
  it('the seeded config gives the reviewer no family the drafter uses, and refuses a config that would', () => {
    expect(JUDGES['create.review']).toBe('create.draft');
    expect(taskModelsError(CREATE_MODELS)).toBeNull();
    expect(taskModelsError({ ...CREATE_MODELS, 'create.review': ['nvidia/llama-3.1-nemotron-70b-instruct:free'] })).toMatch(/shares a model family/);
  });

  it('refuses a review answered by a model outside the reviewer list (e.g. the drafter\'s): the run fails, no post', async () => {
    answeredBy.review_findings = CREATE_MODELS['create.draft'][0];
    const r = await draft();
    expect(r.status).toBe(502);
    expect(db.tables.runs[0].status).toBe('failed');
    expect(db.tables.posts.filter((p) => p.status === 'drafted')).toHaveLength(0);
  });

  it('fails closed with no reviewer: when no reviewer model answers, nothing is saved as approvable', async () => {
    reviewStatus = 400;
    const r = await draft();
    expect(r.status).toBeGreaterThanOrEqual(500);
    expect(db.tables.posts.filter((p) => p.status === 'drafted')).toHaveLength(0);
    expect(db.tables.post_candidates).toHaveLength(0);
  });

  it('a missing or same-family review is no verdict: the review gate fails and the candidate is not approvable', () => {
    const input = { body: GOOD.body, claims: GOOD.claims, facts: FACTS.slice(0, 2).map((f) => ({ id: f.id, claim: f.claim, quote: f.quote })), spec: voiceSpec({ template: 'candid_founder', registeredAt: null }, null), channel: 'LinkedIn', claimsLevel: '4', brandName: 'JamJam', template: null };
    const code = runAll(named('slop,claims,platform,length,voice', 'code'), input);
    const verdict = (rev: unknown, gen: string, judge: string) => verdictOf(0, { ...code, ...runAll(named('review,review_claims,policy,tone', 'model'), { ...input, review: rev as never, generator: gen, judge }) });
    const nem = 'nvidia/nemotron-3-super-120b-a12b:free';
    expect(verdict(goodReview(GOOD.body), nem, 'dots-studio/dots-3-note-preview:free').passed).toBe(true);
    expect(verdict(null, nem, 'dots-studio/dots-3-note-preview:free')).toMatchObject({ passed: false, failedGates: ['review', 'review_claims'] });
    expect(verdict(goodReview(GOOD.body), nem, 'nvidia/llama-3.1-nemotron-70b-instruct:free')).toMatchObject({ passed: false, failedGates: ['review', 'review_claims'] });
    expect(verdict(goodReview(GOOD.body), 'openrouter/free', 'dots-studio/dots-3-note-preview:free')).toMatchObject({ passed: false, failedGates: ['review', 'review_claims'] });
    // The reviewer's claim verdicts gate (architecture §6.1 Claims gate row: at runtime the gate is a judge of another
    // family): one unsupported sentence, or an evidence-bearing sentence it gave no verdict on, fails the candidate.
    const flagged = verdict({ ...goodReview(GOOD.body), claims: [{ text: GOOD.body, fact_ids: [F(1)], supported: false }] }, nem, 'dots-studio/dots-3-note-preview:free');
    expect(flagged).toMatchObject({ passed: false, failedGates: ['review_claims'] });
    const silent = verdict({ ...goodReview(GOOD.body), claims: [] }, nem, 'dots-studio/dots-3-note-preview:free');
    expect(silent).toMatchObject({ passed: false, failedGates: ['review_claims'] });
    expect(silent.reasons[0]).toMatch(/^reviewer gave no verdict on "Teams at 10 companies/);
    // Content findings stay tracked: approval's policyCheck is the content gate.
    const content = verdict({ ...goodReview(GOOD.body), sexual: true }, nem, 'dots-studio/dots-3-note-preview:free');
    expect([content.passed, content.reasons]).toEqual([true, expect.arrayContaining(['content policy: sexual content (tracked)'])]);
  });

  it('the reviewer sees the post, the sentences code found needing evidence, and the facts; never the drafting prompt or the writer\'s claims', async () => {
    await draft();
    const asked = llm('review_findings').map((c) => JSON.parse(c.user) as { post: string; sentences: string[] });
    expect(asked.find((a) => a.post === GOOD.body)!.sentences).toEqual([GOOD.body]);
    for (const c of llm('review_findings')) {
      expect(Object.keys(JSON.parse(c.user))).toEqual(['post', 'sentences', 'facts']);
      expect(c.system).not.toContain('candidate');
      expect(c.user).not.toContain('fact_ids');
    }
  });

  it('nothing grades itself: neither schema asks a model for a score, and the voice fit shown is measured in code', async () => {
    const props = (s: typeof DRAFT_CANDIDATE) => JSON.stringify(s.schema);
    for (const s of [DRAFT_CANDIDATE, REVIEW_FINDINGS]) expect(props(s)).not.toMatch(/voiceFit|"score"|"type":"number"|"type":"integer"/);
    const post = (await draft()).body.post as PostOut;
    const spec = voiceSpec({ template: 'candid_founder', registeredAt: KIT.registered_at }, db.tables.answers[0] as never);
    expect(post.checks.voiceFit).toBe(measureVoice(GOOD.body, spec).fit);
    expect(post.checks.platform).toBe(lintPlatform(GOOD.body, 'LinkedIn').fit);
  });
});

describe('the evaluator registry: one entry per evaluator, named by the definition', () => {
  it('every evaluator the definition names is registered, of the right kind, with a version and a source', () => {
    const measure = DRAFT_POST.steps.find((s) => s.id === 'measure') as { args: Record<string, string> };
    const decide = DRAFT_POST.steps.find((s) => s.id === 'decide') as { args: Record<string, string> };
    expect(named(measure.args.evaluators, 'code').map((e) => e.id)).toEqual(['slop', 'claims', 'platform', 'length', 'voice']);
    expect(named(decide.args.evaluators, 'model').map((e) => e.id)).toEqual(['review', 'review_claims', 'policy', 'tone']);
    for (const [id, e] of Object.entries(EVALUATORS)) expect([e.id, e.version > 0, !!e.source]).toEqual([id, true, true]);
    expect(() => named('slop,nope', 'code')).toThrow(/nope/);
    expect(() => named('review', 'code')).toThrow(/review/);
  });

  it('the claims judge gates (§6.1); other model-judged measures are tracked until calibrated (§13.3)', () => {
    expect(Object.values(EVALUATORS).filter((e) => e.status === 'gate').map((e) => e.id)).toEqual(['slop', 'claims', 'platform', 'length', 'review', 'review_claims']);
  });

  it('a new evaluator is one registry entry: its gate decides the verdict with no other code change', () => {
    EVALUATORS.no_q = { id: 'no_q', version: 1, kind: 'code', status: 'gate', inputs: ['body'], source: 'test', run: ({ body }) => ({ pass: !body.includes('?'), reasons: body.includes('?') ? ['asks a question'] : [] }) };
    try {
      const results = runAll(named('no_q,slop', 'code'), { body: 'Is it good?', claims: [], facts: [], spec: voiceSpec({ template: null, registeredAt: null }, null), channel: '', claimsLevel: '4', brandName: 'X', template: null });
      expect(verdictOf(0, results)).toMatchObject({ passed: false, failedGates: ['no_q'], reasons: ['asks a question'] });
    } finally {
      delete EVALUATORS.no_q;
    }
  });

  it('picks the highest-ranked candidate: approvable first, then fewer failed gates, then fit; ties to the first', () => {
    const v = (idx: number, passed: boolean, failed: number, fit: number) => ({ idx, passed, reasons: [], failedGates: Array(failed).fill('x'), voiceFit: fit, platformFit: 100, rank: (passed ? 1000 : 0) - failed * 100 + fit });
    expect(pick([v(0, false, 1, 99), v(1, true, 0, 10), v(2, true, 0, 10)])).toBe(1);
  });
});

describe('no-AI-slop (G1): one list for the prompt and the check', () => {
  it('the prompt rules are unchanged and built from the same list the check uses', () => {
    expect(SLOP_RULES).toBe(`Write plainly and specifically. Never use these words or phrases: "delve", "unlock", "unleash", "elevate", "seamless", "game-changer", "revolutionize", "cutting-edge", "in today's fast-paced world", "landscape", "tapestry", "empower", "leverage", "synergy", "robust", "harness", "navigate the", "it's not just", "more than just". No em dashes. No hype, no exclamation marks, no rhetorical questions. Do not invent facts, numbers, customers or awards.`);
    for (const t of SLOP_TERMS) expect(slopCheck(`We ${t.say} it.`).passed).toBe(false);
    expect(CREATE_DRAFT_PROMPT).toContain('{{slop_rules}}');
  });

  it('slop fixtures (spec/evals/create/slop.json): every slop post flagged, no human post flagged (§13.2)', () => {
    const fx = JSON.parse(readFileSync(resolvePath(ROOT, 'spec/evals/create/slop.json'), 'utf8')) as { items: { id: string; kind: string; text: string }[] };
    const wrong = fx.items.filter((i) => slopCheck(i.text).passed !== (i.kind === 'human')).map((i) => i.id);
    expect(wrong).toEqual([]);
  });

  it('a sloppy candidate is never the one shown when a clean one exists, and a shipped draft has 0 slop hits', async () => {
    drafts = { 1: SLOPPY, 2: GOOD, 3: SLOPPY };
    const post = (await draft()).body.post as PostOut;
    expect([post.checks.draft.chosen, post.body]).toEqual([1, GOOD.body]);
    expect(slopCheck(post.body).hits).toEqual([]);
  });
});

describe('voice fit (T1a) from research 06 metrics', () => {
  it('templates match the Voice step (steps.ts VOICE_TEMPLATES), dial for dial', () => {
    for (const t of VOICE_TEMPLATES) expect(TEMPLATE_DIALS[t.value]).toEqual(t.v.slice(0, DIALS.length));
    expect(Object.keys(TEMPLATE_DIALS).sort()).toEqual(VOICE_TEMPLATES.map((t) => t.value).sort());
  });

  it('uses the owner\'s dials and sample only when the answer is the one the kit was registered under', () => {
    const ans = { data: { formality: '5', sample: 'Hi.' }, updated_at: '2026-10-12T09:00:00Z', skipped: false };
    expect(voiceSpec({ template: 'friendly', registeredAt: '2026-10-12T10:00:00Z' }, ans)).toMatchObject({ source: 'answer', dials: { formality: 5, warmth: 5 }, sample: 'Hi.' });
    expect(voiceSpec({ template: 'friendly', registeredAt: '2026-10-12T08:00:00Z' }, ans)).toMatchObject({ source: 'template', dials: { formality: 2 }, sample: null });
    expect(voiceSpec({ template: 'unknown', registeredAt: null }, null).template).toBe('candid_founder');
  });

  it('measures sentence length, jargon, emoji, CTA and formality and reports distance from the targets', () => {
    const spec = voiceSpec({ template: 'efficient', registeredAt: null }, null);
    const short = measureVoice('We shipped it. Try it now. It is fast.', spec);
    expect(short.levels).toMatchObject({ sentence_length: 1, cta: 3, emoji: 1 });
    const long = measureVoice('Organisations implementing comprehensive authentication infrastructure consistently underestimate the operational complexity associated with credential rotation, compliance documentation, auditability and interoperability requirements across heterogeneous enterprise environments and jurisdictions.', spec);
    expect(long.levels).toMatchObject({ sentence_length: 5, jargon: 5 });
    expect(long.findings).toEqual(expect.arrayContaining([expect.stringMatching(/^Sentence length reads as 5\/5; the voice asks for 1\/5/), expect.stringMatching(/^Jargon reads as 5\/5/)]));
    expect(long.fit).toBeLessThan(short.fit);
  });
});

describe('platform fit (T1a): a rule-based lint from research 03, no performance prediction', () => {
  it('X: 280 weighted characters is a hard limit; a link and a click-through hook are flagged', () => {
    const x = lintPlatform(`${'a'.repeat(281)}`, 'X');
    expect(x.hardFailures).toEqual(['Within 280 characters as X counts them']);
    const y = lintPlatform('Link below 👇\nhttps://jamjam.tech', 'x');
    expect(y.rules.filter((r) => !r.passed).map((r) => r.id)).toEqual(['x_hook', 'x_link_cost']);
    expect(y.hardFailures).toEqual([]);
  });

  it('LinkedIn: 3,000 characters, engagement bait and broetry; an unknown channel claims no score', () => {
    expect(lintPlatform('a'.repeat(3001), 'LinkedIn').hardFailures).toHaveLength(1);
    expect(lintPlatform("Agree? Comment 'yes' below if you do.", 'LinkedIn').rules.find((r) => r.id === 'li_bait')!.passed).toBe(false);
    expect(isBroetry(['I failed.', 'Then I learned.', 'Then I grew.', 'Now I win.', 'You can too.', 'Here is how.'].join('\n'))).toBe(true);
    expect(lintPlatform('Plain post.', 'Mastodon')).toMatchObject({ channel: null, rules: [], fit: null });
  });
});

describe('decision history (§6.2 "Collect from day one"): edits as original and final, approvals, reject reasons', () => {
  it('records an edit, then an approval with the drafted text and the approved text', async () => {
    const post = (await draft()).body.post as PostOut;
    const e = await call('PUT', `/brands/${BRAND}/posts/${post.id}`, { rev: post.rev ?? 0, body: 'Teams at 10 companies use JamJam.' });
    expect(e.status).toBe(200);
    // The verdict described the drafted text; after a person's edit the approval check decides, as for any edited post.
    const a = await call('POST', `/brands/${BRAND}/posts/${post.id}/approve`, { rev: (e.body.post as PostOut).rev });
    expect(a.status).toBe(200);
    expect(db.tables.post_decisions.map((d) => [d.kind, d.original, d.final, d.decided_by])).toEqual([
      ['edit', GOOD.body, 'Teams at 10 companies use JamJam.', 'u'],
      ['approve', GOOD.body, 'Teams at 10 companies use JamJam.', 'u'],
    ]);
  });

  it('approves a drafted text that passed every gate as is, recorded as approved without edit', async () => {
    const post = (await draft()).body.post as PostOut;
    const a = await call('POST', `/brands/${BRAND}/posts/${post.id}/approve`, { rev: post.rev ?? 0 });
    expect(a.status).toBe(200);
    expect(db.tables.post_decisions.map((d) => [d.kind, d.original === d.final])).toEqual([['approve', true]]);
  });

  it('a change and its decision row land together: if the decision cannot be written, the edit does not land', async () => {
    const post = (await draft()).body.post as PostOut;
    failWrites = /post_decisions|rpc\/change_post_with_decision/;
    const e = await call('PUT', `/brands/${BRAND}/posts/${post.id}`, { rev: post.rev ?? 0, body: 'Teams at 10 companies use JamJam.' });
    expect(e.status).toBe(500);
    expect(db.tables.posts.find((p) => p.id === post.id)).toMatchObject({ body: GOOD.body, rev: 0 });
    failWrites = null;
    // The same revision can then be edited: nothing half-applied blocks it.
    expect((await call('PUT', `/brands/${BRAND}/posts/${post.id}`, { rev: 0, body: 'Teams at 10 companies use JamJam.' })).status).toBe(200);
    expect(db.tables.post_decisions).toHaveLength(1);
  });

  it('records a rejection with its reason code; an unknown reason is refused', async () => {
    const post = (await draft()).body.post as PostOut;
    expect((await call('POST', `/brands/${BRAND}/posts/${post.id}/reject`, { rev: post.rev ?? 0, reason: 'meh' })).status).toBe(400);
    const r = await call('POST', `/brands/${BRAND}/posts/${post.id}/reject`, { rev: post.rev ?? 0, reason: 'off_voice', note: 'too stiff' });
    expect(r.status).toBe(200);
    expect((r.body.post as PostOut).checks.rejected).toMatchObject({ reason: 'off_voice' });
    expect(db.tables.post_decisions.map((d) => [d.kind, d.reason, d.note, d.original])).toEqual([['reject', 'off_voice', 'too stiff', GOOD.body]]);
  });
});

describe('GET /api/drafts/:id/checks: the Ambassador screen\'s DraftCheck shape (#78), from the stored verdict', () => {
  // #78's DraftCheck and DraftRule (web/src/screens/ambassador/types.ts on ui/53-ambassador at c3e9bfe), and its
  // Generate fixture's checks, copied here so the shape is checked without that branch.
  const validCheck = (c: Record<string, unknown>) => {
    const keys = ['id', 'title', 'phrase', 'label', 'blocking', 'fixLabel', 'shortFixLabel', 'rule'];
    const r = c.rule as Record<string, unknown>;
    return Object.keys(c).every((k) => keys.includes(k)) && typeof c.id === 'string' && typeof c.title === 'string' && typeof c.label === 'string'
      && (r.kind === 'phrase' ? typeof r.phrase === 'string' && typeof r.blocks === 'boolean' && ['remove-line', 'replace'].includes((r.fix as { kind: string }).kind) && Object.keys(r).every((k) => ['kind', 'phrase', 'blocks', 'fix'].includes(k))
        : r.kind === 'missing' && Array.isArray(r.anyOf) && typeof r.append === 'string' && typeof r.blocks === 'boolean');
  };
  const FIXTURE_78 = [
    { id: 'banned', title: 'Banned claim', phrase: "10x your team's output", label: "aDNA doesn't allow productivity numbers without a source.", fixLabel: 'Remove line', shortFixLabel: 'Remove', rule: { kind: 'phrase', phrase: "10x your team's output", blocks: true, fix: { kind: 'remove-line' } } },
    { id: 'avoided', title: 'Avoided term', phrase: 'memory dump', label: 'aDNA says "project context".', fixLabel: 'Replace', rule: { kind: 'phrase', phrase: 'memory dump', blocks: false, fix: { kind: 'replace', with: 'project context' } } },
    { id: 'disclosure', title: 'Missing disclosure', label: 'Add "Sponsored by aDNA" or #ad.', fixLabel: 'Add at end', shortFixLabel: 'Add', rule: { kind: 'missing', anyOf: ['Sponsored by aDNA', '#ad'], append: 'Sponsored by aDNA', blocks: true } },
  ];

  it('the validator accepts #78\'s own fixture, and every check served passes it', () => {
    expect(FIXTURE_78.every(validCheck)).toBe(true);
    const out = draftChecks({ channel: 'X', checks: { voiceFit: 70, draft: { bodyHash: 'h', chosen: 0, verdict: { passed: false, reasons: [] }, findings: { slop: ['unlock', '—', 'exclamation mark'], claims: [{ rule: 'number', text: 'We have 12 users', detail: 'no cited fact states 12' }], unsupported: ['Loved by founders'] } } } });
    expect(out.checks.map((c) => [c.title, c.phrase, c.blocking])).toEqual([['Avoided term', 'unlock', true], ['Avoided term', '—', true], ['Avoided term', '!', true], ['Unsupported claim', 'We have 12 users', true], ['Claim to check', 'Loved by founders', false]]);
    expect(out.checks.every((c) => validCheck(c as never))).toBe(true);
    expect([out.score, out.charLimit, out.passed]).toEqual([70, 280, false]);
  });

  it('serves the same verdict the posts API returns, to the owner only', async () => {
    const post = (await draft()).body.post as PostOut;
    const c = await call('GET', `/drafts/${post.id}/checks`);
    expect(c.body).toEqual(JSON.parse(JSON.stringify(draftChecks(post as never))));
    db.tables.brands[0].owner_id = 'someone-else';
    expect((await call('GET', `/drafts/${post.id}/checks`)).status).toBe(404);
  });
});

describe('engine additions this workflow needs', () => {
  it("a 'read' step runs a named read with the run's context; an unknown read is a definition error", async () => {
    const ctx = { env, run: { id: 'r', brand_id: BRAND } as never, state: { input: { step: 'draft' }, steps: {}, prompts: {} } };
    db.tables.run_steps.push({ run_id: 'r', step: 'draft[1]', outcome: 'ok', model: 'a/b:free' }, { run_id: 'r', step: 'draft[0]', outcome: 'ok', model: 'c/d:free' }, { run_id: 'r', step: 'draft[0]', outcome: 'error', model: 'x/y:free' });
    expect((await runStep({ id: 't', type: 'read', label: 't', op: 'trace_models', args: { step: '$input.step' } }, ctx)).output).toEqual({ models: ['c/d:free', 'a/b:free'] });
    await expect(runStep({ id: 't', type: 'read', label: 't', op: 'nope', args: {} }, ctx)).rejects.toThrow(/unknown read step nope/);
    expect(Object.keys(READS)).toEqual(['draft_context', 'draft_retrieve', 'review_inputs', 'trace_models']);
  });

  it('a parallel map starts every item before any finishes, and moves progress past the map once all are done', async () => {
    let inFlight = 0;
    let peak = 0;
    const slow = { ...envWith };
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.startsWith('https://db.test')) return new Response(JSON.stringify(fakeDb(url, init)));
      const body = JSON.parse(String(init!.body)) as { models: string[]; messages: { content: string }[]; response_format: { json_schema: { name: string } } };
      inFlight++; peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      const schema = body.response_format.json_schema.name;
      const content = schema === 'draft_candidate' ? JSON.stringify(GOOD) : JSON.stringify(goodReview(GOOD.body));
      return new Response(JSON.stringify({ model: body.models[0], choices: [{ message: { content } }] }));
    }));
    db.tables.runs.push({ id: 'run-p', brand_id: BRAND, kind: 'draft_post', workflow_version: 1, executor: 'workflows', status: 'running', input: { brief: 'b', channel: 'LinkedIn', kitVersion: 1 }, progress: {} });
    await runWorkflow(slow, 'run-p', fakeStep().api, localDeps);
    expect(db.tables.runs.find((r) => r.id === 'run-p')).toMatchObject({ status: 'done' });
    expect(peak).toBe(3);
  });

  it('inline runs of many steps are allowed only when the request awaits them (no waitUntil window)', () => {
    expect(() => checkExecutor(env, 'inline', DRAFT_POST)).toThrow(/single-step workflows only/);
    expect(() => checkExecutor(env, 'inline', DRAFT_POST, { awaited: true })).not.toThrow();
  });
});

describe('definitions are data (spec/db/013)', () => {
  const sql = readFileSync(resolvePath(ROOT, 'spec/db/013_create_intelligence.sql'), 'utf8');
  it('migration 013 seeds exactly the draft_post definition, its two prompts and its models in seed.ts', () => {
    expect(JSON.parse(/\$spec\$([\s\S]*?)\$spec\$/.exec(sql)![1])).toEqual(DRAFT_POST);
    expect(/\$p1\$([\s\S]*?)\$p1\$/.exec(sql)![1]).toBe(CREATE_DRAFT_PROMPT);
    expect(/\$p2\$([\s\S]*?)\$p2\$/.exec(sql)![1]).toBe(CREATE_REVIEW_PROMPT);
    const rows = [...sql.matchAll(/\('(\w+)', \$cfg\$([\s\S]*?)\$cfg\$::jsonb\)/g)].map(([, key, v]) => ({ key, value: JSON.parse(v) }));
    expect(rows).toEqual(CREATE_CONFIG);
    expect(sql).toMatch(/on conflict \(key\) do update set value = excluded\.value \|\| public\.engine_config\.value/);
    expect(SEEDED_BY['013_create_intelligence.sql']).toEqual({ defs: [DRAFT_POST], prompts: ['create.draft', 'create.review'], config: CREATE_CONFIG });
  });

  it("adds 'read' to the step types run_steps accepts, and reject reasons match posts.ts REJECT_REASONS", async () => {
    const { REJECT_REASONS } = await import('../../worker/posts');
    expect(sql).toMatch(/check \(type in \('fetch','llm','code','read','write','map'\)\)/);
    expect(sql).toContain(`reason in (${REJECT_REASONS.map((r) => `'${r}'`).join(',')})`);
  });

  it('migration 013 holds the two transactional writes the Worker calls, each for the service role only', () => {
    const tx = readFileSync(resolvePath(ROOT, 'spec/db/013_create_intelligence.sql'), 'utf8');
    for (const fn of ['save_draft(jsonb, jsonb)', 'change_post_with_decision(uuid, int, text[], jsonb, jsonb)']) {
      expect(tx).toContain(`create or replace function public.${fn.split('(')[0]}(`);
      expect(tx).toContain(`grant execute on function public.${fn} to service_role;`);
    }
  });

  it('keeps every step output far below the Workflows 1 MiB limit for the largest kit approval accepts', () => {
    // The largest snapshot registration allows: MAX_EVIDENCE_BATCHES batches of 24,000 characters (posts.ts).
    const big = Array.from({ length: 400 }, (_, i) => ({ id: `id-${i}`, claim: 'x'.repeat(240), quote: 'y'.repeat(240), trust: 'owned', review_status: 'approved' }));
    expect(new TextEncoder().encode(JSON.stringify(factDocs(big))).length).toBeLessThan(2 ** 20 / 2);
  });
});

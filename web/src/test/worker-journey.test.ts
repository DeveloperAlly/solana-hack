import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../worker/env';
import { db as engineDb, fakeDbResponse, fakeStep, seedTables } from './engine-harness';
import { runWorkflow } from '../../worker/engine/runner';
import { localDeps } from '../../worker/engine/executor';

// First-run journey backend (issue #48; canvas page "Journey (v3)"). Exercised through the real router (handleApi), with
// Supabase Auth, PostgREST and the model replaced by in-memory fakes, so each test shows allowed and refused cases.
vi.mock('../../worker/registry', () => ({
  registrarFromSecret: async () => ({ address: 'REGISTRAR' }),
  registerKitAttestation: vi.fn(),
  prepareKitAttestation: vi.fn(),
  currentBlockHeight: vi.fn(),
  readKitAttestation: vi.fn(),
  NotLanded: class extends Error {},
  explorerTx: (s: string) => s,
}));
const { handleApi } = await import('../../worker/api');
const { coverage, FIRST_POST_BRIEF, ANON_MAX_SOURCES, samplesFrom } = await import('../../worker/journey');
const { nearestTemplates, voiceAnswerFor, VOICE_TEMPLATES, contrastingTemplates, templateById } = await import('../../worker/voice');

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let llm: (system: string, user: string) => unknown;
let prompts: { system: string; user: string }[];
let limited: boolean;
const users: Record<string, { id: string; email?: string; is_anonymous?: boolean }> = {
  anon: { id: 'a-1', is_anonymous: true },
  anon2: { id: 'a-2', is_anonymous: true },
  expiredAnon: { id: 'a-3', is_anonymous: true },
  perm: { id: 'p-1', email: 'owner@example.com', is_anonymous: false },
};
const env = {
  SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'k', SUPABASE_PUBLISHABLE_KEY: 'pk', REGISTRAR_KEY: '[1]', RPC_URL: 'https://rpc.test', OPENROUTER_API_KEY: 'k',
  PUBLIC_LIMITER: { limit: async () => ({ success: !limited }) },
  RUN_WORKFLOW: { create: async (o: { id: string }) => { await runWorkflow(env, o.id, fakeStep().api, localDeps); return { id: o.id }; } },
} as unknown as Env;

let nextId = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}`;
function matches(row: Row, q: URLSearchParams) {
  for (const [k, v] of q) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue;
    if (v.startsWith('eq.') && String(row[k]) !== v.slice(3)) return false;
    if (v.startsWith('in.(') && !v.slice(4, -1).split(',').includes(String(row[k]))) return false;
    if (v === 'is.null' && row[k] != null) return false;
  }
  return true;
}
function fakeDb(url: string, init: RequestInit = {}) {
  const u = new URL(url);
  const table = u.pathname.split('/').pop()!;
  const q = u.searchParams;
  const method = init.method ?? 'GET';
  const body = init.body ? JSON.parse(String(init.body)) : undefined;
  const rows = (tables[table] ??= []);
  if (method === 'GET') {
    if (Number(q.get('offset') ?? 0) > 0) return [];
    const hit = rows.filter((r) => matches(r, q));
    return q.get('limit') ? hit.slice(0, Number(q.get('limit'))) : hit;
  }
  if (method === 'DELETE') { tables[table] = rows.filter((r) => !matches(r, q)); return null; }
  if (method === 'PATCH') { const hit = rows.filter((r) => matches(r, q)); hit.forEach((r) => Object.assign(r, body)); return hit; }
  const conflict = q.get('on_conflict')?.split(',');
  return ([] as Row[]).concat(body).map((r) => {
    const prev = conflict && rows.find((x) => conflict.every((c) => x[c] === r[c]));
    if (prev) return Object.assign(prev, r);
    const row = { id: uuid(), created_at: new Date(Date.now() + nextId).toISOString(), ...r };
    rows.push(row);
    return row;
  });
}

beforeEach(async () => {
  nextId = 0;
  prompts = [];
  limited = false;
  await seedTables({ brands: [] });
  tables = engineDb.tables;
  llm = () => ({});
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith('https://openrouter.ai')) {
      const [system, userMsg] = (JSON.parse(String(init!.body)).messages as { content: string }[]).map((m) => m.content);
      prompts.push({ system, user: userMsg });
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(llm(system, userMsg)) } }] }));
    }
    if (url === 'https://db.test/auth/v1/user') {
      const token = new Headers(init?.headers).get('authorization')?.slice(7) ?? '';
      const u = token === 'expiredAnon' ? undefined : users[token];
      return u ? new Response(JSON.stringify(u)) : new Response('{}', { status: 401 });
    }
    if (url.includes('/rest/v1/rpc/')) return fakeDbResponse(url, init);
    if (url.startsWith('https://db.test')) return new Response(JSON.stringify(fakeDb(url, init)));
    return new Response('<html><title>Acme</title><body>Acme builds bridges for towns. Founded in 2024.</body></html>', { headers: { 'content-type': 'text/html' } });
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function call(token: string | null, method: string, path: string, body?: unknown) {
  const req = new Request(`https://jamjam.tech${path}`, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    const res = (await handleApi(req, env, new URL(req.url)))!;
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return { status: err.status ?? 500, body: { error: err.message } };
  }
}
const brandRow = (owner: string, extra: Row = {}) => ({ id: uuid(), owner_id: owner, name: 'Acme', type: 'company', description: null, website: 'https://acme.test', goal: null, channel: null, ...extra });
const fact = (brand: string, section: string, extra: Row = {}) => ({ id: uuid(), brand_id: brand, section, claim: `${section} fact`, quote: 'Acme builds bridges', origin: 'source', trust: 'owned', review_status: 'approved', source_id: null, created_at: new Date().toISOString(), ...extra });

describe('reading before sign-in (anonymous users, decision D1)', () => {
  it('lets an anonymous visitor create one brand and refuses a second', async () => {
    const first = await call('anon', 'POST', '/api/brands', { name: 'Acme', website: 'https://acme.test' });
    expect(first.status).toBe(201);
    const second = await call('anon', 'POST', '/api/brands', { name: 'Other' });
    expect(second.status).toBe(409);
  });
  it('does not cap a saved account', async () => {
    await call('perm', 'POST', '/api/brands', { name: 'One' });
    expect((await call('perm', 'POST', '/api/brands', { name: 'Two' })).status).toBe(201);
  });
  it('caps an anonymous brand at the source limit and applies the per-IP limit', async () => {
    const b = brandRow('a-1');
    tables.brands = [b];
    tables.sources = Array.from({ length: ANON_MAX_SOURCES }, () => ({ id: uuid(), brand_id: b.id, url: 'x' }));
    expect((await call('anon', 'POST', `/api/brands/${b.id}/sources`, { url: 'https://acme.test' })).status).toBe(409);
    // Deleting to make room is refused, so the cap bounds what an anonymous visitor reads.
    expect((await call('anon', 'DELETE', `/api/brands/${b.id}/sources/${(tables.sources[0] as { id: string }).id}`)).status).toBe(403);
    expect(tables.sources).toHaveLength(ANON_MAX_SOURCES);
    tables.sources = [];
    limited = true;
    expect((await call('anon', 'POST', `/api/brands/${b.id}/sources`, { url: 'https://acme.test' })).status).toBe(429);
  });
  it('refuses kit and post registration until the brand is saved with an email', async () => {
    const b = brandRow('a-1');
    tables.brands = [b];
    const kit = await call('anon', 'POST', `/api/brands/${b.id}/kit/register`);
    expect(kit).toMatchObject({ status: 403, body: { error: 'save your brand with your email first' } });
    const p = { id: uuid(), brand_id: b.id, rev: 1, status: 'approved', body: 'x', checks: {} };
    tables.posts = [p];
    expect((await call('anon', 'POST', `/api/brands/${b.id}/posts/${p.id}/register`, { rev: 1 })).status).toBe(403);
  });
  it('refuses model calls (section drafts, voice samples) until the brand is saved', async () => {
    const b = brandRow('a-1');
    tables.brands = [b];
    tables.evidence = [fact(b.id, 'purpose')];
    expect((await call('anon', 'POST', `/api/brands/${b.id}/sections/purpose/draft`)).status).toBe(403);
    expect((await call('anon', 'POST', `/api/brands/${b.id}/voice/samples`, { round: 1 })).status).toBe(403);
    expect(prompts).toHaveLength(0);
  });
  it('applies the per-IP limit to anonymous brand creation', async () => {
    limited = true;
    expect((await call('anon', 'POST', '/api/brands', { name: 'Acme' })).status).toBe(429);
  });
  it('refuses requests with no token or an unknown token', async () => {
    expect((await call(null, 'POST', '/api/brands', { name: 'x' })).status).toBe(401);
    expect((await call('nobody', 'POST', '/api/brands', { name: 'x' })).status).toBe(401);
  });
});

describe('claim: brands read anonymously move to an existing account (J2)', () => {
  it('moves the anonymous brands to the signed-in account', async () => {
    const b = brandRow('a-1');
    tables.brands = [b, brandRow('someone-else')];
    const res = await call('perm', 'POST', '/api/me/claim', { anonymousToken: 'anon' });
    expect(res).toMatchObject({ status: 200, body: { moved: [b.id] } });
    expect(tables.brands.filter((r) => r.owner_id === 'p-1')).toHaveLength(1);
    expect(tables.brands.some((r) => r.owner_id === 'someone-else')).toBe(true);
  });
  it('refuses a token that is not an anonymous session, an unknown token, and an anonymous caller', async () => {
    tables.brands = [brandRow('a-1')];
    expect((await call('perm', 'POST', '/api/me/claim', { anonymousToken: 'perm' })).status).toBe(409);
    // An invalid or expired anonymous token cannot be told apart; both are 409 with a reason, never the caller's 401.
    expect((await call('perm', 'POST', '/api/me/claim', { anonymousToken: 'nobody' })).status).toBe(409);
    expect((await call('anon2', 'POST', '/api/me/claim', { anonymousToken: 'anon' })).status).toBe(403);
    expect(await call('perm', 'POST', '/api/me/claim', { anonymousToken: 'expiredAnon' })).toMatchObject({ status: 409 });
    expect(tables.brands[0].owner_id).toBe('a-1');
  });
});

describe('coverage over the kit sections (J1, J3)', () => {
  it('is found with two usable facts, partly with one fact or one waiting for review, needs you with none', () => {
    const c = coverage([
      fact('b', 'purpose'), fact('b', 'purpose'),
      fact('b', 'audience', { trust: 'third_party', review_status: 'proposed' }),
      fact('b', 'origin', { review_status: 'rejected' }),
    ] as never);
    const by = Object.fromEntries(c.sections.map((s) => [s.section, s.status]));
    // audience is also an interview step that messaging is drafted from, so messaging is partly found too.
    expect(by).toMatchObject({ purpose: 'found', audience: 'partly', messaging: 'partly', origin: 'needs-you', voice: 'needs-you' });
    expect(c.covered).toBe(3);
    expect(c.total).toBe(6);
  });
  it('credits interview answers to the sections drafted from them, never basics', () => {
    const answer = (step: string) => fact('b', step, { trust: 'owner_answer', origin: 'owner_answer', quote: null });
    const by = Object.fromEntries(coverage([answer('golden_circle'), answer('golden_circle'), answer('basics')] as never).sections.map((s) => [s.section, s.status]));
    // golden_circle feeds purpose, positioning and messaging (kit.ts SECTIONS.from); basics feeds every section but counts for none.
    expect(by).toMatchObject({ purpose: 'found', positioning: 'found', messaging: 'found', origin: 'needs-you', audience: 'needs-you', voice: 'needs-you' });
  });
  it('is returned on GET /api/brands/:id', async () => {
    const b = brandRow('p-1');
    tables.brands = [b];
    tables.evidence = [fact(b.id, 'purpose'), fact(b.id, 'purpose')];
    const res = await call('perm', 'GET', `/api/brands/${b.id}`);
    expect((res.body.coverage as { covered: number }).covered).toBe(1);
  });
});

describe('voice by example (J4)', () => {
  const sample = (t: string) => ({ template: t, text: `A paragraph about Acme in the ${t} voice.` });
  it('round 1 offers the three most contrasting templates, written only from usable facts', async () => {
    const b = brandRow('p-1');
    tables.brands = [b];
    tables.evidence = [fact(b.id, 'purpose', { claim: 'Acme builds bridges' }), fact(b.id, 'audience', { claim: 'Secret third-party claim', trust: 'third_party', review_status: 'proposed' })];
    const offer = contrastingTemplates(3);
    expect(new Set(offer).size).toBe(3);
    // Duplicates and templates that were not offered are skipped.
    llm = () => ({ samples: [sample(offer[0]), sample(offer[0]), sample('not_a_template'), sample(offer[1]), sample(offer[2])] });
    const res = await call('perm', 'POST', `/api/brands/${b.id}/voice/samples`, { round: 1 });
    expect(res.status).toBe(200);
    expect((res.body.samples as { template: string }[]).map((s) => s.template)).toEqual(offer);
    expect((res.body.samples as { text: string }[]).map((s) => s.text)).toEqual(offer.map((id) => sample(id).text));
    expect((res.body.samples as { answer: Record<string, string> }[])[0].answer).toMatchObject({ template: offer[0], sample: `A paragraph about Acme in the ${offer[0]} voice.` });
    for (const id of offer) expect(prompts[0].user).toContain(id);
    expect(prompts[0].user).toContain('Acme builds bridges');
    expect(prompts[0].user).not.toContain('Secret third-party claim');
  });
  it('round 2 offers the pick and its two nearest templates, and refuses without a pick', async () => {
    const b = brandRow('p-1');
    tables.brands = [b];
    tables.evidence = [fact(b.id, 'purpose')];
    const near = nearestTemplates('friendly');
    expect(near[0]).toBe('friendly');
    llm = () => ({ samples: near.map(sample) });
    const res = await call('perm', 'POST', `/api/brands/${b.id}/voice/samples`, { round: 2, near: 'friendly' });
    expect((res.body.samples as { template: string }[]).map((s) => s.template)).toEqual(near);
    expect((await call('perm', 'POST', `/api/brands/${b.id}/voice/samples`, { round: 2 })).status).toBe(400);
  });
  it('refuses when there are no usable facts, and when the model returns fewer than three usable samples', async () => {
    const b = brandRow('p-1');
    tables.brands = [b];
    expect((await call('perm', 'POST', `/api/brands/${b.id}/voice/samples`, { round: 1 })).status).toBe(409);
    tables.evidence = [fact(b.id, 'purpose')];
    llm = () => ({ samples: [sample('friendly')] });
    expect((await call('perm', 'POST', `/api/brands/${b.id}/voice/samples`, { round: 1 })).status).toBe(502);
    // A malformed reply is a 502, never a 500: samples not an array, or entries that are not objects.
    llm = () => ({ samples: { template: 'friendly' } });
    expect((await call('perm', 'POST', `/api/brands/${b.id}/voice/samples`, { round: 1 })).status).toBe(502);
  });
  it('skips malformed sample entries and keeps the usable ones', async () => {
    const b = brandRow('p-1');
    tables.brands = [b];
    tables.evidence = [fact(b.id, 'purpose')];
    const offer = contrastingTemplates(3);
    llm = () => ({ samples: [null, 7, 'x', ...offer.map(sample)] });
    const res = await call('perm', 'POST', `/api/brands/${b.id}/voice/samples`, { round: 1 });
    expect(res.status).toBe(200);
    expect((res.body.samples as { template: string }[]).map((s) => s.template)).toEqual(offer);
  });
  it('matches a sample by label or by position when the model does not echo the template id', () => {
    const offer = contrastingTemplates(3);
    const labels = offer.map((id) => templateById(id)!.label);
    const byLabel = samplesFrom({ samples: labels.map((l) => ({ template: l.toUpperCase(), text: `In ${l}.` })) }, offer);
    expect(byLabel.map((s) => s.template)).toEqual(offer);
    const byPosition = samplesFrom({ samples: offer.map((_, i) => ({ template: `Style ${i + 1}`, text: `Paragraph ${i + 1}.` })) }, offer);
    expect(byPosition.map((s) => s.text)).toEqual(['Paragraph 1.', 'Paragraph 2.', 'Paragraph 3.']);
    // A known but unoffered template is skipped, not filed under the offered template in its slot.
    const other = VOICE_TEMPLATES.find((t) => !offer.includes(t.value))!.value;
    const mixed = samplesFrom({ samples: [{ template: other, text: 'Wrong voice.' }, { template: offer[1], text: 'B.' }, { template: offer[2], text: 'C.' }] }, offer);
    expect(mixed.map((s) => s.template)).toEqual([offer[1], offer[2]]);
  });
  it('retries once when the first reply is unusable', async () => {
    const b = brandRow('p-1');
    tables.brands = [b];
    tables.evidence = [fact(b.id, 'purpose')];
    const offer = contrastingTemplates(3);
    let n = 0;
    llm = () => (n++ === 0 ? { nothing: true } : { samples: offer.map(sample) });
    const res = await call('perm', 'POST', `/api/brands/${b.id}/voice/samples`, { round: 1 });
    expect(res.status).toBe(200);
    expect(n).toBe(2);
  });
  it('a picked sample is kept in the voice answer but never becomes evidence', async () => {
    const b = brandRow('p-1');
    tables.brands = [b];
    await call('perm', 'PUT', `/api/brands/${b.id}/answers/voice`, { data: { ...voiceAnswerFor('friendly'), sample: 'Acme serves 10,000 towns.' }, skipped: false });
    expect((tables.answers[0].data as Record<string, string>).sample).toBe('Acme serves 10,000 towns.');
    expect(tables.evidence.some((e) => String(e.claim).includes('10,000'))).toBe(false);
  });
  it('a pick saves as the Voice answer the kit policy reads (template, dials, claims gate)', () => {
    const a = voiceAnswerFor('efficient');
    expect(a).toMatchObject({ template: 'efficient', claims: '4', formality: '3', sentence_length: '1' });
    expect(VOICE_TEMPLATES).toHaveLength(12);
  });
});

describe('first post with no brief (J6)', () => {
  it('writes from the registered kit with the first-post brief, and still needs a registered kit', async () => {
    const b = brandRow('p-1');
    tables.brands = [b];
    expect((await call('perm', 'POST', `/api/brands/${b.id}/posts`, {})).status).toBe(409);
    tables.kits = [{ id: uuid(), brand_id: b.id, version: 1, status: 'registered', payload: { policy: { claims: '4', template: 'plainspoken' }, evidence: [], brand: { name: 'Acme' }, sections: [{ section: 'voice', body: 'Plain.' }, { section: 'messaging', body: 'Bridges for towns.' }] } }];
    tables.engine_config.push({ key: 'draft_wait_ms', value: 0 });
    const workflow = env.RUN_WORKFLOW!;
    env.RUN_WORKFLOW = { create: async (o: { id: string }) => ({ id: o.id }) } as never;
    llm = () => ({ body: 'Acme builds bridges for towns. Talk to us.', voiceFit: 80, platform: 70, notes: [] });
    const res = await call('perm', 'POST', `/api/brands/${b.id}/posts`, {});
    expect(res.status).toBe(202);
    expect((tables.runs[0].input as { brief: string }).brief).toBe(FIRST_POST_BRIEF);
    tables.posts = [{ id: uuid(), brand_id: b.id }];
    // Only the first post: a later post with no brief is refused as before, with no model call.
    const calls = prompts.length;
    expect((await call('perm', 'POST', `/api/brands/${b.id}/posts`, { brief: '  ' })).status).toBe(400);
    expect(prompts.length).toBe(calls);
    env.RUN_WORKFLOW = workflow;
  });
});

describe('editing a fact (J3 Edit)', () => {
  it('rejects the source fact and stores the owner wording as an approved owner statement with no quote', async () => {
    const b = brandRow('p-1');
    const f = fact(b.id, 'origin', { trust: 'third_party', review_status: 'proposed', claim: 'Acme started in 2023' });
    tables.brands = [b];
    tables.evidence = [f];
    tables.kit_sections = [{ brand_id: b.id, section: 'origin', citations: [f.id] }];
    const res = await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${f.id}`, { claim: 'Acme started in 2024' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ replaced: f.id, stale: ['origin'] });
    expect(tables.evidence.find((e) => e.id === f.id)!.review_status).toBe('rejected');
    expect(tables.evidence.find((e) => e.claim === 'Acme started in 2024')).toMatchObject({ trust: 'owner_answer', review_status: 'approved', origin: 'owner_answer', quote: null, source_id: null, edited_from: f.id });
  });
  it('survives saving an interview answer for the same section (it is not an interview row)', async () => {
    const b = brandRow('p-1');
    const f = fact(b.id, 'origin', { trust: 'third_party', review_status: 'proposed' });
    tables.brands = [b];
    tables.evidence = [f];
    await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${f.id}`, { claim: 'Owner wording' });
    await call('perm', 'PUT', `/api/brands/${b.id}/answers/origin`, { data: { story: 'We started small' } });
    expect(tables.evidence.some((e) => e.claim === 'Owner wording')).toBe(true);
    // An interview answer for the step is still replaced as before.
    await call('perm', 'PUT', `/api/brands/${b.id}/answers/origin`, { data: { story: 'We started big' } });
    expect(tables.evidence.some((e) => e.claim === 'story: We started small')).toBe(false);
    expect(tables.evidence.some((e) => e.claim === 'story: We started big')).toBe(true);
  });
  it('keeps the owner edit when its source is removed', async () => {
    const b = brandRow('p-1');
    const s = { id: uuid(), brand_id: b.id, url: 'https://acme.test' };
    const f = fact(b.id, 'origin', { trust: 'third_party', review_status: 'proposed', source_id: s.id });
    tables.brands = [b];
    tables.sources = [s];
    tables.evidence = [f];
    await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${f.id}`, { claim: 'Owner wording' });
    expect((await call('perm', 'DELETE', `/api/brands/${b.id}/sources/${s.id}`)).status).toBe(200);
    expect(tables.evidence.map((e) => e.claim)).toEqual(['Owner wording']);
    // Still marked as an edit after the fact it replaced is gone, so an answer save for the section keeps it.
    expect(tables.evidence[0].edited_from).toBe(f.id);
    await call('perm', 'PUT', `/api/brands/${b.id}/answers/origin`, { data: { story: 'We started small' } });
    expect(tables.evidence.some((e) => e.claim === 'Owner wording')).toBe(true);
  });
  it('editing again corrects the same correction, from either the edit or the original fact', async () => {
    const b = brandRow('p-1');
    const f = fact(b.id, 'origin', { trust: 'third_party', review_status: 'proposed' });
    tables.brands = [b];
    tables.evidence = [f];
    const first = await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${f.id}`, { claim: 'First wording' });
    const editId = (first.body.evidence as { id: string }).id;
    const again = await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${editId}`, { claim: 'Second wording' });
    expect(again).toMatchObject({ status: 200, body: { replaced: f.id } });
    await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${f.id}`, { claim: 'Third wording' });
    const approved = tables.evidence.filter((e) => e.review_status === 'approved');
    expect(approved.map((e) => e.claim)).toEqual(['Third wording']);
    // Each save gets a new id, so a section citing an earlier wording is stale and cannot register.
    expect(approved[0].id).not.toBe(editId);
  });
  it('a section citing a correction goes stale when the correction changes, and registration refuses it', async () => {
    const b = brandRow('p-1');
    const f = fact(b.id, 'origin', { trust: 'third_party', review_status: 'proposed' });
    tables.brands = [b];
    tables.evidence = [f];
    const first = await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${f.id}`, { claim: 'First wording' });
    const editId = (first.body.evidence as { id: string }).id;
    tables.kit_sections = [{ brand_id: b.id, section: 'origin', citations: [editId], status: 'approved', body: 'x' }];
    const again = await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${editId}`, { claim: 'Second wording' });
    expect(again.body.stale).toEqual(['origin']);
    const live = new Set(tables.evidence.map((e) => e.id));
    expect(live.has(editId)).toBe(false);
  });
  it('approving the original source fact again retires its correction', async () => {
    const b = brandRow('p-1');
    const f = fact(b.id, 'origin', { trust: 'third_party', review_status: 'proposed' });
    tables.brands = [b];
    tables.evidence = [f];
    const first = await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${f.id}`, { claim: 'Owner wording' });
    const editId = (first.body.evidence as { id: string }).id;
    tables.kit_sections = [{ brand_id: b.id, section: 'origin', citations: [editId], status: 'approved', body: 'x' }];
    // Stand in for the database trigger (spec/db/010): approving the source deletes its correction in the same update.
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const res = await realFetch(url, init);
      if (init?.method === 'PATCH' && url.includes('/evidence?') && String(init.body).includes('"approved"')) tables.evidence = tables.evidence.filter((e) => e.edited_from !== f.id);
      return res;
    }));
    const back = await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${f.id}`, { review_status: 'approved' });
    expect(back.body.stale).toEqual(['origin']);
    expect(tables.evidence.filter((e) => e.review_status === 'approved').map((e) => e.id)).toEqual([f.id]);
  });
  it('refuses an empty edit, an unknown fact and an owner answer', async () => {
    const b = brandRow('p-1');
    const own = fact(b.id, 'origin', { trust: 'owner_answer', origin: 'owner_answer' });
    tables.brands = [b];
    tables.evidence = [own];
    expect((await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${own.id}`, { claim: '  ' })).status).toBe(400);
    expect((await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${uuid()}`, { claim: 'x' })).status).toBe(404);
    expect((await call('perm', 'PATCH', `/api/brands/${b.id}/evidence/${own.id}`, { claim: 'x' })).status).toBe(409);
  });
});

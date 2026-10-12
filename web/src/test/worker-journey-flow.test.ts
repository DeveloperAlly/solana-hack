import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../worker/env';
import { db as engineDb, fakeDbResponse, fakeStep, seedTables } from './engine-harness';
import { runWorkflow } from '../../worker/engine/runner';
import { localDeps } from '../../worker/engine/executor';

// The whole first-run journey, J0 to J7, through the real router in one test: the same calls, in the same order, as
// web/scripts/journey-e2e.mjs makes against the live site. Supabase (Auth and PostgREST), the model, the website and
// Solana are in-memory fakes; everything between them is the production code. This proves the wiring of the critical
// path in CI; the live proof is the journey e2e workflow (issue #4).
const chain = vi.hoisted(() => ({ attestations: new Map<string, Record<string, string>>(), n: 0 }));
vi.mock('../../worker/registry', () => {
  class NotLanded extends Error {}
  return {
    NotLanded,
    explorerTx: (s: string) => `https://explorer.solana.com/tx/${s}?cluster=devnet`,
    registrarFromSecret: async () => ({ address: 'REGISTRAR' }),
    registerKitAttestation: async (_rpc: string, _r: unknown, data: Record<string, string>) => {
      const id = `KITATT${++chain.n}`;
      chain.attestations.set(id, data);
      return { signature: `KITSIG${chain.n}`, attestation: id, explorer: `https://explorer.solana.com/tx/KITSIG${chain.n}?cluster=devnet`, attestationExplorer: `https://explorer.solana.com/address/${id}?cluster=devnet`, registrar: 'REGISTRAR' };
    },
    prepareKitAttestation: async (_rpc: string, _r: unknown, data: Record<string, string>) => {
      const id = `POSTATT${++chain.n}`;
      return { signature: `POSTSIG${chain.n}`, attestation: id, explorer: `https://explorer.solana.com/tx/POSTSIG${chain.n}?cluster=devnet`, lastValidBlockHeight: 150n, send: async () => { chain.attestations.set(id, data); } };
    },
    currentBlockHeight: async () => 100n,
    readKitAttestation: async (_rpc: string, _r: unknown, id: string, want: Record<string, string>) => {
      const a = chain.attestations.get(id);
      return a && Object.entries(want).every(([k, v]) => a[k] === v) ? 'verified' : 'mismatch';
    },
  };
});
const { handleApi } = await import('../../worker/api');

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let nextId = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}`;
const users: Record<string, Row> = { anon: { id: 'a-1', is_anonymous: true }, perm: { id: 'p-1', email: 'owner@example.com', is_anonymous: false } };
const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'k', SUPABASE_PUBLISHABLE_KEY: 'pk', REGISTRAR_KEY: '[1]', RPC_URL: 'https://rpc.test', OPENROUTER_API_KEY: 'k', PUBLIC_LIMITER: { limit: async () => ({ success: true }) } , RUN_WORKFLOW: { create: async (o: { id: string }) => { await runWorkflow(env, o.id, fakeStep().api, localDeps); return { id: o.id }; }, get: async () => ({ status: async () => ({ status: 'complete' }) }) } } as unknown as Env;

function matches(row: Row, q: URLSearchParams) {
  for (const [k, v] of q) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue;
    if (v === 'is.null') { if (row[k] != null) return false; continue; }
    if (v.startsWith('eq.') && String(row[k]) !== decodeURIComponent(v.slice(3))) return false;
    if (v.startsWith('in.(') && !v.slice(4, -1).split(',').map(decodeURIComponent).includes(String(row[k]))) return false;
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
    let hit = rows.filter((r) => matches(r, q));
    if (q.get('order')?.includes('desc')) hit = [...hit].reverse();
    return q.get('limit') ? hit.slice(0, Number(q.get('limit'))) : hit;
  }
  if (method === 'DELETE') { tables[table] = rows.filter((r) => !matches(r, q)); return null; }
  if (method === 'PATCH') { const hit = rows.filter((r) => matches(r, q)); hit.forEach((r) => Object.assign(r, body)); return hit; }
  const conflict = q.get('on_conflict')?.split(',');
  return ([] as Row[]).concat(body).map((r) => {
    const prev = conflict && rows.find((x) => conflict.every((c) => x[c] === r[c]));
    if (prev) return Object.assign(prev, r);
    // Column defaults the migrations set (posts.rev default 0, spec/db/004).
    const defaults = table === 'posts' ? { rev: 0 } : {};
    const row = { id: uuid(), created_at: new Date(Date.now() + nextId).toISOString(), ...defaults, ...r };
    rows.push(row);
    return row;
  });
}

const PAGE = `<html><head><title>Acme</title></head><body>
<p>Acme builds bridges for small towns.</p><p>Acme was founded in 2024 by two engineers.</p>
<p>Our mission is to connect every town to its neighbours.</p><p>Councils and town engineers choose Acme.</p>
<p>Unlike big contractors, Acme designs and builds in one team.</p><p>${'Acme bridge stories. '.repeat(60)}</p></body></html>`;
const FACTS = [
  { section: 'purpose', claim: 'Builds bridges for small towns', quote: 'Acme builds bridges for small towns.' },
  { section: 'origin', claim: 'Founded in 2024 by two engineers', quote: 'Acme was founded in 2024 by two engineers.' },
  { section: 'purpose', claim: 'Mission: connect every town', quote: 'Our mission is to connect every town to its neighbours.' },
  { section: 'audience', claim: 'Councils and town engineers', quote: 'Councils and town engineers choose Acme.' },
  { section: 'positioning', claim: 'Designs and builds in one team', quote: 'Unlike big contractors, Acme designs and builds in one team.' },
  { section: 'messaging', claim: 'Invented award', quote: 'Acme won the Global Bridge Award' },
];
const POST_BODY = 'Acme builds bridges for small towns, designed and built by one team. Talk to us about yours.';
function model(system: string, user: string): unknown {
  if (system.includes('You extract facts')) return { facts: FACTS };
  if (system.includes('You draft one section')) return { body: 'Acme builds bridges for small towns, designed and built by one team.', citations: [] };
  if (system.includes('You show a brand owner')) {
    const offered = [...user.matchAll(/^\d+\. ([a-z_]+):/gm)].map((match) => match[1]);
    expect(offered).toHaveLength(3);
    return { samples: offered.map((t) => ({ template: t, text: `Acme builds bridges for small towns, in the ${t} voice.` })) };
  }
  if (system.includes('You write one social post')) return { body: POST_BODY, voiceFit: 82, platform: 75, notes: [] };
  if (system.includes('You check one social post')) return { unsupported: [], sexual: false, minors: false, explicitLanguage: false };
  if (system.includes('You map the claims')) return { claims: [{ text: 'Acme builds bridges for small towns', opinion: false, facts: [Number(/^\[(\d+)\] .*Acme builds bridges for small towns\./m.exec(user)?.[1] ?? 1)] }, { text: 'Talk to us', opinion: true, facts: [] }] };
  throw new Error(`unexpected model call: ${system.slice(0, 60)}`);
}

beforeEach(async () => {
  await seedTables({ brands: [] });
  tables = engineDb.tables;
  nextId = 0;
  chain.attestations.clear();
  vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    if (u.startsWith('https://openrouter.ai')) {
      const request = JSON.parse(String(init!.body));
      const [system, user] = (request.messages as { content: string }[]).map((message) => message.content);
      const schema = request.response_format?.json_schema?.name;
      let answer: unknown;
      if (schema === 'extracted_facts') answer = { facts: FACTS.map((f) => ({ ...f, slot: 'none', value: '' })) };
      else if (schema === 'support_verdicts') answer = { verdicts: JSON.parse(user).map((f: { id: string }) => ({ id: f.id, supported: true })) };
      else if (schema === 'draft_candidate') answer = { body: POST_BODY, claims: POST_BODY.match(/[^.!?]+[.!?]/g)!.map((text) => ({ text: text.trim(), fact_ids: tables.evidence.filter((f) => f.review_status === 'approved' && f.quote).map((f) => f.id) })) };
      else if (schema === 'review_findings') {
        const sentences = JSON.parse(user).sentences ?? [];
        answer = { claims: sentences.map((text: string) => ({ text, fact_ids: tables.evidence.filter((f) => f.review_status === 'approved' && f.quote).map((f) => f.id), supported: true })), issues: [], tone: ['warmth','energy','humour'].map((dimension) => ({ dimension, observed: 'on' })), sexual: false, minors: false, explicitLanguage: false };
      }
      else answer = model(system, user);
      return new Response(JSON.stringify({ model: request.models?.[0] ?? 'openrouter/free', choices: [{ message: { content: JSON.stringify(answer) } }] }));
    }
    if (u === 'https://db.test/auth/v1/user') {
      const t = new Headers(init?.headers).get('authorization')?.slice(7) ?? '';
      return users[t] ? new Response(JSON.stringify(users[t])) : new Response('{}', { status: 401 });
    }
    if (u.includes('/rest/v1/rpc/')) return fakeDbResponse(u, init);
    if (u.startsWith('https://db.test')) return new Response(JSON.stringify(fakeDb(u, init)));
    if (u.endsWith('/robots.txt')) return new Response('User-agent: *\nAllow: /\n', { headers: { 'content-type': 'text/plain' } });
    return new Response(PAGE, { headers: { 'content-type': 'text/html' } });
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function call(token: string | null, method: string, path: string, body?: unknown) {
  const req = new Request(`https://jamjam.tech/api${path}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4' }, body: body === undefined ? undefined : JSON.stringify(body) });
  try {
    const res = (await handleApi(req, env, new URL(req.url)))!;
    return { status: res.status, body: (await res.json()) as Record<string, any> };
  } catch (e) {
    return { status: (e as { status?: number }).status ?? 500, body: { error: (e as Error).message } as Record<string, any> };
  }
}
async function ok(label: string, p: Promise<{ status: number; body: Record<string, any> }>) {
  const r = await p;
  if (r.status >= 300) throw new Error(`${label}: HTTP ${r.status} ${JSON.stringify(r.body)}`);
  return r.body;
}

describe('first-run journey, J0 to J7, end to end through the router', () => {
  it('reads a site before sign-in, saves, confirms, picks a voice, registers kit v1, registers the first post, and Verify says Official', async () => {
    // J0: no sign-in. One anonymous session, one brand, the site read.
    const { brand } = await ok('create brand', call('anon', 'POST', '/brands', { name: 'Acme', website: 'https://acme.test' }));
    const read = await ok('read site', call('anon', 'POST', `/brands/${brand.id}/sources`, { url: 'https://acme.test' }));
    // J1: facts with quotes; the invented one (its quote is not on the page) is dropped.
    expect(read).toMatchObject({ facts: 5, dropped: 1, kind: 'site' });
    let state = await ok('state', call('anon', 'GET', `/brands/${brand.id}`));
    expect(state.evidence.every((e: Row) => typeof e.quote === 'string' && PAGE.includes(String(e.quote)))).toBe(true);
    expect(state.coverage.ratio).toBeGreaterThanOrEqual(0.7);
    // Anonymous use stops at the model and at Solana.
    expect((await call('anon', 'POST', `/brands/${brand.id}/sections/purpose/draft`)).status).toBe(403);

    // J2: save. The email already has an account, so the brand is claimed into it.
    expect((await ok('claim', call('perm', 'POST', '/me/claim', { anonymousToken: 'anon' }))).moved).toEqual([brand.id]);
    expect((await call('anon', 'GET', `/brands/${brand.id}`)).status).toBe(404);

    // J3: confirm. Owned facts are approved already; one is reworded by the owner.
    const origin = state.evidence.find((e: Row) => e.section === 'origin');
    await ok('edit fact', call('perm', 'PATCH', `/brands/${brand.id}/evidence/${origin.id}`, { claim: 'Founded in 2024 by two bridge engineers' }));

    // J4: voice by example, two rounds; the pick is saved as the Voice answer, with its paragraph.
    const r1 = await ok('voice 1', call('perm', 'POST', `/brands/${brand.id}/voice/samples`, { round: 1 }));
    const r2 = await ok('voice 2', call('perm', 'POST', `/brands/${brand.id}/voice/samples`, { round: 2, near: r1.samples[0].template }));
    expect(r2.samples[0].template).toBe(r1.samples[0].template);
    await ok('save voice', call('perm', 'PUT', `/brands/${brand.id}/answers/voice`, { data: r2.samples[0].answer, skipped: false }));

    // J5: six sections drafted and approved (three gates), kit v1 registered on Solana.
    for (const s of ['origin', 'purpose', 'positioning', 'audience', 'voice', 'messaging']) {
      await ok(`draft ${s}`, call('perm', 'POST', `/brands/${brand.id}/sections/${s}/draft`));
      await ok(`approve ${s}`, call('perm', 'POST', `/brands/${brand.id}/sections/${s}/approve`, { note: 'looks right' }));
    }
    const kit = await ok('register kit', call('perm', 'POST', `/brands/${brand.id}/kit/register`));
    expect(kit.kit).toMatchObject({ version: 1, status: 'registered' });
    expect(kit.explorer).toContain('explorer.solana.com/tx/');

    // J6: the first post with no brief; its claims with their evidence; approved; registered.
    const { post } = await ok('first post', call('perm', 'POST', `/brands/${brand.id}/posts`, {}));
    expect(post.kit_version).toBe(1);
    const claims = await ok('claims', call('perm', 'POST', `/brands/${brand.id}/posts/${post.id}/claims`, { rev: post.rev }));
    expect(claims.claimMap.items[0]).toMatchObject({ status: 'supported', facts: [{ quote: 'Acme builds bridges for small towns.' }] });
    const approved = await ok('approve post', call('perm', 'POST', `/brands/${brand.id}/posts/${post.id}/approve`, { rev: post.rev }));
    const reg = await ok('register post', call('perm', 'POST', `/brands/${brand.id}/posts/${post.id}/register`, { rev: approved.post.rev }));
    expect(reg.post.status).toBe('registered');

    // J7: anyone checks the exact text, no sign-in: Official, for this brand and kit v1. An edited copy is not.
    const v = await ok('verify', call(null, 'POST', '/verify', { text: POST_BODY }));
    expect(v).toMatchObject({ official: true, brand: 'Acme', kitVersion: 1 });
    expect((await ok('verify edited', call(null, 'POST', '/verify', { text: `${POST_BODY} (edited)` }))).official).toBe(false);
    state = await ok('state', call('perm', 'GET', `/brands/${brand.id}`));
    expect(state.kits[0]).toMatchObject({ version: 1, status: 'registered' });
  });
});

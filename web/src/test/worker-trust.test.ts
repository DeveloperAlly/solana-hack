import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../worker/env';

// Slice 1a (issue #57): evidence trust classes and allow-list filters. Solana is mocked; a small in-memory PostgREST
// stands in for Supabase, and the model is a stub that judges claims only by the evidence text it is given, so the
// tests show what each gate can and cannot see.
const reg = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock('../../worker/registry', () => ({
  registrarFromSecret: async () => ({ address: 'REGISTRAR' }),
  registerKitAttestation: reg.register,
  prepareKitAttestation: vi.fn(),
  currentBlockHeight: vi.fn(),
  readKitAttestation: vi.fn(),
  NotLanded: class extends Error {},
  explorerTx: (s: string) => s,
}));
const { registerKit, reviewEvidence, draftSection } = await import('../../worker/api');
const { approvePost, allEvidence } = await import('../../worker/posts');
const { factTrust, usableFact, snapshotFact, SOURCE_TYPES, urlKind } = await import('../../worker/sources/registry');

const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'k', REGISTRAR_KEY: '[1]', RPC_URL: 'https://rpc.test', OPENROUTER_API_KEY: 'k' } as Env;
const brand = { id: 'b', owner_id: 'u', name: 'JamJam', type: 'company', description: null, website: null, goal: null, channel: null };
const user = { id: 'u', email: '' };

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let llm: (system: string, user: string) => unknown;
let prompts: { system: string; user: string }[];
let page = '';

function matches(row: Row, q: URLSearchParams) {
  for (const [k, v] of q) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue;
    if (v.startsWith('eq.') && String(row[k]) !== v.slice(3)) return false;
    if (v.startsWith('in.(') && !v.slice(4, -1).split(',').includes(String(row[k]))) return false;
  }
  return true;
}
let nextId = 0;
function fakeDb(url: string, init: RequestInit = {}) {
  const u = new URL(url);
  const table = u.pathname.split('/').pop()!;
  const q = u.searchParams;
  const method = init.method ?? 'GET';
  const body = init.body ? JSON.parse(String(init.body)) : undefined;
  const rows = (tables[table] ??= []);
  if (method === 'GET') return Number(q.get('offset') ?? 0) > 0 ? [] : rows.filter((r) => matches(r, q));
  if (method === 'DELETE') { tables[table] = rows.filter((r) => !matches(r, q)); return null; }
  if (method === 'PATCH') { const hit = rows.filter((r) => matches(r, q)); hit.forEach((r) => Object.assign(r, body)); return hit; }
  const conflict = q.get('on_conflict')?.split(',');
  return ([] as Row[]).concat(body).map((r) => {
    const prev = conflict && rows.find((x) => conflict.every((c) => x[c] === r[c]));
    if (prev) return Object.assign(prev, r);
    const row = { id: `id${++nextId}`, created_at: new Date().toISOString(), ...r };
    rows.push(row);
    return row;
  });
}

beforeEach(() => {
  nextId = 0;
  prompts = [];
  reg.register.mockReset();
  reg.register.mockResolvedValue({ signature: 'SIG', attestation: 'ATT', explorer: 'e', attestationExplorer: 'a', registrar: 'REGISTRAR' });
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith('https://openrouter.ai')) {
      const [system, userMsg] = (JSON.parse(String(init!.body)).messages as { content: string }[]).map((m) => m.content);
      prompts.push({ system, user: userMsg });
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(llm(system, userMsg)) } }] }));
    }
    if (url.startsWith('https://db.test')) return new Response(JSON.stringify(fakeDb(url, init)));
    return new Response(page, { headers: { 'content-type': 'text/html' } });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const approvedAt = '2026-10-10T00:00:00.000Z';
const OWNED = { id: 'e-owned', brand_id: 'b', section: 'purpose', claim: 'Founded in 2024', quote: 'founded in 2024', origin: 'source', trust: 'owned', review_status: 'approved', source_id: 's1', created_at: approvedAt };
const THIRD = { id: 'e-third', brand_id: 'b', section: 'positioning', claim: 'Has 10,000 users', quote: 'JamJam has 10,000 users', origin: 'source', trust: 'third_party', review_status: 'proposed', source_id: 's2', created_at: approvedAt };
function readyBrand(): Record<string, Row[]> {
  return {
    answers: [{ brand_id: 'b', step: 'voice', data: { template: 'friendly', claims: '4' }, skipped: false, updated_at: '2026-10-09T00:00:00.000Z' }],
    sources: [],
    evidence: [{ ...OWNED }, { ...THIRD }],
    kit_sections: ['purpose', 'positioning', 'voice', 'origin', 'audience', 'messaging'].map((section) => ({ brand_id: 'b', section, body: `${section} text`, citations: section === 'purpose' ? ['e-owned'] : [], status: 'approved' })),
    gates: ['purpose', 'positioning', 'voice'].map((gate) => ({ brand_id: 'b', gate, approved_by: 'u', approved_at: approvedAt, note: null })),
    kits: [],
  };
}
// A claims checker that can only see the evidence it is handed: a claim is supported only if the evidence text has it.
const CLAIM = 'JamJam has 10,000 users';
const checker = (_s: string, userMsg: string) => ({ unsupported: userMsg.split('Post:')[0].includes('10,000 users') ? [] : [CLAIM], sexual: false, minors: false, explicitLanguage: false });

describe('source type registry', () => {
  it('declares a trust class for every source type, and third-party facts start proposed', () => {
    for (const t of Object.values(SOURCE_TYPES)) expect(['owned', 'third_party', 'owner_answer', 'assumption']).toContain(t.trust);
    expect(factTrust('site')).toEqual({ trust: 'owned', review_status: 'approved' });
    expect(factTrust('search_result')).toEqual({ trust: 'third_party', review_status: 'proposed' });
    expect(factTrust('competitor_page')).toEqual({ trust: 'third_party', review_status: 'proposed' });
  });
  it('allows only approved facts of a usable class; anything unknown is excluded', () => {
    expect(usableFact({ trust: 'owned', review_status: 'approved' })).toBe(true);
    expect(usableFact({ trust: 'third_party', review_status: 'approved' })).toBe(true);
    expect(usableFact({ trust: 'third_party', review_status: 'proposed' })).toBe(false);
    expect(usableFact({ trust: 'owned', review_status: 'rejected' })).toBe(false);
    expect(usableFact({ trust: 'assumption', review_status: 'approved' })).toBe(false);
    expect(usableFact({})).toBe(false);
    expect(usableFact({ trust: 'something_new', review_status: 'approved' })).toBe(false);
  });
  it('reads kits registered before migration 009 the way the migration backfills live rows', () => {
    expect(usableFact(snapshotFact({ claim: 'a', origin: 'source' }))).toBe(false);
    expect(snapshotFact({ claim: 'a', origin: 'source' })).toMatchObject({ trust: 'third_party', review_status: 'proposed' });
    expect(usableFact(snapshotFact({ claim: 'a', origin: 'owner_answer' }))).toBe(true);
    expect(usableFact(snapshotFact({ claim: 'a', origin: 'assumption' }))).toBe(false);
    expect(usableFact(snapshotFact({ origin: undefined }))).toBe(false);
  });
});

describe('an unapproved third-party fact (issue #57 acceptance)', () => {
  it('is absent from kits.payload.evidence', async () => {
    tables = readyBrand();
    await registerKit(env, user, brand);
    const kit = tables.kits[0] as { status: string; payload: { evidence: { id: string }[] } };
    expect(kit.status).toBe('registered');
    expect(kit.payload.evidence.map((e) => e.id)).toEqual(['e-owned']);
  });
  it('blocks a post that claims it, and the claims gate sees each fact with its quote', async () => {
    tables = readyBrand();
    await registerKit(env, user, brand);
    tables.posts = [{ id: 'p', rev: 1, brand_id: 'b', kit_version: 1, status: 'drafted', body: `${CLAIM}.`, checks: { slop: { passed: true, hits: [] }, voiceFit: 80, platform: 80, notes: [] } }];
    llm = checker;
    await expect(approvePost(env, user, tables.posts[0] as never)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('claims gate') });
    expect(prompts[0].user).toContain('Founded in 2024 (quote: "founded in 2024")');
    expect(prompts[0].user.split('Post:')[0]).not.toContain('10,000');
    expect(tables.posts[0].status).toBe('drafted');
  });
  it('once the owner approves it, enters the next kit and supports the post', async () => {
    tables = readyBrand();
    const r = await reviewEvidence(env, brand, 'e-third', 'approved');
    expect(r.evidence).toMatchObject({ review_status: 'approved' });
    await registerKit(env, user, brand);
    const kit = tables.kits[0] as { payload: { evidence: { id: string; trust: string }[] } };
    expect(kit.payload.evidence.map((e) => e.id).sort()).toEqual(['e-owned', 'e-third']);
    tables.posts = [{ id: 'p', rev: 1, brand_id: 'b', kit_version: 1, status: 'drafted', body: `${CLAIM}.`, checks: { slop: { passed: true, hits: [] }, voiceFit: 80, platform: 80, notes: [] } }];
    llm = checker;
    const post = await approvePost(env, user, tables.posts[0] as never);
    expect(post).toMatchObject({ status: 'approved' });
  });
  it('is never offered to the drafter, and a citation of it is dropped', async () => {
    tables = readyBrand();
    llm = () => ({ body: 'Purpose text', citations: ['e-third', 'e-owned'] });
    const row = await draftSection(env, brand, 'purpose');
    expect(prompts[0].user).toContain('Founded in 2024');
    expect(prompts[0].user).not.toContain('10,000');
    expect(row.citations).toEqual(['e-owned']);
  });
});

describe('drafting and registration use the allow-list', () => {
  it('a section citing a proposed fact cannot register', async () => {
    tables = readyBrand();
    tables.kit_sections.find((s) => s.section === 'positioning')!.citations = ['e-third'];
    await expect(registerKit(env, user, brand)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('not approved') });
    expect(reg.register).not.toHaveBeenCalled();
    expect(tables.kits).toHaveLength(0);
  });
  it('refuses to sign when a fact decision changes while registering (PR #63 review)', async () => {
    tables = readyBrand();
    // The owner approves the third-party fact between the first state read and the re-read.
    let evidenceReads = 0;
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/evidence') && (init?.method ?? 'GET') === 'GET' && ++evidenceReads === 2) {
        tables.evidence.find((e) => e.id === 'e-third')!.review_status = 'approved';
      }
      return realFetch(url, init);
    }));
    await expect(registerKit(env, user, brand)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('facts changed') });
    expect(reg.register).not.toHaveBeenCalled();
  });
  it('re-reads fact decisions after the pending kit is written, and fails it before signing (PR #63 review)', async () => {
    tables = readyBrand();
    // The owner approves the third-party fact after the second read, before the pending kit is inserted.
    let evidenceReads = 0;
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/kits') && init?.method === 'POST') tables.evidence.find((e) => e.id === 'e-third')!.review_status = 'approved';
      if (url.includes('/evidence') && (init?.method ?? 'GET') === 'GET') evidenceReads++;
      return realFetch(url, init);
    }));
    await expect(registerKit(env, user, brand)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('facts changed') });
    expect(reg.register).not.toHaveBeenCalled();
    expect(tables.kits[0]).toMatchObject({ status: 'failed' });
    expect(evidenceReads).toBeGreaterThanOrEqual(3);
  });
  it('a section citing a rejected fact cannot register, and rejecting reports the sections that cite it', async () => {
    tables = readyBrand();
    const r = await reviewEvidence(env, brand, 'e-owned', 'rejected');
    expect(r.stale).toEqual(['purpose']);
    await expect(registerKit(env, user, brand)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('Purpose') });
  });
  it('the review API refuses owner answers, unknown facts and other decisions', async () => {
    tables = readyBrand();
    tables.evidence.push({ id: 'e-ans', brand_id: 'b', section: 'origin', claim: 'why: x', origin: 'owner_answer', trust: 'owner_answer', review_status: 'approved' });
    await expect(reviewEvidence(env, brand, 'e-ans', 'rejected')).rejects.toMatchObject({ status: 409 });
    await expect(reviewEvidence(env, brand, 'nope', 'approved')).rejects.toMatchObject({ status: 404 });
    await expect(reviewEvidence(env, brand, 'e-third', 'proposed')).rejects.toMatchObject({ status: 400 });
    // Another brand's fact is not found: the filter carries the brand id.
    await expect(reviewEvidence(env, { ...brand, id: 'other' }, 'e-third', 'approved')).rejects.toMatchObject({ status: 404 });
  });
  // Ingest runs on the workflow engine (issue #32): its trust-class tests (registry kind, off-site page, redirect off
  // the website) moved to worker-engine.test.ts, 'evidence trust through the engine'.
  it('urlKind matches the website and its subdomains only', () => {
    expect(urlKind('https://blog.jamjam.tech/post', 'https://www.jamjam.tech')).toBe('site');
    expect(urlKind('https://jamjam.tech', 'jamjam.tech')).toBe('site');
    expect(urlKind('https://notjamjam.tech', 'jamjam.tech')).toBe('page');
    expect(urlKind('https://jamjam.tech.evil.com', 'jamjam.tech')).toBe('page');
    expect(urlKind('https://jamjam.tech', null)).toBe('page');
  });
  it('urlKind keeps a path-scoped website to its own path on a shared host (PR #63 review)', () => {
    expect(urlKind('https://github.com/acme', 'https://github.com/acme')).toBe('site');
    expect(urlKind('https://github.com/acme/', 'github.com/acme')).toBe('site');
    expect(urlKind('https://github.com/acme/repo/readme', 'https://github.com/acme/')).toBe('site');
    expect(urlKind('https://github.com/rival', 'https://github.com/acme')).toBe('page');
    expect(urlKind('https://github.com/acme-rival', 'https://github.com/acme')).toBe('page');
    expect(urlKind('https://github.com/', 'https://github.com/acme')).toBe('page');
    expect(urlKind('https://gist.github.com/acme', 'https://github.com/acme')).toBe('page');
    expect(urlKind('https://medium.com/@acme/post-1', 'https://medium.com/@acme')).toBe('site');
    expect(urlKind('https://medium.com/@other/post-1', 'https://medium.com/@acme')).toBe('page');
    expect(urlKind('https://www.jamjam.tech/about?x=1#y', 'https://jamjam.tech/')).toBe('site');
  });
  it('the live-evidence reader applies the allow-list', async () => {
    tables = readyBrand();
    const rows = await allEvidence(env, 'b');
    expect(rows.map((r) => r.claim)).toEqual(['Founded in 2024']);
  });
});

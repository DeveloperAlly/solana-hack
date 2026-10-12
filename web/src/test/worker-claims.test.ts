import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../worker/env';

// H9 (issue #62): claims on the draft, each with the facts it rests on, before Approve. Through the real router, with
// PostgREST, Supabase Auth and the model replaced by in-memory fakes.
vi.mock('../../worker/registry', () => ({
  registrarFromSecret: async () => ({ address: 'REGISTRAR' }), registerKitAttestation: vi.fn(), prepareKitAttestation: vi.fn(),
  currentBlockHeight: vi.fn(), readKitAttestation: vi.fn(), NotLanded: class extends Error {}, explorerTx: (s: string) => s,
}));
const { handleApi } = await import('../../worker/api');
const { claimMapFrom, mergeSupport, factBatches } = await import('../../worker/claims');
const { evidenceBatches, factLine } = await import('../../worker/posts');

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let reply: unknown;
let prompts: string[];
const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'k', SUPABASE_PUBLISHABLE_KEY: 'pk', REGISTRAR_KEY: '[1]', RPC_URL: 'https://rpc.test', OPENROUTER_API_KEY: 'k' } as unknown as Env;
const BRAND = '00000000-0000-4000-8000-0000000000b1';
const POST = '00000000-0000-4000-8000-0000000000p1'.replace('p', 'a');
const facts = [
  { id: 'f1', claim: 'Acme builds bridges for small towns', quote: 'Acme builds bridges for small towns.', origin: 'source', trust: 'owned', review_status: 'approved' },
  { id: 'f2', claim: 'Founded in 2024', quote: 'founded in 2024', origin: 'source', trust: 'owned', review_status: 'approved' },
  { id: 'f3', claim: 'Has 10,000 users', quote: 'JamJam has 10,000 users', origin: 'source', trust: 'third_party', review_status: 'proposed' },
];
function matches(row: Row, q: URLSearchParams) {
  for (const [k, v] of q) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue;
    if (v.startsWith('eq.') && String(row[k]) !== v.slice(3)) return false;
  }
  return true;
}
function fakeDb(url: string, init: RequestInit = {}) {
  const u = new URL(url);
  const rows = (tables[u.pathname.split('/').pop()!] ??= []);
  const body = init.body ? JSON.parse(String(init.body)) : undefined;
  if ((init.method ?? 'GET') === 'GET') return rows.filter((r) => matches(r, u.searchParams));
  if (init.method === 'PATCH') { const hit = rows.filter((r) => matches(r, u.searchParams)); hit.forEach((r) => Object.assign(r, body)); return hit; }
  return [];
}
beforeEach(() => {
  prompts = [];
  tables = {
    brands: [{ id: BRAND, owner_id: 'p-1', name: 'Acme' }],
    kits: [{ brand_id: BRAND, version: 1, status: 'registered', payload: { policy: { claims: '4', template: 'plainspoken' }, evidence: facts } }],
    posts: [{ id: POST, brand_id: BRAND, body: 'Acme builds bridges for small towns, and 10,000 people use them. Talk to us.', status: 'drafted', kit_version: 1, rev: 3, checks: { slop: { passed: true, hits: [] } } }],
  };
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith('https://openrouter.ai')) { prompts.push((JSON.parse(String(init!.body)).messages as { content: string }[])[1].content); return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] })); }
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'p-1', email: 'o@example.com' }));
    return new Response(JSON.stringify(fakeDb(url, init)));
  }));
});
afterEach(() => vi.unstubAllGlobals());
const call = async (body: unknown) => {
  const req = new Request(`https://jamjam.tech/api/brands/${BRAND}/posts/${POST}/claims`, { method: 'POST', headers: { authorization: 'Bearer t', 'content-type': 'application/json' }, body: JSON.stringify(body) });
  try { const res = (await handleApi(req, env, new URL(req.url)))!; return { status: res.status, body: (await res.json()) as Record<string, unknown> }; }
  catch (e) { return { status: (e as { status?: number }).status ?? 500, body: {} }; }
};

describe('claims on the draft (H9)', () => {
  it('lists each claim with the facts it rests on, marks an unsupported claim, and offers only allow-listed facts', async () => {
    reply = { claims: [
      { text: 'Acme builds bridges for small towns', opinion: false, facts: [1] },
      { text: '10,000 people use them', opinion: false, facts: [] },
      { text: 'Talk to us', opinion: true, facts: [] },
    ] };
    const res = await call({ rev: 3 });
    expect(res.status).toBe(200);
    const map = res.body.claimMap as { items: { text: string; status: string; facts: { id: string; quote: string }[] }[]; unsupported: number; rev: number };
    expect(map.items.map((i) => i.status)).toEqual(['supported', 'unsupported', 'opinion']);
    expect(map.items[0].facts).toEqual([{ id: 'f1', claim: 'Acme builds bridges for small towns', quote: 'Acme builds bridges for small towns.' }]);
    expect(map.unsupported).toBe(1);
    // The proposed third-party fact is not offered, exactly as the claims gate leaves it out.
    expect(prompts[0]).not.toContain('10,000 users');
    // Stored on the post, bound to the revision it describes.
    expect((tables.posts[0].checks as { claimMap: { rev: number } }).claimMap.rev).toBe(3);
  });
  it('refuses a stale revision', async () => {
    reply = { claims: [] };
    expect((await call({ rev: 2 })).status).toBe(409);
  });
  it('never invents support: a fact number outside the list is dropped and the claim becomes unsupported', () => {
    const map = claimMapFrom({ claims: [{ text: 'We won an award', opinion: false, facts: [9, 0, -1] }] }, [{ id: 'f1', claim: 'x', quote: null }], 1, '4');
    expect(map.items[0]).toMatchObject({ status: 'unsupported', facts: [] });
  });
  it('respects the claims gate: a factual claim the gate lets through is not_required, not unsupported', () => {
    const map = claimMapFrom({ claims: [{ text: 'We love bridges', opinion: false, needsEvidence: false, facts: [] }, { text: 'Half price', opinion: false, facts: [] }] }, [], 1, '3');
    expect(map.items.map((i) => i.status)).toEqual(['not_required', 'unsupported']);
    expect(map.unsupported).toBe(1);
  });
  it('a later evidence batch can support a claim the first batch could not, as the gate does', () => {
    let map = claimMapFrom({ claims: [{ text: 'Founded 2024', opinion: false, facts: [] }] }, [{ id: 'a', claim: 'x', quote: null }], 1, '4');
    map = mergeSupport(map, { supports: [{ text: 'Founded 2024', facts: [1] }] }, [{ id: 'f121', claim: 'Founded in 2024', quote: 'founded in 2024' }]);
    expect(map.items[0]).toMatchObject({ status: 'supported', facts: [{ id: 'f121' }] });
    expect(map.unsupported).toBe(0);
  });
  it('batches facts exactly as the claims gate batches evidence', () => {
    const many = Array.from({ length: 1500 }, (_, i) => ({ id: `f${i}`, claim: `Fact number ${i}`, quote: null }));
    const groups = factBatches(many);
    expect(groups.length).toBe(evidenceBatches(many.map(factLine)).length);
    expect(groups.flat().map((f) => f.id)).toEqual(many.map((f) => f.id));
  });
  it('fails closed on an unusable reply', () => {
    expect(() => claimMapFrom({ nope: true }, [], 1, '4')).toThrow();
    // One malformed entry fails the map rather than being dropped (which could hide an unsupported claim).
    expect(() => claimMapFrom({ claims: [{ text: 'Fine', opinion: true, facts: [] }, { text: '  ', facts: [] }] }, [], 1, '4')).toThrow();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../worker/env';

// Kit integrity (issue #31). Solana is mocked; a small in-memory PostgREST stands in for Supabase, so these tests pin
// what the Worker reads and writes around registration, answer saves and ingest.
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
const { registerKit, saveAnswer, ingest, KIT_PENDING_TIMEOUT_MS, staleSections, unapprovedSections } = await import('../../worker/api');
const { normaliseQuote, normalisePage, quoteOnPage, MAX_QUOTE } = await import('../../worker/quote');
const { decode } = await import('../../worker/ingest');

const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'k', REGISTRAR_KEY: '[1]', RPC_URL: 'https://rpc.test', OPENROUTER_API_KEY: 'k' } as Env;
const brand = { id: 'b', owner_id: 'u', name: 'JamJam', type: 'company', description: null, website: null, goal: null, channel: null };
const user = { id: 'u', email: '' };

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let calls: { method: string; table: string; query: string; body?: unknown }[];
let llmReply = '';
let page = '';

// Applies the eq./in. filters this code uses; ignores select, order, limit and offset beyond a single page.
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
  calls.push({ method, table, query: u.search, body });
  const rows = (tables[table] ??= []);
  if (method === 'GET') return Number(q.get('offset') ?? 0) > 0 ? [] : rows.filter((r) => matches(r, q));
  if (method === 'DELETE') { tables[table] = rows.filter((r) => !matches(r, q)); return null; }
  if (method === 'PATCH') { const hit = rows.filter((r) => matches(r, q)); hit.forEach((r) => Object.assign(r, body)); return hit; }
  // POST: insert, or upsert on the conflict columns.
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
  calls = [];
  reg.register.mockReset();
  reg.register.mockResolvedValue({ signature: 'SIG', attestation: 'ATT', explorer: 'e', attestationExplorer: 'a', registrar: 'REGISTRAR' });
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith('https://openrouter.ai')) return new Response(JSON.stringify({ choices: [{ message: { content: llmReply } }] }));
    if (url.startsWith('https://db.test')) return new Response(JSON.stringify(fakeDb(url, init)));
    return new Response(page, { headers: { 'content-type': 'text/html' } });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const approvedAt = '2026-10-10T00:00:00.000Z';
/** A brand ready to register: three gates, every section approved, a voice answer with a claims gate. */
function readyBrand(): Record<string, Row[]> {
  return {
    answers: [{ brand_id: 'b', step: 'voice', data: { template: 'friendly', claims: '4' }, skipped: false, updated_at: '2026-10-09T00:00:00.000Z' }],
    sources: [],
    evidence: [{ id: 'e1', brand_id: 'b', section: 'origin', claim: 'why: proof', quote: null, origin: 'owner_answer', source_id: null, created_at: approvedAt }],
    kit_sections: ['purpose', 'positioning', 'voice', 'origin', 'audience', 'messaging'].map((section) => ({ brand_id: 'b', section, body: `${section} text`, citations: section === 'origin' ? ['e1'] : [], status: 'approved' })),
    gates: ['purpose', 'positioning', 'voice'].map((gate) => ({ brand_id: 'b', gate, approved_by: 'u', approved_at: approvedAt, note: null })),
    kits: [],
  };
}

describe('kit registration needs every drafted section approved', () => {
  it('refuses while any drafted section is unapproved, naming each one, and writes nothing', async () => {
    tables = readyBrand();
    tables.kit_sections.find((s) => s.section === 'messaging')!.status = 'drafted';
    tables.kit_sections.find((s) => s.section === 'origin')!.status = 'drafted';
    await expect(registerKit(env, user, brand)).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/approve these sections first: .*Origin story.*Messaging|approve these sections first: .*Messaging.*Origin story/) });
    expect(calls.filter((c) => c.method !== 'GET')).toHaveLength(0);
    expect(reg.register).not.toHaveBeenCalled();
  });
  it('registers once every section is approved, and records only approved sections', async () => {
    tables = readyBrand();
    await registerKit(env, user, brand);
    const kit = tables.kits[0] as { status: string; payload: { sections: { status: string }[] } };
    expect(kit.status).toBe('registered');
    expect(kit.payload.sections).toHaveLength(6);
    expect(kit.payload.sections.every((s) => s.status === 'approved')).toBe(true);
  });
  it('lists unapproved sections', () => {
    expect(unapprovedSections([{ section: 'a', status: 'approved' }, { section: 'b', status: 'drafted' }])).toEqual(['b']);
  });
});

describe('a kit left pending by an interrupted request', () => {
  const now = Date.parse('2026-10-12T12:00:00.000Z');
  it('still blocks inside the window: a live request may be confirming it', async () => {
    tables = readyBrand();
    tables.kits.push({ id: 'k1', brand_id: 'b', version: 1, hash: 'h', status: 'pending', created_at: new Date(now - 60_000).toISOString() });
    await expect(registerKit(env, user, brand, now)).rejects.toMatchObject({ status: 409, message: 'a registration is already in progress' });
    expect(tables.kits[0].status).toBe('pending');
    expect(reg.register).not.toHaveBeenCalled();
  });
  it('is marked failed after the window, and a new registration proceeds as the next version', async () => {
    tables = readyBrand();
    tables.kits.push({ id: 'k1', brand_id: 'b', version: 1, hash: 'h', status: 'pending', created_at: new Date(now - KIT_PENDING_TIMEOUT_MS - 1000).toISOString() });
    await registerKit(env, user, brand, now);
    const stuck = calls.find((c) => c.method === 'PATCH' && c.table === 'kits' && c.query.includes('id=eq.k1'));
    // Only a row that is still pending is changed, so a late success is never overwritten.
    expect(stuck?.query).toContain('status=eq.pending');
    expect(tables.kits.find((k) => k.id === 'k1')).toMatchObject({ status: 'failed', error: 'registration interrupted' });
    expect(tables.kits.find((k) => k.version === 2)).toMatchObject({ status: 'registered' });
  });
  it('outlasts a whole registration attempt (45 s confirm plus read-back) and a blockhash lifetime', () => {
    expect(KIT_PENDING_TIMEOUT_MS).toBeGreaterThan(2 * 60 * 1000);
  });
});

describe('re-saving an answer reports stale drafts at once', () => {
  function seeded() {
    tables = readyBrand();
    tables.evidence = [
      { id: 'w', brand_id: 'b', section: 'origin', claim: 'why: proof', origin: 'owner_answer', source_id: null },
      { id: 'x', brand_id: 'b', section: 'origin', claim: 'broken: trust', origin: 'owner_answer', source_id: null },
      { id: 's', brand_id: 'b', section: 'origin', claim: 'from the page', origin: 'source', source_id: 'src' },
    ];
    tables.kit_sections = [
      { brand_id: 'b', section: 'origin', body: 'o', citations: ['x', 's'], status: 'approved' },
      { brand_id: 'b', section: 'purpose', body: 'p', citations: ['w'], status: 'approved' },
      { brand_id: 'b', section: 'audience', body: 'a', citations: ['s'], status: 'approved' },
    ];
  }
  it('returns the sections citing a changed field, in the same response', async () => {
    seeded();
    const r = await saveAnswer(env, brand, 'origin', { why: 'proof', broken: 'nobody could check claims' }, false);
    expect(r.stale).toEqual(['origin']);
    expect(r.answer).toMatchObject({ step: 'origin' });
    // The registration check agrees with what the save reported.
    expect(staleSections(tables.kit_sections as never, tables.evidence.map((e) => e.id as string))).toEqual(['origin']);
  });
  it('keeps the evidence id of an unchanged field, so drafts citing it stay valid', async () => {
    seeded();
    const r = await saveAnswer(env, brand, 'origin', { why: 'proof', broken: 'trust' }, false);
    expect(r.stale).toEqual([]);
    expect(tables.evidence.map((e) => e.id).sort()).toEqual(['s', 'w', 'x']);
    expect(calls.some((c) => c.method === 'DELETE' && c.table === 'evidence')).toBe(false);
  });
  it('adds a row for a new field and removes only the cleared one; skipping makes every cited answer stale', async () => {
    seeded();
    await saveAnswer(env, brand, 'origin', { why: 'proof', broken: '', first_win: 'a pilot' }, false);
    expect(tables.evidence.map((e) => e.claim).sort()).toEqual(['first_win: a pilot', 'from the page', 'why: proof']);
    const r = await saveAnswer(env, brand, 'origin', { why: 'proof' }, true);
    expect(r.stale).toEqual(['purpose']);
  });
});

describe('quote normaliser', () => {
  it('unifies curly quotes, apostrophes and dashes', () => {
    expect(normaliseQuote('\u201CWe\u2019re fast\u201D \u2014 and cheap \u2013 ok')).toBe(normaliseQuote('"We\'re fast" - and cheap - ok'));
  });
  it('removes soft hyphens and zero-width characters', () => {
    expect(normaliseQuote('inter\u00ADnational\u200B pro\u200Dof\uFEFF')).toBe('international proof');
  });
  it('rejoins words hyphenated at a line end, but keeps real hyphens', () => {
    expect(normaliseQuote('a brand-\nnew inter-\n  national launch')).toBe('a brandnew international launch');
    expect(normaliseQuote('a well-known brand')).toBe('a well-known brand');
  });
  it('matches a quote of a compound that the page wrapped at its hyphen, in either form', () => {
    const page = normalisePage('a brand-\nnew inter-\nnational launch');
    expect(quoteOnPage(page, 'brand-new')).toBe(true);
    expect(quoteOnPage(page, 'international launch')).toBe(true);
    expect(quoteOnPage(page, 'old launch')).toBe(false);
  });
  it('reads each line-end hyphen on its own, so a page that wraps both kinds still matches (PR #40 review)', () => {
    const page = normalisePage('a brand-\nnew inter-\nnational launch');
    expect(quoteOnPage(page, 'brand-new international launch')).toBe(true);
    expect(quoteOnPage(page, 'brandnew international launch')).toBe(true);
    expect(quoteOnPage(page, 'brand-new inter-national launch')).toBe(true);
    expect(quoteOnPage(page, 'brand new international launch')).toBe(false);
    expect(quoteOnPage(normalisePage('cost (in $) is 1.5x [approx]?'), 'cost (in $) is 1.5x [approx]?')).toBe(true);
  });
  it('collapses whitespace and lowercases', () => {
    expect(normaliseQuote('  Build\t your\n\nBrand  ')).toBe('build your brand');
  });
  it('strips simple Markdown emphasis on both sides of the check', () => {
    expect(normaliseQuote('We **prove** what _brands_ said, `fast`, ~~not~~ *always*')).toBe('we prove what brands said, fast, not always');
    expect(normaliseQuote('snake_case_name stays')).toBe('snake_case_name stays');
  });
  it('applies NFKC, so styled and full-width letters match plain ones', () => {
    expect(normaliseQuote('\uFF2A\uFF41\uFF4D \uFB01ne')).toBe('jam fine');
  });
  it('matches a typographic page against a plain quote, and never an empty quote', () => {
    const hay = normalisePage('<p>JamJam\u2019s **mission**: help brands \u201Cprove\u201D what they say.</p>');
    expect(quoteOnPage(hay, "JamJam's mission: help brands \"prove\"")).toBe(true);
    expect(quoteOnPage(hay, '  ')).toBe(false);
  });
  it('decodes typographic, hex and nested entities in one pass', () => {
    expect(decode('It&rsquo;s &#x2014; &amp;lt; &shy;x &#8217;')).toBe('It\u2019s \u2014 &lt; \u00ADx \u2019');
  });
});

describe('ingest keeps only quotes it checked, as checked', () => {
  const html = `<html><title>JamJam</title><body><p>JamJam\u2019s mission is to help brands prove what they say on\u00AD chain.</p><p>${'Filler text about the product. '.repeat(100)}</p></body></html>`;
  it('stores the checked quote in full, refuses over-long quotes before the check, and stores the full source text', async () => {
    tables = { sources: [], evidence: [] };
    page = html;
    const long = `JamJam's mission ${'x'.repeat(MAX_QUOTE)}`;
    llmReply = JSON.stringify({ facts: [
      { section: 'purpose', claim: 'Helps brands prove claims', quote: "JamJam's mission is to help brands prove what they say on chain." },
      { section: 'purpose', claim: 'Too long', quote: long },
      { section: 'purpose', claim: 'Invented', quote: 'We have a million users' },
    ] });
    const r = await ingest(env, brand, 'https://example.com');
    expect(r).toMatchObject({ facts: 1, dropped: 2 });
    expect(tables.evidence).toHaveLength(1);
    expect(tables.evidence[0].quote).toBe("JamJam's mission is to help brands prove what they say on chain.");
    const src = tables.sources[0] as { status: string; source_text: string; text_excerpt: string };
    expect(src.status).toBe('read');
    expect(src.source_text.length).toBeGreaterThan(src.text_excerpt.length);
    // The stored quote re-checks against the stored source text.
    expect(quoteOnPage(normalisePage(src.source_text), tables.evidence[0].quote as string)).toBe(true);
  });
});

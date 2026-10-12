// @vitest-environment node
// The Worker runs on workerd, whose Request, FormData and File are the WHATWG ones Node provides (undici); jsdom's
// File does not round-trip through a multipart body, so this file runs in the node environment.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND, db, env, fakeDbResponse, fakeStep, seedTables, type Row } from './engine-harness';
import { parseLinkedInExport, parseXArchive, socialPayload } from '../lib/socialExport';
import type { ConversionResult } from '../../worker/sources/types';

// Intake readers (R9 on issue #38; issues #33, #35): documents, the owner's own social exports and Exa research, each a
// reader in the fact-extraction registry (engine/readers.ts). Supabase is the in-memory PostgREST in engine-harness.ts;
// Workers AI, Exa and OpenRouter are stubbed, so no model, converter or search is called for real.
const { handleApi } = await import('../../worker/api');
const { HttpError } = await import('../../worker/env');
const { runWorkflow } = await import('../../worker/engine/runner');
const { localDeps } = await import('../../worker/engine/executor');
const { READERS, readSource, SOURCE_READ_LIMIT } = await import('../../worker/engine/readers');
const { EXTRACT_FACTS, FIND_COMPETITORS } = await import('../../worker/engine/seed');
const { SOURCE_TYPES } = await import('../../worker/sources/registry');
const { readSocial, SOCIAL_LIMIT, SOCIAL_MAX_ITEMS } = await import('../../worker/sources/social');
const { readSearch, readCompetitors, EXA_SEARCH, EXA_SEARCH_PRICE, COMPETITOR_CANDIDATES, COMPETITOR_RESULTS } = await import('../../worker/sources/search');
const { readStored } = await import('../../worker/sources/stored');
const { readBodyCapped, MULTIPART_OVERHEAD } = await import('../../worker/intake');
const { DOC_MAX_BYTES } = await import('../../worker/sources/document');

// ------------------------------------------------------------------------------------------------------------ stubs

/** Facts the extraction stub proposes when its chunk holds the quote; the judge supports every claim listed here. */
const FACTS = [
  { section: 'origin', claim: 'JamJam is based in Melbourne.', quote: 'JamJam is based in Melbourne.', slot: 'headquarters', value: 'Melbourne' },
  { section: 'purpose', claim: 'JamJam helps brands prove what they say.', quote: 'JamJam helps brands prove what they say.', slot: 'none', value: '' },
  { section: 'positioning', claim: 'Every post is checked by a person before it is registered.', quote: 'Every post is checked by a person before it is registered.', slot: 'none', value: '' },
];
const SUPPORTED = new Set(FACTS.map((f) => f.claim));
const PROSE = 'JamJam helps brands prove what they say. JamJam is based in Melbourne. Every post is checked by a person before it is registered.';

let calls: { schema?: string; user: string }[] = [];
let exaCalls: { url: string; body: Record<string, unknown> }[] = [];
let exaReply: ((url: string, body: Record<string, unknown>) => Response) | null = null;

beforeEach(async () => {
  await seedTables();
  db.tables.brands[0].website = 'https://jamjam.tech';
  calls = [];
  exaCalls = [];
  exaReply = null;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u', email: 'o@example.com' }));
    if (url.startsWith('https://db.test')) return fakeDbResponse(url, init);
    if (url.startsWith('https://api.exa.ai/')) {
      const body = JSON.parse(String(init!.body)) as Record<string, unknown>;
      exaCalls.push({ url, body });
      return exaReply ? exaReply(url, body) : new Response('{}', { status: 500 });
    }
    if (url.startsWith('https://openrouter.ai')) {
      const body = JSON.parse(String(init!.body)) as { messages: { content: string }[]; models?: string[]; response_format?: { json_schema?: { name?: string } } };
      const schema = body.response_format?.json_schema?.name;
      const user = body.messages[1].content;
      calls.push({ schema, user });
      const content = schema === 'extracted_facts'
        ? JSON.stringify({ facts: FACTS.filter((f) => user.includes(f.quote)) })
        : JSON.stringify({ verdicts: (JSON.parse(user) as { id: string; claim: string }[]).map((i) => ({ id: i.id, supported: SUPPORTED.has(i.claim) })) });
      return new Response(JSON.stringify({ model: body.models?.[0] ?? `test/${schema}`, usage: { prompt_tokens: 10, completion_tokens: 5 }, choices: [{ message: { content } }] }));
    }
    return new Response('', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const converted = (name: string, data: string): ConversionResult => ({ name, format: 'markdown', data });
let aiOut: (name: string) => ConversionResult = (name) => converted(name, `# ${name}\n\n${PROSE}`);
const AI = { toMarkdown: vi.fn(async (files: { name: string; blob: Blob }[]) => files.map((f) => aiOut(f.name))) };

let step = fakeStep();
const envWith = {
  ...env,
  AI,
  EXA_API_KEY: 'exa-test',
  RUN_WORKFLOW: {
    async create(o: { id?: string }) { await runWorkflow(envWith, o.id!, step.api, localDeps); return { id: o.id! }; },
    async get() { return { status: async () => ({ status: 'complete' }) }; },
  },
};

async function send(req: Request, e: typeof envWith = envWith) {
  step = fakeStep();
  try {
    const res = (await handleApi(req, e, new URL(req.url), { waitUntil: () => undefined }))!;
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  } catch (err) {
    if (err instanceof HttpError) return { status: err.status, body: { error: err.message } as Record<string, unknown> };
    throw err;
  }
}
const api = (method: string, path: string, body?: unknown, e?: typeof envWith) =>
  send(new Request(`https://jamjam.tech/api${path}`, { method, headers: { authorization: 'Bearer t', 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }), e);
function upload(name: string, bytes: Uint8Array<ArrayBuffer>, e?: typeof envWith) {
  const form = new FormData();
  form.set('file', new File([bytes], name));
  return send(new Request(`https://jamjam.tech/api/brands/${BRAND}/sources/document`, { method: 'POST', headers: { authorization: 'Bearer t' }, body: form }), e);
}
const run = (id: unknown) => db.tables.runs.find((r) => r.id === id) as Row & { status: string; output: Record<string, unknown>; error: string | null; input: Record<string, unknown> };
const evidence = () => db.tables.evidence as (Row & { claim: string; quote: string; trust: string; review_status: string; source_id: string; quote_start: number; quote_end: number; page_url: string | null })[];
const source = (id: unknown) => db.tables.sources.find((s) => s.id === id) as Row & { kind: string; status: string; source_text: string; url: string; title: string };

/** Every saved fact quotes its stored source text exactly, at its offsets. */
function quotesExact() {
  for (const e of evidence()) expect(source(e.source_id).source_text.slice(e.quote_start, e.quote_end)).toBe(e.quote);
}

// ------------------------------------------------------------------------------------------------------- documents

describe('documents: converted at upload, text stored, read into extract_facts by the document reader', () => {
  const pdf = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]);

  it.each([['deck.pdf'], ['about.docx'], ['metrics.xlsx']])('%s is converted through the AI binding, stored as an owned document source with no address, and its facts are extracted from the stored text', async (name) => {
    const r = await upload(name, pdf);
    expect(r.status).toBe(202);
    const src = source((r.body.source as Row).id);
    expect(src).toMatchObject({ kind: 'document', status: 'read', url: '', title: name });
    expect(src.source_text).toContain(PROSE);
    const done = run((r.body.run as Row).id);
    expect(done).toMatchObject({ status: 'done', kind: 'extract_facts' });
    expect(done.input).toMatchObject({ reader: 'document', sourceId: src.id });
    // The text was read back from the database by the read step; the converter ran once, at upload.
    expect(AI.toMarkdown).toHaveBeenLastCalledWith([expect.objectContaining({ name })]);
    expect(evidence().map((e) => e.claim).sort()).toEqual(FACTS.map((f) => f.claim).sort());
    for (const e of evidence()) expect(e).toMatchObject({ trust: 'owned', review_status: 'approved', source_id: src.id });
    quotesExact();
    // The run input holds the id, never the document's text.
    expect(JSON.stringify(done.input)).not.toContain('Melbourne');
  });

  it('a file over DOC_MAX_BYTES is refused from its declared length, before any byte of the body is read', async () => {
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({ pull(c) { pulled++; c.enqueue(new Uint8Array(1024)); } });
    const req = new Request(`https://jamjam.tech/api/brands/${BRAND}/sources/document`, {
      method: 'POST', body, duplex: 'half',
      headers: { authorization: 'Bearer t', 'content-type': 'multipart/form-data; boundary=x', 'content-length': String(DOC_MAX_BYTES + MULTIPART_OVERHEAD + 1) },
    } as RequestInit);
    const r = await send(req);
    expect(r).toMatchObject({ status: 413, body: { code: 'too_large' } });
    expect(pulled).toBeLessThanOrEqual(1);
    expect(db.tables.sources).toHaveLength(0);
    expect(AI.toMarkdown).not.toHaveBeenCalledWith([expect.objectContaining({ name: 'big.pdf' })]);
  });

  it('without a declared length the streamed read stops at the cap and the rest is never read', async () => {
    let sent = 0;
    const body = new ReadableStream<Uint8Array>({ pull(c) { sent += 64 * 1024; c.enqueue(new Uint8Array(64 * 1024)); } });
    const out = await readBodyCapped(new Request('https://x.test/', { method: 'POST', body, duplex: 'half' } as RequestInit), 256 * 1024);
    expect(out).toBeNull();
    expect(sent).toBeLessThan(512 * 1024);
    const small = await readBodyCapped(new Request('https://x.test/', { method: 'POST', body: 'hello' }), 1024);
    expect(small && new TextDecoder().decode(small)).toBe('hello');
  });

  it('a file just over the limit inside the multipart cap is refused by the document adapter, with nothing stored', async () => {
    const big = new Uint8Array(DOC_MAX_BYTES + 1);
    const r = await upload('big.pdf', big);
    expect(r).toMatchObject({ status: 413, body: { code: 'too_large' } });
    expect(db.tables.sources).toHaveLength(0);
  });

  it('Codex review on PR #100: a document that converts to more text than one run reads is refused (413) before anything is stored, never cut', async () => {
    const over = 'JamJam is based in Melbourne. '.repeat(Math.ceil((SOURCE_READ_LIMIT.maxChars + 1) / 30));
    aiOut = (name) => converted(name, over);
    try {
      const r = await upload('huge.docx', pdf);
      expect(r).toMatchObject({ status: 413, body: { code: 'too_large' } });
      expect(r.body.error).toMatch(/converts to [\d,]+ characters .* at most 200,000 characters .*Split it into smaller files/);
      expect(db.tables.sources).toHaveLength(0);
      expect(db.tables.runs).toHaveLength(0);
      // Exactly at the limit is read whole.
      aiOut = (name) => converted(name, over.slice(0, SOURCE_READ_LIMIT.maxChars));
      expect((await upload('fits.docx', pdf)).status).toBe(202);
    } finally {
      aiOut = (name) => converted(name, `# ${name}\n\n${PROSE}`);
    }
  });

  it('the stored-text limit is the read step\'s own limit, one constant', () => {
    expect(EXTRACT_FACTS.steps.find((x) => x.id === 'read')).toMatchObject(SOURCE_READ_LIMIT);
    expect(SOCIAL_LIMIT).toBe(SOURCE_READ_LIMIT);
  });

  it('Codex review on PR #100: a caller over its caps is refused before the upload is read or converted, and a failed conversion gives its reservation back', async () => {
    db.tables.engine_config.push({ key: 'metered_call_budget', value: { permanent: 0, anonymous: 0 } });
    const before = AI.toMarkdown.mock.calls.length;
    const refused = await upload('deck.pdf', pdf);
    expect(refused.status).toBe(429);
    const social = await api('POST', `/brands/${BRAND}/sources/social`, { platform: 'x', items: [{ text: PROSE }] });
    expect(social.status).toBe(429);
    expect(AI.toMarkdown.mock.calls.length).toBe(before);
    expect(db.tables.sources).toHaveLength(0);
    expect(db.tables.runs).toHaveLength(0);
    db.tables.engine_config = db.tables.engine_config.filter((c) => c.key !== 'metered_call_budget');
    // Admitted, then the conversion is refused: the reservation is released, so no run row holds the brand's capacity.
    const ocr = await upload('deck.pptx', pdf);
    expect(ocr.status).toBe(415);
    expect(db.tables.runs).toHaveLength(0);
  });

  it('a scanned PDF answers needs_ocr (422) with what to do, and nothing is stored', async () => {
    aiOut = (name) => converted(name, `# ${name}\n## Metadata\n- Producer=Scanner\n## Contents\n### Page 1\n\n### Page 2\n`);
    try {
      const r = await upload('scan.pdf', pdf);
      expect(r).toMatchObject({ status: 422, body: { code: 'needs_ocr', error: expect.stringMatching(/scan/) } });
      expect(db.tables.sources).toHaveLength(0);
      expect(db.tables.runs).toHaveLength(0);
    } finally {
      aiOut = (name) => converted(name, `# ${name}\n\n${PROSE}`);
    }
  });

  it('a PPTX answers unsupported_type (415) and points to PDF; nothing is stored', async () => {
    const r = await upload('deck.pptx', pdf);
    expect(r).toMatchObject({ status: 415, body: { code: 'unsupported_type', error: expect.stringMatching(/PDF/) } });
    expect(db.tables.sources).toHaveLength(0);
  });

  it('a body that is not multipart, or has no file field, is refused before conversion', async () => {
    expect((await api('POST', `/brands/${BRAND}/sources/document`, { file: 'x' })).status).toBe(415);
    const form = new FormData();
    form.set('other', 'x');
    const r = await send(new Request(`https://jamjam.tech/api/brands/${BRAND}/sources/document`, { method: 'POST', headers: { authorization: 'Bearer t' }, body: form }));
    expect(r).toMatchObject({ status: 400, body: { error: expect.stringMatching(/"file"/) } });
  });

  it('a stored source the run cannot start on is removed, not left pending or half added', async () => {
    db.tables.workflow_defs = db.tables.workflow_defs.filter((d) => d.id !== 'extract_facts');
    const r = await upload('deck.pdf', pdf);
    expect(r.status).toBe(503);
    expect(db.tables.sources).toHaveLength(0);
    expect(db.tables.runs).toHaveLength(0);
  });

  it('extract_facts on a stored reader takes only an existing source of this brand and that kind', async () => {
    db.tables.sources.push({ id: '11111111-0000-4000-8000-000000000003', brand_id: BRAND, kind: 'site', url: 'https://jamjam.tech', source_text: PROSE });
    expect((await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'document' })).status).toBe(400);
    expect((await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'document', sourceId: '11111111-0000-4000-8000-000000000003' })).status).toBe(404);
    expect((await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'competitors' })).status).toBe(400);
    expect(db.tables.runs).toHaveLength(0);
  });

  it('the document reader reads only a stored document of the run\'s brand; anything else is not found', async () => {
    db.tables.sources.push({ id: '11111111-0000-4000-8000-000000000001', brand_id: BRAND, kind: 'site', url: 'https://jamjam.tech', source_text: PROSE });
    db.tables.sources.push({ id: '11111111-0000-4000-8000-000000000002', brand_id: 'other-brand', kind: 'document', url: '', title: 'x.pdf', source_text: PROSE });
    expect(await readStored(envWith, 'document', { sourceId: '11111111-0000-4000-8000-000000000001' })).toMatchObject({ ok: false, code: 'invalid_input' });
    expect(await readStored(envWith, 'document', { sourceId: '11111111-0000-4000-8000-000000000002', brandId: BRAND })).toMatchObject({ ok: false, code: 'invalid_input' });
    expect(await readStored(envWith, 'document', { sourceId: 'not-an-id' })).toMatchObject({ ok: false, code: 'invalid_input' });
  });
});

// --------------------------------------------------------------------------------------------------------- socials

describe('socials: the owner\'s own X and LinkedIn exports, parsed in the browser, read into extract_facts', () => {
  const tweets = `window.YTD.tweets.part0 = ${JSON.stringify([
    { tweet: { id_str: '2', full_text: 'Every post is checked by a person before it is registered. &amp; proud of it', created_at: 'Tue Mar 05 10:00:00 +0000 2024', retweeted: false } },
    { tweet: { id_str: '1', full_text: 'JamJam is based in Melbourne. JamJam helps brands prove what they say.', created_at: 'Mon Jan 15 10:00:00 +0000 2024', retweeted: false } },
    { tweet: { id_str: '3', full_text: 'RT @rival: JamJam is based in Sydney.', created_at: 'Mon Jan 15 11:00:00 +0000 2024', retweeted: true } },
  ])}`;

  it('an X archive: the parser output is stored as an owned social_export source, and its facts come only from the owner\'s posts', async () => {
    const parsed = parseXArchive([{ name: 'data/tweets.js', content: tweets }]);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const r = await api('POST', `/brands/${BRAND}/sources/social`, socialPayload(parsed));
    expect(r.status).toBe(202);
    const src = source((r.body.source as Row).id);
    expect(src).toMatchObject({ kind: 'social_export', status: 'read', url: '', title: 'X export (2 items)' });
    // The repost (someone else's words) never reached the Worker.
    expect(src.source_text).not.toContain('Sydney');
    expect(run((r.body.run as Row).id)).toMatchObject({ status: 'done', input: { reader: 'social_export', sourceId: src.id } });
    expect(evidence().map((e) => e.claim).sort()).toEqual(FACTS.map((f) => f.claim).sort());
    for (const e of evidence()) expect(e).toMatchObject({ trust: 'owned', source_id: src.id });
    quotesExact();
  });

  it('a LinkedIn export (Shares.csv and Profile.csv) goes the same way', async () => {
    const parsed = parseLinkedInExport([
      { name: 'Shares.csv', content: `Date,ShareLink,ShareCommentary,SharedUrl,MediaUrl,Visibility\n2024-02-01 09:00:00,https://www.linkedin.com/feed/update/urn:li:share:1,"${PROSE}",,,PUBLIC` },
      { name: 'Profile.csv', content: 'First Name,Last Name,Headline,Summary\nAda,Example,Founder at JamJam,We help brands.' },
    ]);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const r = await api('POST', `/brands/${BRAND}/sources/social`, socialPayload(parsed));
    expect(r.status).toBe(202);
    const src = source((r.body.source as Row).id);
    expect(src).toMatchObject({ kind: 'social_export', title: 'LinkedIn export (3 items)' });
    expect(src.source_text).not.toContain('Ada');
    expect(evidence()).toHaveLength(3);
    quotesExact();
  });

  it('keeps exactly the newest items that fit the read step, whole, and reports the rest', () => {
    const big = 'x'.repeat(SOCIAL_LIMIT.maxChars / 2);
    const r = readSocial({ platform: 'x', items: [{ text: `new ${big}` }, { text: `mid ${big}` }, { text: 'old but short' }] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.text.startsWith('new ')).toBe(true);
    expect(r.text).not.toContain('mid ');
    // An older short item is not slipped in after a newer one was left out.
    expect(r.text).not.toContain('old but short');
    expect(r.meta.notes.join(' ')).toMatch(/2 older item\(s\) left out/);
  });

  it('Codex review on PR #100: only each item\'s text leaves the browser, and the Worker refuses any other field', async () => {
    const parsed = parseLinkedInExport([
      { name: 'Shares.csv', content: `Date,ShareLink,ShareCommentary\n2024-02-01 09:00:00,https://www.linkedin.com/feed/update/urn:li:share:1,"${PROSE}"` },
      { name: 'Profile.csv', content: 'First Name,Headline\nAda,Founder at JamJam' },
    ]);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const payload = socialPayload(parsed);
    expect(Object.keys(payload).sort()).toEqual(['items', 'platform']);
    for (const item of payload.items) expect(Object.keys(item)).toEqual(['text']);
    const sent = JSON.stringify(payload);
    for (const meta of ['2024-02-01', 'linkedin.com/feed', 'Headline', 'Ada']) expect(sent).not.toContain(meta);
    expect(readSocial({ platform: 'x', items: [{ text: 'a post', date: '2024-01-01' }] })).toMatchObject({ ok: false, code: 'invalid_input' });
    expect(readSocial({ platform: 'x', items: [{ text: 'a post' }], account: 'me' })).toMatchObject({ ok: false, code: 'invalid_input' });
    const r = await api('POST', `/brands/${BRAND}/sources/social`, { platform: 'x', items: [{ text: PROSE, url: 'https://x.com/me/status/1' }] });
    expect(r).toMatchObject({ status: 400, body: { code: 'invalid_input' } });
    expect(db.tables.sources).toHaveLength(0);
  });

  it('refuses an unknown platform, a missing list, an item without text, too many items, and an export with no words', async () => {
    expect(readSocial({ platform: 'facebook', items: [] })).toMatchObject({ ok: false, code: 'invalid_input' });
    expect(readSocial({ platform: 'x' })).toMatchObject({ ok: false, code: 'invalid_input' });
    expect(readSocial({ platform: 'x', items: [{ txt: 'a' }] })).toMatchObject({ ok: false, code: 'invalid_input' });
    expect(readSocial({ platform: 'x', items: Array.from({ length: SOCIAL_MAX_ITEMS + 1 }, () => ({ text: 'a' })) })).toMatchObject({ ok: false, code: 'too_large' });
    expect(readSocial({ platform: 'linkedin', items: [{ text: ' ... ' }] })).toMatchObject({ ok: false, code: 'empty' });
    const r = await api('POST', `/brands/${BRAND}/sources/social`, { platform: 'x', items: [] });
    expect(r).toMatchObject({ status: 422, body: { code: 'empty' } });
    expect(db.tables.sources).toHaveLength(0);
  });
});

// ------------------------------------------------------------------------------------------------------ Exa search

const exaResult = (url: string, text: string, title = url) => ({ url, title, text });
const exaOk = (results: unknown[], cost = 0.008) => new Response(JSON.stringify({ results, costDollars: { total: cost } }));

describe('Exa search (#35): web research on the brand, third-party, never pre-approved', () => {
  it('without EXA_API_KEY the search and competitor readers answer not_configured and call nothing', async () => {
    const plain = { ...envWith, EXA_API_KEY: undefined };
    expect(await readSearch(plain, { brandName: 'JamJam', website: 'https://jamjam.tech' })).toMatchObject({ ok: false, code: 'not_configured' });
    expect(await readCompetitors(plain, { brandName: 'JamJam', website: 'https://jamjam.tech' })).toMatchObject({ ok: false, code: 'not_configured' });
    expect(exaCalls).toHaveLength(0);
  });

  it('asks Exa for cached text only, excludes the brand\'s own domain, and leaves out own-site, duplicate, textless and over-long results', async () => {
    exaReply = () => exaOk([
      exaResult('https://news.example/jamjam', `News: ${PROSE}`),
      exaResult('https://blog.jamjam.tech/post', 'own site, read by the site adapter instead'),
      exaResult('https://news.example/jamjam', 'duplicate'),
      exaResult('https://empty.example/', ''),
      exaResult(`https://long.example/${'a'.repeat(2100)}`, 'too long an address to store'),
      exaResult('ftp://files.example/x', 'not http'),
    ]);
    const r = await readSearch(envWith, { brandName: 'JamJam', website: 'https://jamjam.tech' });
    expect(r).toMatchObject({ ok: true, kind: 'search_result', trust: 'third_party', meta: { pages: 1, cost: 0.008, via: 'exa' } });
    expect(r.ok && r.pages!.map((p) => p.url)).toEqual(['https://news.example/jamjam']);
    expect(exaCalls[0]).toMatchObject({ url: EXA_SEARCH, body: { query: 'JamJam (jamjam.tech)', excludeDomains: ['jamjam.tech'], contents: { maxAgeHours: -1 } } });
  });

  it('a second web search while one is listed is refused, so the same pages never become duplicate facts', async () => {
    exaReply = () => exaOk([exaResult('https://news.example/jamjam', PROSE)]);
    expect((await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' })).status).toBe(202);
    const again = await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' });
    expect(again).toMatchObject({ status: 409, body: { error: expect.stringMatching(/remove it to search again/) } });
    expect(db.tables.sources.filter((s) => s.kind === 'search_result')).toHaveLength(1);
  });

  it('Codex review on PR #100: two search requests at once start exactly one search: one Exa call, one run, one source', async () => {
    exaReply = () => exaOk([exaResult('https://news.example/jamjam', PROSE)]);
    const both = await Promise.all([1, 2].map(() => api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' })));
    expect(both.map((r) => r.status).sort()).toEqual([202, 409]);
    expect(both.find((r) => r.status === 409)!.body.error).toMatch(/already in your sources \(/);
    expect(exaCalls).toHaveLength(1);
    expect(db.tables.runs).toHaveLength(1);
    expect(db.tables.sources.filter((s) => s.kind === 'search_result')).toHaveLength(1);
  });

  it('Codex review on PR #100: a reservation no run owns is reclaimed after two minutes, and not before', async () => {
    exaReply = () => exaOk([exaResult('https://news.example/jamjam', PROSE)]);
    // A reservation whose start failed after it was made (no run ever wrote it into its input).
    const orphan = { id: '22222222-0000-4000-8000-000000000002', brand_id: BRAND, kind: 'search_result', url: '', status: 'pending', title: 'Web search: JamJam', created_at: new Date().toISOString() };
    db.tables.sources.push(orphan);
    expect((await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' })).status).toBe(409);
    orphan.created_at = new Date(Date.now() - 2 * 60_000 - 1000).toISOString();
    const r = await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' });
    expect(r.status).toBe(202);
    expect(orphan).toMatchObject({ status: 'failed' });
  });

  it('Codex review on PR #100: a reservation whose run failed is reclaimed at once', async () => {
    exaReply = () => exaOk([exaResult('https://news.example/jamjam', PROSE)]);
    const held = { id: '22222222-0000-4000-8000-000000000003', brand_id: BRAND, kind: 'search_result', url: '', status: 'pending', title: 'Web search: JamJam', created_at: new Date().toISOString() };
    db.tables.sources.push(held);
    db.tables.runs.push({ id: 'dead-run', brand_id: BRAND, kind: 'extract_facts', status: 'failed', input: { sourceId: held.id }, created_at: '2000-01-01T00:00:00.000Z' });
    expect((await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' })).status).toBe(202);
    expect(held).toMatchObject({ status: 'failed' });
  });

  it('a failed web search does not hold the place: a new one can start', async () => {
    db.tables.sources.push({ id: '22222222-0000-4000-8000-000000000001', brand_id: BRAND, kind: 'search_result', url: '', status: 'failed', title: 'Web search: JamJam' });
    exaReply = () => exaOk([exaResult('https://news.example/jamjam', PROSE)]);
    expect((await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' })).status).toBe(202);
  });

  it('Codex review on PR #100: a malformed Exa reply (results an object, or a null entry) is a typed unreadable failure, for search and competitors', async () => {
    for (const bad of [{ results: { url: 'https://a.example/' } }, { results: [null] }, { results: [{ url: 7, text: 'x' }] }, { results: [{ url: 'https://a.example/', text: 3 }] }, [], null]) {
      exaReply = () => new Response(JSON.stringify(bad));
      expect(await readSearch(envWith, { brandName: 'JamJam' })).toMatchObject({ ok: false, code: 'unreadable', reason: expect.stringMatching(/unexpected shape/) });
      expect(await readCompetitors(envWith, { brandName: 'JamJam', website: 'https://jamjam.tech' })).toMatchObject({ ok: false, code: 'unreadable' });
    }
    // Through a run: the read fails once, with a 4xx, and is not retried.
    exaReply = () => new Response(JSON.stringify({ results: [null] }));
    const r = await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' });
    const done = run((r.body.run as Row).id);
    expect(done).toMatchObject({ status: 'failed', error_code: 422 });
    // Six direct brand searches above, one for the run: the run's read was made once. (The six competitor reads are
    // /search calls too, told apart by their "pages similar to" query.)
    const brandSearches = exaCalls.filter((c) => c.url === EXA_SEARCH && !String(c.body.query).startsWith('pages similar to '));
    expect(brandSearches).toHaveLength(7);
    expect(exaCalls).toHaveLength(13);
  });

  it('Codex review on PR #100: each Exa failure is classified where it happens: transient ones retryable (503), the rest not (422)', async () => {
    const cases: [string, () => Response | Promise<Response>, string][] = [
      ['no answer', () => { throw new TypeError('network'); }, 'unavailable'],
      ['429 without Retry-After', () => new Response('{"error":"rate"}', { status: 429 }), 'unavailable'],
      ['500', () => new Response('{}', { status: 500 }), 'unavailable'],
      ['503 overloaded', () => new Response('{"tag":"SERVICE_OVERLOADED"}', { status: 503 }), 'unavailable'],
      ['400', () => new Response('{}', { status: 400 }), 'unreadable'],
      ['401', () => new Response('{}', { status: 401 }), 'unreadable'],
      ['oversized', () => new Response('x'.repeat(2_000_000)), 'unreadable'],
      ['not JSON', () => new Response('<html>'), 'unreadable'],
    ];
    for (const [name, reply, code] of cases) {
      exaReply = reply as () => Response;
      const r = await readSearch(envWith, { brandName: 'JamJam' });
      expect({ name, code: r.ok ? 'ok' : r.code }).toEqual({ name, code });
      const c = await readCompetitors(envWith, { brandName: 'JamJam', website: 'https://jamjam.tech' });
      expect({ name, code: c.ok ? 'ok' : c.code }).toEqual({ name, code });
    }
    const { STATUS } = await import('../../worker/engine/readers');
    expect([STATUS.unavailable, STATUS.unreadable]).toEqual([503, 422]);
  });

  it('a 429 with a short Retry-After is waited out and retried once in the step; a long one is left to the runner', async () => {
    let n = 0;
    exaReply = () => (++n === 1 ? new Response('{}', { status: 429, headers: { 'retry-after': '0' } }) : exaOk([exaResult('https://a.example/', PROSE)]));
    expect(await readSearch(envWith, { brandName: 'JamJam' })).toMatchObject({ ok: true });
    expect(n).toBe(2);
    n = 0;
    exaReply = () => { n++; return new Response('{}', { status: 429, headers: { 'retry-after': '3600' } }); };
    expect(await readSearch(envWith, { brandName: 'JamJam' })).toMatchObject({ ok: false, code: 'unavailable' });
    expect(n).toBe(1);
    const { retryAfterMs } = await import('../../worker/sources/search');
    expect(retryAfterMs('7')).toBe(7000);
    expect(retryAfterMs('Wed, 21 Oct 2015 07:28:10 GMT', Date.parse('Wed, 21 Oct 2015 07:28:00 GMT'))).toBe(10_000);
    expect(retryAfterMs('soon')).toBeNull();
  });

  it('a /search reply without cost records the published list price, with a note', async () => {
    exaReply = () => new Response(JSON.stringify({ results: [exaResult('https://a.example/', PROSE)] }));
    const r = await readSearch(envWith, { brandName: 'JamJam' });
    expect(r).toMatchObject({ ok: true, meta: { cost: 0.007 } });
    expect(r.meta.notes.join(' ')).toMatch(/list price/);
  });

  it('through a run: a retryable Exa failure (503) is retried with backoff, a 4xx (422) is not', async () => {
    exaReply = () => new Response('{}', { status: 503 });
    const a = await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' });
    expect(run((a.body.run as Row).id)).toMatchObject({ status: 'failed', error_code: 503 });
    const retried = exaCalls.length;
    expect(retried).toBe(1 + EXTRACT_FACTS.retries.limit);
    expect(step.delays.filter((d) => d.step === 'read').length).toBe(EXTRACT_FACTS.retries.limit);
    exaCalls = [];
    db.tables.sources = db.tables.sources.filter((x) => x.kind !== 'search_result');
    exaReply = () => new Response('{}', { status: 400 });
    const b = await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' });
    expect(run((b.body.run as Row).id)).toMatchObject({ status: 'failed', error_code: 422 });
    expect(exaCalls).toHaveLength(1);
  });

  it('end to end: a search run stores one search_result source; every fact from it waits for the owner and links to its page', async () => {
    exaReply = () => exaOk([exaResult('https://news.example/jamjam', `In the news. ${PROSE}`, 'JamJam in the news'), exaResult('https://dir.example/jamjam', 'JamJam is based in Melbourne.', 'Directory')]);
    const r = await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' });
    expect(r.status).toBe(202);
    const done = run((r.body.run as Row).id);
    expect(done.status).toBe('done');
    const src = db.tables.sources.find((s) => s.kind === 'search_result') as Row & { id: string; status: string; url: string; title: string };
    expect(src).toMatchObject({ status: 'read', url: '', title: 'Web search: JamJam' });
    expect(done.input).toMatchObject({ reader: 'search', args: { brandName: 'JamJam', website: 'https://jamjam.tech' } });
    expect(evidence().length).toBeGreaterThan(0);
    for (const e of evidence()) expect(e).toMatchObject({ trust: 'third_party', review_status: 'proposed', source_id: src.id });
    expect(evidence().find((e) => e.claim.startsWith('Every post'))!.page_url).toBe('https://news.example/jamjam');
    quotesExact();
  });
});

describe('migration 012 seeds exactly the find_competitors definition in seed.ts', () => {
  it('the SQL row and FIND_COMPETITORS are the same definition', async () => {
    const { readFileSync } = await import('node:fs');
    const { FIND_COMPETITORS, SEEDED_BY } = await import('../../worker/engine/seed');
    const sql = readFileSync(new URL('../../../spec/db/012_intake_sources.sql', import.meta.url), 'utf8');
    expect(JSON.parse(/\$spec\$([\s\S]*?)\$spec\$/.exec(sql)![1])).toEqual(FIND_COMPETITORS);
    expect(SEEDED_BY['012_intake_sources.sql'].defs).toEqual([FIND_COMPETITORS]);
  });
});

describe('competitor candidates (#35): three, with sources, for the positioning step', () => {
  it('a find_competitors run stores up to three candidates, one per host, the brand\'s own site left out, as third-party competitor_page sources', async () => {
    exaReply = () => exaOk([
      exaResult('https://rival-one.example/', 'Rival One makes brand kits.', 'Rival One'),
      exaResult('https://rival-one.example/pricing', 'Same host again.', 'Rival One pricing'),
      exaResult('https://www.jamjam.tech/', 'Our own site.', 'JamJam'),
      exaResult('https://rival-two.example/', 'Rival Two writes posts.', 'Rival Two'),
      exaResult('https://rival-three.example/', 'Rival Three verifies claims.', 'Rival Three'),
      exaResult('https://rival-four.example/', 'Rival Four.', 'Rival Four'),
    ], 0.005);
    const r = await api('POST', `/brands/${BRAND}/competitors`, {});
    expect(r.status).toBe(202);
    const done = run((r.body.run as Row).id);
    expect(done).toMatchObject({ status: 'done', kind: 'find_competitors' });
    // Exa's replacement for its deprecated findSimilar: /search with "pages similar to <url>" (exa-py 2.25.0).
    expect(exaCalls).toHaveLength(1);
    expect(exaCalls[0]).toEqual({ url: EXA_SEARCH, body: {
      query: 'pages similar to https://jamjam.tech/', type: 'auto', numResults: COMPETITOR_RESULTS, excludeDomains: ['jamjam.tech'],
      contents: { text: { maxCharacters: 1500 }, maxAgeHours: -1 },
    } });
    // Within the 10 results the /search base price covers (https://exa.ai/docs/admin/pricing).
    expect(COMPETITOR_RESULTS).toBeLessThanOrEqual(10);
    const out = done.output as { candidates: { url: string; title: string; excerpt: string }[]; cost: number };
    expect(out.candidates.map((c) => c.title)).toEqual(['Rival One', 'Rival Two', 'Rival Three']);
    expect(out.candidates).toHaveLength(COMPETITOR_CANDIDATES);
    expect(out.cost).toBe(0.005);
    const rows = db.tables.sources.filter((s) => s.kind === 'competitor_page');
    expect(rows).toHaveLength(3);
    // Candidates are not facts about the brand: no model was asked about them, and no evidence was written.
    expect(calls).toHaveLength(0);
    expect(evidence()).toHaveLength(0);
    // Listed for the positioning step, kept out of the brand's own sources (and so out of the kit's source list).
    const list = await api('GET', `/brands/${BRAND}/competitors`);
    expect((list.body.candidates as { url: string }[]).map((c) => c.url).sort()).toEqual(['https://rival-one.example/', 'https://rival-three.example/', 'https://rival-two.example/']);
    const brand = await api('GET', `/brands/${BRAND}`);
    expect((brand.body.sources as Row[]).some((s) => s.kind === 'competitor_page')).toBe(false);
  });

  it('a website on a shared host (github.com/acme) is compared and excluded by its path, never the whole host', async () => {
    exaReply = () => exaOk([
      exaResult('https://github.com/acme/tool', 'Acme\'s own repo.', 'acme/tool'),
      exaResult('https://github.com/rival/kit', 'A rival on the same host.', 'rival/kit'),
    ]);
    const r = await readCompetitors(envWith, { brandName: 'Acme', website: 'https://github.com/acme' });
    expect(exaCalls[0]).toMatchObject({ url: EXA_SEARCH, body: { query: 'pages similar to https://github.com/acme', excludeDomains: ['github.com/acme'] } });
    expect(r.ok && r.pages!.map((p) => p.url)).toEqual(['https://github.com/rival/kit']);
    await readSearch(envWith, { brandName: 'Acme', website: 'github.com/acme' });
    expect(exaCalls[1].body).toMatchObject({ query: 'Acme (github.com/acme)', excludeDomains: ['github.com/acme'] });
  });

  it('only the public address is put in the query: user name, password, query string and fragment never reach Exa', async () => {
    exaReply = () => exaOk([exaResult('https://rival.example/', 'Rival.', 'Rival')]);
    await readCompetitors(envWith, { brandName: 'Acme', website: 'https://user:secret@acme.example/shop?ref=x#top' });
    expect(exaCalls[0].body).toMatchObject({ query: 'pages similar to https://acme.example/shop', excludeDomains: ['acme.example/shop'] });
    expect(JSON.stringify(exaCalls[0].body)).not.toMatch(/secret|user|ref=x|#top/);
  });

  it('a competitor read records Exa\'s costDollars.total, and the published /search list price when the reply has none', async () => {
    exaReply = () => exaOk([exaResult('https://rival.example/', 'Rival.', 'Rival')], 0.0042);
    expect(await readCompetitors(envWith, { brandName: 'JamJam', website: 'https://jamjam.tech' })).toMatchObject({ ok: true, meta: { cost: 0.0042 } });
    exaReply = () => new Response(JSON.stringify({ results: [exaResult('https://rival.example/', 'Rival.', 'Rival')] }));
    const r = await readCompetitors(envWith, { brandName: 'JamJam', website: 'https://jamjam.tech' });
    expect(EXA_SEARCH_PRICE).toBe(0.007);
    expect(r).toMatchObject({ ok: true, meta: { cost: EXA_SEARCH_PRICE } });
    expect(r.meta.notes.join(' ')).toMatch(/list price/);
    const done = run((await api('POST', `/brands/${BRAND}/competitors`, {})).body.run && db.tables.runs[0].id);
    expect(done.output).toMatchObject({ cost: EXA_SEARCH_PRICE });
    expect(db.tables.run_steps.find((s) => s.run_id === done.id && s.step === 'read')).toMatchObject({ cost_usd: EXA_SEARCH_PRICE });
  });

  it('Codex review on PR #100: the paid competitor search step is metered, so a brand over its budget or spend is refused before any Exa call', async () => {
    expect(FIND_COMPETITORS.steps.find((x) => x.id === 'read')).toMatchObject({ metered: 1 });
    exaReply = () => exaOk([exaResult('https://rival.example/', 'Rival.', 'Rival')]);
    db.tables.engine_config.push({ key: 'metered_call_budget', value: { permanent: 0, anonymous: 0 } });
    const overBudget = await api('POST', `/brands/${BRAND}/competitors`, {});
    expect(overBudget.status).toBe(429);
    db.tables.engine_config = db.tables.engine_config.filter((c) => c.key !== 'metered_call_budget');
    // Today's recorded spend at the cap (spec/db/011 admit_run sums cost_usd, failed attempts included).
    db.tables.runs.push({ id: 'spent-run', brand_id: BRAND, kind: 'extract_facts', status: 'done', created_at: '2000-01-01T00:00:00.000Z' });
    db.tables.run_steps.push({ id: 's1', run_id: 'spent-run', step: 'read', type: 'fetch', outcome: 'ok', cost_usd: 0.5, created_at: new Date().toISOString() });
    const overSpend = await api('POST', `/brands/${BRAND}/competitors`, {});
    expect(overSpend).toMatchObject({ status: 429, body: { error: expect.stringMatching(/daily allowance/) } });
    expect(exaCalls).toHaveLength(0);
    expect(db.tables.runs.filter((r) => r.kind === 'find_competitors')).toHaveLength(0);
  });

  it('a competitor search whose cost Exa did not report still uses up its metered call', async () => {
    db.tables.engine_config.push({ key: 'metered_call_budget', value: { permanent: 1, anonymous: 1 } });
    exaReply = () => new Response(JSON.stringify({ results: [exaResult('https://rival.example/', 'Rival.', 'Rival')] }));
    const first = await api('POST', `/brands/${BRAND}/competitors`, {});
    expect(run((first.body.run as Row).id)).toMatchObject({ status: 'done', output: { cost: EXA_SEARCH_PRICE } });
    const second = await api('POST', `/brands/${BRAND}/competitors`, {});
    expect(second).toMatchObject({ status: 429, body: { error: expect.stringMatching(/metered calls/) } });
    expect(exaCalls).toHaveLength(1);
  });

  it('Codex review on PR #100: a search or competitor read that Exa charged for but that found nothing usable still records its cost', async () => {
    exaReply = () => exaOk([exaResult('https://jamjam.tech/about', 'Our own page.', 'About')], 0.009);
    const s = await api('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', reader: 'search' });
    const searchRun = run((s.body.run as Row).id);
    expect(searchRun).toMatchObject({ status: 'failed', error_code: 422 });
    expect(db.tables.run_steps.find((x) => x.run_id === searchRun.id && x.step === 'read')).toMatchObject({ outcome: 'error', cost_usd: 0.009 });
    const c = await api('POST', `/brands/${BRAND}/competitors`, {});
    const compRun = run((c.body.run as Row).id);
    expect(compRun.status).toBe('failed');
    expect(db.tables.run_steps.find((x) => x.run_id === compRun.id && x.step === 'read')).toMatchObject({ outcome: 'error', cost_usd: 0.009 });
  });

  it('Codex review on PR #100: the candidates shown are the latest finished run\'s; a newer run still going, or one that fails, never hides them', async () => {
    const list = async () => ((await api('GET', `/brands/${BRAND}/competitors`)).body.candidates as { title: string }[]).map((c) => c.title).sort();
    exaReply = () => exaOk([exaResult('https://a.example/', 'A.', 'A'), exaResult('https://b.example/', 'B.', 'B')]);
    await api('POST', `/brands/${BRAND}/competitors`, {});
    expect(await list()).toEqual(['A', 'B']);
    // A newer run fails: the older finished set is still the one shown.
    exaReply = () => new Response('{}', { status: 400 });
    const failed = await api('POST', `/brands/${BRAND}/competitors`, {});
    expect(run((failed.body.run as Row).id).status).toBe('failed');
    expect(await list()).toEqual(['A', 'B']);
    // A newer run whose rows are saved but which has not finished: still the older set.
    const { saveCompetitorCandidates } = await import('../../worker/intake');
    db.tables.runs.push({ id: 'r-going', brand_id: BRAND, kind: 'find_competitors', status: 'running', created_at: new Date(Date.now() + 1000).toISOString() });
    await saveCompetitorCandidates(envWith, { id: 'r-going', brand_id: BRAND }, { kind: 'competitor_page', trust: 'third_party', title: 't', text: 'G.', truncated: false, pages: [{ url: 'https://g.example/', title: 'G', start: 0, end: 2 }], meta: { pages: 1, cost: 0, ms: 1, notes: [] } });
    expect(await list()).toEqual(['A', 'B']);
    // Once it finishes, its set is the one shown.
    db.tables.runs.find((r) => r.id === 'r-going')!.status = 'done';
    expect(await list()).toEqual(['G']);
    // A newer run that finishes replaces the shown set, and its save prunes sets that can never be shown again.
    exaReply = () => exaOk([exaResult('https://c.example/', 'C.', 'C')]);
    db.tables.runs.find((r) => r.id === 'r-going')!.created_at = new Date(Date.now() - 1000).toISOString();
    await api('POST', `/brands/${BRAND}/competitors`, {});
    expect(await list()).toEqual(['C']);
    const third = await api('POST', `/brands/${BRAND}/competitors`, {});
    expect(run((third.body.run as Row).id).status).toBe('done');
    expect(db.tables.sources.filter((x) => x.kind === 'competitor_page' && ['A', 'B', 'G'].includes(String(x.title)))).toHaveLength(0);
  });

  it('a retried save of the same run writes no second row; each run keeps its own rows', async () => {
    const { saveCompetitorCandidates } = await import('../../worker/intake');
    db.tables.runs.push({ id: 'r-one', brand_id: BRAND, kind: 'find_competitors', status: 'running', created_at: new Date().toISOString() });
    const read = { kind: 'competitor_page', trust: 'third_party', title: 't', text: 'R.', truncated: false, pages: [{ url: 'https://r.example/', title: 'R', start: 0, end: 2 }], meta: { pages: 1, cost: 0, ms: 1, notes: [] } };
    await saveCompetitorCandidates(envWith, { id: 'r-one', brand_id: BRAND }, read);
    await saveCompetitorCandidates(envWith, { id: 'r-one', brand_id: BRAND }, read);
    expect(db.tables.sources.filter((x) => x.kind === 'competitor_page')).toHaveLength(1);
    expect(db.tables.sources[0]).toMatchObject({ run_id: 'r-one' });
  });

  it('a brand without a website is told to add one; nothing is called', async () => {
    expect(await readCompetitors(envWith, { brandName: 'JamJam', website: null })).toMatchObject({ ok: false, code: 'invalid_input' });
    expect(exaCalls).toHaveLength(0);
  });
});

// ------------------------------------------------------------------------------------------------- composability

describe('composability: each reader is one registry entry over its own adapter', () => {
  it('every new reader is registered and every kind it returns is a declared source type with its trust', async () => {
    for (const name of ['document', 'social_export', 'search', 'competitors']) expect(Object.keys(READERS)).toContain(name);
    expect(SOURCE_TYPES.social_export.trust).toBe('owned');
    expect(SOURCE_TYPES.document.trust).toBe('owned');
    expect(SOURCE_TYPES.search_result.trust).toBe('third_party');
    expect(SOURCE_TYPES.competitor_page.trust).toBe('third_party');
  });
  it('readSource caps a stored source like any other and keeps a search\'s page offsets', async () => {
    exaReply = () => exaOk([exaResult('https://a.example/', 'Alpha text.'), exaResult('https://b.example/', 'Beta text.')]);
    const out = await readSource(envWith, 'search', { brandName: 'JamJam', website: 'https://jamjam.tech' }, 200000, 600000);
    expect(out.pages.map((p) => out.text.slice(p.start, p.end))).toEqual(['Alpha text.', 'Beta text.']);
  });
});

import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND, db, env, fakeDb, fakeStep, seedTables, type Row } from './engine-harness';
import { filler, NEWS_PROPOSALS, NEWS_TEXT, PLANTED, SITE_PROPOSALS, SITE_SENTENCES, SUPPORT_LABELS, type Proposal } from './extract-fixtures';

// Fact extraction (issue #64; architecture §6.1 "Fact extraction with quote check", §13). Supabase is the in-memory
// PostgREST in engine-harness.ts; pages and OpenRouter are stubbed fetches, so the model is mocked throughout: the
// extraction stub proposes the fixture facts, and the support-check stub answers from hand labels.
const { handleApi } = await import('../../worker/api');
const { HttpError } = await import('../../worker/env');
const { runWorkflow } = await import('../../worker/engine/runner');
const { localDeps } = await import('../../worker/engine/executor');
const { EXTRACT_FACTS, EXTRACT_CHUNK_PROMPT, CHECK_SUPPORT_PROMPT, SEEDED_BY } = await import('../../worker/engine/seed');
const { chatBody, chat, NO_PROVIDER } = await import('../../worker/llm');
const { schemaError } = await import('../../worker/schema');
const { EXTRACTED_FACTS, SUPPORT_VERDICTS } = await import('../../worker/extract/schemas');
const { chunkText, CHUNK_DEFAULTS } = await import('../../worker/extract/chunk');
const { alignQuote, bestFuzzySpan, FUZZY_MIN } = await import('../../worker/extract/align');
const { alignFacts, chunkSource, decideFacts, supportBatches } = await import('../../worker/extract/pipeline');
const { confidenceOf, findConflicts, numbersSupported } = await import('../../worker/extract/facts');
const { initialReviewFor } = await import('../../worker/extract/save');
const { normaliseMapped, normalisePage, normaliseQuote, quoteOnPage, MAX_QUOTE } = await import('../../worker/quote');
const { readSource } = await import('../../worker/engine/readers');

const page = (paras: string[]) => `<html><title>JamJam</title><body>${paras.map((p) => `<p>${p}</p>`).join('')}</body></html>`;
const SITE_PARAS = [...SITE_SENTENCES.slice(0, 3), ...filler(200).split('\n\n'), ...SITE_SENTENCES.slice(3)];
const PAGES: Record<string, string> = {
  'https://jamjam.tech/': page(SITE_PARAS),
  'https://news.example/jamjam': page([NEWS_TEXT]),
  'https://other.example/profile': page(['JamJam, founded in 2021, is a Melbourne company.']),
};

type Call = { schema?: string; body: Record<string, unknown>; user: string; system: string };
let calls: Call[] = [];
let proposals: Proposal[] = [];
let extractReply: ((user: string) => string) | null = null;

const propose = (user: string) => JSON.stringify({ facts: proposals.filter((p) => user.includes(p.when)).map(({ when: _w, ...f }) => f) });
function judge(user: string) {
  const items = JSON.parse(user) as { id: string; claim: string; passage: string }[];
  return JSON.stringify({
    verdicts: items.map((i) => {
      if (!(i.claim in SUPPORT_LABELS)) throw new Error(`no support label for "${i.claim}"`);
      return { id: i.id, supported: SUPPORT_LABELS[i.claim] };
    }),
  });
}

beforeEach(async () => {
  await seedTables();
  db.tables.brands[0].website = 'https://jamjam.tech';
  calls = [];
  proposals = [...SITE_PROPOSALS, ...NEWS_PROPOSALS];
  extractReply = null;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u', email: 'o@example.com' }));
    if (url.startsWith('https://db.test')) return new Response(JSON.stringify(fakeDb(url, init)));
    if (url.endsWith('/robots.txt')) return new Response('', { status: 404 });
    if (url.startsWith('https://openrouter.ai')) {
      const body = JSON.parse(String(init!.body)) as { messages: { content: string }[]; response_format?: { json_schema?: { name?: string } } };
      const schema = body.response_format?.json_schema?.name;
      const [system, user] = body.messages.map((m) => m.content);
      calls.push({ schema, body, user, system });
      const content = schema === 'extracted_facts' ? (extractReply ?? propose)(user) : schema === 'support_verdicts' ? judge(user) : '{}';
      return new Response(JSON.stringify({ model: `test/${schema}`, usage: { prompt_tokens: 100, completion_tokens: 20 }, choices: [{ message: { content } }] }));
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
  const req = new Request(`https://jamjam.tech/api${path}`, { method, headers: { authorization: 'Bearer t', 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  try {
    const res = (await handleApi(req, envWith, new URL(req.url), { waitUntil: () => undefined }))!;
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: { error: e.message } as Record<string, unknown> };
    throw e;
  }
};
/** Starts an extract_facts run for a link and returns the finished run row. */
async function extract(url: string) {
  step = fakeStep();
  const r = await call('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', url });
  expect(r.status).toBe(202);
  return db.tables.runs.find((x) => x.id === (r.body.run as Row).id) as Row & { status: string; output: Record<string, unknown>; error: string | null };
}
const evidence = () => db.tables.evidence as (Row & { claim: string; quote: string; review_status: string; slot: string | null; confidence: string; match: string; quote_start: number; quote_end: number; source_id: string })[];
const sourceText = (id: string) => (db.tables.sources.find((s) => s.id === id) as { source_text: string }).source_text;

describe('definitions are data (spec/db/011)', () => {
  const sql = readFileSync(resolvePath(process.cwd(), '../spec/db/011_fact_extraction.sql'), 'utf8');
  it('migration 011 seeds exactly the extract_facts definition and its two prompts in seed.ts', () => {
    expect(JSON.parse(/\$spec\$([\s\S]*?)\$spec\$/.exec(sql)![1])).toEqual(EXTRACT_FACTS);
    expect(/\$p1\$([\s\S]*?)\$p1\$/.exec(sql)![1]).toBe(EXTRACT_CHUNK_PROMPT);
    expect(/\$p2\$([\s\S]*?)\$p2\$/.exec(sql)![1]).toBe(CHECK_SUPPORT_PROMPT);
    expect(sql).toMatch(/\('extract\.facts', 1, \$p1\$/);
    expect(sql).toMatch(/\('extract\.check_support', 1, \$p2\$/);
    expect(SEEDED_BY['011_fact_extraction.sql'].defs).toEqual([EXTRACT_FACTS]);
  });
  it('sizes the definition so no step output can pass the Workflows 1 MiB limit', () => {
    const read = EXTRACT_FACTS.steps.find((s) => s.id === 'read') as { maxChars: number; maxBytes: number };
    const chunk = EXTRACT_FACTS.steps.find((s) => s.id === 'chunk') as { args: Record<string, string> };
    const extractMap = EXTRACT_FACTS.steps.find((s) => s.id === 'extract') as { max: number };
    expect(extractMap.max).toBeGreaterThanOrEqual(Number(chunk.args.max_chunks));
    // Worst case: the largest text the read step may carry, in 3-byte UTF-8 characters.
    const text = 'あ'.repeat(read.maxBytes / 3);
    expect(text.length).toBeLessThanOrEqual(read.maxChars);
    const out = chunkSource(text, { target: 12000, min: 8000, max: 16000, overlap: 600 }, Number(chunk.args.max_chunks));
    expect(out.skipped).toBe(0);
    const json = JSON.stringify(out);
    expect(new TextEncoder().encode(json).length).toBeLessThan(2 ** 20);
    expect(json.length * 2).toBeLessThan(2 ** 20);
  });
  it('refuses to start, before writing any row, on a database without migration 011', async () => {
    db.tables.workflow_defs = db.tables.workflow_defs.filter((d) => d.id !== 'extract_facts');
    const r = await call('POST', `/brands/${BRAND}/runs`, { kind: 'extract_facts', url: 'https://jamjam.tech' });
    expect(r.status).toBe(503);
    expect(r.body.error).toMatch(/migration/);
    expect(db.tables.sources).toHaveLength(0);
    expect(db.tables.runs).toHaveLength(0);
  });
});

describe('LLM gateway: strict schema with providers required to honour it', () => {
  it('sends response_format json_schema strict and provider.require_parameters only when a schema is given', () => {
    const body = chatBody('openrouter/free', 's', 'u', { schema: EXTRACTED_FACTS });
    expect(body).toEqual({
      model: 'openrouter/free',
      messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'u' }],
      response_format: { type: 'json_schema', json_schema: { name: 'extracted_facts', strict: true, schema: EXTRACTED_FACTS.schema } },
      provider: { require_parameters: true },
    });
    // Existing callers (drafting, polish, claims) send exactly what they sent before.
    expect(chatBody('m', 's', 'u')).toEqual({ model: 'm', messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'u' }] });
  });
  it('every object in both schemas lists all its properties as required and forbids others (strict-mode rules)', () => {
    const walk = (s: Record<string, unknown>): void => {
      if (s.type === 'object') {
        expect(s.additionalProperties).toBe(false);
        expect([...(s.required as string[])].sort()).toEqual(Object.keys(s.properties as object).sort());
        Object.values(s.properties as Record<string, Record<string, unknown>>).forEach(walk);
      }
      if (s.type === 'array') walk(s.items as Record<string, unknown>);
    };
    walk(EXTRACTED_FACTS.schema as never);
    walk(SUPPORT_VERDICTS.schema as never);
  });
  it('reports token usage, and says plainly when no provider supports the schema (503) instead of "busy"', async () => {
    const r = await chat(env, 's', '[]', { schema: SUPPORT_VERDICTS });
    expect(r.usage).toEqual({ promptTokens: 100, completionTokens: 20 });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    vi.useFakeTimers();
    const p = chat(env, 's', 'u', { schema: SUPPORT_VERDICTS }).catch((e) => e);
    await vi.runAllTimersAsync();
    vi.useRealTimers();
    expect(((await p) as Error).message).toBe(NO_PROVIDER);
  });
  it('schemaError names the first path that breaks the schema and never echoes content', () => {
    const fact = { section: 'purpose', claim: 'c', quote: 'q', slot: 'none', value: '' };
    expect(schemaError(EXTRACTED_FACTS.schema, { facts: [fact] })).toBeNull();
    expect(schemaError(EXTRACTED_FACTS.schema, { facts: [{ ...fact, quote: undefined }] })).toBe('$.facts[0].quote: not a string');
    expect(schemaError(EXTRACTED_FACTS.schema, { facts: [{ section: 'purpose', claim: 'c', slot: 'none', value: '' }] })).toBe('$.facts[0].quote: missing');
    expect(schemaError(EXTRACTED_FACTS.schema, { facts: [{ ...fact, confidence: 0.9 }] })).toBe('$.facts[0].confidence: not allowed');
    expect(schemaError(EXTRACTED_FACTS.schema, { facts: [{ ...fact, section: 'secret plans' }] })).toBe('$.facts[0].section: not one of the allowed values');
    expect(schemaError(SUPPORT_VERDICTS.schema, { verdicts: [{ id: 'f1', supported: 'yes' }] })).toBe('$.verdicts[0].supported: not a boolean');
    expect(EXTRACTED_FACTS.limits!({ facts: Array(21).fill(fact) })).toMatch(/more than 20/);
  });
});

describe('normaliser with offsets (quote.ts)', () => {
  const samples = [
    'JamJam’s mission is to help brands prove what they say on­ chain.',
    'Café ﬁne ① Ａ full-width, 각 jamo, ệ marks',
    'A brand-\nnew inter-\n  national launch with **bold**, __strong__, ~~old~~, *em*, _under_ and `code`.',
    'İstanbul ΟΔΟΣ final sigma, ß, \u{1F600} emoji\r\n\r\n  trailing  ',
    '“Quoted” — dash – and −minus ​zero‍width﻿',
  ];
  it('produces exactly normalisePage, and every normalised range maps back to source text that matches it', () => {
    for (const s of samples) {
      const m = normaliseMapped(s);
      expect(m.text).toBe(normalisePage(s));
      expect(m.from).toHaveLength(m.text.length);
      for (let i = 1; i < m.from.length; i++) expect(m.from[i]).toBeGreaterThanOrEqual(m.from[i - 1]);
      // Any word of the normalised text, sliced from the source by its offsets, is found by the quote check.
      for (const w of m.text.matchAll(/[\p{L}\p{N}]{3,}/gu)) {
        const src = s.slice(m.from[w.index!], m.to[w.index! + w[0].length - 1]);
        expect(quoteOnPage(m.text, src)).toBe(true);
      }
    }
  });
});

describe('chunking (2-4k tokens, offsets into the stored text)', () => {
  const text = [SITE_SENTENCES.join(' '), filler(600), SITE_SENTENCES.join(' ')].join('\n\n');
  it('cuts deterministic chunks of 2-4k estimated tokens whose text is exactly the source at their offsets', () => {
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunkText(text)).toEqual(chunks);
    expect(chunks[0].start).toBe(0);
    expect(chunks[chunks.length - 1].end).toBe(text.length);
    chunks.forEach((c, i) => {
      expect(c.text).toBe(text.slice(c.start, c.end));
      expect(c.end - c.start).toBeLessThanOrEqual(CHUNK_DEFAULTS.max);
      if (i < chunks.length - 1) {
        expect(c.end - c.start).toBeGreaterThanOrEqual(CHUNK_DEFAULTS.min);
        expect(c.tokens).toBeGreaterThanOrEqual(2000);
        expect(c.tokens).toBeLessThanOrEqual(4000);
        // Overlap with the next chunk is never shorter than asked.
        expect(c.end - chunks[i + 1].start).toBeGreaterThanOrEqual(CHUNK_DEFAULTS.overlap);
      }
    });
  });
  it('puts every passage of up to MAX_QUOTE characters wholly inside at least one chunk', () => {
    const chunks = chunkText(text);
    for (let at = 0; at + MAX_QUOTE <= text.length; at += 97) {
      expect(chunks.some((c) => c.start <= at && at + MAX_QUOTE <= c.end)).toBe(true);
    }
  });
  it('refuses settings that could not make progress', () => {
    expect(() => chunkText(text, { min: 100, target: 50, max: 200, overlap: 10 })).toThrow(/chunk settings/);
    expect(() => chunkText(text, { min: 100, target: 150, max: 200, overlap: 100 })).toThrow(/chunk settings/);
  });
  it('reports chunks beyond the cap instead of dropping them silently', () => {
    const out = chunkSource(text, {}, 2);
    expect(out.count).toBe(2);
    expect(out.skipped).toBe(out.total - 2);
    expect(out.charsSkipped).toBe(text.length - out.chunks[1].end);
  });
});

describe('quote check and source alignment', () => {
  const source = SITE_SENTENCES.join('\n\n');
  const m = normaliseMapped(source);
  it('exact: a quote that differs only in typography is stored as the exact source text with its offsets', () => {
    const a = alignQuote(source, m, 'Every post is checked by a person before it is registered on Solana.'.replace('post', 'post').toUpperCase())!;
    expect(a.match).toBe('exact');
    expect(a.text).toBe(SITE_SENTENCES[3]);
    expect(source.slice(a.start, a.end)).toBe(a.text);
  });
  it('fuzzy (>= 0.9) only finds the passage: the stored quote is the source text there, never the model\'s', () => {
    const quote = 'Every post is checked by a real person before it is registered on Solana.';
    const a = alignQuote(source, m, quote)!;
    expect(a.match).toBe('fuzzy');
    expect(a.ratio).toBeGreaterThanOrEqual(FUZZY_MIN);
    // A fuzzy span runs from the first to the last aligned word of the source.
    expect(a.text).toBe(SITE_SENTENCES[3].replace(/\.$/, ''));
    expect(a.text).not.toBe(quote);
  });
  it('F3: 100% of planted near-miss quotes fail the exact check and are never stored as written', () => {
    for (const p of PLANTED) {
      expect(quoteOnPage(normalisePage(source), p.quote)).toBe(false);
      const a = alignQuote(source, m, p.quote);
      if (a) {
        expect(a.match).toBe('fuzzy');
        expect(normaliseQuote(a.text)).not.toBe(normaliseQuote(p.quote));
        expect(source.slice(a.start, a.end)).toBe(a.text);
      }
    }
    // Each kind behaves as designed: short changed-number quotes and distant merges are not even located.
    const located = Object.fromEntries(PLANTED.map((p) => [p.quote, alignQuote(source, m, p.quote)?.text ?? null]));
    expect(located[PLANTED[3].quote]).toBeNull();
    expect(located[PLANTED[7].quote]).toBeNull();
    expect(located[PLANTED[8].quote]).toBeNull();
    expect(located[PLANTED[0].quote]).toBe(SITE_SENTENCES[3].replace(/\.$/, ''));
  });
  it('fuzzy search stays within its CPU budget and reports what it skipped; a skipped search can only drop a fact', () => {
    const repeat = 'a '.repeat(8000);
    const quote = `${'a '.repeat(240)}b`;
    const budget = { cells: 1e12, skipped: 0 };
    expect(alignQuote(repeat, normaliseMapped(repeat), quote, undefined, budget)).toBeNull();
    expect(budget.skipped).toBe(1);
    const out = alignFacts(repeat, [{ start: 0, end: repeat.length }], [{ facts: [{ section: 'purpose', claim: 'c', quote, slot: 'none', value: '' }] }]);
    expect(out).toMatchObject({ facts: [], dropped: { not_located: 1 } });
    // A shared step budget runs out across quotes.
    expect(bestFuzzySpan('a b c d e f g h i j'.split(' '), 'a b c d e f g h i j'.split(' '), FUZZY_MIN, { cells: 10, skipped: 0 })).toBe('over_budget');
  });
  it('fuzzy search finds the tightest span and ignores scattered matches', () => {
    expect(bestFuzzySpan('a b c d e f g h i j'.split(' '), 'a b c d e f g h i j'.split(' '))).toMatchObject({ start: 0, end: 9, ratio: 1 });
    expect(bestFuzzySpan('x a y b z c w d v e u f t g s h r i q j'.split(' '), 'a b c d e f g h i j'.split(' '))).toBeNull();
  });
});

describe('fact rules', () => {
  it('number guard: a number the passage does not state is refused, with thousands separators read alike', () => {
    expect(numbersSupported('Plans start at $15 a month.', 'Plans start at $12 a month for a single brand.')).toBe(false);
    expect(numbersSupported('Used by 1,000 teams', 'used by 1000 teams')).toBe(true);
    expect(numbersSupported('Founded in 2021 by 3 people', 'In 2021 3 people founded it')).toBe(true);
    expect(numbersSupported('2021100 users', 'in 2021 100 users')).toBe(false);
  });
  it('review: an owned fact is approved only when exact and uncontested; third-party facts always wait', () => {
    expect(initialReviewFor('owned', 'exact', false)).toBe('approved');
    expect(initialReviewFor('owned', 'fuzzy', false)).toBe('proposed');
    expect(initialReviewFor('owned', 'exact', true)).toBe('proposed');
    expect(initialReviewFor('third_party', 'exact', false)).toBe('proposed');
  });
  it('confidence comes from match type and independent sources, never from the model', () => {
    expect([confidenceOf('exact', 1), confidenceOf('exact', 2), confidenceOf('fuzzy', 1), confidenceOf('fuzzy', 3)]).toEqual(['medium', 'high', 'low', 'medium']);
  });
  it('merges supported facts read twice from one passage, but never lets an unsupported reading decide for a true one', () => {
    const text = SITE_SENTENCES[3];
    const { facts } = alignFacts(text, [{ start: 0, end: text.length }], [{ facts: [
      { section: 'messaging', claim: 'A robot checks every post.', quote: text, slot: 'none', value: '' },
      { section: 'messaging', claim: 'A person checks every post.', quote: text, slot: 'none', value: '' },
      { section: 'messaging', claim: 'Posts are checked by a person.', quote: text, slot: 'none', value: '' },
    ] }]);
    expect(facts).toHaveLength(3);
    const { batches } = supportBatches(facts, 12, 40);
    const out = decideFacts(facts, batches, [{ verdicts: [{ id: 'f1', supported: false }, { id: 'f2', supported: true }, { id: 'f3', supported: true }] }]);
    expect(out.facts.map((f) => f.claim)).toEqual(['A person checks every post.']);
    expect(out).toMatchObject({ merged: 1, dropped: { unsupported: 1 } });
  });
  it('merges overlapping facts: the same fact from overlapping chunks, or the same slot value, is one candidate', () => {
    const text = `${SITE_SENTENCES[0]}\n\n${SITE_SENTENCES[1]}`;
    const f = { section: 'origin', claim: 'JamJam was founded in 2020.', quote: SITE_SENTENCES[0], slot: 'founded', value: '2020' };
    const out = alignFacts(text, [{ start: 0, end: text.length }, { start: 0, end: text.length }], [
      { facts: [f] },
      { facts: [{ ...f, claim: 'Founded in 2020.', quote: 'founded in 2020' }, { ...f, quote: 'JAMJAM WAS FOUNDED IN 2020 IN MELBOURNE.' }] },
    ]);
    expect(out.facts).toHaveLength(1);
    expect(out.facts[0]).toMatchObject({ claim: 'JamJam was founded in 2020.', passages: 2, match: 'exact', quote: SITE_SENTENCES[0] });
    expect(out.merged).toBe(2);
  });
  it('clears a slot whose value the passage does not state, so it cannot raise a conflict', () => {
    const text = SITE_SENTENCES[1];
    const out = alignFacts(text, [{ start: 0, end: text.length }], [{ facts: [{ section: 'positioning', claim: 'Teams at 10 companies use JamJam.', quote: text, slot: 'customer_count', value: 'ten' }] }]);
    expect(out.facts[0]).toMatchObject({ slot: 'none', value: '' });
  });
  it('the support check sees only the claim and the exact source passage; no verdict means not kept', () => {
    const text = SITE_SENTENCES.join(' ');
    const { facts } = alignFacts(text, [{ start: 0, end: text.length }], [{ facts: [
      { section: 'messaging', claim: 'A person checks every post.', quote: 'Every post is checked by a real person before it is registered on Solana.', slot: 'none', value: '' },
      { section: 'purpose', claim: 'Helps brands prove what they say.', quote: SITE_SENTENCES[2], slot: 'none', value: '' },
    ] }]);
    const { batches } = supportBatches(facts, 12, 40);
    const items = JSON.parse(batches[0].text) as Record<string, string>[];
    expect(items[0]).toEqual({ id: 'f1', claim: 'A person checks every post.', passage: SITE_SENTENCES[3].replace(/\.$/, '') });
    expect(batches[0].text).not.toContain('real person');
    expect(() => supportBatches(facts, 1, 1)).toThrow(/more than the 1/);
    // f1 supported, f2 has no verdict, an unknown id is ignored, a contradictory pair is not a pass.
    expect(decideFacts(facts, batches, [{ verdicts: [{ id: 'f1', supported: true }, { id: 'f9', supported: true }] }])).toMatchObject({ facts: [{ id: 'f1' }], dropped: { not_checked: 1 } });
    expect(decideFacts(facts, batches, [{ verdicts: [{ id: 'f1', supported: true }, { id: 'f1', supported: false }, { id: 'f2', supported: false }] }])).toMatchObject({ facts: [], dropped: { not_checked: 1, unsupported: 1 } });
  });
  it('one conflict per slot lists every fact on every side, and only live facts count', () => {
    const f = (id: string, value: string, review = 'approved') => ({ id, source_id: 's', section: 'origin', claim: `Founded ${value}`, slot: 'founded', slot_value: value, match: 'exact', review_status: review, trust: 'owned' });
    const c = findConflicts([f('a', '2020'), f('b', '2021'), f('c', '2021'), f('d', '2019', 'rejected')]);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ slot: 'founded', ids: ['a', 'b', 'c'] });
    expect(c[0].question).toBe('Your sources disagree on when the brand was founded or launched: "2020" (1 fact) or "2021" (2 facts). Which is right?');
    expect(findConflicts([f('a', '2020'), f('b', '2020')])).toEqual([]);
  });
});

describe('extract_facts runs as engine steps on the source adapters', () => {
  it('reads the brand\'s site, chunks it, keeps only located and supported facts, and stores exact quotes with offsets', async () => {
    const run = await extract('https://jamjam.tech');
    expect(run.status).toBe('done');
    const src = db.tables.sources[0] as Row & { id: string; status: string; kind: string };
    expect(src).toMatchObject({ status: 'read', kind: 'site' });
    const text = sourceText(src.id);
    // Every model call: extraction under the strict schema, then a separate support check.
    const ex = calls.filter((c) => c.schema === 'extracted_facts');
    const sup = calls.filter((c) => c.schema === 'support_verdicts');
    expect(ex.length).toBe(chunkText(text).length);
    expect(ex.length).toBeGreaterThan(1);
    expect(sup.length).toBeGreaterThan(0);
    for (const c of calls) expect(c.body.provider).toEqual({ require_parameters: true });
    // The judge never sees the chunk, the extraction prompt or a model quote that was not in the source.
    for (const c of sup) {
      expect(c.system).toBe(CHECK_SUPPORT_PROMPT.replace('{{brand_name}}', 'JamJam'));
      expect(c.user).not.toContain('Section 1 describes');
      expect(c.user).not.toContain('robot before');
    }
    const ev = evidence();
    expect(ev.map((e) => e.claim).sort()).toEqual(['A person checks every post before it is registered on Solana.', 'JamJam exists to help brands prove what they say.', 'JamJam is based in Melbourne.', 'JamJam was founded in 2020.', 'Plans start at $12 a month.']);
    for (const e of ev) {
      expect(text.slice(e.quote_start, e.quote_end)).toBe(e.quote);
      expect(quoteOnPage(normalisePage(text), e.quote)).toBe(true);
      expect(e).toMatchObject({ trust: 'owned', run_id: run.id });
    }
    // Exact and supported: approved. Fuzzily located, even when supported: held for the owner, low confidence.
    const fuzzy = ev.filter((e) => e.match === 'fuzzy');
    expect(fuzzy).toHaveLength(1);
    expect(fuzzy[0]).toMatchObject({ quote: 'Every post is checked by a person before it is registered on Solana', review_status: 'proposed', confidence: 'low' });
    for (const e of ev.filter((x) => x.match === 'exact')) expect(e).toMatchObject({ review_status: 'approved', confidence: 'medium' });
    expect(run.output).toMatchObject({ facts: 5, kind: 'site', needsReview: 1, conflicts: 0, truncated: false });
    expect(run.output.droppedBy).toEqual({ not_in_source: 2, number_not_in_quote: 1, unsupported: 2 });
    // Traces carry prompt versions, models and tokens, never content.
    const traces = db.tables.run_steps.filter((s) => s.type === 'llm');
    expect(traces[0]).toMatchObject({ prompt_key: 'extract.facts', prompt_version: 1, model: 'test/extracted_facts', tokens_in: 100, tokens_out: 20 });
    expect(JSON.stringify(db.tables.run_steps)).not.toContain('Melbourne');
  });

  it('gate: 0 invented facts and 0 unsupported quote-fact pairs on the fixtures', async () => {
    await extract('https://jamjam.tech');
    const text = sourceText(db.tables.sources[0].id as string);
    for (const e of evidence()) {
      expect(text.includes(e.quote)).toBe(true);
      expect(SUPPORT_LABELS[e.claim]).toBe(true);
    }
    expect(evidence().some((e) => /award|robot|2019|\$15/i.test(`${e.claim} ${e.quote}`))).toBe(false);
  });

  it('issue #64 example: "used by teams at 10 companies" never becomes "10 enterprise customers"', async () => {
    await extract('https://jamjam.tech');
    const judged = calls.filter((c) => c.schema === 'support_verdicts').map((c) => JSON.parse(c.user) as { claim: string; passage: string }[]).flat();
    expect(judged).toContainEqual(expect.objectContaining({ claim: 'JamJam has 10 enterprise customers.', passage: 'JamJam is used by teams at 10 companies.' }));
    expect(evidence().some((e) => /enterprise|customer/i.test(e.claim))).toBe(false);
    expect(evidence().some((e) => e.slot === 'customer_count')).toBe(false);
  });

  it('gate: a contradiction between two sources produces one conflict for the owner, not two approved facts', async () => {
    await extract('https://jamjam.tech');
    const second = await extract('https://news.example/jamjam');
    expect(second.output).toMatchObject({ kind: 'page', conflicts: 1 });
    const founded = evidence().filter((e) => e.slot === 'founded');
    expect(founded).toHaveLength(2);
    expect(founded.every((e) => e.review_status === 'proposed')).toBe(true);
    expect(db.tables.fact_conflicts).toHaveLength(1);
    expect(db.tables.fact_conflicts[0]).toMatchObject({ slot: 'founded', status: 'open', evidence_ids: founded.map((e) => e.id).sort() });
    expect(db.tables.fact_conflicts[0].question).toMatch(/"2020" \(1 fact\) or "2021" \(1 fact\)/);
    // A third source on the same question joins the open conflict; it does not open another.
    await extract('https://other.example/profile');
    expect(db.tables.fact_conflicts).toHaveLength(1);
    expect((db.tables.fact_conflicts[0].evidence_ids as string[]).length).toBe(3);
  });

  it('agreement across independent sources raises confidence on every copy of the fact', async () => {
    await extract('https://jamjam.tech');
    await extract('https://news.example/jamjam');
    const hq = evidence().filter((e) => e.slot === 'headquarters');
    expect(hq).toHaveLength(2);
    expect(hq.map((e) => e.confidence)).toEqual(['high', 'high']);
    // Facts only one source states keep medium.
    expect(evidence().find((e) => e.claim === 'Plans start at $12 a month.')!.confidence).toBe('medium');
  });

  it('a retried save writes the same rows and never reverts a review the owner made', async () => {
    await extract('https://jamjam.tech');
    const first = evidence().map((e) => e.id).sort();
    evidence()[0].review_status = 'rejected';
    const run = db.tables.runs[0] as Row & { id: string; status: string };
    run.status = 'running';
    step = fakeStep();
    await runWorkflow(envWith, run.id, step.api, localDeps);
    expect(evidence().map((e) => e.id).sort()).toEqual(first);
    expect(evidence()[0].review_status).toBe('rejected');
  });

  it('a schema-invalid model reply is refused whole, retried, and then fails the run with nothing saved', async () => {
    extractReply = () => JSON.stringify({ facts: [{ section: 'purpose', claim: 'c', quote: SITE_SENTENCES[2] }] });
    const run = await extract('https://jamjam.tech');
    expect(run.status).toBe('failed');
    expect(run.error).toBe('the AI model reply did not match the expected format, trying again');
    expect(evidence()).toHaveLength(0);
    expect(db.tables.sources[0]).toMatchObject({ status: 'failed' });
    expect(step.delays.filter((d) => d.step.startsWith('extract[')).length).toBe(EXTRACT_FACTS.retries.limit);
    expect(calls.filter((c) => c.schema === 'support_verdicts')).toHaveLength(0);
  });

  it('a reply over the fact limit is refused whole as well', async () => {
    extractReply = () => JSON.stringify({ facts: Array(21).fill({ section: 'purpose', claim: 'c', quote: SITE_SENTENCES[2], slot: 'none', value: '' }) });
    const run = await extract('https://jamjam.tech');
    expect(run.status).toBe('failed');
    expect(evidence()).toHaveLength(0);
  });

  it('a third-party page\'s supported facts wait for the owner (never auto-approved)', async () => {
    await extract('https://news.example/jamjam');
    expect(evidence().length).toBeGreaterThan(0);
    expect(evidence().every((e) => e.trust === 'third_party' && e.review_status === 'proposed')).toBe(true);
  });

  it('an adapter failure ends the run with the adapter\'s reason on the source, without calling the model', async () => {
    const run = await extract('https://missing.example/nothing');
    expect(run.status).toBe('failed');
    expect(String(db.tables.sources[0].error)).toMatch(/paste/i);
    expect(calls).toHaveLength(0);
  });
});

describe('source readers', () => {
  it('the paste reader keeps its owned trust and offsets the text it returns', async () => {
    const out = await readSource(env, 'paste', { text: 'JamJam was founded in 2020.', name: 'notes' }, 1000, 3000);
    expect(out).toMatchObject({ kind: 'paste', trust: 'owned', text: 'JamJam was founded in 2020.', truncated: false });
  });
  it('caps the text for the step and says so', async () => {
    const out = await readSource(env, 'paste', { text: 'x'.repeat(50) }, 20, 1000);
    expect(out).toMatchObject({ text: 'x'.repeat(20), truncated: true });
  });
  it('maps adapter failures to statuses the runner reads: input problems stop retries', async () => {
    await expect(readSource(env, 'paste', { text: '   ' }, 10, 10)).rejects.toMatchObject({ status: 422 });
    await expect(readSource(env, 'nope', {}, 10, 10)).rejects.toMatchObject({ status: 500 });
  });
});

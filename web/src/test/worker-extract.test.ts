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
const { EXTRACT_FACTS, EXTRACT_CHUNK_PROMPT, CHECK_SUPPORT_PROMPT, EXTRACT_MODELS, SEED_CONFIG, SEEDED_BY } = await import('../../worker/engine/seed');
const { differentFamily, JUDGES, loadTaskModels, modelFamilies, sameModel, taskModelsError } = await import('../../worker/models');
const { chatBody, chat, NO_PROVIDER } = await import('../../worker/llm');
const { schemaError } = await import('../../worker/schema');
const { EXTRACTED_FACTS, SUPPORT_VERDICTS } = await import('../../worker/extract/schemas');
const { chunkText, CHUNK_DEFAULTS } = await import('../../worker/extract/chunk');
const { alignQuote, bestFuzzySpan, FUZZY_MIN } = await import('../../worker/extract/align');
const { alignFacts, chunkSource, decideFacts, supportBatches } = await import('../../worker/extract/pipeline');
const { confidenceOf, findConflicts, numbersSupported, MAX_CLAIM, MAX_FACTS_PER_CHUNK } = await import('../../worker/extract/facts');
const { initialReviewFor, pageOf, saveExtractedFacts, MAX_PAGE_TITLE, MAX_PAGE_URL } = await import('../../worker/extract/save');
const { conflictView, factView, journeyFacts, openConflictIds, sectionLabel, sourceLabel } = await import('../../worker/extract/journey');
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
/** The model the stub says answered; by default the first of the request's `models` (OpenRouter's fallback order). */
let answerModel: ((models: string[] | undefined, schema?: string) => string) | null = null;

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
  answerModel = null;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u', email: 'o@example.com' }));
    if (url.startsWith('https://db.test')) return new Response(JSON.stringify(fakeDb(url, init)));
    if (url.endsWith('/robots.txt')) return new Response('', { status: 404 });
    if (url.startsWith('https://openrouter.ai')) {
      const body = JSON.parse(String(init!.body)) as { messages: { content: string }[]; models?: string[]; response_format?: { json_schema?: { name?: string } } };
      const schema = body.response_format?.json_schema?.name;
      const [system, user] = body.messages.map((m) => m.content);
      calls.push({ schema, body, user, system });
      const content = schema === 'extracted_facts' ? (extractReply ?? propose)(user) : schema === 'support_verdicts' ? judge(user) : '{}';
      const model = answerModel ? answerModel(body.models, schema) : body.models?.[0] ?? `test/${schema}`;
      return new Response(JSON.stringify({ model, usage: { prompt_tokens: 100, completion_tokens: 20 }, choices: [{ message: { content } }] }));
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
  it('every fact the extract calls can return fits the support check, and the align, batch and decide outputs stay under 1 MiB', () => {
    const chunk = EXTRACT_FACTS.steps.find((s) => s.id === 'chunk') as { args: Record<string, string> };
    const batch = EXTRACT_FACTS.steps.find((s) => s.id === 'batch') as { args: Record<string, string> };
    const support = EXTRACT_FACTS.steps.find((s) => s.id === 'support') as { max: number };
    const read = EXTRACT_FACTS.steps.find((s) => s.id === 'read') as { maxChars: number; maxBytes: number };
    const [chunks, size, maxBatches] = [Number(chunk.args.max_chunks), Number(batch.args.size), Number(batch.args.max_batches)];
    // Facts are merged before the support check only when the judge would get the identical question, so the worst
    // case is every proposed fact reaching it.
    expect(chunks * MAX_FACTS_PER_CHUNK).toBeLessThanOrEqual(size * maxBatches);
    expect(support.max).toBeGreaterThanOrEqual(maxBatches);
    // Worst case: the largest text, all 3-byte UTF-8 characters with no digits, every chunk returning the most facts,
    // each with the longest claim and quote, all distinct, all located exactly and all supported.
    const cjk = (n: number, seed: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(0x4e00 + ((seed * 7919 + i * 104729) % 20000))).join('');
    const text = cjk(read.maxBytes / 3, 1);
    const out = chunkSource(text, { target: 12000, min: 8000, max: 16000, overlap: 600 }, chunks);
    const replies = out.chunks.map((c, j) => ({ facts: Array.from({ length: MAX_FACTS_PER_CHUNK }, (_, k) => {
      const at = c.start + k * Math.floor((c.end - c.start - MAX_QUOTE) / MAX_FACTS_PER_CHUNK);
      return { section: 'purpose', claim: cjk(MAX_CLAIM, j * 100 + k + 7), quote: text.slice(at, at + MAX_QUOTE), slot: 'none', value: '' };
    }) }));
    const aligned = alignFacts(text, out.chunks, replies);
    expect(aligned.facts).toHaveLength(out.chunks.length * MAX_FACTS_PER_CHUNK);
    const batched = supportBatches(aligned.facts, size, maxBatches);
    const decided = decideFacts(aligned.facts, batched.batches, batched.batches.map((b) => ({ verdicts: b.ids.map((id) => ({ id, supported: true })) })));
    expect(decided.facts).toHaveLength(aligned.facts.length);
    for (const o of [aligned, batched, decided]) {
      const json = JSON.stringify(o);
      expect(new TextEncoder().encode(json).length).toBeLessThan(2 ** 20);
      expect(json.length * 2).toBeLessThan(2 ** 20);
    }
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

describe('models per task: pinned free models, and a judge never from the extractor\'s family (architecture §13.3)', () => {
  const config = () => db.tables.engine_config.find((r) => r.key === 'task_models')!.value as Record<string, string[]>;
  it('the seeded lists are valid, free-only, and give the support judge no family the extractor uses', () => {
    expect(taskModelsError(EXTRACT_MODELS)).toBeNull();
    expect(JUDGES['extract.check_support']).toBe('extract.facts');
    for (const j of EXTRACT_MODELS['extract.check_support']) for (const g of EXTRACT_MODELS['extract.facts']) expect(differentFamily(j, g)).toBe(true);
    expect([...EXTRACT_MODELS['extract.facts'], ...EXTRACT_MODELS['extract.check_support']].map((m) => [...modelFamilies(m)].join('+'))).toEqual(['nvidia', 'apodex', 'dots-studio', 'liquid']);
  });
  it('migration 011 merges exactly that config into the shared task_models row', () => {
    const sql = readFileSync(resolvePath(process.cwd(), '../spec/db/011_fact_extraction.sql'), 'utf8');
    const rows = [...sql.matchAll(/\('(\w+)', \$cfg\$([\s\S]*?)\$cfg\$::jsonb\)/g)].map(([, key, v]) => ({ key, value: JSON.parse(v) }));
    expect(rows).toEqual(SEED_CONFIG);
    expect(SEEDED_BY['011_fact_extraction.sql'].config).toEqual(SEED_CONFIG);
    expect(sql).toMatch(/on conflict \(key\) do update set value = excluded\.value \|\| public\.engine_config\.value/);
  });
  it('families: maker plus every base lineage in the name; routers have none, so nothing can be shown to differ', () => {
    expect([...modelFamilies('nousresearch/hermes-3-llama-3.1-405b:free')].sort()).toEqual(['llama', 'nous']);
    expect(differentFamily('nvidia/llama-3.1-nemotron-70b:free', 'meta-llama/llama-3.3-70b:free')).toBe(false);
    expect(differentFamily('openrouter/free', 'liquid/lfm-2.5-2.6b:free')).toBe(false);
    expect(differentFamily('dots-studio/dots-3-note-preview:free', 'nvidia/nemotron-3-super-120b-a12b:free')).toBe(true);
    expect(sameModel('liquid/lfm-2.5-2.6b', 'liquid/lfm-2.5-2.6b:free')).toBe(true);
    expect(sameModel('', 'liquid/lfm-2.5-2.6b:free')).toBe(false);
  });
  it('refuses lists that let a judge share a family, name a paid or router model, repeat a model, or judge an unlisted task', () => {
    const ext = ['nvidia/nemotron-3-super-120b-a12b:free', 'apodex/apodex-1.1-mini:free'];
    expect(taskModelsError({ 'extract.facts': ext, 'extract.check_support': ['dots-studio/dots-3-note-preview:free', 'nvidia/llama-3.1-nemotron-ultra:free'] })).toMatch(/nvidia\/llama-3\.1-nemotron-ultra:free shares a model family with nvidia\/nemotron-3-super-120b-a12b:free/);
    expect(taskModelsError({ 'extract.check_support': ['dots-studio/dots-3-note-preview:free'] })).toMatch(/judges extract\.facts, which has no models configured/);
    expect(taskModelsError({ 'extract.facts': ['openai/gpt-x'] })).toMatch(/not a free model id/);
    expect(taskModelsError({ 'extract.facts': ['openrouter/free'] })).toMatch(/not a free model id/);
    expect(taskModelsError({ 'extract.facts': [] })).toMatch(/no models/);
    expect(taskModelsError({ 'extract.facts': [ext[0], ext[0]] })).toMatch(/twice/);
  });
  it('loading a judge task always checks it against the task it judges, and a judge never falls back to the router', async () => {
    expect(Object.keys(await loadTaskModels(env, ['extract.check_support'])).sort()).toEqual(['extract.check_support', 'extract.facts']);
    expect(await loadTaskModels(env, ['ingest.extract_facts'])).toEqual({});
    config()['extract.facts'].push('dots-studio/other:free');
    await expect(loadTaskModels(env, ['extract.check_support'])).rejects.toThrow(/dots-studio\/dots-3-note-preview:free shares a model family with dots-studio\/other:free/);
    delete config()['extract.facts'];
    await expect(loadTaskModels(env, ['extract.check_support'])).rejects.toThrow(/judges extract\.facts, which has no models configured/);
    delete config()['extract.check_support'];
    await expect(loadTaskModels(env, ['extract.check_support'])).rejects.toThrow(/is a judge and has no models configured/);
  });
  it('each extract_facts call sends its task\'s fallback list, and every trace records the model that answered', async () => {
    const run = await extract('https://jamjam.tech');
    expect(run.status).toBe('done');
    for (const c of calls) {
      expect(c.body.model).toBeUndefined();
      expect(c.body.models).toEqual(EXTRACT_MODELS[c.schema === 'extracted_facts' ? 'extract.facts' : 'extract.check_support']);
    }
    expect(calls.some((c) => c.schema === 'support_verdicts')).toBe(true);
    const traces = db.tables.run_steps.filter((s) => s.type === 'llm' && s.outcome === 'ok');
    expect(traces.length).toBeGreaterThan(1);
    for (const t of traces) expect(t.model).toBe(EXTRACT_MODELS[t.prompt_key as string][0]);
  });
  it('a fallback answers within its own list; a reply from any other model is refused and never used', async () => {
    // The extractor's first model is down, so its fallback answers: allowed, and recorded.
    answerModel = (models) => (models?.[0].startsWith('nvidia/') ? models[1] : models![0]);
    expect((await extract('https://jamjam.tech')).status).toBe('done');
    expect(new Set(db.tables.run_steps.filter((s) => s.prompt_key === 'extract.facts').map((s) => s.model))).toEqual(new Set(['apodex/apodex-1.1-mini:free']));
    // The judge's call answered by the extractor's model (a family the judge must not share): refused, retried, failed.
    await seedTables();
    db.tables.brands[0].website = 'https://jamjam.tech';
    answerModel = (models, schema) => (schema === 'support_verdicts' ? 'nvidia/nemotron-3-super-120b-a12b:free' : models![0]);
    const run = await extract('https://jamjam.tech');
    expect(run.status).toBe('failed');
    expect(run.error).toMatch(/nvidia\/nemotron-3-super-120b-a12b:free, which is not configured for extract\.check_support/);
    expect(evidence()).toHaveLength(0);
  });
  it('a run whose model config breaks the family rule fails before any model is called', async () => {
    config()['extract.check_support'].push('nvidia/other-nemotron:free');
    const run = await extract('https://jamjam.tech');
    expect(run).toMatchObject({ status: 'failed', error: expect.stringMatching(/model config: extract\.check_support: nvidia\/other-nemotron:free shares a model family/) });
    expect(calls).toHaveLength(0);
  });
  it('the gateway refuses any named model that is not a free variant, before sending', async () => {
    await expect(chat(env, 's', 'u', { models: ['openai/gpt-x'] })).rejects.toThrow(/only named free models/);
    await expect(chat(env, 's', 'u', { models: [] })).rejects.toThrow(/only named free models/);
    expect(calls).toHaveLength(0);
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
    // A task with configured models sends OpenRouter's fallback list in place of the default model.
    expect(chatBody('m', 's', 'u', { models: ['a/x:free', 'b/y:free'] })).toEqual({ models: ['a/x:free', 'b/y:free'], messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'u' }] });
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
  it('merges overlapping facts: the same claim on the same passage is checked once; the same slot value is merged only after both pass', () => {
    const text = `${SITE_SENTENCES[0]}\n\n${SITE_SENTENCES[1]}`;
    const f = { section: 'origin', claim: 'JamJam was founded in 2020.', quote: SITE_SENTENCES[0], slot: 'founded', value: '2020' };
    const out = alignFacts(text, [{ start: 0, end: text.length }, { start: 0, end: text.length }], [
      { facts: [f] },
      { facts: [{ ...f, claim: 'Founded in 2020.', quote: 'founded in 2020' }, { ...f, quote: 'JAMJAM WAS FOUNDED IN 2020 IN MELBOURNE.' }] },
    ]);
    // The identical claim on the identical passage (overlapping chunks) asks the judge the same question: one item.
    expect(out.facts.map((x) => x.claim)).toEqual(['JamJam was founded in 2020.', 'Founded in 2020.']);
    expect(out.merged).toBe(1);
    const { batches } = supportBatches(out.facts, 12, 40);
    const both = decideFacts(out.facts, batches, [{ verdicts: [{ id: 'f1', supported: true }, { id: 'f2', supported: true }] }]);
    expect(both.facts).toHaveLength(1);
    expect(both.facts[0]).toMatchObject({ claim: 'JamJam was founded in 2020.', passages: 2, match: 'exact', quote: SITE_SENTENCES[0] });
    expect(both.merged).toBe(1);
    // The same claim on the same passage, located fuzzily by one reading and exactly by another: one item, exact.
    const s3 = SITE_SENTENCES[3];
    const c = { section: 'messaging', claim: 'A person checks every post.', slot: 'none', value: '' };
    const body = s3.slice(0, -1);
    const up = alignFacts(s3, [{ start: 0, end: s3.length }], [{ facts: [{ ...c, quote: PLANTED[0].quote }, { ...c, quote: body }] }]);
    expect(up.facts).toEqual([expect.objectContaining({ match: 'exact', quote: body, start: 0, end: body.length })]);
  });
  it('Codex review on PR #91: an overclaim with the same slot value never hides a true claim read later (both are support-checked)', () => {
    const text = `${SITE_SENTENCES[1]}\n\n${filler(3)}\n\n${SITE_SENTENCES[1]}`;
    const second = text.lastIndexOf(SITE_SENTENCES[1]);
    const over = { section: 'positioning', claim: 'JamJam has 10 enterprise customers.', quote: SITE_SENTENCES[1], slot: 'customer_count', value: '10' };
    const truth = { ...over, claim: 'Teams at 10 companies use JamJam.' };
    const out = alignFacts(text, [{ start: 0, end: second }, { start: second, end: text.length }], [{ facts: [over] }, { facts: [truth] }]);
    expect(out.facts.map((x) => x.claim)).toEqual([over.claim, truth.claim]);
    const { batches } = supportBatches(out.facts, 12, 40);
    expect(JSON.parse(batches[0].text).map((i: { claim: string }) => i.claim)).toEqual([over.claim, truth.claim]);
    const kept = decideFacts(out.facts, batches, [{ verdicts: [{ id: 'f1', supported: false }, { id: 'f2', supported: true }] }]);
    expect(kept.facts).toEqual([expect.objectContaining({ claim: truth.claim, slot: 'customer_count', value: '10', start: second })]);
    expect(kept.dropped).toEqual({ unsupported: 1 });
  });
  it('a true reading on a second passage survives when the first passage does not support the same claim', () => {
    const vague = 'JamJam began in 2020.';
    const text = `${vague}\n\n${SITE_SENTENCES[0]}`;
    const claim = { section: 'origin', claim: 'JamJam was founded in 2020 in Melbourne.', slot: 'founded', value: '2020' };
    const out = alignFacts(text, [{ start: 0, end: text.length }], [{ facts: [{ ...claim, quote: vague }, { ...claim, quote: SITE_SENTENCES[0] }] }]);
    expect(out.facts).toHaveLength(2);
    const { batches } = supportBatches(out.facts, 12, 40);
    const kept = decideFacts(out.facts, batches, [{ verdicts: [{ id: 'f1', supported: false }, { id: 'f2', supported: true }] }]);
    expect(kept.facts).toEqual([expect.objectContaining({ quote: SITE_SENTENCES[0], passages: 1 })]);
  });
  it('after the check, an exact passage replaces a fuzzily located one for the same fact, claim and quote together', () => {
    const text = `${SITE_SENTENCES[3]}\n\nA person checks every post before Solana registration.`;
    const fuzzy = { section: 'messaging', claim: 'A person checks every post before it is registered on Solana.', quote: 'Every post is checked by a real person before it is registered on Solana.', slot: 'none', value: '' };
    const exact = { ...fuzzy, quote: SITE_SENTENCES[3] };
    const out = alignFacts(text, [{ start: 0, end: text.length }], [{ facts: [fuzzy, exact] }]);
    // The fuzzy search located a slightly shorter span than the exact quote, so the judge sees both passages; once both
    // pass, the exact reading is the one kept.
    expect(out.facts.map((x) => x.match)).toEqual(['fuzzy', 'exact']);
    const one = decideFacts(out.facts, supportBatches(out.facts, 12, 40).batches, [{ verdicts: [{ id: 'f1', supported: true }, { id: 'f2', supported: true }] }]);
    expect(one.facts).toEqual([expect.objectContaining({ id: 'f2', match: 'exact', quote: SITE_SENTENCES[3] })]);
    // Two readings of the same fact (same slot and value) on different passages, the first located fuzzily: once both
    // pass, the exact one is kept whole (its own claim, quote and offsets), and both passages are counted.
    const base = { section: 'origin', slot: 'founded' as const, value: '2020', ratio: 1, chunk: 0, passages: 1 };
    const cands = [
      { ...base, id: 'f1', claim: 'Founded in 2020.', quote: 'founded in 2020', start: 20, end: 35, match: 'fuzzy' as const, ratio: 0.93 },
      { ...base, id: 'f2', claim: 'JamJam was founded in 2020.', quote: SITE_SENTENCES[0], start: 100, end: 100 + SITE_SENTENCES[0].length, match: 'exact' as const },
    ];
    const { batches } = supportBatches(cands, 12, 40);
    const kept = decideFacts(cands, batches, [{ verdicts: [{ id: 'f1', supported: true }, { id: 'f2', supported: true }] }]);
    expect(kept.facts).toEqual([{ ...cands[1], passages: 2 }]);
    expect(kept.merged).toBe(1);
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
      expect(e).toMatchObject({ trust: 'owned', run_id: run.id, page_url: 'https://jamjam.tech/', page_title: 'JamJam' });
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
    expect(traces[0]).toMatchObject({ prompt_key: 'extract.facts', prompt_version: 1, model: 'nvidia/nemotron-3-super-120b-a12b:free', tokens_in: 100, tokens_out: 20 });
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

  it('reported (§6.1): false-drop rate of true facts on the fixtures is 0 of 5', async () => {
    await extract('https://jamjam.tech');
    // True facts: proposals whose claim the hand labels mark supported. Each must be saved, quoted from the page.
    const truth = SITE_PROPOSALS.filter((p) => SUPPORT_LABELS[p.claim] === true);
    const saved = new Set(evidence().map((e) => e.claim));
    const dropped = truth.filter((p) => !saved.has(p.claim));
    expect({ trueFacts: truth.length, dropped: dropped.length }).toEqual({ trueFacts: 5, dropped: 0 });
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

describe('consumers: the onboarding journey shape (PR #75 JourneyFact, served by #34)', () => {
  const JOURNEY_FACT_KEYS = ['id', 'section', 'status', 'statement', 'quote', 'source', 'note'];
  const rows = () => ({
    sources: new Map(db.tables.sources.map((x) => [x.id as string, x as never])),
    conflicts: db.tables.fact_conflicts as never[],
  });
  const legacy = { id: 'x', section: 'purpose', claim: 'c', quote: 'q', source_id: null, review_status: 'approved', trust: 'owned', match: null };
  it('labels sections and sources as PR #75 does, linking only http(s) pages', () => {
    expect([sectionLabel('purpose'), sectionLabel('positioning'), sectionLabel('voice'), sectionLabel('origin'), sectionLabel('audience')]).toEqual(['Purpose · Gate 1', 'Positioning · Gate 2', 'Voice · Gate 3', 'Origin story', 'Audience']);
    expect(sourceLabel('https://www.jamjam.tech/', 'JamJam')).toEqual({ label: 'jamjam.tech · home page', url: 'https://www.jamjam.tech/' });
    expect(sourceLabel('https://jamjam.tech', 'JamJam')).toEqual({ label: 'jamjam.tech · home page', url: 'https://jamjam.tech' });
    expect(sourceLabel('https://jamjam.tech/how-it-works', 'How it works')).toEqual({ label: 'jamjam.tech · How it works', url: 'https://jamjam.tech/how-it-works' });
    expect(sourceLabel('https://jamjam.tech/pricing', null)).toEqual({ label: 'jamjam.tech · /pricing', url: 'https://jamjam.tech/pricing' });
    expect(sourceLabel('javascript:alert(1)', 'x')).toEqual({ label: 'x' });
    expect(sourceLabel(null, 'Pasted text')).toEqual({ label: 'Pasted text' });
    expect(sourceLabel(null, null)).toBeUndefined();
  });
  it('every stored fact maps to a JourneyFact: found or partly, with its exact quote and the page it is on', async () => {
    await extract('https://jamjam.tech');
    const { sources, conflicts } = rows();
    const out = journeyFacts(evidence() as never, sources, conflicts);
    expect(out.conflicts).toEqual([]);
    expect(out.facts).toHaveLength(evidence().length);
    for (const v of out.facts) {
      expect(Object.keys(v).every((k) => JOURNEY_FACT_KEYS.includes(k))).toBe(true);
      expect(evidence().find((e) => e.id === v.id)!.quote).toBe(v.quote);
      expect(v.source).toEqual({ label: 'jamjam.tech · home page', url: 'https://jamjam.tech/' });
    }
    expect(out.facts.filter((v) => v.status === 'found').map((v) => v.note)).toEqual([undefined, undefined, undefined, undefined]);
    expect(out.facts.filter((v) => v.status === 'partly')).toEqual([expect.objectContaining({ statement: 'A person checks every post before it is registered on Solana.', note: expect.stringMatching(/closest passage/) })]);
  });
  it('older facts, owner answers, third-party facts and rejected facts each get the status their evidence earns', () => {
    const sources = new Map([['s3', { id: 's3', url: 'https://news.example/jamjam', title: 'JamJam' }]]);
    const none = new Set<string>();
    // ingest_url: the quote is on the page but was never support-checked.
    expect(factView(legacy, sources, none)).toEqual({ id: 'x', section: 'Purpose · Gate 1', status: 'partly', statement: 'c', quote: 'q', note: expect.stringMatching(/not been checked/) });
    expect(factView({ ...legacy, quote: null, trust: 'assumption' }, sources, none)).toMatchObject({ status: 'partly', note: 'Not quoted from any page.' });
    expect(factView({ ...legacy, review_status: 'rejected' }, sources, none)).toBeNull();
    // An owner answer is the owner's own evidence: found, no source; an interview step that is not a kit section is
    // labelled as PR #75's ownerAnswer fixture is.
    expect(factView({ ...legacy, section: 'golden_circle', quote: null, trust: 'owner_answer' }, sources, none)).toEqual({ id: 'x', section: 'Owner answer', status: 'found', statement: 'c', note: 'Your own answer.' });
    expect(factView({ ...legacy, section: 'origin', quote: null, trust: 'owner_answer' }, sources, none)).toMatchObject({ section: 'Origin story', status: 'found' });
    // A supported exact quote from a page the brand does not control: found, and it says it waits for the owner.
    const third = { ...legacy, source_id: 's3', trust: 'third_party', match: 'exact', review_status: 'proposed' };
    expect(factView(third, sources, none)).toMatchObject({ status: 'found', source: { label: 'news.example · JamJam', url: 'https://news.example/jamjam' }, note: expect.stringMatching(/waits for you/) });
    expect(factView(third, sources, new Set(['x']))).toMatchObject({ status: 'needs-you' });
  });
  it('a conflict (B3a) maps to one needs-you question plus each side with its own quote and source, each fact shown once', async () => {
    await extract('https://jamjam.tech');
    await extract('https://news.example/jamjam');
    const { sources, conflicts } = rows();
    expect(conflicts).toHaveLength(1);
    const out = journeyFacts(evidence() as never, sources, conflicts);
    expect(out.conflicts).toHaveLength(1);
    const [v] = out.conflicts;
    expect(v.question).toMatchObject({ status: 'needs-you', section: 'Origin story', statement: expect.stringMatching(/disagree on when the brand was founded/) });
    expect(v.sides.map((x) => [x.status, x.quote, x.source?.label]).sort()).toEqual([
      ['needs-you', 'JamJam was founded in 2020 in Melbourne.', 'jamjam.tech · home page'],
      ['needs-you', 'JamJam, founded in 2021', 'news.example · JamJam'],
    ]);
    const shown = [...out.facts.map((f) => f.id), ...v.sides.map((f) => f.id)];
    expect(new Set(shown).size).toBe(shown.length);
    expect(shown.sort()).toEqual(evidence().filter((e) => e.review_status !== 'rejected').map((e) => e.id).sort());
    expect(out.facts.every((f) => f.status !== 'needs-you')).toBe(true);
    // A side the owner rejected drops out; a resolved conflict is no longer asked, and its facts show on their own.
    const rejected = evidence().find((e) => e.id === v.sides[0].id)!;
    rejected.review_status = 'rejected';
    expect(conflictView(conflicts[0], evidence() as never, sources)!.sides).toHaveLength(1);
    const others = evidence().filter((e) => (conflicts[0] as { evidence_ids: string[] }).evidence_ids.includes(e.id as string) && e.review_status !== 'rejected');
    expect(conflictView(conflicts[0], evidence().map((e) => (others.includes(e) ? { ...e, review_status: 'rejected' } : e)) as never, sources)).toBeNull();
    const resolved = { ...(conflicts[0] as object), status: 'resolved' } as never;
    expect(conflictView(resolved, evidence() as never, sources)).toBeNull();
    expect(openConflictIds([resolved]).size).toBe(0);
    expect(journeyFacts(evidence() as never, sources, [resolved]).facts.every((f) => f.status !== 'needs-you')).toBe(true);
  });
  it('the save step stores the page each quote is on, never a cut address, and cuts text only between characters', async () => {
    const read = { kind: 'site', url: 'https://jamjam.tech/', title: 'JamJam', text: 'abcdef', truncated: false, pages: [
      { url: 'https://jamjam.tech/', title: 'JamJam', start: 0, end: 3 },
      { url: `https://jamjam.tech/${'p'.repeat(MAX_PAGE_URL)}`, title: 'Long', start: 3, end: 6 },
    ] };
    expect(pageOf(read, 0, 3)).toEqual({ url: 'https://jamjam.tech/', title: 'JamJam' });
    expect(pageOf(read, 2, 4)).toBeNull(); // across two pages: the fact links to its source
    expect(pageOf(read, 3, 5)).toBeNull(); // an address too long to store is left out, not cut
    expect(pageOf({ ...read, pages: undefined }, 0, 3)).toBeNull();
    const long = `${'😀'.repeat(MAX_PAGE_TITLE)}x`;
    expect(pageOf({ ...read, pages: [{ ...read.pages[0], title: long }] }, 0, 3)!.title).toBe('😀'.repeat(MAX_PAGE_TITLE));
    // The source excerpt: 1,999 characters then an emoji across the 2,000-unit mark is cut before the emoji.
    const text = `${'a'.repeat(1999)}😀 and more`;
    db.tables.sources.push({ id: 'src-x', brand_id: BRAND, url: 'https://jamjam.tech/', status: 'queued' });
    await saveExtractedFacts(env, { id: 'run-x', brand_id: BRAND }, { sourceId: 'src-x', read: { ...read, text, pages: [] }, facts: [], dropped: {} });
    expect(db.tables.sources.find((x) => x.id === 'src-x')).toMatchObject({ text_excerpt: 'a'.repeat(1999), source_text: text });
  });
});

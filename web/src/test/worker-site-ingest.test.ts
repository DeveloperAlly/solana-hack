import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND, db, env, Evicted, fakeDb, fakeStep, seedTables, type Row } from './engine-harness';

// ingest_site (issue #95): the brand's website home page read as a site through the source adapter registry
// (sources/site.ts), facts extracted per page, each quote checked against its own page, each page saved as a source.
const { handleApi } = await import('../../worker/api');
const { HttpError } = await import('../../worker/env');
const { runWorkflow } = await import('../../worker/engine/runner');
const { localDeps } = await import('../../worker/engine/executor');
const { ingestKind } = await import('../../worker/engine/api');
const { INGEST_SITE } = await import('../../worker/engine/seed');

const filler = (w: string) => `${w} `.repeat(120);
const PAGES: Record<string, string> = {
  'https://acme.test/': `<html><head><title>Acme</title></head><body><p>Acme builds bridges for small towns.</p><a href="/about">About</a><a href="/pricing">Pricing</a><p>${filler('home')}</p></body></html>`,
  'https://acme.test/about': `<html><head><title>About Acme</title></head><body><p>Acme was founded in 2024 by two engineers.</p><p>${filler('about')}</p></body></html>`,
  'https://acme.test/pricing': `<html><head><title>Pricing</title></head><body><p>Plans start at ten dollars a month.</p><p>${filler('pricing')}</p></body></html>`,
};
// The model answers per page; each page also offers a quote that is only on another page, which must be dropped.
function factsFor(userMsg: string) {
  if (userMsg.includes('URL: https://acme.test/about')) return [{ section: 'origin', claim: 'Founded 2024', quote: 'Acme was founded in 2024 by two engineers.' }, { section: 'purpose', claim: 'Bridges', quote: 'Acme builds bridges for small towns.' }];
  if (userMsg.includes('URL: https://acme.test/pricing')) return [{ section: 'positioning', claim: 'Cheap plans', quote: 'Plans start at ten dollars a month.' }];
  return [{ section: 'purpose', claim: 'Builds bridges', quote: 'Acme builds bridges for small towns.' }, { section: 'origin', claim: 'Founded 2024', quote: 'Acme was founded in 2024 by two engineers.' }];
}

let step = fakeStep();
let llmCalls = 0;
let robots = 'User-agent: *\nAllow: /\n';
beforeEach(async () => {
  await seedTables();
  db.tables.brands[0].website = 'https://acme.test';
  step = fakeStep();
  llmCalls = 0;
  robots = 'User-agent: *\nAllow: /\n';
  vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    if (u.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u', email: 'o@example.com' }));
    if (u.startsWith('https://db.test')) return new Response(JSON.stringify(fakeDb(u, init)));
    if (u.startsWith('https://openrouter.ai')) {
      llmCalls++;
      const userMsg = (JSON.parse(String(init!.body)).messages as { content: string }[])[1].content;
      return new Response(JSON.stringify({ model: 'test/model', choices: [{ message: { content: JSON.stringify({ facts: factsFor(userMsg) }) } }] }));
    }
    if (u === 'https://acme.test/robots.txt') return new Response(robots, { headers: { 'content-type': 'text/plain' } });
    const page = PAGES[u] ?? PAGES[u.replace(/\/$/, '') + '/'];
    if (page) return new Response(page, { headers: { 'content-type': 'text/html' } });
    return new Response('not found', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const binding = () => ({
  async create(o: { id?: string }) {
    await runWorkflow(envWith, o.id!, step.api, localDeps).catch((e) => { if (!(e instanceof Evicted)) throw e; });
    return { id: o.id! };
  },
  async get(id: string) {
    return { status: async () => ({ status: ['done', 'failed'].includes(String(db.tables.runs.find((r) => r.id === id)?.status)) ? 'complete' : 'running' }) };
  },
});
const envWith = { ...env, RUN_WORKFLOW: binding() };
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

describe('ingest_site definition', () => {
  it('migration 011 seeds exactly the definition in seed.ts and lets run_steps record source steps', () => {
    const sql = readFileSync(resolvePath(process.cwd(), '../spec/db/011_ingest_site.sql'), 'utf8');
    expect(JSON.parse(/\$spec\$([\s\S]*?)\$spec\$/.exec(sql)![1])).toEqual(INGEST_SITE);
    expect(sql).toContain("check (type in ('fetch','source','llm','code','write','map'))");
  });
  it('reads the home page of the brand website as a site; any other link as one page', () => {
    expect(ingestKind('https://acme.test', 'https://acme.test')).toBe('ingest_site');
    expect(ingestKind('https://acme.test/', 'acme.test')).toBe('ingest_site');
    expect(ingestKind('https://acme.test/about', 'https://acme.test')).toBe('ingest_url');
    expect(ingestKind('https://other.test/', 'https://acme.test')).toBe('ingest_url');
    expect(ingestKind('https://acme.test/', null)).toBe('ingest_url');
  });
});

describe('reading the website (J1)', () => {
  it('reads the home page and its key subpages, checks each quote against its own page, saves one source per page', async () => {
    const res = await call('POST', `/brands/${BRAND}/sources`, { url: 'https://acme.test/' });
    expect(res.status).toBe(201);
    expect(db.tables.runs[0]).toMatchObject({ kind: 'ingest_site', status: 'done' });
    expect(res.body).toMatchObject({ pages: 3, kind: 'site' });
    expect(llmCalls).toBe(3);
    const sources = db.tables.sources as (Row & { id: string; url: string })[];
    expect(sources.map((s) => s.url).sort()).toEqual(['https://acme.test/', 'https://acme.test/about', 'https://acme.test/pricing']);
    expect(sources.every((s) => s.status === 'read' && s.kind === 'site')).toBe(true);
    const ev = db.tables.evidence as Row[];
    // Each kept fact sits on the page its quote is on; a quote offered for the wrong page is dropped.
    for (const e of ev) {
      const src = sources.find((s) => s.id === e.source_id)!;
      expect(String(src.source_text)).toContain(String(e.quote));
    }
    expect(ev).toHaveLength(3); // one kept per page: home (bridges), about (founded), pricing (plans)
    expect(res.body.dropped).toBe(2);
    expect(ev.every((e) => e.trust === 'owned' && e.review_status === 'approved')).toBe(true);
  });
  it('a retried save writes no duplicate sources or facts', async () => {
    await call('POST', `/brands/${BRAND}/sources`, { url: 'https://acme.test/' });
    const before = { s: db.tables.sources.length, e: db.tables.evidence.length };
    const { WRITES } = await import('../../worker/engine/steps');
    const run = db.tables.runs[0] as Row & { id: string; brand_id: string };
    expect((run.output as { sources: string[] }).sources).toHaveLength(3);
    // Run the save again with the same pages, as Workflows does when a step is retried.
    const ctx = { env: envWith, run: run as never, state: { input: {}, steps: {}, prompts: {} } };
    const srcs = db.tables.sources as (Row & { url: string; source_text: string })[];
    const again = srcs.map((s) => ({ url: s.url, title: 't', text: s.source_text, facts: (db.tables.evidence as Row[]).filter((e) => e.source_id === s.id).map((e) => ({ section: e.section, claim: e.claim, quote: e.quote })), dropped: 0 }));
    // Facts are re-derived per source in the same order, so the derived ids match and nothing new is inserted.
    await WRITES.save_site_facts(ctx, { sourceId: srcs[0].id, pages: again, link: 'https://acme.test/', website: 'https://acme.test' });
    expect(db.tables.sources.length).toBe(before.s);
    expect(db.tables.evidence.length).toBe(before.e);
  });
  it('honours robots.txt: a disallowed site is not read and the source is marked failed with a reason', async () => {
    robots = 'User-agent: *\nDisallow: /\n';
    const res = await call('POST', `/brands/${BRAND}/sources`, { url: 'https://acme.test/' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(llmCalls).toBe(0);
    expect(db.tables.sources[0]).toMatchObject({ status: 'failed' });
    expect(String(db.tables.sources[0].error)).toContain('robots.txt');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND, db, env, Evicted, fakeDbResponse, fakeStep, seedTables } from './engine-harness';

// The model's rate limits inside a run (issue #32). llm.ts is stubbed here: after its own three tries it throws "the AI
// model is busy" for a 429 or 5xx, which is all the runner can see today (see the PR's llm.ts follow-up).
const llm = vi.hoisted(() => ({ busyFor: 0, calls: 0 }));
vi.mock('../../worker/llm', async (actual) => {
  const real = await actual<typeof import('../../worker/llm')>();
  const { HttpError } = await import('../../worker/env');
  return {
    ...real,
    chat: async () => {
      llm.calls++;
      if (llm.busyFor-- > 0) throw new HttpError(502, 'the AI model is busy, try again in a minute');
      return { text: JSON.stringify({ facts: [{ section: 'purpose', claim: 'c', quote: 'JamJam helps brands prove what they say.' }] }), model: 'test/model' };
    },
  };
});
const { runWorkflow, nextUtcMidnight, RATE_LIMIT_DELAY_MS, MAX_PAUSES } = await import('../../worker/engine/runner');
const { inlineStep, localDeps } = await import('../../worker/engine/executor');
const { progressAt } = await import('../../worker/engine/runner');
const { INGEST_URL } = await import('../../worker/engine/seed');

beforeEach(async () => {
  await seedTables({ sources: [{ id: 's1', brand_id: BRAND, url: 'https://example.com', status: 'pending' }] });
  db.tables.runs.push({ id: 'r1', brand_id: BRAND, kind: 'ingest_url', workflow_version: 1, executor: 'workflows', status: 'running', input: { url: 'https://example.com', sourceId: 's1', brandName: 'JamJam' }, progress: progressAt(INGEST_URL, 0) });
  llm.calls = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith('https://db.test')) return fakeDbResponse(url, init);
    return new Response('<title>JamJam</title><p>JamJam helps brands prove what they say. More text to read here.</p>', { headers: { 'content-type': 'text/html' } });
  }));
});
afterEach(() => vi.unstubAllGlobals());
const run = () => db.tables.runs[0];

describe('model rate limits in a run', () => {
  it('a per-minute limit waits at least 60 s, then more, before each retry', async () => {
    llm.busyFor = 2;
    const step = fakeStep();
    await runWorkflow(env, 'r1', step.api, localDeps);
    expect(step.delays).toEqual([{ step: 'extract', ms: RATE_LIMIT_DELAY_MS }, { step: 'extract', ms: 2 * RATE_LIMIT_DELAY_MS }]);
    expect(run().status).toBe('done');
    expect(db.tables.run_steps.filter((s) => s.step === 'extract').map((s) => s.outcome)).toEqual(['error', 'error', 'ok']);
  });

  it('a limit that outlasts the retries pauses the run until 00:00 UTC with a clear message, then carries on', async () => {
    llm.busyFor = 3; // every attempt of the first try at the step
    const step = fakeStep();
    const before = Date.now();
    await runWorkflow(env, 'r1', step.api, localDeps);
    // While paused (between the pause write and the wake-up), the run row said so; the trace keeps the pause.
    expect(db.tables.run_steps.find((s) => s.outcome === 'paused')).toMatchObject({ step: 'extract', error: 'rate limited' });
    expect(step.sleeps).toEqual([{ step: 'wait:extract:1', until: nextUtcMidnight(before) }]);
    expect(step.ran).toContain('extract~1');
    expect(run()).toMatchObject({ status: 'done', resume_at: null });
  });

  it('inline: a limit that outlasts the retries ends the run with when to try again, never parked (PR #99 review)', async () => {
    llm.busyFor = 100;
    run().executor = 'inline';
    run().metered_planned = 1;
    const before = Date.now();
    // The inline step API with no real waiting: its retry delays above INLINE_MAX_WAIT_MS end the attempt at once.
    await runWorkflow(env, 'r1', inlineStep(async () => undefined), localDeps);
    const at = new Date(nextUtcMidnight(before)).toISOString().slice(11, 16);
    expect(run()).toMatchObject({ status: 'failed', resume_at: null, error: `The AI model's free daily allowance is used up, so this run stopped. Start it again after ${at} UTC.`, error_code: 429 });
    expect(db.tables.sources[0]).toMatchObject({ status: 'failed' });
    // A failed run holds nothing: the next admission counts no reservation for it.
    const { admit } = await import('../../worker/engine/api');
    db.tables.engine_config.push({ key: 'metered_call_budget', value: { permanent: 1 } });
    db.tables.metered_usage = []; // the calls it made are the meter's; what matters here is that it reserves nothing
    db.tables.workflow_defs.find((d) => d.id === 'ingest_url')!.status = 'active';
    await expect(admit({ ...env, RUN_WORKFLOW: { create: async () => ({ id: 'x' }), get: async () => ({ status: async () => ({ status: 'complete' }) }) } } as never, { brand: db.tables.brands[0] as never, kind: 'ingest_url', actor: { id: 'u' } })).resolves.toMatchObject({ kind: 'ingest_url' });
  });

  it('records paused, resume_at and the message while it waits', async () => {
    llm.busyFor = 3;
    // Stop at the wake-up, as if the instance were still asleep, and read the row a reload would read.
    const step = fakeStep({ evictBefore: 'resume:extract:1' });
    await runWorkflow(env, 'r1', step.api, localDeps).catch((e) => { if (!(e instanceof Evicted)) throw e; });
    expect(run().status).toBe('paused');
    expect(run().resume_at).toBe(new Date(nextUtcMidnight()).toISOString());
    expect((run().progress as { message: string }).message).toMatch(/continues at 00:00 UTC/);
    expect((run().progress as { steps: { status: string }[] }).steps.map((s) => s.status)).toEqual(['done', 'paused', 'pending', 'pending']);
  });

  it(`fails after ${MAX_PAUSES} pauses rather than waiting forever, and closes the source`, async () => {
    llm.busyFor = 100;
    await runWorkflow(env, 'r1', fakeStep().api, localDeps);
    expect(run()).toMatchObject({ status: 'failed', error: 'the AI model is busy, try again in a minute', error_code: 502 });
    expect(db.tables.sources[0]).toMatchObject({ status: 'failed', error: 'the AI model is busy, try again in a minute' });
  });
});

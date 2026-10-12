// The run loop (issue #32). One function runs a definition's steps on any executor: the Cloudflare Workflows class
// (workflow.ts) hands it the real `step` object; the inline adapter and the tests hand it a stand-in with the same
// two methods. Every step's work and its run_steps row happen inside one durable step, so a retried or replayed step
// redoes both, and every write a step makes is idempotent (steps.ts WRITES).
import { db } from '../db';
import { HttpError, safeError, type Env } from '../env';
import { runStep, resolve, WRITES, type RunState, type StepContext } from './steps';
import { loadTaskModels, type TaskModels } from '../models';
import { BudgetExhausted, MeteredFailure } from '../metering';
import { meteredCalls } from './guards';
import type { Progress, RetrySpec, RunRow, StepProgress, StepSpec, StepTrace, WorkflowSpec } from './types';

/** The subset of the Workflows step API the runner uses (https://developers.cloudflare.com/workflows/build/workers-api/#step). */
export interface StepApi {
  do<T>(name: string, config: StepConfig, callback: (ctx: { attempt: number }) => Promise<T>): Promise<T>;
  sleepUntil(name: string, timestamp: number): Promise<void>;
}
export interface StepConfig {
  retries: { limit: number; delay: (i: { ctx: { attempt: number }; error: Error }) => number };
  timeout?: string;
}
export interface RunnerDeps {
  /** Builds an error that stops retries: Workflows' NonRetryableError, or a stand-in carrying the same name. */
  nonRetryable(message: string): Error;
}

/** A run pauses at most this many times for the model's daily limit before it fails. */
export const MAX_PAUSES = 2;
/** The shortest wait before retrying after the model's per-minute limit (20 requests a minute on free models,
 * https://openrouter.ai/docs/api-reference/limits). */
export const RATE_LIMIT_DELAY_MS = 60_000;

const UNITS: Record<string, number> = { second: 1e3, minute: 6e4, hour: 3.6e6, day: 8.64e7 };
/** "5 seconds" -> 5000. Accepts the units Workflows accepts for these spans. */
export function durationMs(s: string) {
  const m = /^(\d+)\s*(second|minute|hour|day)s?$/.exec(s.trim());
  if (!m) throw new HttpError(500, `bad duration ${s}`);
  return Number(m[1]) * UNITS[m[2]];
}

/**
 * Errors cross the Workflows boundary as messages only, so they are encoded "E<code>|<kind>|<message>": code is the
 * HTTP status the API answers with, kind says how the runner treats it ('fail' stops retries, 'retry' retries with
 * backoff, 'rate' retries after at least a minute, 'superseded' and 'parked' end the run quietly).
 */
export type ErrorKind = 'fail' | 'retry' | 'rate' | 'superseded' | 'parked';
export function encodeError(code: number, kind: ErrorKind, message: string) { return `E${code}|${kind}|${message}`; }
export function decodeError(e: unknown): { code: number; kind: ErrorKind; message: string } {
  const m = /^E(\d+)\|(\w+)\|([\s\S]*)$/.exec((e as Error)?.message ?? '');
  if (m) return { code: Number(m[1]), kind: m[2] as ErrorKind, message: m[3] };
  return { code: 500, kind: 'retry', message: 'something went wrong' };
}

// llm.ts answers a 429 or 5xx that outlasts its own three tries with this message, and does not say which it was.
const MODEL_BUSY = 'the AI model is busy, try again in a minute';

/** Turns what a step threw into an encoded error, choosing whether it is worth retrying. */
export function classify(e: unknown, deps: RunnerDeps): Error {
  if (/^E\d+\|/.test((e as Error)?.message ?? '')) return e as Error;
  if (e instanceof HttpError) {
    if (e.message === MODEL_BUSY) return new Error(encodeError(e.status, 'rate', e.message));
    // A bad link, a page that is not text, a page with no text, or a site answering 4xx will not change on retry.
    if ((e.status >= 400 && e.status < 500) || /^the site answered with HTTP 4\d\d$/.test(e.message)) return deps.nonRetryable(encodeError(e.status, 'fail', e.message));
    return new Error(encodeError(e.status, 'retry', e.message));
  }
  console.error('run step error', safeError(e));
  return new Error(encodeError(500, 'retry', 'something went wrong'));
}

/** Retry delay for a step: its own backoff, and at least a minute (growing per attempt) after a rate limit. */
export function retryDelay(r: RetrySpec) {
  const base = durationMs(r.delay);
  return ({ ctx, error }: { ctx: { attempt: number }; error: Error }) => {
    const n = Math.max(1, ctx.attempt);
    const backoff = r.backoff === 'exponential' ? base * 2 ** (n - 1) : r.backoff === 'linear' ? base * n : base;
    return decodeError(error).kind === 'rate' ? Math.max(RATE_LIMIT_DELAY_MS * n, backoff) : backoff;
  };
}
const configFor = (r: RetrySpec, timeout?: string): StepConfig => ({ retries: { limit: r.limit, delay: retryDelay(r) }, ...(timeout ? { timeout } : {}) });
const BOOKKEEPING = configFor({ limit: 3, delay: '2 seconds', backoff: 'exponential' });

/** Progress for a run whose first `done` steps are finished and whose next step is in `current` state. */
export function progressAt(spec: Pick<WorkflowSpec, 'steps'>, done: number, current: StepProgress['status'] = 'running', message: string | null = null): Progress {
  const steps = spec.steps.map((s, j): StepProgress => ({ id: s.id, label: s.label, status: j < done ? 'done' : j === done ? current : 'pending' }));
  return { steps, done: Math.min(done, steps.length), total: steps.length, message };
}

/** One coalesced write per stage: the step's trace row and the run's new progress in one call (spec/db/010
 * record_run_step). Returns false when the run is no longer running or paused (superseded or finished elsewhere). */
export async function record(env: Env, runId: string, step: StepTrace | null, patch: Record<string, unknown>) {
  return (await db.rpc<boolean>(env, 'record_run_step', { p_run: runId, p_step: step, p_patch: patch })) !== false;
}

/** The next 00:00 UTC, when OpenRouter's daily free-model allowance starts again (limits page above: "current UTC day"). */
export const nextUtcMidnight = (now = Date.now()) => { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1); };

export async function runWorkflow(env: Env, runId: string, step: StepApi, deps: RunnerDeps) {
  // Loading is inside the failure path (PR #70 review): a missing definition or prompt, or a database error that
  // outlasts the retries, marks the run and its source failed instead of leaving them running and pending.
  let loaded: Awaited<ReturnType<typeof load>>;
  try {
    loaded = await load(env, runId, step, deps);
  } catch (e) {
    const err = decodeError(e);
    if (err.kind === 'superseded') return;
    await step.do('fail:load', BOOKKEEPING, async () => {
      const [run] = await db.select<Pick<RunRow, 'brand_id' | 'input'>>(env, 'runs', `${db.eq('id', runId)}&select=brand_id,input`);
      // Without a definition there is no onFailure op to read, so a run that started a source (input.sourceId, as
      // ingest_url does) closes it the same way mark_source_failed would.
      const sourceId = (run?.input as { sourceId?: unknown } | undefined)?.sourceId;
      if (run && typeof sourceId === 'string') await WRITES.mark_source_failed({ env, run: run as RunRow, state: { input: run.input, steps: {}, prompts: {} } }, { sourceId, error: err.message });
      await record(env, runId, null, { status: 'failed', error: err.message, error_code: err.code });
      return null;
    });
    return;
  }
  const { run, spec } = loaded;
  if (run.status !== 'running' && run.status !== 'paused') return;
  const state: RunState = { input: run.input ?? {}, steps: {}, prompts: loaded.prompts, models: loaded.models };
  const ctx: StepContext = { env, run, state };
  let at = 0;
  try {
    for (; at < spec.steps.length; at++) state.steps[spec.steps[at].id] = await stage(env, step, deps, ctx, spec, at);
    await step.do('finish', BOOKKEEPING, async () => {
      await record(env, run.id, null, { status: 'done', output: resolve(spec.output, state) ?? null, progress: progressAt(spec, spec.steps.length), resume_at: null });
      return null;
    });
  } catch (e) {
    const err = decodeError(e);
    if (err.kind === 'superseded' || err.kind === 'parked') return;
    await step.do('fail', BOOKKEEPING, async () => {
      if (spec.onFailure) {
        const op = WRITES[spec.onFailure.op];
        const args = Object.fromEntries(Object.entries(spec.onFailure.args).map(([k, ref]) => [k, resolve(ref, state)]));
        await op?.(ctx, { ...args, error: err.message });
      }
      await record(env, run.id, null, { status: 'failed', error: err.message, error_code: err.code, resume_at: null, progress: progressAt(spec, at, 'failed', err.message) });
      return null;
    });
  }
}

/** The run row, its pinned definition and the prompt version each llm step will use, as one durable step. */
function load(env: Env, runId: string, step: StepApi, deps: RunnerDeps) {
  return step.do('load', BOOKKEEPING, async () => {
    const [run] = await db.select<RunRow>(env, 'runs', db.eq('id', runId));
    if (!run) throw deps.nonRetryable(encodeError(404, 'superseded', 'run not found'));
    const [def] = await db.select<{ spec: WorkflowSpec }>(env, 'workflow_defs', `${db.eq('id', run.kind)}&${db.eq('version', String(run.workflow_version))}&select=spec`);
    if (!def) throw deps.nonRetryable(encodeError(500, 'fail', `workflow ${run.kind} v${run.workflow_version} is missing`));
    // Each llm step's prompt version is fixed here, once per run, so every attempt and every resume uses the same one.
    const keys = [...new Set(def.spec.steps.flatMap((s) => (s.type === 'llm' && !s.promptVersion ? [s.prompt] : s.type === 'map' && s.step.type === 'llm' && !s.step.promptVersion ? [s.step.prompt] : [])))];
    const prompts: Record<string, number> = {};
    for (const key of keys) {
      const [p] = await db.select<{ version: number }>(env, 'prompt_versions', `${db.eq('key', key)}&${db.eq('status', 'active')}&select=version&order=version.desc&limit=1`);
      if (!p) throw deps.nonRetryable(encodeError(500, 'fail', `prompt ${key} is missing`));
      prompts[key] = p.version;
    }
    // Each llm step's models are fixed here too (models.ts): a run never mixes configs, and a judge's family rule is
    // checked once, before any model is called. An unusable config fails the run without retrying.
    const tasks = [...new Set(def.spec.steps.flatMap((s) => (s.type === 'llm' ? [s.prompt] : s.type === 'map' && s.step.type === 'llm' ? [s.step.prompt] : [])))];
    let models: TaskModels;
    try {
      models = await loadTaskModels(env, tasks);
    } catch (e) {
      throw deps.nonRetryable(encodeError(500, 'fail', (e as Error).message));
    }
    return { run, spec: def.spec, prompts, models };
  });
}

/** Consumes metered calls for one attempt; a 429 from the meter is BudgetExhausted (a 4xx, so it is not retried). */
async function consumeMetered(env: Env, runId: string, n: number) {
  try {
    await db.rpc<number | null>(env, 'consume_metered', { p_run: runId, p_n: n });
  } catch (e) {
    if (e instanceof HttpError && e.status === 429) throw new BudgetExhausted(e.message);
    throw e;
  }
}

/**
 * One stage, retried by the executor per its policy. If it still fails on the model's rate limit after its retries
 * (several minutes of backoff), the run pauses until 00:00 UTC, when the daily free allowance resets, then tries the
 * stage again under a new step name. llm.ts does not yet say which limit a 429 hit, so a limit that outlasts the
 * backoff is treated as the daily one; see the PR for the llm.ts follow-up.
 */
async function stage(env: Env, step: StepApi, deps: RunnerDeps, ctx: StepContext, spec: WorkflowSpec, i: number) {
  const s = spec.steps[i];
  for (let pause = 0; ; pause++) {
    const name = pause ? `${s.id}~${pause}` : s.id;
    try {
      return await attempt(env, step, deps, ctx, spec, i, s, name);
    } catch (e) {
      if (decodeError(e).kind !== 'rate' || pause >= MAX_PAUSES) throw e;
      const message = 'The AI model has turned requests away for several minutes, most likely because the free daily allowance is used up. This run continues at 00:00 UTC.';
      const resumeAt = await step.do(`pause:${s.id}:${pause + 1}`, BOOKKEEPING, async () => {
        const at = nextUtcMidnight();
        await record(env, ctx.run.id, { step: s.id, attempt: 0, type: s.type, outcome: 'paused', duration_ms: 0, error: 'rate limited' }, { status: 'paused', resume_at: new Date(at).toISOString(), progress: progressAt(spec, i, 'paused', message) });
        return at;
      });
      await step.sleepUntil(`wait:${s.id}:${pause + 1}`, resumeAt);
      await step.do(`resume:${s.id}:${pause + 1}`, BOOKKEEPING, async () => {
        await record(env, ctx.run.id, null, { status: 'running', resume_at: null, progress: progressAt(spec, i) });
        return null;
      });
    }
  }
}

async function attempt(env: Env, step: StepApi, deps: RunnerDeps, ctx: StepContext, spec: WorkflowSpec, i: number, s: StepSpec, name: string) {
  const config = configFor(s.retries ?? spec.retries, s.timeout);
  const one = (stepName: string, traceId: string, inner: Exclude<StepSpec, { type: 'map' }>, last: boolean, item?: unknown) =>
    step.do(stepName, config, async (sctx) => {
      const t0 = Date.now();
      try {
        // The meter is the authority for the budget: every attempt at a metered step consumes its calls first
        // (spec/db/011 consume_metered); a refusal ends the run without a retry (metering.ts BudgetExhausted).
        const n = meteredCalls(inner);
        if (n > 0) await consumeMetered(env, ctx.run.id, n);
        const r = await runStep(inner, ctx, item);
        const live = await record(env, ctx.run.id, { step: traceId, attempt: sctx.attempt, type: inner.type, outcome: 'ok', duration_ms: Date.now() - t0, metered_calls: meteredCalls(inner), ...r.trace }, last ? { progress: progressAt(spec, i + 1) } : {});
        if (!live) throw deps.nonRetryable(encodeError(409, 'superseded', 'run superseded'));
        return r.output ?? null;
      } catch (e) {
        const err = classify(e, deps);
        const d = decodeError(err);
        if (d.kind === 'superseded') throw err;
        const waiting = d.kind === 'rate' ? "Waiting for the AI model's rate limit before trying again." : null;
        // A failure after money was spent (metering.ts MeteredFailure: a refused model reply, a paid read that returned
        // nothing usable) keeps its cost and the call's trace on the error record, so spend and admission count it.
        const made = e instanceof MeteredFailure ? { ...(e.trace ?? {}), cost_usd: e.cost } : {};
        await record(env, ctx.run.id, { ...made, metered_calls: e instanceof BudgetExhausted ? 0 : meteredCalls(inner), step: traceId, attempt: sctx.attempt, type: inner.type, outcome: 'error', duration_ms: Date.now() - t0, error: d.message.slice(0, 300) }, { progress: progressAt(spec, i, 'running', waiting) }).catch(() => undefined);
        throw err;
      }
    });
  if (s.type !== 'map') return one(name, s.id, s, true);
  const items = (resolve(s.over, ctx.state) as unknown[] | undefined ?? []).slice(0, s.max);
  const out: unknown[] = [];
  for (let j = 0; j < items.length; j++) out.push(await one(`${name}[${j}]`, `${s.id}[${j}]`, s.step, j === items.length - 1, items[j]));
  if (!items.length) await step.do(`${name}:empty`, BOOKKEEPING, async () => { await record(env, ctx.run.id, null, { progress: progressAt(spec, i + 1) }); return null; });
  return out;
}

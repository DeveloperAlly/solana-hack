// Executors (issue #32): where a run's steps execute. 'workflows' (default) hands the run to Cloudflare Workflows, which
// persists each step and retries it; 'inline' runs it in this Worker invocation with ctx.waitUntil. The choice is the
// engine_config row 'executor' (spec/db/010), so it changes without a deploy.
//
// The inline adapter runs single-step definitions only. waitUntil work is cancelled 30 seconds after the response is
// sent (https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil), so a multi-call run could be cut off
// part-way with nothing to resume it. Multi-step definitions need Workflows, and the executor refuses them inline.
import { db } from '../db';
import { HttpError, safeError, type Env } from '../env';
import { runWorkflow, type RunnerDeps, type StepApi } from './runner';
import type { RunRow, WorkflowSpec } from './types';

export type ExecutorName = 'workflows' | 'inline';

/** The Workflow binding (wrangler.jsonc "workflows"; https://developers.cloudflare.com/workflows/build/workers-api/#workflow). */
export interface WorkflowBinding {
  create(o: { id?: string; params?: unknown }): Promise<{ id: string }>;
  get(id: string): Promise<{ status(): Promise<{ status: string; error?: { name: string; message: string } }> }>;
}
export interface WaitUntil { waitUntil(p: Promise<unknown>): void }

/** Instance states after which the instance does no more work (InstanceStatus, Workers API page above). */
const TERMINAL = new Set(['complete', 'errored', 'terminated']);

/** Waits before an inline retry longer than this are not taken: the run fails instead of outliving the waitUntil window. */
export const INLINE_MAX_WAIT_MS = 10_000;

/** A stand-in for NonRetryableError outside the Workflows runtime: same name, so the inline step loop stops on it. */
export const localDeps: RunnerDeps = { nonRetryable: (m) => Object.assign(new Error(m), { name: 'NonRetryableError' }) };

/** The step API for inline runs: retries in-process with the step's delays (capped), and cannot sleep. */
export function inlineStep(sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))): StepApi {
  return {
    async do(_name, config, callback) {
      for (let attempt = 1; ; attempt++) {
        try {
          return await callback({ attempt });
        } catch (e) {
          if ((e as Error)?.name === 'NonRetryableError' || attempt > config.retries.limit) throw e;
          const ms = config.retries.delay({ ctx: { attempt }, error: e as Error });
          if (ms > INLINE_MAX_WAIT_MS) throw e;
          await sleep(ms);
        }
      }
    },
    // No inline run can outlive its request, so a pause leaves the run 'paused' with its resume_at; starting it again
    // is a new run.
    async sleepUntil() { throw localDeps.nonRetryable('E0|parked|paused until resume_at'); },
  };
}

/** The most POST /sources may be set to wait for its run (engine_config ingest_wait_ms). */
export const MAX_INGEST_WAIT_MS = 30_000;

/**
 * Engine settings from engine_config, in one read. executor: 'workflows' unless the row says 'inline'.
 * ingestWaitMs: how long POST /sources waits for its run before answering "still reading"; 0 (no row) means it does not
 * wait, so the request never holds on to the run (PR #70 review), capped at MAX_INGEST_WAIT_MS.
 */
export async function engineConfig(env: Env): Promise<{ executor: ExecutorName; ingestWaitMs: number }> {
  const rows = await db.select<{ key: string; value: unknown }>(env, 'engine_config', 'key=in.(executor,ingest_wait_ms)&select=key,value');
  const get = (k: string) => rows.find((r) => r.key === k)?.value;
  const wait = Number(get('ingest_wait_ms'));
  return { executor: get('executor') === 'inline' ? 'inline' : 'workflows', ingestWaitMs: Number.isFinite(wait) ? Math.min(Math.max(wait, 0), MAX_INGEST_WAIT_MS) : 0 };
}

/** Refuses a run the chosen executor cannot finish, before any row is written. */
export function checkExecutor(env: Env, name: ExecutorName, spec: WorkflowSpec) {
  if (name === 'inline' && spec.steps.length > 1) {
    throw new HttpError(503, `${spec.id} has ${spec.steps.length} steps; the inline engine runs single-step workflows only, so this needs Cloudflare Workflows`);
  }
  if (name === 'workflows' && !env.RUN_WORKFLOW) throw new HttpError(503, 'the workflow engine is not available here');
}

export async function launch(env: Env, ctx: WaitUntil | undefined, run: RunRow) {
  if (run.executor === 'workflows') {
    // The instance id is the run id, so the run row and the Workflows instance can always be matched.
    await env.RUN_WORKFLOW!.create({ id: run.id, params: { runId: run.id } });
    return;
  }
  const p = runWorkflow(env, run.id, inlineStep(), localDeps).catch((e) => console.error('inline run failed', safeError(e)));
  if (ctx) ctx.waitUntil(p); else await p;
}

/**
 * Waits up to `ms` for a run to stop doing work, so a request can answer with the result as before. Workflows runs are
 * polled through the binding (calls to Cloudflare services, not external subrequests), then the run row is read once.
 */
export async function waitForRun(env: Env, run: RunRow, ms: number, everyMs = 1500, sleep = (t: number) => new Promise((r) => setTimeout(r, t))) {
  if (ms > 0 && run.executor === 'workflows' && env.RUN_WORKFLOW) {
    const instance = await env.RUN_WORKFLOW.get(run.id);
    for (const end = Date.now() + ms; Date.now() < end; await sleep(everyMs)) {
      if (TERMINAL.has((await instance.status()).status)) break;
    }
  }
  const [row] = await db.select<RunRow>(env, 'runs', db.eq('id', run.id));
  return row ?? run;
}

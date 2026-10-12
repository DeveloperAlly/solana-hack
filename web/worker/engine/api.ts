// Run API (issue #32), owner-only like every /api/brands route:
//   POST /api/brands/:id/runs {kind, ...}  -> 202 {run}             starts a run of a startable kind (engine/kinds.ts)
//   GET  /api/runs/:id                     -> 200 {run, steps}      status, progress and per-step traces
//   GET  /api/brands/:id                   -> adds activeRun        the newest running or paused run, or null
//   POST /api/brands/:id/sources {url}     -> the extract_facts workflow (SOURCE_RUN_KIND); 201 body when done, else 409
//                                             "still reading"
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { checkExecutor, engineConfig, launch, waitForRun, type WaitUntil } from './executor';
import { progressAt } from './runner';
import { admissionLimits, checkStart, type Caller } from './guards';
import { KINDS, type BrandRef } from './kinds';
import type { RunRow, WorkflowSpec } from './types';

type UserRef = Caller;


/** Fields a run row returns to the browser (no input: it can hold a URL the owner typed, which the owner already has). */
const RUN_FIELDS = 'id,brand_id,kind,workflow_version,executor,status,progress,resume_at,error,error_code,output,created_at,updated_at';
const STEP_FIELDS = 'step,attempt,type,outcome,prompt_key,prompt_version,prompt_hash,model,tokens_in,tokens_out,cost_usd,duration_ms,error,created_at';

/**
 * The workflow POST /api/brands/:id/sources starts: fact extraction with its support check (issue #64). ingest_url (one
 * model call, no support check) is retired by spec/db/011, so a claim that says more than its quote can no longer be
 * saved through the Your links step (design review on PR #91).
 */
export const SOURCE_RUN_KIND = 'extract_facts';

export async function activeDef(env: Env, kind: string): Promise<WorkflowSpec> {
  const [def] = await db.select<{ spec: WorkflowSpec }>(env, 'workflow_defs', `${db.eq('id', kind)}&${db.eq('status', 'active')}&select=spec&order=version.desc&limit=1`);
  // A startable kind whose definition is not in the database is a setup gap (its migration is not applied), not a bad
  // request, and is refused before any row is written.
  if (def) return def.spec;
  if (!Object.hasOwn(KINDS, kind)) throw new HttpError(404, `unknown run kind ${kind}`);
  // A startable kind with versions but none active was retired (ingest_url, by spec/db/011): say so, not "not set up".
  const [any] = await db.select<{ id: string }>(env, 'workflow_defs', `${db.eq('id', kind)}&select=id&limit=1`);
  throw any ? new HttpError(410, `${kind} is retired; new runs use ${SOURCE_RUN_KIND}`) : new HttpError(503, `${kind} is not set up in this database yet (its migration in spec/db has not been applied)`);
}

/** Starts a run: pins the active definition's version, writes the run row with its first progress, hands it to the executor. */
export async function startRun(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, kind: string, body: Record<string, unknown>) {
  return (await start(env, ctx, user, brand, kind, body)).run;
}

async function start(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, kind: string, body: Record<string, unknown>) {
  const prepare = Object.hasOwn(KINDS, kind) ? KINDS[kind] : undefined;
  if (!prepare) throw new HttpError(404, `unknown run kind ${kind}`);
  const [spec, config] = await Promise.all([activeDef(env, kind), engineConfig(env)]);
  const { executor } = config;
  checkExecutor(env, executor, spec);
  await checkStart(env, user, brand, spec);
  // Admission is the first write (spec/db/011 admit_run): the run rate and the metered-call budget are checked and the
  // run row is written as the reservation in one transaction, serialised per brand. A refusal (429) writes nothing.
  const limits = await admissionLimits(env, user, spec);
  let run = await db.rpc<RunRow>(env, 'admit_run', {
    p_brand: brand.id, p_kind: kind, p_version: spec.version, p_executor: executor, p_progress: progressAt(spec, 0),
    p_created_by: user.id, p_planned: limits.planned, p_budget: limits.budget, p_run_rate: limits.runRate, p_spend_cap: limits.spendCap,
  });
  let input: Record<string, unknown>;
  try {
    input = await prepare(env, brand, body);
  } catch (e) {
    // The request was not usable (or prepare failed): release the reservation, so nothing of this start remains.
    await db.del(env, 'runs', `${db.eq('id', run.id)}&${db.eq('brand_id', brand.id)}`).catch(() => undefined);
    throw e instanceof HttpError ? e : new HttpError(503, 'the run could not start, try again');
  }
  // Everything after prepare() is in one cleanup path (PR #70 review): if writing the input, superseding or handing the
  // run to the executor fails, the run and any source prepare() created are marked failed, so no pending source is left
  // without a run to finish it. Cleanup is best effort: the database may be the thing that failed.
  try {
    [run] = await db.update<RunRow>(env, 'runs', db.eq('id', run.id), { input, updated_at: new Date().toISOString() });
    if (spec.concurrency === 'supersede') {
      await db.update(env, 'runs', `${db.eq('brand_id', brand.id)}&${db.eq('kind', kind)}&id=neq.${run.id}&status=in.(running,paused)`, { status: 'superseded', updated_at: new Date().toISOString() });
    }
    await launch(env, ctx, run);
  } catch (e) {
    const note = 'the run could not start';
    await db.update(env, 'runs', db.eq('id', run.id), { status: 'failed', error: note, error_code: 503, updated_at: new Date().toISOString() }).catch(() => undefined);
    if (typeof input.sourceId === 'string') await db.update(env, 'sources', `${db.eq('id', input.sourceId)}&${db.eq('brand_id', brand.id)}`, { status: 'failed', error: note }).catch(() => undefined);
    throw e instanceof HttpError ? e : new HttpError(503, 'the run could not start, try again');
  }
  return { run, config };
}

/** The newest run that is still running or paused, for a reload to show its progress. */
export async function activeRun(env: Env, brandId: string) {
  const [run] = await db.select<RunRow>(env, 'runs', `${db.eq('brand_id', brandId)}&status=in.(running,paused)&select=${RUN_FIELDS}&order=created_at.desc&limit=1`);
  return run ?? null;
}

/** One run and its step traces, for its owner only. A run of someone else's brand is reported as not found. */
export async function getRun(env: Env, user: UserRef, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, 'run not found');
  const [run] = await db.select<RunRow>(env, 'runs', `${db.eq('id', id)}&select=${RUN_FIELDS}`);
  if (!run) throw new HttpError(404, 'run not found');
  const [own] = await db.select<{ id: string }>(env, 'brands', `${db.eq('id', run.brand_id)}&${db.eq('owner_id', user.id)}&select=id`);
  if (!own) throw new HttpError(404, 'run not found');
  const steps = await db.select(env, 'run_steps', `${db.eq('run_id', id)}&select=${STEP_FIELDS}&order=created_at.asc`);
  return { run, steps };
}

/** The answer while a source is still being read: a non-2xx the shipped Your links step already shows as a message. */
export const STILL_READING = 'Still reading your source. It will appear in your links shortly.';

/**
 * POST /api/brands/:id/sources on the engine. The run goes on in the background; the request does not wait for it
 * unless engine_config ingest_wait_ms is set (default 0). A run already done answers as the old synchronous ingest did:
 * 201 {sourceId, facts, dropped, kind, needsReview, runId}; a failed run answers with the same error as before.
 * A run still going answers 409 {error, runId, sourceId, status, progress, resume_at}. The shipped Your links step
 * (Build.tsx) treats every 2xx as {facts, dropped} and shows the error text of any non-2xx, then reloads the list, so
 * this never shows "undefined facts" (PR #70 review); GET /api/runs/:id follows the run from there.
 */
export async function ingestSource(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, body: Record<string, unknown>, kind: string = SOURCE_RUN_KIND) {
  const { run, config } = await start(env, ctx, user, brand, kind, body);
  const done = await waitForRun(env, run, config.ingestWaitMs);
  if (done.status === 'done') return { status: 201, body: { ...(done.output as object), runId: run.id } };
  if (done.status === 'failed') throw new HttpError(done.error_code && done.error_code >= 400 ? done.error_code : 502, done.error ?? 'reading the page failed');
  const error = done.status === 'paused' ? (done.progress?.message ?? STILL_READING) : STILL_READING;
  return { status: 409, body: { error, runId: run.id, sourceId: (run.input as { sourceId?: string }).sourceId, status: done.status, progress: done.progress, resume_at: done.resume_at } };
}

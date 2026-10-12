// Run API (issue #32), owner-only like every /api/brands route:
//   POST /api/brands/:id/runs {kind, ...}  -> 202 {run}             starts a run of a startable kind
//   GET  /api/runs/:id                     -> 200 {run, steps}      status, progress and per-step traces
//   GET  /api/brands/:id                   -> adds activeRun        the newest running or paused run, or null
//   POST /api/brands/:id/sources {url}     -> the ingest_url workflow; same 201 body when done, else 409 "still reading"
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { checkExecutor, engineConfig, launch, waitForRun, type WaitUntil } from './executor';
import { progressAt } from './runner';
import { urlKind } from '../sources/registry';
import type { RunRow, WorkflowSpec } from './types';

interface BrandRef { id: string; owner_id: string; name: string; website?: string | null }
interface UserRef { id: string }


/** Fields a run row returns to the browser (no input: it can hold a URL the owner typed, which the owner already has). */
const RUN_FIELDS = 'id,brand_id,kind,workflow_version,executor,status,progress,resume_at,error,error_code,output,created_at,updated_at';
const STEP_FIELDS = 'step,attempt,type,outcome,prompt_key,prompt_version,prompt_hash,model,tokens_in,tokens_out,duration_ms,error,created_at';

/** Kinds a person can start through POST /runs, each turning the request body into the run's input. */
const KINDS: Record<string, (env: Env, brand: BrandRef, body: Record<string, unknown>) => Promise<Record<string, unknown>>> = {
  ingest_url: async (env, brand, body) => {
    const url = typeof body.url === 'string' ? body.url.trim().slice(0, 500) : '';
    if (!url) throw new HttpError(400, 'a link is required');
    // The source row exists from the start (pending), as before, so the list shows it while it is read. Its kind is
    // 'site' only for a link on the brand's own website (sources/registry.ts urlKind, issue #57); the save step
    // classifies again on the page actually read, since a redirect can leave the website.
    const website = brand.website ?? null;
    const [src] = await db.insert<{ id: string }>(env, 'sources', { brand_id: brand.id, url, status: 'pending', kind: urlKind(url, website) });
    return { url, sourceId: src.id, brandName: brand.name, website };
  },
};

export async function activeDef(env: Env, kind: string): Promise<WorkflowSpec> {
  const [def] = await db.select<{ spec: WorkflowSpec }>(env, 'workflow_defs', `${db.eq('id', kind)}&${db.eq('status', 'active')}&select=spec&order=version.desc&limit=1`);
  if (!def) throw new HttpError(404, `unknown run kind ${kind}`);
  return def.spec;
}

/** Starts a run: pins the active definition's version, writes the run row with its first progress, hands it to the executor. */
export async function startRun(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, kind: string, body: Record<string, unknown>) {
  return (await start(env, ctx, user, brand, kind, body)).run;
}

async function start(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, kind: string, body: Record<string, unknown>) {
  const prepare = KINDS[kind];
  if (!prepare) throw new HttpError(404, `unknown run kind ${kind}`);
  const [spec, config] = await Promise.all([activeDef(env, kind), engineConfig(env)]);
  const { executor } = config;
  checkExecutor(env, executor, spec);
  const input = await prepare(env, brand, body);
  if (spec.concurrency === 'supersede') {
    await db.update(env, 'runs', `${db.eq('brand_id', brand.id)}&${db.eq('kind', kind)}&status=in.(running,paused)`, { status: 'superseded', updated_at: new Date().toISOString() });
  }
  const [run] = await db.insert<RunRow>(env, 'runs', { brand_id: brand.id, kind, workflow_version: spec.version, executor, status: 'running', input, progress: progressAt(spec, 0), created_by: user.id });
  try {
    await launch(env, ctx, run);
  } catch (e) {
    await db.update(env, 'runs', db.eq('id', run.id), { status: 'failed', error: 'the run could not start', error_code: 503, updated_at: new Date().toISOString() });
    if (typeof input.sourceId === 'string') await db.update(env, 'sources', db.eq('id', input.sourceId), { status: 'failed', error: 'the run could not start' });
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
export async function ingestSource(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, body: Record<string, unknown>) {
  const { run, config } = await start(env, ctx, user, brand, 'ingest_url', body);
  const done = await waitForRun(env, run, config.ingestWaitMs);
  if (done.status === 'done') return { status: 201, body: { ...(done.output as object), runId: run.id } };
  if (done.status === 'failed') throw new HttpError(done.error_code && done.error_code >= 400 ? done.error_code : 502, done.error ?? 'reading the page failed');
  const error = done.status === 'paused' ? (done.progress?.message ?? STILL_READING) : STILL_READING;
  return { status: 409, body: { error, runId: run.id, sourceId: (run.input as { sourceId?: string }).sourceId, status: done.status, progress: done.progress, resume_at: done.resume_at } };
}

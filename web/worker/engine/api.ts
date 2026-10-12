// Run API (issue #32), owner-only like every /api/brands route:
//   POST /api/brands/:id/runs {kind, ...}  -> 202 {run}             starts a run of a startable kind (engine/kinds.ts)
//   GET  /api/runs/:id                     -> 200 {run, steps}      status, progress and per-step traces
//   GET  /api/brands/:id                   -> adds activeRun        the newest running or paused run, or null
//   GET  /api/brands/:id/runs?kind=K       -> 200 {runs}            that kind's runs still running or paused
//   POST /api/brands/:id/sources {url}     -> the extract_facts workflow (SOURCE_RUN_KIND); 201 body when done, else 202
//                                             {runId, status, ...} to follow with GET /api/runs/:id
//   POST /api/brands/:id/posts {brief, channel} -> the draft_post workflow (issue #93; kind in create/kind.ts); 201
//                                             {post, runId} when done, else 202 {post: null, runId, status} to follow
//                                             with GET /api/runs/:id
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { checkExecutor, engineConfig, launch, waitForRun, type ExecutorName, type WaitUntil } from './executor';
import { progressAt } from './runner';
import { admissionLimits, checkStart, type Caller } from './guards';
import { KINDS, type BrandRef } from './kinds';
// Registers the draft_post kind (issue #93).
import '../create/kind';
import type { RunRow, WorkflowSpec } from './types';

type UserRef = Caller;


/** Fields a run row returns to the browser (no input: it can hold a URL the owner typed, which the owner already has). */
const RUN_FIELDS = 'id,brand_id,kind,workflow_version,executor,status,progress,resume_at,error,error_code,output,created_at,updated_at';
const STEP_FIELDS = 'step,attempt,type,outcome,prompt_key,prompt_version,prompt_hash,model,tokens_in,tokens_out,cost_usd,duration_ms,error,created_at';

/**
 * The workflow POST /api/brands/:id/sources starts: fact extraction with its support check (issue #64). ingest_url (one
 * model call, no support check) is retired by spec/db/012, so a claim that says more than its quote can no longer be
 * saved through the Your links step (design review on PR #91).
 */
export const SOURCE_RUN_KIND = 'extract_facts';

export async function activeDef(env: Env, kind: string): Promise<WorkflowSpec> {
  const [def] = await db.select<{ spec: WorkflowSpec }>(env, 'workflow_defs', `${db.eq('id', kind)}&${db.eq('status', 'active')}&select=spec&order=version.desc&limit=1`);
  // A startable kind whose definition is not in the database is a setup gap (its migration is not applied), not a bad
  // request, and is refused before any row is written.
  if (def) return def.spec;
  if (!Object.hasOwn(KINDS, kind)) throw new HttpError(404, `unknown run kind ${kind}`);
  // A startable kind with versions but none active was retired (ingest_url, by spec/db/012): say so, not "not set up".
  const [any] = await db.select<{ id: string }>(env, 'workflow_defs', `${db.eq('id', kind)}&select=id&limit=1`);
  throw any ? new HttpError(410, `${kind} is retired; new runs use ${SOURCE_RUN_KIND}`) : new HttpError(503, `${kind} is not set up in this database yet (its migration in spec/db has not been applied)`);
}

/**
 * A run's place, held after admission and before its work starts (spec/db/012 admit_run): the run row in status
 * 'reserved', with the definition version and executor pinned at admission. Its capacity counts against the brand's
 * caps until it starts, is released, or expires (RESERVATION_TTL_S).
 */
export interface Reservation { runId: string; brandId: string; kind: string; workflowVersion: number; executor: ExecutorName; expiresAt: string }

/** How long a reservation holds capacity before it lapses on its own: enough for pre-work such as converting an upload. */
export const RESERVATION_TTL_S = 600;

/**
 * Admits a run, atomically (spec/db/012 admit_run): the anonymous caller's network cap, the brand's run rate, its daily
 * spend allowance and its metered-call budget are checked and the reservation written in one transaction. Call it
 * before any expensive pre-work; a refusal is an HttpError (429 over a cap; 404 unknown kind; 410 retired; 503 not
 * set up or no executor) and writes nothing.
 */
export async function admit(env: Env, a: { brand: BrandRef; kind: string; actor: { id: string; isAnonymous?: boolean }; ip?: string | null; awaited?: boolean }): Promise<Reservation> {
  if (!Object.hasOwn(KINDS, a.kind)) throw new HttpError(404, `unknown run kind ${a.kind}`);
  const caller: Caller = { ...a.actor, ip: a.ip ?? null };
  const [spec, config] = await Promise.all([activeDef(env, a.kind), engineConfig(env)]);
  checkExecutor(env, config.executor, spec, { awaited: a.awaited });
  await checkStart(env, caller, a.brand, spec);
  const limits = await admissionLimits(env, caller, spec);
  const row = await db.rpc<RunRow & { reserved_until: string }>(env, 'admit_run', {
    p_brand: a.brand.id, p_kind: a.kind, p_version: spec.version, p_executor: config.executor, p_progress: progressAt(spec, 0),
    p_created_by: a.actor.id, p_planned: limits.planned, p_budget: limits.budget, p_run_rate: limits.runRate,
    p_spend_cap: limits.spendCap, p_client_key: await clientKey(env, caller), p_client_cap: limits.clientCap, p_ttl_s: RESERVATION_TTL_S, p_source_cap: limits.sourceCap,
  });
  return { runId: row.id, brandId: row.brand_id, kind: row.kind, workflowVersion: row.workflow_version, executor: row.executor, expiresAt: row.reserved_until };
}

/** Gives a reservation's capacity back (pre-work failed or was abandoned). Only a reservation not yet started is removed. */
export async function release(env: Env, r: Reservation): Promise<void> {
  await db.del(env, 'runs', `${db.eq('id', r.runId)}&${db.eq('brand_id', r.brandId)}&status=eq.reserved`);
}

/**
 * Starts an admitted run: prepares its input (engine/kinds.ts), turns the reservation into the run (status 'running')
 * and hands it to its executor. It never checks the caps again and never reserves again: the reservation is the charge.
 * A reservation that lapsed or was released is refused (409); a request prepare() cannot use releases the reservation.
 * opts.awaited: the caller waits for the run inside its own request. An inline run then runs to its end before start
 * returns (no waitUntil, so no 30-second cut-off), which lets an inline run have many steps (executor.ts checkExecutor).
 */
export async function start(env: Env, ctx: WaitUntil | undefined, r: Reservation, brand: BrandRef, body: Record<string, unknown>, opts: { awaited?: boolean } = {}) {
  const prepare = KINDS[r.kind];
  const [[def], config] = await Promise.all([
    db.select<{ spec: WorkflowSpec }>(env, 'workflow_defs', `${db.eq('id', r.kind)}&version=eq.${r.workflowVersion}&select=spec`),
    engineConfig(env),
  ]);
  if (!def || !prepare) { await release(env, r).catch(() => undefined); throw new HttpError(503, `${r.kind} v${r.workflowVersion} is not available`); }
  const spec = def.spec;
  let input: Record<string, unknown>;
  try {
    input = await prepare(env, brand, body);
  } catch (e) {
    await release(env, r).catch(() => undefined);
    throw e instanceof HttpError ? e : new HttpError(503, 'the run could not start, try again');
  }
  // Everything after prepare() is in one cleanup path (PR #70 review): if starting, superseding or handing the run to
  // the executor fails, the run and any source prepare() created are marked failed, so no pending source is left
  // without a run to finish it. Cleanup is best effort: the database may be the thing that failed.
  let run: RunRow | undefined;
  try {
    [run] = await db.update<RunRow>(env, 'runs', `${db.eq('id', r.runId)}&status=eq.reserved&reserved_until=gt.${encodeURIComponent(new Date().toISOString())}`, { status: 'running', input, updated_at: new Date().toISOString() });
    if (!run) throw new HttpError(409, 'this start was held too long and lapsed; start it again');
    if (spec.concurrency === 'supersede') {
      await db.update(env, 'runs', `${db.eq('brand_id', brand.id)}&${db.eq('kind', r.kind)}&id=neq.${run.id}&status=in.(running,paused)`, { status: 'superseded', updated_at: new Date().toISOString() });
    }
    await launch(env, opts.awaited ? undefined : ctx, run);
  } catch (e) {
    const note = 'the run could not start';
    if (run) await db.update(env, 'runs', db.eq('id', run.id), { status: 'failed', error: note, error_code: 503, updated_at: new Date().toISOString() }).catch(() => undefined);
    else await release(env, r).catch(() => undefined);
    if (typeof input.sourceId === 'string') await db.update(env, 'sources', `${db.eq('id', input.sourceId)}&${db.eq('brand_id', brand.id)}`, { status: 'failed', error: note }).catch(() => undefined);
    throw e instanceof HttpError ? e : new HttpError(503, 'the run could not start, try again');
  }
  return { run, config };
}

/** Admit, then start: for callers with no pre-work between the two. */
export async function startRun(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, kind: string, body: Record<string, unknown>) {
  return (await admitAndStart(env, ctx, user, brand, kind, body)).run;
}
async function admitAndStart(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, kind: string, body: Record<string, unknown>) {
  const r = await admit(env, { brand, kind, actor: user, ip: user.ip });
  return start(env, ctx, r, brand, body);
}

/** An anonymous caller's network, as a key the database can count by without holding the IP: HMAC-SHA-256 of the IP
 * under the Worker's secret key (Web Crypto, https://developers.cloudflare.com/workers/runtime-apis/web-crypto/). */
async function clientKey(env: Env, c: Caller): Promise<string | null> {
  if (!c.isAnonymous) return null;
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SUPABASE_SECRET_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(c.ip ?? 'unknown')));
  return [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The newest run that is still running or paused, for a reload to show its progress. */
export async function activeRun(env: Env, brandId: string) {
  const [run] = await db.select<RunRow>(env, 'runs', `${db.eq('brand_id', brandId)}&status=in.(running,paused)&select=${RUN_FIELDS}&order=created_at.desc&limit=1`);
  return run ?? null;
}

/** Runs of one kind still going for a brand, newest first, so a screen can resume following them (Create.tsx). */
export async function activeRuns(env: Env, brandId: string, kind: string) {
  if (!/^\w{1,60}$/.test(kind)) throw new HttpError(400, 'kind must be a run kind');
  return db.select<RunRow>(env, 'runs', `${db.eq('brand_id', brandId)}&${db.eq('kind', kind)}&status=in.(running,paused)&select=${RUN_FIELDS}&order=created_at.desc&limit=20`);
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

/** The message while a source is still being read (the 202 answer's `message`). */
export const STILL_READING = 'Still reading your source. It will appear in your links shortly.';

/**
 * POST /api/brands/:id/sources on the engine. The run goes on in the background; the request does not wait for it
 * unless engine_config ingest_wait_ms is set (default 0). A run already done answers as the old synchronous ingest did:
 * 201 {sourceId, facts, dropped, kind, needsReview, runId}; a failed run answers with the same error as before.
 * A run still going answers 202 {runId, sourceId, status, progress, resume_at, message}: accepted, not done, the same
 * contract as the drafting route (PR #99 review), so a client follows the run with GET /api/runs/:runId until it is
 * done or failed. 202 has no facts and dropped; the Your links step (Build.tsx, the UI session's) reads it so.
 */
export async function ingestSource(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, body: Record<string, unknown>, kind: string = SOURCE_RUN_KIND) {
  const { run, config } = await admitAndStart(env, ctx, user, brand, kind, body);
  const done = await waitForRun(env, run, config.ingestWaitMs);
  if (done.status === 'done') return { status: 201, body: { ...(done.output as object), runId: run.id } };
  if (done.status === 'failed') throw new HttpError(done.error_code && done.error_code >= 400 ? done.error_code : 502, done.error ?? 'reading the page failed');
  const message = done.status === 'paused' ? (done.progress?.message ?? STILL_READING) : STILL_READING;
  return { status: 202, body: { runId: run.id, sourceId: (run.input as { sourceId?: string }).sourceId, status: done.status, progress: done.progress, resume_at: done.resume_at, message } };
}

/** What the Create screen says while a draft is still being written on Workflows (the 202 answer's message). */
export const STILL_DRAFTING = 'Still drafting your post. It will appear in your list shortly.';

/**
 * POST /api/brands/:id/posts on the engine (issue #93): a draft_post run. Inline, it runs inside this request; on
 * Workflows, the request waits up to engine_config draft_wait_ms. Done: 201 {post, runId}, the post in the same shape
 * as before plus checks.draft. Failed: the run's error. Still going: 202 {post: null, runId, status, message, progress}.
 */
export async function draftRun(env: Env, ctx: WaitUntil | undefined, user: UserRef, brand: BrandRef, body: Record<string, unknown>) {
  const r = await admit(env, { brand, kind: 'draft_post', actor: user, ip: user.ip, awaited: true });
  const { run, config } = await start(env, ctx, r, brand, body, { awaited: true });
  const done = await waitForRun(env, run, config.draftWaitMs);
  if (done.status === 'done') {
    const postId = (done.output as { postId?: unknown } | null)?.postId;
    const [post] = typeof postId === 'string' ? await db.select(env, 'posts', `${db.eq('id', postId)}&${db.eq('brand_id', brand.id)}`) : [];
    if (!post) throw new HttpError(500, 'the draft finished but its post was not found');
    return { status: 201, body: { post, runId: run.id } };
  }
  if (done.status === 'failed') throw new HttpError(done.error_code && done.error_code >= 400 ? done.error_code : 502, done.error ?? 'drafting failed');
  // Still going: 202 with no post yet and the run to follow; the Create screen polls GET /api/runs/:id until the run
  // finishes, then reloads its list (Create.tsx followRun; PR #99 review). draft_post runs in parallel, so a second
  // draft never supersedes this one.
  const message = done.status === 'paused' ? (done.progress?.message ?? STILL_DRAFTING) : STILL_DRAFTING;
  return { status: 202, body: { post: null, runId: run.id, status: done.status, message, progress: done.progress, resume_at: done.resume_at } };
}

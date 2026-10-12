// Test harness for the workflow engine (issue #32): an in-memory PostgREST with the engine's one RPC, a stand-in for
// the Cloudflare Workflows step API that retries, records delays and replays finished steps by name the way Workflows
// does after an interruption (https://developers.cloudflare.com/workflows/build/rules-of-workflows/), and a fake binding.
import type { Env } from '../../worker/env';
import { sha256Hex } from '../../worker/env';
import type { StepApi } from '../../worker/engine/runner';
import { ALL_SEED_CONFIG, RETIRED_BY, SEED_DEFS, SEED_PROMPTS } from '../../worker/engine/seed';

export type Row = Record<string, unknown>;
/** Brand ids are UUIDs (api.ts ownBrand). */
export const BRAND = 'bbbbbbbb-0000-4000-8000-000000000001';
export const db: { tables: Record<string, Row[]>; calls: { method: string; table: string; query: string }[] } = { tables: {}, calls: [] };
let nextId = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}`;

function matches(row: Row, q: URLSearchParams) {
  for (const [k, v] of q) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue;
    if (v.startsWith('eq.') && String(row[k]) !== v.slice(3)) return false;
    if (v.startsWith('in.(') && !v.slice(4, -1).split(',').includes(String(row[k]))) return false;
    // ISO timestamps compare in order as strings, as PostgREST's gte does on timestamptz for these values.
    if (v.startsWith('gte.') && !(String(row[k] ?? '') >= v.slice(4))) return false;
    if (v.startsWith('gt.') && !(String(row[k] ?? '') > v.slice(3))) return false;
    if (v.startsWith('neq.') && String(row[k]) === v.slice(4)) return false;
    if (v === 'not.is.null' && (row[k] === null || row[k] === undefined)) return false;
  }
  return true;
}

/** Same semantics as spec/db/010 record_run_step: insert the trace, patch the run only while running or paused. */
function recordRunStep({ p_run, p_step, p_patch }: { p_run: string; p_step: Row | null; p_patch: Row | null }) {
  if (p_step) db.tables.run_steps.push({ id: uuid(), run_id: p_run, created_at: new Date().toISOString(), attempt: 1, duration_ms: 0, ...p_step });
  const run = db.tables.runs.find((r) => r.id === p_run && (r.status === 'running' || r.status === 'paused'));
  if (!run) return false;
  for (const k of ['status', 'progress', 'output', 'resume_at', 'error', 'error_code']) if (p_patch && k in p_patch) run[k] = p_patch[k];
  run.updated_at = new Date().toISOString();
  return true;
}

/** Same semantics as spec/db/011 record_fact_conflict (checked against Postgres 16 when 011 was written): open or extend
 * the one open conflict per brand and slot, hold its approved non-owner facts for review, skip a resolved one. */
function recordFactConflict({ p_brand, p_slot, p_evidence, p_question }: { p_brand: string; p_slot: string; p_evidence: string[]; p_question: string }) {
  const rows = (db.tables.fact_conflicts ??= []);
  if (rows.some((c) => c.brand_id === p_brand && c.slot === p_slot && c.status === 'resolved' && p_evidence.every((id) => (c.evidence_ids as string[]).includes(id)))) return null;
  let c = rows.find((x) => x.brand_id === p_brand && x.slot === p_slot && x.status === 'open');
  if (c) Object.assign(c, { evidence_ids: [...new Set([...(c.evidence_ids as string[]), ...p_evidence])].sort(), question: p_question });
  else rows.push((c = { id: uuid(), brand_id: p_brand, slot: p_slot, evidence_ids: [...new Set(p_evidence)].sort(), question: p_question, status: 'open' }));
  for (const e of db.tables.evidence ?? []) if (e.brand_id === p_brand && p_evidence.includes(e.id as string) && e.review_status === 'approved' && e.trust !== 'owner_answer') e.review_status = 'proposed';
  rederiveConflicts(p_brand, p_slot);
  return c.id;
}

/** Same semantics as spec/db/013 save_draft: the post and its candidates, rows already present left alone. */
function saveDraft({ p_post, p_candidates }: { p_post: Row; p_candidates: Row[] }) {
  const posts = (db.tables.posts ??= []);
  const cands = (db.tables.post_candidates ??= []);
  if (!posts.some((p) => p.id === p_post.id)) posts.push({ created_at: new Date().toISOString(), rev: 0, hash: null, approved_by: null, approved_at: null, signature: null, attestation: null, published_url: null, ...p_post });
  for (const c of p_candidates) if (!cands.some((x) => x.id === c.id)) cands.push({ created_at: new Date().toISOString(), ...c });
  return p_post.id;
}

/** Same semantics as spec/db/013 change_post_with_decision: compare-and-swap on the post, then the decision row. */
function changePostWithDecision({ p_post, p_rev, p_statuses, p_patch, p_decision }: { p_post: string; p_rev: number; p_statuses: string[]; p_patch: Row; p_decision: Row }) {
  const post = (db.tables.posts ??= []).find((p) => p.id === p_post && Number(p.rev ?? 0) === p_rev && p_statuses.includes(String(p.status)));
  if (!post) return [];
  for (const k of ['body', 'checks', 'status', 'approved_by', 'approved_at']) if (k in p_patch) post[k] = p_patch[k];
  post.rev = Number(post.rev ?? 0) + 1;
  (db.tables.post_decisions ??= []).push({ id: uuid(), post_id: post.id, brand_id: post.brand_id, created_at: new Date().toISOString(), ...p_decision });
  return [post];
}

/** A database error a function raises on purpose (PostgREST PTxyz: the status and message reach the caller). */
export class FakePgError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
const pt = (status: number, message: string) => new FakePgError(status, `PT${status}`, message);
/** Calls an attempt made, as admit_run counts them: its metered_calls, else 1 for a model call or a costed call. */
const metered = (s: Row) => (typeof s.metered_calls === 'number' ? s.metered_calls : s.type === 'llm' || (s.cost_usd !== null && s.cost_usd !== undefined) ? 1 : 0);

/** Same semantics as spec/db/011 admit_run (checked against Postgres 16): expired reservations dropped, then the
 * network cap, the run rate, the spend allowance and the metered-call budget, then the run row as a reservation.
 * Single-threaded here, as the advisory locks make it in Postgres. */
function admitRun(a: { p_brand: string; p_kind: string; p_version: number; p_executor: string; p_progress: unknown; p_created_by: string | null; p_planned: number; p_budget: number; p_run_rate: number; p_spend_cap: number; p_client_key: string | null; p_client_cap: number; p_ttl_s: number }) {
  const now = Date.now();
  const iso = new Date(now).toISOString();
  db.tables.runs = db.tables.runs.filter((r) => !(r.brand_id === a.p_brand && r.status === 'reserved' && String(r.reserved_until) <= iso));
  const live = (r: Row) => r.status !== 'reserved' || String(r.reserved_until) > iso;
  const hourAgo = new Date(now - 3_600_000).toISOString();
  if (a.p_client_key !== null && db.tables.runs.filter((r) => r.client_key === a.p_client_key && String(r.created_at) >= hourAgo && live(r)).length >= a.p_client_cap) throw pt(429, 'too many reads from your network; wait a little and try again');
  const runs = db.tables.runs.filter((r) => r.brand_id === a.p_brand);
  if (runs.filter((r) => String(r.created_at) >= hourAgo).length >= a.p_run_rate) throw pt(429, `this brand has started ${a.p_run_rate} runs in the last hour; wait a little and try again`);
  if (a.p_planned > 0) {
    const today = new Date(Math.floor(now / 86_400_000) * 86_400_000).toISOString();
    const ids = new Set(runs.map((r) => r.id));
    const spent = db.tables.run_steps.filter((x) => ids.has(x.run_id) && String(x.created_at) >= today).reduce((n, x) => n + Number(x.cost_usd ?? 0), 0);
    if (spent >= a.p_spend_cap) throw pt(429, `this brand has spent $${Math.round(spent * 10000) / 10000} of its $${a.p_spend_cap} daily allowance for paid services; try again after 00:00 UTC`);
    const used = db.tables.run_steps.filter((x) => ids.has(x.run_id) && String(x.created_at) >= today).reduce((n, x) => n + metered(x), 0);
    const reserved = runs.filter((r) => typeof r.metered_planned === 'number' && (r.status === 'running' || r.status === 'paused' || (r.status === 'reserved' && live(r))))
      .reduce((n, r) => n + Math.max((r.metered_planned as number) - db.tables.run_steps.filter((x) => x.run_id === r.id).reduce((m, x) => m + metered(x), 0), 0), 0);
    if (used + reserved + a.p_planned > a.p_budget) throw pt(429, `this brand has used its ${a.p_budget} metered calls for today (${used} made, ${reserved} reserved by runs still going, ${a.p_planned} needed); try again after 00:00 UTC`);
  }
  const run: Row = { id: uuid(), brand_id: a.p_brand, kind: a.p_kind, workflow_version: a.p_version, executor: a.p_executor, status: 'reserved', input: {}, progress: a.p_progress, created_by: a.p_created_by, metered_planned: a.p_planned, reserved_until: new Date(now + a.p_ttl_s * 1000).toISOString(), client_key: a.p_client_key, created_at: iso, updated_at: iso };
  db.tables.runs.push(run);
  return { ...run };
}

/** Same semantics as spec/db/011 resolve_fact_conflict (checked against Postgres 16). */
function resolveFactConflict({ p_brand, p_conflict, p_keep, p_by, p_answer }: { p_brand: string; p_conflict: string; p_keep: string[] | null; p_by: string | null; p_answer?: Record<string, unknown> | null }) {
  const c = (db.tables.fact_conflicts ??= []).find((x) => x.id === p_conflict && x.brand_id === p_brand);
  if (!c) throw pt(404, 'no such conflict for this brand');
  if (c.status !== 'open') throw pt(409, 'this conflict is already resolved');
  const ids = c.evidence_ids as string[];
  const keep = [...new Set(p_keep ?? [])];
  if (!keep.every((k) => ids.includes(k))) throw pt(400, 'keep names a fact that is not on this conflict');
  if (db.tables.evidence.filter((e) => e.brand_id === p_brand && keep.includes(e.id as string) && e.review_status !== 'rejected').length !== keep.length) throw pt(409, 'this disagreement changed since it was shown; reload it');
  let answer: Row | null = null;
  if (p_answer) {
    if (keep.length) throw pt(400, 'give either the facts to keep or your own answer, not both');
    const str = (k: string) => (typeof p_answer[k] === 'string' ? (p_answer[k] as string).trim() : '');
    const [section, claim, value, key] = [str('section'), str('claim'), str('value'), typeof p_answer.slot_key === 'string' ? p_answer.slot_key : ''];
    if (!section || section.length > 40) throw pt(400, 'the answer needs its kit section');
    if (!claim || claim.length > 500) throw pt(400, 'the answer must be 1 to 500 characters');
    if (p_answer.slot !== c.slot) throw pt(400, 'the answer must be for this question');
    if (!value || value.length > 120 || !key || key.length > 120) throw pt(400, 'the answer needs a value of 1 to 120 characters');
    const from = p_answer.edited_from as string | undefined;
    if (from !== undefined && !(ids.includes(from) && db.tables.evidence.some((e) => e.id === from && e.brand_id === p_brand && e.trust !== 'owner_answer'))) throw pt(400, 'edited_from must be a source fact on this conflict');
    answer = { id: uuid(), created_at: new Date().toISOString(), brand_id: p_brand, source_id: null, section, claim, quote: null, origin: 'owner_answer', trust: 'owner_answer', review_status: 'approved', slot: c.slot, slot_value: value, slot_key: key, ...(from ? { edited_from: from } : {}) };
  }
  Object.assign(c, { status: 'resolved', resolved_by: p_by, resolved_at: new Date().toISOString() });
  let changed = 0;
  for (const e of db.tables.evidence) if (e.brand_id === p_brand && ids.includes(e.id as string) && e.trust !== 'owner_answer') { e.review_status = keep.includes(e.id as string) ? 'approved' : 'rejected'; changed++; }
  if (answer) db.tables.evidence.push(answer);
  return { changed, answer: answer?.id ?? null };
}

/** Same semantics as spec/db/011 rederive_conflicts (checked against Postgres 16), run as its triggers run it: after
 * every delete on evidence and every change of a fact's review_status. */
function rederiveConflicts(brand: string, slot: string) {
  for (const c of db.tables.fact_conflicts ?? []) {
    if (c.brand_id !== brand || c.slot !== slot || c.status !== 'open') continue;
    const live = db.tables.evidence.filter((e) => (c.evidence_ids as string[]).includes(e.id as string));
    c.evidence_ids = live.map((e) => e.id as string).sort();
    const values = new Set(live.filter((e) => e.review_status !== 'rejected' && e.slot_key != null).map((e) => e.slot_key));
    if (values.size >= 2) continue;
    Object.assign(c, { status: 'dissolved', resolved_at: new Date().toISOString() });
    for (const e of live) if (e.review_status === 'proposed' && e.trust !== 'owner_answer') e.review_status = e.trust === 'owned' && e.match === 'exact' ? 'approved' : 'proposed';
  }
}
const rederiveFor = (rows: Row[]) => {
  for (const key of new Set(rows.filter((r) => r.slot).map((r) => `${r.brand_id}|${r.slot}`))) rederiveConflicts(...(key.split('|') as [string, string]));
};

/** fakeDb as a fetch Response: a FakePgError becomes PostgREST's error body with its status. */
export function fakeDbResponse(url: string, init: RequestInit = {}) {
  try {
    return new Response(JSON.stringify(fakeDb(url, init)));
  } catch (e) {
    if (e instanceof FakePgError) return new Response(JSON.stringify({ code: e.code, message: e.message, details: null, hint: null }), { status: e.status });
    throw e;
  }
}

export function fakeDb(url: string, init: RequestInit = {}) {
  const u = new URL(url);
  const path = u.pathname.replace('/rest/v1/', '');
  const q = u.searchParams;
  const method = init.method ?? 'GET';
  const body = init.body ? JSON.parse(String(init.body)) : undefined;
  db.calls.push({ method, table: path, query: u.search });
  if (path === 'rpc/record_run_step') return recordRunStep(body);
  if (path === 'rpc/record_fact_conflict') return recordFactConflict(body);
  if (path === 'rpc/save_draft') return saveDraft(body);
  if (path === 'rpc/change_post_with_decision') return changePostWithDecision(body);
  if (path === 'rpc/admit_run') return admitRun(body);
  if (path === 'rpc/resolve_fact_conflict') return resolveFactConflict(body);
  if (path === 'rpc/delete_source') {
    // Same semantics as spec/db/011 delete_source: 404 when missing; the facts, then the source, then the conflicts re-derived.
    if (!db.tables.sources.some((x) => x.id === body.p_source && x.brand_id === body.p_brand)) throw pt(404, 'not found');
    const gone = db.tables.evidence.filter((e) => e.brand_id === body.p_brand && e.source_id === body.p_source);
    db.tables.evidence = db.tables.evidence.filter((e) => !gone.includes(e));
    db.tables.sources = db.tables.sources.filter((x) => x.id !== body.p_source);
    rederiveFor(gone);
    return null;
  }
  const rows = (db.tables[path] ??= []);
  if (method === 'GET') {
    if (Number(q.get('offset') ?? 0) > 0) return [];
    const hit = rows.filter((r) => matches(r, q));
    const ordered = q.get('order')?.includes('created_at.desc') ? [...hit].reverse() : hit;
    const cols = q.get('select')?.split(',');
    return cols ? ordered.map((r) => Object.fromEntries(cols.filter((c) => c in r).map((c) => [c, r[c]]))) : ordered;
  }
  if (method === 'DELETE') {
    const gone = rows.filter((r) => matches(r, q));
    db.tables[path] = rows.filter((r) => !matches(r, q));
    if (path === 'evidence') rederiveFor(gone);
    return null;
  }
  if (method === 'PATCH') {
    const hit = rows.filter((r) => matches(r, q));
    const reviewed = hit.filter((r) => 'review_status' in body && r.review_status !== body.review_status);
    hit.forEach((r) => Object.assign(r, body));
    if (path === 'evidence') rederiveFor(reviewed);
    return hit;
  }
  const conflict = q.get('on_conflict')?.split(',');
  const ignore = String((init.headers as Record<string, string> | undefined)?.prefer ?? '').includes('ignore-duplicates');
  return ([] as Row[]).concat(body).flatMap((r) => {
    const prev = conflict && rows.find((x) => conflict.every((c) => x[c] === r[c]));
    if (prev) return ignore ? [] : [Object.assign(prev, r)];
    const row: Row = { id: uuid(), created_at: new Date().toISOString(), ...r };
    // runs.updated_at defaults to now() (spec/db/010), as record_run_step keeps it current.
    if (path === 'runs' && !('updated_at' in row)) row.updated_at = row.created_at;
    rows.push(row);
    return row;
  });
}

/** Fresh tables holding what migrations 010 and 011 seed (from seed.ts, which a test checks against the SQL). */
const retired = new Set(Object.values(RETIRED_BY).flat().map((d) => `${d.id}@${d.version}`));
export async function seedTables(extra: Record<string, Row[]> = {}) {
  nextId = 0;
  db.calls = [];
  db.tables = {
    brands: [{ id: BRAND, owner_id: 'u', name: 'JamJam', type: 'company' }],
    sources: [], evidence: [], runs: [], run_steps: [], engine_config: ALL_SEED_CONFIG.map((c) => structuredClone(c)), fact_conflicts: [],
    workflow_defs: SEED_DEFS.map((spec) => ({ id: spec.id, version: spec.version, spec, status: retired.has(`${spec.id}@${spec.version}`) ? 'retired' : 'active' })),
    prompt_versions: await Promise.all(SEED_PROMPTS.map(async (p) => ({ ...p, status: 'active', hash: 'sha256:' + (await sha256Hex(p.body)) }))),
    ...extra,
  };
}

export const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'k', SUPABASE_PUBLISHABLE_KEY: 'p', REGISTRAR_KEY: '[1]', RPC_URL: 'https://rpc.test', OPENROUTER_API_KEY: 'k' } as Env;

/** Thrown by the fake step API to stand for the isolate being evicted mid-run. */
export class Evicted extends Error {}

/**
 * Workflows' step API, in memory: a finished step's result is kept by name and returned without running it again on
 * replay; failures retry up to the step's limit (NonRetryableError never), and each retry delay is recorded, not waited.
 */
export function fakeStep(opts: { evictBefore?: string } = {}) {
  const done = new Map<string, unknown>();
  const delays: { step: string; ms: number }[] = [];
  const sleeps: { step: string; until: number }[] = [];
  const ran: string[] = [];
  let evict = opts.evictBefore;
  let dead = false;
  const api: StepApi = {
    async do(name, config, callback) {
      // A replay starts at 'load'; until then an evicted isolate runs nothing more, not even the runner's own catch.
      if (name === 'load') dead = false;
      if (dead) throw new Evicted(name);
      if (done.has(name)) return done.get(name) as never;
      if (evict === name) { evict = undefined; dead = true; throw new Evicted(name); }
      for (let attempt = 1; ; attempt++) {
        try {
          ran.push(name);
          const out = await callback({ attempt });
          done.set(name, out);
          return out;
        } catch (e) {
          if ((e as Error).name === 'NonRetryableError' || attempt > config.retries.limit) throw e;
          delays.push({ step: name, ms: config.retries.delay({ ctx: { attempt }, error: e as Error }) });
        }
      }
    },
    async sleepUntil(name, until) {
      if (done.has(name)) return;
      sleeps.push({ step: name, until });
      done.set(name, null);
    },
  };
  return { api, delays, sleeps, ran };
}

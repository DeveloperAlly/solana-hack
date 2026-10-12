// Test harness for the workflow engine (issue #32): an in-memory PostgREST with the engine's one RPC, a stand-in for
// the Cloudflare Workflows step API that retries, records delays and replays finished steps by name the way Workflows
// does after an interruption (https://developers.cloudflare.com/workflows/build/rules-of-workflows/), and a fake binding.
import type { Env } from '../../worker/env';
import { sha256Hex } from '../../worker/env';
import type { StepApi } from '../../worker/engine/runner';
import { RETIRED_BY, SEED_CONFIG, SEED_DEFS, SEED_PROMPTS } from '../../worker/engine/seed';

export type Row = Record<string, unknown>;
/** Brand ids are UUIDs (api.ts ownBrand). */
export const BRAND = 'bbbbbbbb-0000-4000-8000-000000000001';
export const db: { tables: Record<string, Row[]>; calls: { method: string; table: string; query: string }[]; failInside?: string } = { tables: {}, calls: [] };
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

/** Same semantics as spec/db/011 record_fact_conflict: re-derives the slot (the facts decide; the other arguments are unused). */
function recordFactConflict({ p_brand, p_slot }: { p_brand: string; p_slot: string }) {
  return rederiveConflicts(p_brand, p_slot);
}

/** A database error a function raises on purpose (PostgREST PTxyz: the status and message reach the caller). */
export class FakePgError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
const pt = (status: number, message: string) => new FakePgError(status, `PT${status}`, message);

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
    const used = Number((db.tables.metered_usage ?? []).find((u) => u.brand_id === a.p_brand && u.day === utcDay())?.calls ?? 0);
    const reserved = runs.filter((r) => typeof r.metered_planned === 'number' && (r.status === 'running' || r.status === 'paused' || (r.status === 'reserved' && live(r))))
      .reduce((n, r) => n + Math.max((r.metered_planned as number) - Number(r.metered_used ?? 0), 0), 0);
    if (used + reserved + a.p_planned > a.p_budget) throw pt(429, `this brand has used its ${a.p_budget} metered calls for today (${used} made, ${reserved} reserved by runs still going, ${a.p_planned} needed); try again after 00:00 UTC`);
  }
  const run: Row = { id: uuid(), brand_id: a.p_brand, kind: a.p_kind, workflow_version: a.p_version, executor: a.p_executor, status: 'reserved', input: {}, progress: a.p_progress, created_by: a.p_created_by, metered_planned: a.p_planned, metered_budget: a.p_budget, metered_used: 0, reserved_until: new Date(now + a.p_ttl_s * 1000).toISOString(), client_key: a.p_client_key, created_at: iso, updated_at: iso };
  db.tables.runs.push(run);
  return { ...run };
}

const utcDay = () => new Date().toISOString().slice(0, 10);

/** One transaction: every table as it was if fn throws. db.failInside, when set, throws at that named point. */
function atomically<T>(fn: () => T): T {
  const before = structuredClone(db.tables);
  try {
    return fn();
  } catch (e) {
    for (const k of Object.keys(db.tables)) delete db.tables[k];
    Object.assign(db.tables, before);
    throw e;
  }
}
const failPoint = (name: string) => { if (db.failInside === name) throw pt(500, `failed inside ${name}`); };

/** Same semantics as spec/db/011 save_extraction (checked against Postgres 16): insert (existing ids left alone), the
 * insert trigger's rederive, confidence across sources, then the source marked read. */
function saveExtraction({ p_run, p_brand, p_source, p_rows, p_source_patch }: { p_run: string; p_brand: string; p_source: string; p_rows: Row[]; p_source_patch: Row }) {
  if (!db.tables.runs.some((r) => r.id === p_run && r.brand_id === p_brand)) throw pt(404, 'no such run');
  if (!db.tables.sources.some((x) => x.id === p_source && x.brand_id === p_brand)) throw pt(404, 'no such source');
  const added: Row[] = [];
  for (const r of p_rows) {
    if (db.tables.evidence.some((e) => e.id === r.id)) continue;
    const row: Row = { ...r, brand_id: p_brand, source_id: p_source, origin: 'source', run_id: p_run, confidence: null, created_at: new Date().toISOString() };
    db.tables.evidence.push(row);
    added.push(row);
  }
  rederiveFor(added);
  failPoint('conflicts');
  const keys = new Set(p_rows.map((r) => r.fact_key));
  const checked = db.tables.evidence.filter((e) => e.brand_id === p_brand && (e.match === 'exact' || e.match === 'fuzzy') && (e.review_status === 'proposed' || e.review_status === 'approved'));
  const n = new Map<unknown, Set<unknown>>();
  for (const e of checked) if (keys.has(e.fact_key)) n.set(e.fact_key, (n.get(e.fact_key) ?? new Set()).add(e.source_key ?? `source:${e.source_id ?? e.id}`));
  for (const e of checked) {
    const k = n.get(e.fact_key)?.size;
    if (k === undefined) continue;
    e.confidence = e.match === 'exact' ? (k >= 2 ? 'high' : 'medium') : k >= 2 ? 'medium' : 'low';
  }
  failPoint('confidence');
  const src = db.tables.sources.find((x) => x.id === p_source)!;
  Object.assign(src, { status: 'read', error: null, fetched_at: new Date().toISOString(), kind: p_source_patch.kind ?? src.kind, title: p_source_patch.title ?? src.title, text_excerpt: p_source_patch.text_excerpt, source_text: p_source_patch.source_text, url: p_source_patch.url || src.url });
  const ids = new Set(p_rows.map((r) => r.id));
  const mine = db.tables.evidence.filter((e) => ids.has(e.id));
  return {
    facts: mine.filter((e) => e.review_status !== 'rejected').length,
    needsReview: mine.filter((e) => e.review_status === 'proposed').length,
    conflicts: (db.tables.fact_conflicts ?? []).filter((c) => c.brand_id === p_brand && c.status === 'open' && (c.evidence_ids as string[]).some((id) => ids.has(id))).length,
  };
}
/** Same semantics as spec/db/011 consume_metered (checked against Postgres 16). */
function consumeMetered({ p_run, p_n }: { p_run: string; p_n: number }) {
  const run = db.tables.runs.find((r) => r.id === p_run);
  if (!run) throw pt(404, 'no such run');
  const usage = (db.tables.metered_usage ??= []);
  const row = usage.find((u) => u.brand_id === run.brand_id && u.day === utcDay());
  const used = Number(row?.calls ?? 0);
  const budget = run.metered_budget as number | null | undefined;
  if (typeof budget === 'number' && used + p_n > budget) throw pt(429, `this brand has used its ${budget} metered calls for today, so the run stopped here (${used} made, ${p_n} more needed); start it again after 00:00 UTC`);
  if (row) row.calls = used + p_n; else usage.push({ brand_id: run.brand_id, day: utcDay(), calls: p_n });
  run.metered_used = Number(run.metered_used ?? 0) + p_n;
  return typeof budget === 'number' ? budget - used - p_n : null;
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
    answer = { id: uuid(), created_at: new Date().toISOString(), brand_id: p_brand, source_id: null, section, claim, quote: null, origin: 'owner_answer', trust: 'owner_answer', review_status: 'approved', slot: c.slot, slot_value: value, slot_key: key, owner_decision: 'edited', owner_decided_by: p_by, owner_decided_at: new Date().toISOString(), ...(from ? { edited_from: from } : {}) };
  }
  Object.assign(c, { status: 'resolved', resolved_by: p_by, resolved_at: new Date().toISOString() });
  let changed = 0;
  const at = new Date().toISOString();
  for (const e of db.tables.evidence) {
    if (e.brand_id !== p_brand || !ids.includes(e.id as string)) continue;
    const kept = keep.includes(e.id as string);
    Object.assign(e, { review_status: kept ? 'approved' : 'rejected', owner_decision: kept ? 'confirmed' : e.id === p_answer?.edited_from ? 'edited' : 'rejected', owner_decided_by: p_by, owner_decided_at: at });
    changed++;
  }
  rederiveConflicts(p_brand, c.slot as string);
  if (answer) { db.tables.evidence.push(answer); rederiveConflicts(p_brand, c.slot as string); }
  return { changed, answer: answer?.id ?? null };
}

/** Same semantics as spec/db/011 rederive_conflicts (checked against Postgres 16), run as its triggers run it: after
 * every insert, delete and review change on evidence. */
const SLOT_LABELS: Record<string, string> = { founded: 'when the brand was founded or launched', headquarters: 'where the brand is based', legal_name: 'the registered company name', team_size: 'how many people work on the brand', customer_count: 'how many customers or clients it has', user_count: 'how many users it has', funding: 'how much money it has raised', price_from: 'its lowest listed price' };
function rederiveConflicts(brand: string, slot: string): string | null {
  const conflicts = (db.tables.fact_conflicts ??= []);
  const live = (db.tables.evidence ?? []).filter((e) => e.brand_id === brand && e.slot === slot && e.review_status !== 'rejected' && e.slot_key != null).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const groups = new Map<string, Row[]>();
  for (const e of live) groups.set(e.slot_key as string, [...(groups.get(e.slot_key as string) ?? []), e]);
  let open = conflicts.find((c) => c.brand_id === brand && c.slot === slot && c.status === 'open');
  if (groups.size >= 2) {
    const sides = [...groups.values()].map((g) => ({ v: g.map((e) => String(e.slot_value).trim()).sort()[0], n: g.length })).sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : 0));
    const question = `Your sources disagree on ${SLOT_LABELS[slot] ?? slot}: ${sides.map((x) => `"${x.v}" (${x.n} ${x.n === 1 ? 'fact' : 'facts'})`).join(' or ')}. Which is right?`;
    const ids = live.map((e) => e.id as string);
    if (!open) conflicts.push((open = { id: uuid(), brand_id: brand, slot, evidence_ids: ids, question, status: 'open', created_at: new Date().toISOString() }));
    else Object.assign(open, { evidence_ids: ids, question });
    for (const e of live) if (e.review_status === 'approved') e.review_status = 'proposed';
    return open.id as string;
  }
  if (open) {
    const held = open.evidence_ids as string[];
    const still = (db.tables.evidence ?? []).filter((e) => held.includes(e.id as string));
    Object.assign(open, { evidence_ids: still.map((e) => e.id as string).sort(), status: 'dissolved', resolved_at: new Date().toISOString() });
    for (const e of still) if (e.review_status === 'proposed') e.review_status = e.trust === 'owner_answer' || (e.trust === 'owned' && e.match === 'exact') ? 'approved' : 'proposed';
  }
  return null;
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
  if (path === 'rpc/admit_run') return admitRun(body);
  if (path === 'rpc/consume_metered') return consumeMetered(body);
  if (path === 'rpc/save_extraction') return atomically(() => saveExtraction(body));
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
    // Same semantics as spec/db/011 refuse_disputed_approval (a before-update trigger on evidence).
    if (path === 'evidence' && body.review_status === 'approved') {
      for (const r of hit) if (r.review_status !== 'approved' && (db.tables.fact_conflicts ?? []).some((c) => c.brand_id === r.brand_id && c.status === 'open' && (c.evidence_ids as string[]).includes(r.id as string))) throw pt(409, 'other sources disagree with this fact: resolve the disagreement first');
    }
    const reviewed = hit.filter((r) => 'review_status' in body && r.review_status !== body.review_status);
    hit.forEach((r) => Object.assign(r, body));
    if (path === 'evidence') rederiveFor(reviewed);
    return hit;
  }
  const conflict = q.get('on_conflict')?.split(',');
  const ignore = String((init.headers as Record<string, string> | undefined)?.prefer ?? '').includes('ignore-duplicates');
  const inserted = ([] as Row[]).concat(body).flatMap((r): Row[] => {
    const prev = conflict && rows.find((x) => conflict.every((c) => x[c] === r[c]));
    if (prev) return ignore ? [] : [Object.assign(prev, r)];
    const row: Row = { id: uuid(), created_at: new Date().toISOString(), ...r };
    // runs.updated_at defaults to now() (spec/db/010), as record_run_step keeps it current.
    if (path === 'runs' && !('updated_at' in row)) row.updated_at = row.created_at;
    rows.push(row);
    return [row];
  });
  if (path === 'evidence') rederiveFor(inserted);
  return inserted;
}

/** Fresh tables holding what migrations 010 and 011 seed (from seed.ts, which a test checks against the SQL). */
const retired = new Set(Object.values(RETIRED_BY).flat().map((d) => `${d.id}@${d.version}`));
export async function seedTables(extra: Record<string, Row[]> = {}) {
  nextId = 0;
  db.calls = [];
  db.failInside = undefined;
  db.tables = {
    brands: [{ id: BRAND, owner_id: 'u', name: 'JamJam', type: 'company' }],
    sources: [], evidence: [], runs: [], run_steps: [], metered_usage: [], engine_config: SEED_CONFIG.map((c) => structuredClone(c)), fact_conflicts: [],
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

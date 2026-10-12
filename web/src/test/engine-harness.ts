// Test harness for the workflow engine (issue #32): an in-memory PostgREST with the engine's one RPC, a stand-in for
// the Cloudflare Workflows step API that retries, records delays and replays finished steps by name the way Workflows
// does after an interruption (https://developers.cloudflare.com/workflows/build/rules-of-workflows/), and a fake binding.
import type { Env } from '../../worker/env';
import { sha256Hex } from '../../worker/env';
import type { StepApi } from '../../worker/engine/runner';
import { ALL_SEED_CONFIG, SEED_DEFS, SEED_PROMPTS } from '../../worker/engine/seed';

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
  return c.id;
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
  const rows = (db.tables[path] ??= []);
  if (method === 'GET') {
    if (Number(q.get('offset') ?? 0) > 0) return [];
    const hit = rows.filter((r) => matches(r, q));
    const ordered = q.get('order')?.includes('created_at.desc') ? [...hit].reverse() : hit;
    const cols = q.get('select')?.split(',');
    return cols ? ordered.map((r) => Object.fromEntries(cols.filter((c) => c in r).map((c) => [c, r[c]]))) : ordered;
  }
  if (method === 'DELETE') { db.tables[path] = rows.filter((r) => !matches(r, q)); return null; }
  if (method === 'PATCH') { const hit = rows.filter((r) => matches(r, q)); hit.forEach((r) => Object.assign(r, body)); return hit; }
  const conflict = q.get('on_conflict')?.split(',');
  const ignore = String((init.headers as Record<string, string> | undefined)?.prefer ?? '').includes('ignore-duplicates');
  return ([] as Row[]).concat(body).flatMap((r) => {
    const prev = conflict && rows.find((x) => conflict.every((c) => x[c] === r[c]));
    if (prev) return ignore ? [] : [Object.assign(prev, r)];
    const row = { id: uuid(), created_at: new Date().toISOString(), ...r };
    rows.push(row);
    return row;
  });
}

/** Fresh tables holding what migration 010 seeds (from seed.ts, which a test checks against the SQL). */
export async function seedTables(extra: Record<string, Row[]> = {}) {
  nextId = 0;
  db.calls = [];
  db.tables = {
    brands: [{ id: BRAND, owner_id: 'u', name: 'JamJam', type: 'company' }],
    sources: [], evidence: [], runs: [], run_steps: [], engine_config: ALL_SEED_CONFIG.map((c) => structuredClone(c)), fact_conflicts: [],
    workflow_defs: SEED_DEFS.map((spec) => ({ id: spec.id, version: spec.version, spec, status: 'active' })),
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

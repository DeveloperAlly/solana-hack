// Test harness for the workflow engine (issue #32): an in-memory PostgREST with the engine's one RPC, a stand-in for
// the Cloudflare Workflows step API that retries, records delays and replays finished steps by name the way Workflows
// does after an interruption (https://developers.cloudflare.com/workflows/build/rules-of-workflows/), and a fake binding.
import type { Env } from '../../worker/env';
import { sha256Hex } from '../../worker/env';
import type { StepApi } from '../../worker/engine/runner';
import { SEED_DEFS, SEED_PROMPTS } from '../../worker/engine/seed';

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

export function fakeDb(url: string, init: RequestInit = {}) {
  const u = new URL(url);
  const path = u.pathname.replace('/rest/v1/', '');
  const q = u.searchParams;
  const method = init.method ?? 'GET';
  const body = init.body ? JSON.parse(String(init.body)) : undefined;
  db.calls.push({ method, table: path, query: u.search });
  if (path === 'rpc/record_run_step') return recordRunStep(body);
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
  return ([] as Row[]).concat(body).map((r) => {
    const prev = conflict && rows.find((x) => conflict.every((c) => x[c] === r[c]));
    if (prev) return Object.assign(prev, r);
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
    sources: [], evidence: [], runs: [], run_steps: [], engine_config: [],
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

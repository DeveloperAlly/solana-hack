// Checks every run start passes before anything is written (engine/api.ts start(), so every route that starts a run is
// covered: POST /runs, POST /sources and any later caller of startRun). Design review on PR #91: a per-brand daily
// budget of model calls, and, for a brand whose owner is an anonymous visitor (reading before sign-in, decision D1 and
// PR #96), a per-IP limit and a smaller budget. Owner types are read from the caller (`isAnonymous`, set by auth for a
// Supabase anonymous user in PR #96); without it every caller is a permanent account, so this does not depend on #96.
import { db } from '../db';
import { HttpError, type Env } from '../env';
import type { BrandRef } from './kinds';
import type { WorkflowSpec } from './types';

/** Who is starting the run: the signed-in user, whether Supabase marks them anonymous, and their IP when known. */
export interface Caller { id: string; isAnonymous?: boolean; ip?: string | null }
export type OwnerType = 'permanent' | 'anonymous';
export type StartGuard = (env: Env, caller: Caller, brand: BrandRef, spec: WorkflowSpec) => Promise<void>;

/**
 * Model calls a brand may start per UTC day, by owner type (engine_config 'model_call_budget' overrides either). Sized
 * against OpenRouter's free-model limit, which is per account and shared by every brand: 50 requests a day under 10
 * credits purchased, 1,000 at or above (https://openrouter.ai/docs/api/reference/limits). A permanent brand may use at
 * most 300 (5 worst-case extract_facts sources of 60 calls, or about 40 typical ones); an anonymous visitor 120, two
 * worst-case sources, within PR #96's cap of 8 sources (ANON_MAX_SOURCES).
 */
export const DEFAULT_MODEL_CALL_BUDGET: Record<OwnerType, number> = { permanent: 300, anonymous: 120 };

/** Most model calls one run of this definition makes, before retries: one per llm step, `max` per map of llm steps. */
export function plannedModelCalls(spec: WorkflowSpec): number {
  return spec.steps.reduce((n, s) => n + (s.type === 'llm' ? 1 : s.type === 'map' && s.step.type === 'llm' ? s.max : 0), 0);
}

const ownerType = (c: Caller): OwnerType => (c.isAnonymous ? 'anonymous' : 'permanent');
const startOfUtcDay = (now = Date.now()) => new Date(Math.floor(now / 86_400_000) * 86_400_000).toISOString();

/** The brand's budget for today, from engine_config or the default for its owner type. */
export async function modelCallBudget(env: Env, type: OwnerType): Promise<number> {
  const [row] = await db.select<{ value: unknown }>(env, 'engine_config', `${db.eq('key', 'model_call_budget')}&select=value`);
  const v = Number((row?.value as Record<string, unknown> | undefined)?.[type]);
  return Number.isInteger(v) && v >= 0 ? v : DEFAULT_MODEL_CALL_BUDGET[type];
}

/**
 * Admits a run only if the brand's model calls today (every recorded llm attempt), plus the planned calls of its runs
 * still going, plus this run's planned calls, fit the budget. Runs still going are counted in full even when some of
 * their calls are already recorded: the check can refuse early, never late.
 */
export const budgetGuard: StartGuard = async (env, caller, brand, spec) => {
  const planned = plannedModelCalls(spec);
  if (!planned) return;
  const budget = await modelCallBudget(env, ownerType(caller));
  const today = startOfUtcDay();
  const runs = await db.select<{ id: string; kind: string; workflow_version: number; status: string }>(env, 'runs', `${db.eq('brand_id', brand.id)}&updated_at=gte.${today}&select=id,kind,workflow_version,status`);
  let used = 0;
  if (runs.length) {
    const steps = await db.select<{ id: string }>(env, 'run_steps', `run_id=in.(${runs.map((r) => r.id).join(',')})&type=eq.llm&created_at=gte.${today}&select=id&limit=${budget + 1}`);
    used = steps.length;
  }
  const going = runs.filter((r) => r.status === 'running' || r.status === 'paused');
  const defs = going.length ? await db.select<{ id: string; version: number; spec: WorkflowSpec }>(env, 'workflow_defs', `id=in.(${[...new Set(going.map((r) => r.kind))].join(',')})&select=id,version,spec`) : [];
  const reserved = going.reduce((n, r) => n + plannedModelCalls(defs.find((d) => d.id === r.kind && d.version === r.workflow_version)?.spec ?? { steps: [] } as never), 0);
  if (used + reserved + planned > budget) {
    throw new HttpError(429, `this brand has used its ${budget} AI model calls for today (${used} made, ${reserved} reserved by runs still going, ${planned} needed); try again after 00:00 UTC`);
  }
};

/** Anonymous visitors: one Workers rate-limit check per run start, keyed by IP (wrangler.jsonc PUBLIC_LIMITER). No-op
 * without the binding (tests, local) and for permanent accounts. */
export const anonymousIpGuard: StartGuard = async (env, caller) => {
  if (!caller.isAnonymous || !env.PUBLIC_LIMITER) return;
  const { success } = await env.PUBLIC_LIMITER.limit({ key: `run:${caller.ip ?? 'unknown'}` });
  if (!success) throw new HttpError(429, 'too many reads from your network; wait a minute and try again');
};

/** Guards run in order; the first that refuses stops the start. Other caps (for example PR #96's source cap) register here. */
export const START_GUARDS: StartGuard[] = [anonymousIpGuard, budgetGuard];
export function registerStartGuard(g: StartGuard) {
  if (!START_GUARDS.includes(g)) START_GUARDS.push(g);
}
export async function checkStart(env: Env, caller: Caller, brand: BrandRef, spec: WorkflowSpec) {
  for (const g of START_GUARDS) await g(env, caller, brand, spec);
}

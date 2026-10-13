// Checks every run start passes before anything is written (engine/api.ts start(), so every route that starts a run is
// covered: POST /runs, POST /sources and any later caller of startRun). Design review on PR #91: a per-brand daily
// budget of metered calls (model calls and paid service calls, declared per step: types.ts StepBase.metered), a
// per-brand run rate (Codex review on PR #100: a run kind with no model call still costs money), a daily spend
// allowance, and, for an anonymous visitor (reading before sign-in, decision D1 and PR #96), a per-network run rate and
// smaller caps. The values are computed here; spec/db/012 admit_run checks them and reserves in one transaction. Owner types are read from the caller (`isAnonymous`, set by auth for a
// Supabase anonymous user in PR #96); without it every caller is a permanent account, so this does not depend on #96.
import { db } from '../db';
import { ANON_MAX_SOURCES, assertCanAddSource } from '../journey';
import type { Env } from '../env';
import type { BrandRef } from './kinds';
import type { StepSpec, WorkflowSpec } from './types';

/** Who is starting the run: the signed-in user, whether Supabase marks them anonymous, and their IP when known. */
export interface Caller { id: string; isAnonymous?: boolean; ip?: string | null }
export type OwnerType = 'permanent' | 'anonymous';
export type StartGuard = (env: Env, caller: Caller, brand: BrandRef, spec: WorkflowSpec) => Promise<void>;

/**
 * Metered calls a brand may start per UTC day, by owner type (engine_config 'metered_call_budget' overrides either). A
 * metered call is a model call or a call to a paid or rate-limited service (types.ts StepBase.metered). Sized against
 * OpenRouter's free-model limit, which is per account and shared by every brand: 50 requests a day under 10 credits
 * purchased, 1,000 at or above (https://openrouter.ai/docs/api/reference/limits). A permanent brand may use at most
 * 300 (4 worst-case extract_facts sources of 61, or about 30 typical ones); an anonymous visitor 120, within PR #96's
 * cap of 8 sources (ANON_MAX_SOURCES).
 */
export const DEFAULT_METERED_CALL_BUDGET: Record<OwnerType, number> = { permanent: 300, anonymous: 120 };
/** Runs a brand may start per rolling hour, by owner type (engine_config 'run_rate' overrides either): a cap on how fast
 * any run kind, metered or not, can be started, including kinds whose cost is not a model call. */
export const DEFAULT_RUN_RATE: Record<OwnerType, number> = { permanent: 30, anonymous: 10 };

/**
 * US dollars a brand may spend per UTC day on paid services, by owner type (engine_config 'daily_spend_usd' overrides
 * either): once today's recorded cost_usd reaches it, runs with metered steps are refused. At Exa's prices
 * (https://exa.ai/pricing: $7 per 1,000 searches, $1 per 1,000 content pages) $0.50 is about 70 searches or 500
 * pages a day for a permanent brand, and $0.05 about 7 searches for an anonymous visitor. Free models cost 0.
 */
export const DEFAULT_DAILY_SPEND_USD: Record<OwnerType, number> = { permanent: 0.5, anonymous: 0.05 };

/** Runs anonymous visitors on one network (IP) may start per rolling hour, across brands (engine_config
 * 'network_run_rate' overrides): PR #96 caps one anonymous visitor at 1 brand and 8 sources (ANON_MAX_BRANDS,
 * ANON_MAX_SOURCES), so 20 lets about two visitors share a network. Permanent accounts are not counted by network. */
export const DEFAULT_NETWORK_RUN_RATE: Record<OwnerType, number> = { permanent: 0, anonymous: 20 };

/** Most metered calls one step makes per run (types.ts StepBase.metered and its defaults); a map counts its inner step
 * once per item, up to its max. */
export function meteredCalls(s: StepSpec): number {
  if (s.type === 'map') return meteredCalls(s.step) * s.max;
  if (typeof s.metered === 'number' && Number.isFinite(s.metered) && s.metered >= 0) return s.metered;
  return s.type === 'llm' || (s.type === 'fetch' && s.reader !== undefined) ? 1 : 0;
}
/** Most metered calls one run of this definition makes, before retries. */
export function plannedMeteredCalls(spec: WorkflowSpec): number {
  return spec.steps.reduce((n, s) => n + meteredCalls(s), 0);
}

const ownerType = (c: Caller): OwnerType => (c.isAnonymous ? 'anonymous' : 'permanent');

/** A per-owner-type setting from engine_config, or its default. */
async function setting(env: Env, key: string, type: OwnerType, fallback: Record<OwnerType, number>, integer = true): Promise<number> {
  const [row] = await db.select<{ value: unknown }>(env, 'engine_config', `${db.eq('key', key)}&select=value`);
  const raw = (row?.value as Record<string, unknown> | undefined)?.[type];
  const v = typeof raw === 'number' ? raw : NaN;
  return (integer ? Number.isInteger(v) : Number.isFinite(v)) && v >= 0 ? v : fallback[type];
}

/**
 * The caps and plan one start is admitted against (spec/db/012 admit_run, which counts, checks and writes the run row
 * in one transaction serialised per brand, so two starts at the edge cannot both pass: Codex review on PR #91):
 * planned metered calls, the brand's daily metered-call budget and its hourly run rate, for the caller's owner type.
 */
export async function admissionLimits(env: Env, caller: Caller, spec: WorkflowSpec) {
  const type = ownerType(caller);
  const [budget, runRate, spendCap, clientCap] = await Promise.all([
    setting(env, 'metered_call_budget', type, DEFAULT_METERED_CALL_BUDGET),
    setting(env, 'run_rate', type, DEFAULT_RUN_RATE),
    setting(env, 'daily_spend_usd', type, DEFAULT_DAILY_SPEND_USD, false),
    setting(env, 'network_run_rate', type, DEFAULT_NETWORK_RUN_RATE),
  ]);
  return { planned: plannedMeteredCalls(spec), budget, runRate, spendCap, clientCap, sourceCap: caller.isAnonymous && ['extract_facts', 'ingest_url'].includes(spec.id) ? ANON_MAX_SOURCES : null };
}

/**
 * Extra checks a feature may add before admission (for example PR #96's source cap), run in order; the first that
 * refuses stops the start. None by default: the network cap, run rate, spend and metered-call budget are not guards,
 * they are checked and reserved atomically by admit_run.
 */
export const START_GUARDS: StartGuard[] = [async (env, caller, brand, spec) => {
  if (caller.isAnonymous && ['extract_facts', 'ingest_url'].includes(spec.id)) await assertCanAddSource(env, caller, brand.id);
}];
export function registerStartGuard(g: StartGuard) {
  if (!START_GUARDS.includes(g)) START_GUARDS.push(g);
}
export async function checkStart(env: Env, caller: Caller, brand: BrandRef, spec: WorkflowSpec) {
  for (const g of START_GUARDS) await g(env, caller, brand, spec);
}

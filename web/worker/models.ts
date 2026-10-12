// Which models answer each task, and the judge's family rule, in one place for every workflow (issue #64 for fact
// extraction; the drafting reviewer of issue #93 uses the same row and the same family functions).
//
// Config: one engine_config row (spec/db/010), key 'task_models', value {"<task>": ["<model id>", ...], ...}. A task is
// a prompt key (prompt_versions.key, e.g. 'extract.facts'). Each list is the task's pinned free models in fallback
// order, sent as OpenRouter's `models` array: the first is tried and the next only when it errors, and the reply's
// `model` field names the one that answered (https://openrouter.ai/docs/guides/routing/model-fallbacks). Pinning means
// a task is always answered by a known model, so an evaluation of that model carries from one request to the next.
// Only free models (ADR-010 decision 6): every id is a ':free' variant. Each migration that adds tasks merges its keys
// into the row and keeps keys already there (spec/db/011), so owners' edits survive and migrations compose. The lists
// are fixed per run when the run loads (engine/runner.ts), like the prompt version. A task with no list keeps the
// gateway default (llm.ts: OPENROUTER_MODEL or openrouter/free).
//
// Family rule (architecture §13.3: "the judge is always a different model family from the drafter"): a judge task may
// only list models that share no family with any model its generator task lists, so whichever fallbacks answer, the
// judge never shares the generator's family. Families come from the model id: its maker and every base lineage its
// name shows, so a fine-tune keeps its base's family.
import { db } from './db';
import type { Env } from './env';
import { isFreeModel } from './llm';

export const TASK_MODELS_KEY = 'task_models';
export type TaskModels = Record<string, string[]>;

/** Judge task -> the task whose output it judges. */
export const JUDGES: Record<string, string> = {
  'extract.check_support': 'extract.facts',
  // The independent reviewer of drafts (issue #93; backlog G4).
  'create.review': 'create.draft',
};


/** One model id, with or without OpenRouter's ':free' variant suffix (a reply may name either form). */
export const sameModel = (a: string, b: string) => !!a && !!b && a.replace(/:free$/, '') === b.replace(/:free$/, '');

// Base-model lineages named inside model ids. A model can belong to several (a distilled or fine-tuned model keeps its
// base's family and adds its maker's), and two models share a family if any lineage or maker matches.
const LINEAGES: [RegExp, string][] = [
  [/llama/, 'llama'], [/qwen|qwq/, 'qwen'], [/mistral|mixtral|ministral|devstral|magistral|codestral|pixtral/, 'mistral'],
  [/gemma|gemini/, 'google'], [/gpt|(^|[^a-z])o[134]([^a-z0-9]|$)/, 'openai'], [/deepseek/, 'deepseek'], [/(^|[^a-z])phi-?\d/, 'microsoft'],
  [/nemotron/, 'nvidia'], [/glm/, 'zhipu'], [/kimi/, 'moonshot'], [/claude/, 'anthropic'], [/grok/, 'xai'],
  [/command|(^|[^a-z])aya/, 'cohere'], [/(^|[^a-z])lfm/, 'liquid'], [/hermes/, 'nous'], [/granite/, 'ibm'], [/olmo/, 'allenai'],
];
// Makers whose OpenRouter vendor prefix differs from the family name used above.
const VENDORS: Record<string, string> = {
  'meta-llama': 'llama', mistralai: 'mistral', google: 'google', qwen: 'qwen', nvidia: 'nvidia', 'z-ai': 'zhipu', thudm: 'zhipu',
  moonshotai: 'moonshot', 'x-ai': 'xai', liquid: 'liquid', openai: 'openai', deepseek: 'deepseek', microsoft: 'microsoft',
  anthropic: 'anthropic', cohere: 'cohere', nousresearch: 'nous', 'ibm-granite': 'ibm', allenai: 'allenai',
};

/** The families a model id belongs to: its maker and every base lineage its name shows. Empty for a router or no id. */
export function modelFamilies(id: string | null | undefined): Set<string> {
  const m = /^([a-z0-9][\w.-]*)\/([\w.:-]+)$/i.exec((id ?? '').trim().toLowerCase());
  // A router (openrouter/free, openrouter/auto) is not a model: it names no family, so nothing can be shown to differ.
  if (!m || m[1] === 'openrouter') return new Set();
  const out = new Set([VENDORS[m[1]] ?? m[1]]);
  for (const [re, fam] of LINEAGES) if (re.test(m[2])) out.add(fam);
  return out;
}

/** True only when both models have a known family and share none. */
export function differentFamily(a: string | null | undefined, b: string | null | undefined): boolean {
  const fa = modelFamilies(a);
  const fb = modelFamilies(b);
  return fa.size > 0 && fb.size > 0 && [...fa].every((f) => !fb.has(f));
}

/** Why a set of task lists is unusable, or null: a list that is empty, not free-only or repeats a model, or a judge
 * that lists a model sharing a family with any model of the task it judges (or judges a task with no list). */
export function taskModelsError(models: TaskModels): string | null {
  for (const [task, list] of Object.entries(models)) {
    if (!Array.isArray(list) || !list.length) return `${task}: no models`;
    const bad = list.find((m) => typeof m !== 'string' || !isFreeModel(m));
    if (bad !== undefined) return `${task}: ${String(bad)} is not a free model id`;
    if (new Set(list).size !== list.length) return `${task}: a model is listed twice`;
  }
  for (const [judge, generator] of Object.entries(JUDGES)) {
    if (!(judge in models)) continue;
    const gen = models[generator];
    if (!gen) return `${judge}: judges ${generator}, which has no models configured`;
    for (const j of models[judge]) {
      const g = gen.find((x) => !differentFamily(j, x));
      if (g) return `${judge}: ${j} shares a model family with ${g}, which ${generator} uses`;
    }
  }
  return null;
}

/**
 * The lists for these tasks, plus the generator of any judge among them (so the family rule is always checked against
 * it), validated together. Tasks without a list are left out (gateway default). Throws a message for an unusable
 * config; the caller decides how to fail.
 */
export async function loadTaskModels(env: Env, tasks: string[]): Promise<TaskModels> {
  const [row] = await db.select<{ value: unknown }>(env, 'engine_config', `${db.eq('key', TASK_MODELS_KEY)}&select=value`);
  const all = (row?.value && typeof row.value === 'object' ? row.value : {}) as Record<string, unknown>;
  const want = new Set(tasks.flatMap((t) => (t in JUDGES ? [t, JUDGES[t]] : [t])));
  const out: TaskModels = {};
  for (const t of want) if (t in all) out[t] = all[t] as string[];
  // A judge never falls back to the default router: a router names no family, so the rule could not be shown to hold.
  const unlisted = tasks.find((t) => t in JUDGES && !(t in out));
  if (unlisted) throw new Error(`model config: ${unlisted} is a judge and has no models configured`);
  const bad = taskModelsError(out);
  if (bad) throw new Error(`model config: ${bad}`);
  return out;
}

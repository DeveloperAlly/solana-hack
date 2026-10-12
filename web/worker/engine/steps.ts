// Step types (fetch, llm, code, write, map) and the registries that definitions name. Definitions are data; these are
// the only places their steps run code. Each handler returns {output, trace}; the runner records the trace in run_steps.
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { MAX_FACTS_PER_CHUNK, SLOT_PROMPT } from '../extract/facts';
import { addDropped, alignFacts, chunkSource, decideFacts, supportBatches, type Candidate, type Dropped } from '../extract/pipeline';
import { saveExtractedFacts, type ReadOutput } from '../extract/save';
import { EXTRACTED_FACTS, SUPPORT_VERDICTS } from '../extract/schemas';
import { stableId } from '../ids';
import { readPage } from '../ingest';
import { isSection, SECTIONS } from '../kit';
import { chat, parseJson } from '../llm';
import { sameModel, type TaskModels } from '../models';
import { MAX_QUOTE, normalisePage, quoteOnPage } from '../quote';
import { schemaError, type NamedSchema } from '../schema';
import { capText, readSource } from './readers';
import { loadPrompt, render } from './prompts';
import { factTrust, urlKind } from '../sources/registry';
import type { RunRow, StepSpec, StepTrace } from './types';

export { capText } from './readers';

export interface StepContext { env: Env; run: RunRow; state: RunState }
/** What a run has so far: its input and the output of every finished step, by step id. */
export interface RunState {
  input: Record<string, unknown>;
  steps: Record<string, unknown>;
  prompts: Record<string, number>;
  /** Models per task (prompt key), fixed when the run loads (models.ts); a task without an entry uses the gateway default. */
  models?: TaskModels;
}
export type StepResult = { output: unknown; trace: Partial<StepTrace> };

/** Constants a definition may reference as $const.NAME. */
const CONSTS: Record<string, unknown> = { MAX_QUOTE, SECTIONS: Object.keys(SECTIONS).join(', '), SLOTS: SLOT_PROMPT, MAX_FACTS_PER_CHUNK };

/** Reply schemas an 'llm' step can name (types.ts LlmStep.schema). */
export const SCHEMAS: Record<string, NamedSchema> = { extracted_facts: EXTRACTED_FACTS, support_verdicts: SUPPORT_VERDICTS };

/** Resolves "$input.a", "$steps.id.a.b" or "$const.NAME"; any other string is a literal. */
export function resolve(ref: string, state: RunState): unknown {
  if (!ref.startsWith('$')) return ref;
  const [root, ...path] = ref.slice(1).split('.');
  let v: unknown = root === 'input' ? state.input : root === 'steps' ? state.steps : root === 'const' ? CONSTS : undefined;
  if (v === undefined) throw new HttpError(500, `unknown reference ${ref}`);
  for (const k of path) v = v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined;
  return v;
}

const resolveAll = (args: Record<string, string> | undefined, state: RunState) =>
  Object.fromEntries(Object.entries(args ?? {}).map(([k, ref]) => [k, resolve(ref, state)]));
const asText = (v: unknown) => (typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v));
const textVars = (args: Record<string, string> | undefined, state: RunState) =>
  Object.fromEntries(Object.entries(resolveAll(args, state)).map(([k, v]) => [k, asText(v)]));

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

type Fact = { section?: string; claim?: string; quote?: string };

/** A whole number from a definition argument (literals arrive as strings); a bad one is a definition error. */
function int(v: unknown, name: string): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n) || n < 0) throw new HttpError(500, `step argument ${name} must be a whole number`);
  return n;
}
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Pure functions a 'code' step can name. */
export const CODE: Record<string, (args: Record<string, unknown>) => unknown> = {
  /**
   * The quote check from issue #31, unchanged: keep a fact only when its quote is on the page, through the one
   * normaliser (quote.ts). A quote longer than the stored limit is refused before the check, never cut after it.
   */
  keep_quoted_facts: ({ facts, page }) => {
    const list = (Array.isArray(facts) ? facts : []) as Fact[];
    const hay = normalisePage(asText(page));
    const kept = list
      .map((f) => ({ ...f, quote: typeof f.quote === 'string' ? f.quote.trim() : '' }))
      .filter((f) => f.claim && f.quote && f.quote.length <= MAX_QUOTE && isSection(f.section ?? '') && quoteOnPage(hay, f.quote))
      .map((f) => ({ section: f.section as string, claim: str(f.claim, 500), quote: f.quote }));
    return { facts: kept, dropped: list.length - kept.length };
  },
  // Fact extraction (issue #64; architecture §6.1): extract/pipeline.ts holds each stage; these adapt step arguments.
  /** Chunks of 2-4k tokens with offsets into the source text (extract/chunk.ts). */
  chunk_text: ({ text, target, min, max, overlap, max_chunks }) =>
    chunkSource(asText(text), { target: int(target, 'target'), min: int(min, 'min'), max: int(max, 'max'), overlap: int(overlap, 'overlap') }, int(max_chunks, 'max_chunks')),
  /** Each proposed fact's quote located in the source, exact or fuzzy, with the number guard and merging. */
  align_facts: ({ text, chunks, extracted }) => alignFacts(asText(text), list(chunks), list(extracted)),
  /** The support check's inputs, `size` facts per call, at most `max_batches` calls. */
  support_batches: ({ facts, size, max_batches }) => supportBatches(list<Candidate>(facts), Math.max(1, int(size, 'size')), int(max_batches, 'max_batches')),
  /** Only facts the support check marked supported. */
  decide_facts: ({ facts, batches, verdicts }) => decideFacts(list<Candidate>(facts), list(batches), list(verdicts)),
};

/** Attaches the trace of a call that was made to the error that refused its result (engine/runner.ts records it). */
export function withTrace(e: unknown, trace: Partial<StepTrace>): unknown {
  if (e && typeof e === 'object') (e as { trace?: Partial<StepTrace> }).trace = trace;
  return e;
}

/** Database writes a 'write' step (or onFailure) can name. Each is idempotent, because a step may run more than once. */
export const WRITES: Record<string, (ctx: StepContext, args: Record<string, unknown>) => Promise<unknown>> = {
  /**
   * Evidence for one source, then the source marked read. Each fact's id is derived from the source and the fact, and
   * rows already present are left alone, so a retried step (Workflows retries the whole callback) writes the same ids
   * and never reverts a review the owner made in between (PR #70 review;
   * https://developers.cloudflare.com/workflows/build/rules-of-workflows/). Trust comes from the source type registry (issue #57): owned only when both the link and the page actually
   * read (after redirects) are on the brand's website; anything else is a third-party 'page' whose facts wait for review.
   */
  save_source_facts: async ({ env, run }, { sourceId, facts, dropped, link, website, url, title, text }) => {
    const sid = asText(sourceId);
    const site = typeof website === 'string' ? website : null;
    const kind = urlKind(asText(link), site) === 'site' && urlKind(asText(url), site) === 'site' ? 'site' : 'page';
    const list = (facts ?? []) as { section: string; claim: string; quote: string }[];
    const rows = await Promise.all(list.map(async (f, i) => ({ id: await stableId(sid, String(i), f.section, f.claim, f.quote), brand_id: run.brand_id, source_id: sid, section: f.section, claim: f.claim, quote: f.quote, origin: 'source', ...factTrust(kind) })));
    if (rows.length) await db.insertNew(env, 'evidence', rows, 'id');
    const page = asText(text);
    // source_text (spec/db/008) keeps the text the quotes were checked against, so any stored quote can be re-checked.
    await db.update(env, 'sources', `${db.eq('id', sid)}&${db.eq('brand_id', run.brand_id)}`, { status: 'read', kind, title: asText(title), text_excerpt: page.slice(0, 2000), source_text: page, fetched_at: new Date().toISOString(), url: asText(url).slice(0, 500), error: null });
    return { sourceId: sid, facts: rows.length, dropped: Number(dropped) || 0, kind, needsReview: kind === 'page' ? rows.length : 0 };
  },
  /** Extracted facts for one source, with trust, review, confidence and conflicts (extract/save.ts; issue #64). */
  save_extracted_facts: async ({ env, run }, { sourceId, read, facts, droppedAlign, droppedSupport }) =>
    saveExtractedFacts(env, run, { sourceId: asText(sourceId), read: read as ReadOutput, facts: list<Candidate>(facts), dropped: addDropped(droppedAlign as Dropped, droppedSupport as Dropped) }),
  mark_source_failed: async ({ env, run }, { sourceId, error }) => {
    await db.update(env, 'sources', `${db.eq('id', asText(sourceId))}&${db.eq('brand_id', run.brand_id)}`, { status: 'failed', error: asText(error) || 'reading the page failed' });
    return null;
  },
};

/** Runs one step of a definition. Map steps are expanded by the runner, not here. */
export async function runStep(spec: Exclude<StepSpec, { type: 'map' }>, ctx: StepContext, item?: unknown): Promise<StepResult> {
  const state = item === undefined ? ctx.state : { ...ctx.state, input: { ...ctx.state.input, item } };
  switch (spec.type) {
    case 'fetch': {
      if (spec.reader !== undefined) {
        const reader = asText(resolve(spec.reader, state));
        // args: one reference to the run's checked reader arguments (engine/readers.ts READER_INPUTS), or a map of references.
        const args = typeof spec.args === 'string' ? resolve(spec.args, state) : resolveAll(spec.args, state);
        if (!args || typeof args !== 'object' || Array.isArray(args)) throw new HttpError(500, 'source step args must resolve to an object');
        const out = await readSource(ctx.env, reader, args as Record<string, unknown>, spec.maxChars, spec.maxBytes);
        // Metering: the adapter's own estimate of what the read cost (sources/types.ts SourceMeta.cost; 0 when only free
        // services were used), so a brand's cost is a sum over its runs' steps.
        return { output: out, trace: { cost_usd: out.meta.cost } };
      }
      const page = await readPage(asText(resolve(spec.url, state)));
      const text = capText(page.text, spec.maxChars, spec.maxBytes);
      return { output: { url: page.url, title: page.title, text, excerpt: text.slice(0, spec.excerptChars) }, trace: {} };
    }
    case 'llm': {
      const p = await loadPrompt(ctx.env, spec.prompt, spec.promptVersion ?? state.prompts[spec.prompt]);
      const system = render(p.body, textVars(spec.vars, state));
      const user = render(spec.user, textVars(spec.userVars, state));
      const schema = spec.schema === undefined ? undefined : SCHEMAS[spec.schema];
      if (spec.schema !== undefined && !schema) throw new HttpError(500, `unknown reply schema ${spec.schema}`);
      // Token counts are recorded when OpenRouter reports usage, null otherwise; never guessed.
      const task = state.models?.[spec.prompt];
      const r = await chat(ctx.env, system, user, { ...(schema ? { schema } : {}), ...(task ? { models: task } : {}) });
      // Cost is OpenRouter's usage.cost in credits (US dollars; 0 for free models) when it reports one, else null
      // (https://openrouter.ai/docs/guides/guides/usage-accounting).
      const trace = { prompt_key: p.key, prompt_version: p.version, prompt_hash: p.hash, model: r.model || null, tokens_in: r.usage?.promptTokens ?? null, tokens_out: r.usage?.completionTokens ?? null, cost_usd: r.usage?.cost ?? null };
      // A reply that is then refused was still made: its trace (model, tokens, cost) goes on the error record too.
      try {
        // A configured task uses only a reply from one of its own models, so the family rule (models.ts) holds for the
        // model that actually answered. Anything else is refused (5xx, so the step is retried) and recorded as such.
        if (task && !task.some((m) => sameModel(m, r.model))) {
          console.error('llm reply from an unlisted model', { task: spec.prompt, model: r.model });
          throw new HttpError(502, `the reply came from ${r.model || 'an unnamed model'}, which is not configured for ${spec.prompt}`);
        }
        if (!schema) return { output: spec.json ? parseJson<unknown>(r.text) : { text: r.text }, trace };
        // A schema-bound reply is used only if it conforms in full; otherwise the step fails (5xx, so it is retried) and
        // nothing from that reply is kept. The log names the schema and the path that failed, never the content.
        const value = parseJson<unknown>(r.text);
        const bad = schemaError(schema.schema, value) ?? schema.limits?.(value) ?? null;
        if (bad) {
          console.error('llm reply off schema', { schema: schema.name, at: bad.split(':')[0], model: r.model });
          throw new HttpError(502, 'the AI model reply did not match the expected format, trying again');
        }
        return { output: value, trace };
      } catch (e) {
        throw withTrace(e, trace);
      }
    }
    case 'code': {
      const fn = CODE[spec.fn];
      if (!fn) throw new HttpError(500, `unknown code step ${spec.fn}`);
      return { output: fn(resolveAll(spec.args, state)), trace: {} };
    }
    case 'write': {
      const op = WRITES[spec.op];
      if (!op) throw new HttpError(500, `unknown write step ${spec.op}`);
      return { output: await op({ ...ctx, state }, resolveAll(spec.args, state)), trace: {} };
    }
  }
}

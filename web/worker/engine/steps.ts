// Step types (fetch, llm, code, write, map) and the registries that definitions name. Definitions are data; these are
// the only places their steps run code. Each handler returns {output, trace}; the runner records the trace in run_steps.
import { db } from '../db';
import { HttpError, sha256Hex, type Env } from '../env';
import { readPage } from '../ingest';
import { isSection, SECTIONS } from '../kit';
import { chat, parseJson } from '../llm';
import { MAX_QUOTE, normalisePage, quoteOnPage } from '../quote';
import { loadPrompt, render } from './prompts';
import { factTrust, urlKind } from '../sources/registry';
import type { RunRow, StepSpec, StepTrace } from './types';

export interface StepContext { env: Env; run: RunRow; state: RunState }
/** What a run has so far: its input and the output of every finished step, by step id. */
export interface RunState { input: Record<string, unknown>; steps: Record<string, unknown>; prompts: Record<string, number> }
export type StepResult = { output: unknown; trace: Partial<StepTrace> };

/** Constants a definition may reference as $const.NAME. */
const CONSTS: Record<string, unknown> = { MAX_QUOTE, SECTIONS: Object.keys(SECTIONS).join(', ') };

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

/**
 * The longest prefix of `s` within `maxUnits` UTF-16 units and `maxBytes` UTF-8 bytes, never splitting a character
 * (TextEncoder.encodeInto stops before a character that does not fit and reports how many units it read).
 */
export function capText(s: string, maxUnits: number, maxBytes: number) {
  let t = s.slice(0, maxUnits);
  if (/[\uD800-\uDBFF]$/.test(t)) t = t.slice(0, -1);
  const { read } = new TextEncoder().encodeInto(t, new Uint8Array(maxBytes));
  return t.slice(0, read ?? t.length);
}

/** A stable UUID for a fact, from its source and content, so a retried save writes the same rows (name-based, as in
 * RFC 9562 §5.8 UUIDv8 layout: https://www.rfc-editor.org/rfc/rfc9562#section-5.8). */
async function factId(...parts: string[]) {
  const h = await sha256Hex(parts.join('\u0000'));
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

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
};

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
    const rows = await Promise.all(list.map(async (f, i) => ({ id: await factId(sid, String(i), f.section, f.claim, f.quote), brand_id: run.brand_id, source_id: sid, section: f.section, claim: f.claim, quote: f.quote, origin: 'source', ...factTrust(kind) })));
    if (rows.length) await db.insertNew(env, 'evidence', rows, 'id');
    const page = asText(text);
    // source_text (spec/db/008) keeps the text the quotes were checked against, so any stored quote can be re-checked.
    await db.update(env, 'sources', `${db.eq('id', sid)}&${db.eq('brand_id', run.brand_id)}`, { status: 'read', kind, title: asText(title), text_excerpt: page.slice(0, 2000), source_text: page, fetched_at: new Date().toISOString(), url: asText(url).slice(0, 500), error: null });
    return { sourceId: sid, facts: rows.length, dropped: Number(dropped) || 0, kind, needsReview: kind === 'page' ? rows.length : 0 };
  },
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
      const page = await readPage(asText(resolve(spec.url, state)));
      const text = capText(page.text, spec.maxChars, spec.maxBytes);
      return { output: { url: page.url, title: page.title, text, excerpt: text.slice(0, spec.excerptChars) }, trace: {} };
    }
    case 'llm': {
      const p = await loadPrompt(ctx.env, spec.prompt, spec.promptVersion ?? state.prompts[spec.prompt]);
      const system = render(p.body, textVars(spec.vars, state));
      const user = render(spec.user, textVars(spec.userVars, state));
      // llm.ts returns the text and the model that answered; token counts are not returned yet (see the PR's
      // follow-up for llm.ts), so tokens are recorded as null rather than guessed.
      const r = (await chat(ctx.env, system, user)) as { text: string; model: string; usage?: { promptTokens?: number; completionTokens?: number } };
      const trace = { prompt_key: p.key, prompt_version: p.version, prompt_hash: p.hash, model: r.model, tokens_in: r.usage?.promptTokens ?? null, tokens_out: r.usage?.completionTokens ?? null };
      return { output: spec.json ? parseJson<unknown>(r.text) : { text: r.text }, trace };
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

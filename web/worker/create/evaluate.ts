// Evaluating a post's current text outside the drafting run (PR #99 review: no body is approvable without a passing
// verdict for its own hash). After an AI polish, after a person's edit, and at approval when the text has none, the
// same gate set as drafting runs: the evaluators the active draft_post definition names (measure and decide steps),
// with the independent review by the create.review task's models (models.ts), in a family other than the writer's.
// A text a person typed (PERSON) excludes no family; the reviewer still has to answer (fail closed).
import { db } from '../db';
import { HttpError, type Env } from '../env';
import { differentFamily, loadTaskModels, sameModel } from '../models';
import { chat, parseJson } from '../llm';
import { CLAIMS_POLICY, CONTENT_QUESTIONS, contentHash, FLIRTY_NOTE, type Post } from '../posts';
import { loadPrompt, render } from '../engine/prompts';
import type { WorkflowSpec } from '../engine/types';
import { schemaError } from '../schema';
import { evidenceSentences, type DraftClaim } from './claims';
import { EVALUATORS, failedVerdict, named, PERSON, postVerdict, runAll, withinLength, type EvalInput, type PostVerdict, type ReviewFindings } from './evaluators';
import { registeredKit } from './ops';
import { factDocs, rankCorpus, RETRIEVE_DEFAULTS } from './retrieve';
import { REVIEW_FINDINGS } from './schemas';
import { toneTargets, voiceSpec } from './voice';

/** The evaluator lists the active draft_post definition names: one source for drafting and for re-evaluation. */
async function evaluatorLists(env: Env): Promise<{ code: string; model: string }> {
  const [def] = await db.select<{ spec: WorkflowSpec }>(env, 'workflow_defs', `${db.eq('id', 'draft_post')}&${db.eq('status', 'active')}&select=spec&order=version.desc&limit=1`);
  const arg = (id: string) => (def?.spec.steps.find((s) => s.id === id) as { args?: Record<string, string> } | undefined)?.args?.evaluators;
  const code = arg('measure');
  const model = arg('decide');
  if (!code || !model) throw new HttpError(503, 'drafting is not set up in this database yet (spec/db/013)');
  return { code, model };
}

/**
 * The verdict for `body` as the post's current text, written by `generator` (a model id, or PERSON). Never throws for a
 * check that cannot run: the verdict then fails with the reason (fail closed), so the caller can still save the text.
 */
export async function evaluateText(env: Env, post: Pick<Post, 'brand_id' | 'kit_version' | 'channel'>, body: string, generator: string, source: PostVerdict['source']): Promise<PostVerdict> {
  const text = body.trim();
  const hash = await contentHash(text);
  try {
    const kit = await registeredKit({ env }, post.brand_id, post.kit_version);
    const pol = kit.payload.policy!;
    const [answers, lists, models, prompt] = await Promise.all([
      db.select<{ data: Record<string, string>; updated_at: string | null; skipped: boolean }>(env, 'answers', `${db.eq('brand_id', post.brand_id)}&${db.eq('step', 'voice')}&select=data,updated_at,skipped`),
      evaluatorLists(env),
      loadTaskModels(env, ['create.review']),
      loadPrompt(env, 'create.review'),
    ]);
    const spec = voiceSpec({ template: pol.template ?? null, registeredAt: kit.registered_at }, answers[0] ?? null);
    const ranked = await rankCorpus({ facts: factDocs(kit.payload.evidence!), posts: [], excerpts: [] }, text, RETRIEVE_DEFAULTS);
    const facts = ranked.facts.map((f) => ({ id: f.id, claim: f.text, quote: f.meta?.quote ?? null }));
    const base: EvalInput = { body: text, claims: [], facts, spec, channel: post.channel ?? 'LinkedIn', claimsLevel: pol.claims!, brandName: kit.payload.brand?.name ?? 'the brand', template: pol.template ?? null };
    // Length first, as drafting does: a text over the maximum is not evaluated further.
    if (!withinLength(text)) return postVerdict(hash, runAll([EVALUATORS.length], base), { source, generator, judge: null, prompt: null });
    // The reviewer: the configured models outside the writer's family (any, for a person's text). None: no verdict.
    const reviewers = (models['create.review'] ?? []).filter((m) => generator === PERSON || differentFamily(generator, m));
    if (!reviewers.length) return failedVerdict(hash, 'no reviewer model of another family than the writer is configured', { source, generator });
    const system = render(prompt.body, { channel: base.channel, claims_policy: CLAIMS_POLICY[base.claimsLevel], tone_targets: toneTargets(spec), content_questions: CONTENT_QUESTIONS, flirty_note: pol.template === 'flirty' ? `\n${FLIRTY_NOTE}` : '' });
    const r = await chat(env, system, JSON.stringify({ post: text, sentences: evidenceSentences(text, base.claimsLevel), facts }), { schema: REVIEW_FINDINGS, models: reviewers });
    if (!reviewers.some((m) => sameModel(m, r.model))) return failedVerdict(hash, `the review came from ${r.model || 'an unnamed model'}, which is not a reviewer for this text`, { source, generator });
    const review = parseJson<ReviewFindings>(r.text);
    const bad = schemaError(REVIEW_FINDINGS.schema, review) ?? REVIEW_FINDINGS.limits?.(review) ?? null;
    if (bad) return failedVerdict(hash, 'the review did not match the expected format', { source, generator });
    // No writer declared claims for this text: the reviewer's citations are the declarations, and the code gate checks
    // each one against the facts it cites (numbers, counted words, superlatives, guarantees, names).
    const declared: DraftClaim[] = review.claims.map((c) => ({ text: c.text, fact_ids: c.fact_ids }));
    const input = { ...base, claims: declared, review, generator, judge: r.model };
    const results = { ...runAll(named(lists.code, 'code'), input), ...runAll(named(lists.model, 'model'), input) };
    return postVerdict(hash, results, { source, generator, judge: r.model, prompt: { key: prompt.key, version: prompt.version } });
  } catch (e) {
    const reason = e instanceof HttpError ? e.message : 'something went wrong';
    return failedVerdict(hash, reason, { source, generator });
  }
}

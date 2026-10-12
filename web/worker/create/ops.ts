// The draft_post workflow's named steps (issue #93), registered in engine/steps.ts READS, CODE and WRITES. Reads and
// code here never call a model; the two model calls are the workflow's 'llm' steps, with versioned prompts
// (engine/seed.ts, prompt_versions) and per-step traces (run_steps), so every candidate traces to its prompt and model.
import { db } from '../db';
import { HttpError } from '../env';
import { stableId } from '../ids';
import { CLAIMS_POLICY, contentHash, FLIRTY_NOTE, slopCheck } from '../posts';
import type { StepContext } from '../engine/steps';
import { evidenceSentences, type DraftClaim, type FactRef } from './claims';
import { EVALUATORS, named, pick, postVerdict, runAll, verdictOf, withinLength, type EvalInput, type ReviewFindings, type Results } from './evaluators';
import { factDocs, loadCorpus, rankCorpus, RETRIEVE_DEFAULTS, type FactInput, type Ranked } from './retrieve';
import { directives, toneTargets, VOICE_BANDS_VERSION, voiceSpec, type VoiceMeasure, type VoiceSpec } from './voice';
import type { ClaimsResult } from './claims';
import type { PlatformLint } from './platform';

/** Candidates per draft (backlog T1b: best of 3). */
export const CANDIDATES = 3;

const asText = (v: unknown) => (typeof v === 'string' ? v : '');
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

interface KitRow { version: number; registered_at: string | null; payload: { brand?: { name?: string }; sections?: { section: string; body: string }[]; policy?: { claims?: string; template?: string | null }; evidence?: FactInput[]; sources?: { id: string }[] } }

/** Reads the registered kit a post is drafted to; the same refusals as the approval check (posts.ts postPolicy). */
export async function registeredKit(ctx: { env: StepContext['env'] }, brandId: string, version?: number | null): Promise<KitRow> {
  const which = version ? `&${db.eq('version', String(version))}` : '';
  const [kit] = await db.select<KitRow>(ctx.env, 'kits', `${db.eq('brand_id', brandId)}&${db.eq('status', 'registered')}${which}&select=version,registered_at,payload&order=version.desc&limit=1`);
  if (!kit) throw new HttpError(409, 'register your brand kit first, so posts are written to a fixed kit version');
  if (!kit.payload.sections?.find((s) => s.section === 'voice')?.body) throw new HttpError(409, 'the registered kit has no voice section');
  // Drafts are checked against the kit's own claims gate and evidence snapshot, as approval is; a kit registered before
  // kits recorded them cannot back a post (posts.ts postPolicy).
  if (!CLAIMS_POLICY[kit.payload.policy?.claims ?? ''] || !Array.isArray(kit.payload.evidence)) throw new HttpError(409, `kit v${kit.version} was registered before kits recorded their evidence; register a new kit version, then draft again`);
  return kit;
}

const factLine = (f: Ranked) => `${f.id}: ${f.text}`;

export const CREATE_READS: Record<string, (ctx: StepContext, args: Record<string, unknown>) => Promise<unknown>> = {
  /**
   * The registered kit, its voice spec and the allow-listed facts of its evidence snapshot. The models for the two
   * model steps come from engine_config task_models, fixed when the run loads (models.ts, engine/runner.ts).
   */
  draft_context: async (ctx, { kitVersion, channel }) => {
    const { env, run } = ctx;
    const kit = await registeredKit(ctx, run.brand_id, Number(kitVersion) || null);
    const answers = await db.select<{ data: Record<string, string>; updated_at: string | null; skipped: boolean }>(env, 'answers', `${db.eq('brand_id', run.brand_id)}&${db.eq('step', 'voice')}&select=data,updated_at,skipped`);
    const pol = kit.payload.policy!;
    const spec = voiceSpec({ template: pol.template ?? null, registeredAt: kit.registered_at }, answers[0] ?? null);
    const section = (id: string) => kit.payload.sections?.find((s) => s.section === id)?.body ?? '';
    const ch = asText(channel) || 'LinkedIn';
    return {
      kitVersion: kit.version,
      brandName: kit.payload.brand?.name ?? 'the brand',
      channel: ch,
      sections: { voice: section('voice'), messaging: section('messaging'), positioning: section('positioning'), purpose: section('purpose') },
      policy: { claims: pol.claims!, template: pol.template ?? null },
      claimsPolicy: CLAIMS_POLICY[pol.claims!],
      flirtyNote: pol.template === 'flirty' ? `\n${FLIRTY_NOTE}` : '',
      spec, directives: directives(spec), toneTargets: toneTargets(spec), sample: spec.sample ?? '(none)',
      // The allow-list is applied here and again inside retrieval, before any ranking (architecture §2a.2).
      facts: factDocs(kit.payload.evidence!).map((d) => ({ id: d.id, claim: d.text, quote: d.meta?.quote ?? null, trust: d.meta?.trust ?? null, review_status: 'approved' })),
      sourceIds: (kit.payload.sources ?? []).map((s) => s.id),
      slots: Array.from({ length: CANDIDATES }, (_, i) => ({ n: i + 1 })),
      count: CANDIDATES,
    };
  },
  /** Retrieval (X16): the allow-listed corpus ranked for the brief, with the prompt text built from it. */
  draft_retrieve: async ({ env, run }, { brief, facts, sourceIds }) => {
    const corpus = await loadCorpus(env, run.brand_id, { facts: list<FactInput>(facts), sourceIds: list<string>(sourceIds) });
    const r = await rankCorpus(corpus, asText(brief), RETRIEVE_DEFAULTS);
    return {
      ranker: r.ranker,
      facts: r.facts.map((f) => ({ id: f.id, claim: f.text, quote: f.meta?.quote ?? null, score: f.score })),
      posts: r.posts.map((p) => ({ id: p.id, why: p.meta?.why ?? null, score: p.score })),
      excerpts: r.excerpts.map((e) => ({ id: e.id, source: e.meta?.source ?? null, score: e.score })),
      factsText: r.facts.map(factLine).join('\n') || '(no facts: make no claims)',
      postsText: r.posts.map((p, i) => `Example ${i + 1}:\n${p.text}`).join('\n\n') || '(none yet)',
      excerptsText: r.excerpts.map((e) => `- ${e.text}`).join('\n') || '(none)',
    };
  },
  /**
   * For each candidate: the model that wrote it, read from the trace (run_steps), and the reviewer's input. The reviewer
   * sees the post, the sentences code found needing evidence, and the facts the writer was given: fresh context, never
   * the drafting prompt or the writer's claims (backlog G4).
   */
  review_inputs: async (ctx, { candidates, facts, claims }) => {
    const generators = await traceModels(ctx, 'draft');
    const given = list<{ id: string; claim: string; quote: string | null }>(facts).map((f) => ({ id: f.id, claim: f.claim, quote: f.quote }));
    // The sentences the reviewer must rule on: those code finds needing evidence under the kit's claims gate (claims.ts).
    // Only candidates within the length are reviewed; one over it is refused before evaluation (measure_drafts).
    const items = list<{ body: string }>(candidates).flatMap((c, idx) => {
      const post = asText(c?.body).trim();
      return withinLength(post) ? [{ idx, input: JSON.stringify({ post, sentences: evidenceSentences(post, asText(claims)), facts: given }) }] : [];
    });
    return { generators, items };
  },
  /** The model that answered each item of a map step, from the trace: the last successful attempt per item. */
  trace_models: async (ctx, { step }) => ({ models: await traceModels(ctx, asText(step)) }),
};

/** Models by item index for a map step, read from run_steps (the record of which model answered each item). */
export async function traceModels({ env, run }: Pick<StepContext, 'env' | 'run'>, step: string): Promise<(string | null)[]> {
  const rows = await db.select<{ step: string; model: string | null; outcome: string }>(env, 'run_steps', `${db.eq('run_id', run.id)}&${db.eq('outcome', 'ok')}&select=step,model,outcome,created_at&order=created_at.asc`);
  const out: (string | null)[] = [];
  const re = new RegExp(`^${step.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\[(\\d+)\\]$`);
  for (const r of rows) {
    const m = re.exec(r.step);
    if (m) out[Number(m[1])] = r.model || null;
  }
  return out;
}

/** What every evaluator reads, for one candidate. */
const evalInput = (c: { body?: unknown; claims?: unknown } | undefined, a: Record<string, unknown>): EvalInput => ({
  body: asText(c?.body).trim(), claims: list<DraftClaim>(c?.claims), facts: list<FactRef>(a.facts), spec: a.spec as VoiceSpec,
  channel: asText(a.channel), claimsLevel: asText(a.claims), brandName: asText(a.brandName), template: typeof a.template === 'string' ? a.template : null,
});

export const CREATE_CODE: Record<string, (args: Record<string, unknown>) => unknown> = {
  /** The code evaluators the definition names, on every candidate (evaluators.ts). */
  measure_drafts: (a) => {
    const evals = named(a.evaluators, 'code');
    // Length is a hard gate before evaluation (PR #99 review): a candidate over the maximum gets only its length result,
    // is never reviewed (review_inputs) or chosen (decide_draft), and is stored whole, as written.
    return list<{ body: string; claims: DraftClaim[] }>(a.candidates).map((c) => {
      const input = evalInput(c, a);
      return withinLength(input.body) ? runAll(evals, input) : runAll([EVALUATORS.length], input);
    });
  },
  /**
   * The model evaluators the definition names, from each candidate's independent review, merged with the code results;
   * then every candidate's verdict and the one shown.
   */
  decide_draft: (a) => {
    const evals = named(a.evaluators, 'model');
    const drafts = list<{ body: string; claims: DraftClaim[] }>(a.candidates);
    const gens = list<string | null>(a.generators);
    // Reviews and their models come in the order of the review items, which hold only candidates within the length.
    const items = list<{ idx: number }>(a.items);
    const byIdx = <T>(v: T[]) => new Map(items.map((it, k) => [it.idx, v[k]]));
    const reviews = byIdx(list<ReviewFindings | null>(a.reviews));
    const judges = byIdx(list<string | null>(a.judges));
    const results = list<Results>(a.measured).map((m, idx) => (withinLength(evalInput(drafts[idx], a).body)
      ? { ...m, ...runAll(evals, { ...evalInput(drafts[idx], a), review: reviews.get(idx) ?? null, generator: gens[idx] ?? null, judge: judges.get(idx) ?? null }) }
      : m));
    const verdicts = results.map((r, idx) => verdictOf(idx, r));
    const eligible = verdicts.filter((v) => withinLength(evalInput(drafts[v.idx], a).body));
    if (!eligible.length) throw new HttpError(422, 'every candidate came back longer than 4,000 characters, so nothing was saved; draft again');
    return { chosen: pick(eligible), verdicts, results, judges: verdicts.map((v) => judges.get(v.idx) ?? null) };
  },
};

type Decision = { chosen: number; verdicts: ReturnType<typeof verdictOf>[]; results: Results[]; judges: (string | null)[] };

export const CREATE_WRITES: Record<string, (ctx: StepContext, args: Record<string, unknown>) => Promise<unknown>> = {
  /**
   * Every candidate with its scores and verdict (post_candidates), and the post showing the chosen one, with the
   * decision in checks.draft. Ids derive from the run, and existing rows are left alone, so a retried step writes the
   * same rows once (architecture §6.2 "Collect from day one").
   */
  save_draft: async ({ env, run, state }, args) => {
    const input = args.input as { brief: string; channel: string };
    const context = args.context as { kitVersion: number; channel: string; spec: VoiceSpec };
    const retrieved = args.retrieve as { ranker: string; facts: { id: string; claim: string }[]; posts: { id: string; why: string | null }[]; excerpts: { id: string; source: string | null }[] };
    const drafts = list<{ body: string; claims: DraftClaim[] }>(args.candidates);
    const decision = args.decision as Decision;
    const gens = list<string | null>(args.generators);
    const judges = decision.judges;
    const chosen = decision.chosen;
    // Exactly the text that was evaluated (evalInput: trimmed), never cut: the stored post is what its verdicts describe.
    const body = asText(drafts[chosen]?.body).trim();
    const postId = await stableId(run.id, 'post');
    const v = decision.verdicts[chosen];
    const res = decision.results[chosen];
    const prompts = { draft: state.prompts['create.draft'] ?? null, review: state.prompts['create.review'] ?? null };
    // Evaluator results without their bulky detail, for the list of candidates.
    const brief = (r: Results) => Object.fromEntries(Object.entries(r).map(([id, x]) => [id, { pass: x.pass, status: x.status, version: x.version, score: x.score ?? null, reasons: x.reasons.slice(0, 8), model: x.model ?? null }]));
    const summary = drafts.map((d, idx) => ({
      idx, body: asText(d?.body).trim(), model: gens[idx] ?? null, judge: judges[idx] ?? null,
      voiceFit: decision.verdicts[idx].voiceFit, platformFit: decision.verdicts[idx].platformFit,
      passed: decision.verdicts[idx].passed, failedGates: decision.verdicts[idx].failedGates, reasons: decision.verdicts[idx].reasons.slice(0, 12),
      evaluators: brief(decision.results[idx]),
    }));
    const claims = (res.claims?.detail as ClaimsResult | undefined)?.claims ?? [];
    const cited = new Set(claims.flatMap((c) => c.factIds));
    const draft = {
      run: run.id, workflow: { id: run.kind, version: run.workflow_version }, prompts,
      kitVersion: context.kitVersion,
      spec: { version: context.spec.version, source: context.spec.source, template: context.spec.template, dials: context.spec.dials, bands: VOICE_BANDS_VERSION },
      ranker: retrieved.ranker,
      chosen, bodyHash: await contentHash(body),
      verdict: { passed: v.passed, failedGates: v.failedGates, reasons: v.reasons.slice(0, 12) },
      evaluators: brief(res),
      claims,
      // The findings behind the verdict, with the words they point at, for the checks list (create/checks.ts).
      findings: {
        slop: (res.slop?.detail as { hits?: string[] } | undefined)?.hits ?? [],
        claims: ((res.claims?.detail as ClaimsResult | undefined)?.findings ?? []).map((f) => ({ rule: f.rule, text: f.text.slice(0, 500), detail: f.detail })),
        unsupported: (((res.review_claims?.detail as { claims?: { text: string; supported: boolean }[] } | undefined)?.claims) ?? []).filter((c) => !c.supported).map((c) => c.text),
      },
      review: { generator: gens[chosen] ?? null, judge: judges[chosen] ?? null, claims: (res.review_claims?.detail as { claims?: unknown } | undefined)?.claims ?? [], tone: (res.tone?.detail as { tone?: unknown } | undefined)?.tone ?? [], issues: (res.tone?.detail as { issues?: unknown } | undefined)?.issues ?? [] },
      voice: res.voice?.detail as VoiceMeasure | undefined,
      platform: res.platform?.detail as PlatformLint | undefined,
      // "Why this?" (#86): the facts the post cites, and what retrieval put in front of the writer.
      why: {
        facts: retrieved.facts.filter((f) => cited.has(f.id)).map((f) => ({ id: f.id, claim: f.claim })),
        retrieved: { facts: retrieved.facts.map((f) => f.id), posts: retrieved.posts, excerpts: retrieved.excerpts },
        voice: context.spec.source === 'answer' ? 'your voice settings and sample' : `the ${context.spec.template} template`,
      },
      candidates: summary,
    };
    const notes = v.reasons.slice(0, 3).map((n) => n.slice(0, 200));
    // The verdict for exactly this text (the one approval reads), from the same results the decision used.
    const verdict = postVerdict(draft.bodyHash, res, { source: 'draft', generator: gens[chosen] ?? null, judge: judges[chosen] ?? null, prompt: prompts.review ? { key: 'create.review', version: prompts.review } : null });
    const checks = { slop: slopCheck(body), voiceFit: v.voiceFit, platform: v.platformFit, notes, source: 'ai', draft, verdict };
    const rows = await Promise.all(summary.map(async (c) => ({
      id: await stableId(run.id, 'candidate', String(c.idx)), run_id: run.id, brand_id: run.brand_id, post_id: postId, idx: c.idx, chosen: c.idx === chosen,
      body: c.body, claims: (decision.results[c.idx].claims?.detail as ClaimsResult | undefined)?.claims ?? [], model: c.model, judge_model: c.judge, prompt_versions: prompts,
      scores: { voice: c.voiceFit, platform: c.platformFit }, verdict: { passed: c.passed, failedGates: c.failedGates, reasons: c.reasons, evaluators: decision.results[c.idx] },
      retrieved: draft.why.retrieved, spec: draft.spec, kit_version: context.kitVersion,
    })));
    // The post and every candidate in one transaction (spec/db/013 save_draft): a failed candidate write leaves no post
    // without its audit rows (PR #99 review).
    await db.rpc(env, 'save_draft', { p_post: { id: postId, brand_id: run.brand_id, brief: asText(input.brief), channel: asText(input.channel) || null, body, checks, status: 'drafted', model: gens[chosen] ?? null, kit_version: context.kitVersion }, p_candidates: rows });
    return { postId, chosen, passed: v.passed };
  },
};


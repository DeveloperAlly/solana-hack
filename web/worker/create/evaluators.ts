// The evaluator registry (backlog T1a, G1, G2, G4, V3; architecture §6.1 "nothing grades itself", §13.3; issue #93).
//
// One entry per evaluator, each with the same output: {pass, score?, reasons, model?, detail?}. A workflow definition
// names the evaluators it runs (draft_post: the measure and decide steps' `evaluators` arguments), so adding one is a
// registry entry plus a new definition version naming it. 'code' evaluators run on the candidate alone; 'model'
// evaluators read the independent reviewer's findings (backlog G4: another model family, fresh context).
//
// Status: a 'gate' evaluator decides whether a draft is approvable as written; a 'tracked' one is recorded and shown but
// never decides. The claims judge gates: architecture §6.1 (Claims gate row) makes a judge of another model family the
// runtime claims gate, and a code gate alone always has another gap (PR #99 review). Its agreement with the owner's
// labels (§13.3, Cohen's kappa >= 0.6) is not yet measured (no labels, issue #65), so "verified" is not claimed for it.
// Tone and content findings are tracked (content is gated at approval by policyCheck). The voice-fit bands are
// uncalibrated (voice.ts), so voice fit is tracked. Without a review there is no verdict (fail closed).
import { differentFamily } from '../models';
import { MAX_POST_CHARS } from '../limits';
import { policyVerdict, slopCheck } from '../posts';
import { checkClaims, evidenceSentences, key as sentenceKey, type DraftClaim, type FactRef } from './claims';
import { lintPlatform } from './platform';
import { measureVoice, type VoiceSpec } from './voice';

/** One maximum for a post's length (posts.ts MAX_POST_CHARS). Platform limits are platform.ts hard rules. */
export const MAX_BODY = MAX_POST_CHARS;
/** True when a candidate is within the maximum: anything longer is refused before any evaluator runs (ops.ts). */
export const withinLength = (body: string) => !!body.trim() && body.trim().length <= MAX_BODY;

export interface EvaluatorOutput { pass: boolean; score?: number | null; reasons: string[]; model?: string | null; detail?: unknown }

/** The reviewer's findings, as the review_findings schema returns them (schemas.ts). */
export interface ReviewFindings {
  claims: { text: string; fact_ids: string[]; supported: boolean }[];
  issues: { kind: string; quote: string; note: string }[];
  tone: { dimension: string; observed: string }[];
  sexual: boolean; minors: boolean; explicitLanguage: boolean;
}

export interface EvalInput {
  body: string;
  claims: DraftClaim[];
  facts: FactRef[];
  spec: VoiceSpec;
  channel: string;
  claimsLevel: string;
  brandName: string;
  template: string | null;
  /** Model evaluators only: the review step's output, and the writer and reviewer models read from the trace. */
  review?: ReviewFindings | null;
  generator?: string | null;
  judge?: string | null;
}

export interface Evaluator {
  id: string;
  version: number;
  kind: 'code' | 'model';
  status: 'gate' | 'tracked';
  /** The EvalInput fields it reads. */
  inputs: (keyof EvalInput)[];
  /** Where its rule comes from. */
  source: string;
  run(i: EvalInput): EvaluatorOutput;
}

const isFindings = (r: unknown): r is ReviewFindings => !!r && typeof r === 'object' && Array.isArray((r as ReviewFindings).claims);
/** The writer of a text a person typed (an edit): no model wrote it, so no model family is excluded from reviewing it. */
export const PERSON = 'person';
/** A review counts only if it exists and its model shares no family with the writer's, both from the trace. */
function validReview(i: EvalInput): string | null {
  if (!isFindings(i.review)) return 'the independent review did not run';
  if (i.generator !== PERSON && !differentFamily(i.generator, i.judge)) return 'the reviewer was not of another model family than the writer';
  if (i.generator === PERSON && !i.judge) return 'the reviewer model is unknown';
  return null;
}
/** Claims the reviewer could not resolve to the facts the writer was given count as unsupported. */
function reviewedClaims(i: EvalInput) {
  const ids = new Set(i.facts.map((f) => f.id));
  return (i.review?.claims ?? []).map((c) => ({ text: c.text.slice(0, 500), factIds: [...new Set(c.fact_ids)], supported: c.supported && c.fact_ids.length > 0 && c.fact_ids.every((id) => ids.has(id)) }));
}

export const EVALUATORS: Record<string, Evaluator> = {
  slop: {
    id: 'slop', version: 1, kind: 'code', status: 'gate', inputs: ['body'], source: 'backlog G1; slop.ts (one list)',
    run: ({ body }) => { const r = slopCheck(body); return { pass: r.passed, reasons: r.hits.map((h) => `on the no-AI-slop list: ${h}`), detail: r }; },
  },
  claims: {
    id: 'claims', version: 1, kind: 'code', status: 'gate', inputs: ['body', 'claims', 'facts', 'claimsLevel', 'brandName'], source: 'backlog G2, C1; architecture §6.1 Claims gate row',
    run: (i) => { const r = checkClaims(i.body, i.claims, i.facts, i.claimsLevel, i.brandName); return { pass: r.passed, reasons: r.findings.map((f) => `claim "${f.text.slice(0, 120)}": ${f.detail}`), detail: r }; },
  },
  platform: {
    id: 'platform', version: 1, kind: 'code', status: 'gate', inputs: ['body', 'channel'], source: 'research 03 Draft-scoring checklist; architecture §6.1 Platform fit row',
    // Gates only on limits the platform itself enforces (hard rules); the other checklist rules lower the score.
    run: ({ body, channel }) => { const r = lintPlatform(body, channel); return { pass: r.hardFailures.length === 0, score: r.fit, reasons: r.rules.filter((x) => !x.passed).map((x) => `${x.hard ? '' : 'suggestion: '}${x.label}`), detail: r }; },
  },
  length: {
    id: 'length', version: 1, kind: 'code', status: 'gate', inputs: ['body'], source: 'posts.ts: a post is at most 4,000 characters',
    run: ({ body }) => ({ pass: !!body.trim() && body.trim().length <= MAX_BODY, reasons: body.trim() ? (body.trim().length > MAX_BODY ? [`longer than ${MAX_BODY} characters`] : []) : ['empty'] }),
  },
  voice: {
    id: 'voice', version: 1, kind: 'code', status: 'tracked', inputs: ['body', 'spec'], source: 'research 06 Measuring each dimension automatically; bands uncalibrated (voice.ts)',
    run: ({ body, spec }) => { const r = measureVoice(body, spec); return { pass: r.findings.length === 0, score: r.fit, reasons: r.findings, detail: r }; },
  },
  review: {
    id: 'review', version: 1, kind: 'model', status: 'gate', inputs: ['review', 'generator', 'judge'], source: 'backlog G4; architecture §13.3 (a different model family, fresh context)',
    run: (i) => { const missing = validReview(i); return { pass: !missing, reasons: missing ? [`no independent review: ${missing}`] : [], model: i.judge ?? null }; },
  },
  review_claims: {
    id: 'review_claims', version: 2, kind: 'model', status: 'gate', inputs: ['review', 'body', 'facts', 'claimsLevel', 'generator', 'judge'], source: 'backlog G2, G4; architecture §6.1 Claims gate row (at runtime the gate is a judge of another family, given only the cited facts); PR #99 review',
    // Gates (PR #99 review: a lexical gate always has another gap). Passes only when the reviewer ruled every sentence
    // that needs evidence supported by facts it was given, and called no claim unsupported. No review, or a sentence
    // left without a verdict, is not a pass (fail closed). The code gate (claims) still refuses the obvious cases first.
    run: (i) => {
      if (validReview(i)) return { pass: false, reasons: ['not reviewed'], model: i.judge ?? null };
      const claims = reviewedClaims(i);
      const ruled = new Map(claims.map((c) => [sentenceKey(c.text), c]));
      const silent = evidenceSentences(i.body, i.claimsLevel).filter((s) => !ruled.has(sentenceKey(s)));
      const bad = claims.filter((c) => !c.supported);
      return {
        pass: bad.length === 0 && silent.length === 0,
        reasons: [...bad.map((c) => `reviewer: no evidence for "${c.text.slice(0, 120)}"`), ...silent.map((s) => `reviewer gave no verdict on "${s.slice(0, 120)}"`)],
        model: i.judge ?? null, detail: { claims, silent },
      };
    },
  },
  policy: {
    id: 'policy', version: 1, kind: 'model', status: 'tracked', inputs: ['review', 'claimsLevel', 'template', 'generator', 'judge'], source: 'backlog V3; posts.ts policyVerdict and CONTENT_QUESTIONS; approval runs policyCheck, which still gates',
    run: (i) => {
      if (validReview(i)) return { pass: false, reasons: ['not reviewed'], model: i.judge ?? null };
      const unsupported = reviewedClaims(i).filter((c) => !c.supported).map((c) => c.text);
      const v = policyVerdict(i.claimsLevel, i.template, { unsupported, sexual: i.review!.sexual, minors: i.review!.minors, explicitLanguage: i.review!.explicitLanguage });
      return { pass: v.blocked.length === 0, reasons: v.blocked.map((b) => `content policy: ${b}`), model: i.judge ?? null, detail: { blocked: v.blocked } };
    },
  },
  tone: {
    id: 'tone', version: 1, kind: 'model', status: 'tracked', inputs: ['review', 'spec', 'generator', 'judge'], source: 'research 06: warmth, energy and humour by an LLM rater; tracked until kappa >= 0.6',
    run: (i) => {
      if (validReview(i)) return { pass: false, score: null, reasons: ['not reviewed'], model: i.judge ?? null };
      const t = i.review!.tone;
      const off = t.filter((x) => x.observed !== 'on');
      return { pass: off.length === 0, score: t.length ? Math.round(((t.length - off.length) / t.length) * 100) : null, reasons: off.map((x) => `${x.dimension} reads ${x.observed} its target`), model: i.judge ?? null, detail: { tone: t, issues: i.review!.issues.slice(0, 20) } };
    },
  },
};

/** The evaluators a definition names ("slop,claims,..."), each of the expected kind; an unknown id is a definition error. */
export function named(list: unknown, kind: Evaluator['kind']): Evaluator[] {
  const ids = String(list ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return ids.map((id) => {
    const e = EVALUATORS[id];
    if (!e || e.kind !== kind) throw new Error(`evaluator ${id} is not a registered ${kind} evaluator`);
    return e;
  });
}

export type Results = Record<string, EvaluatorOutput & { status: Evaluator['status']; version: number }>;
export const runAll = (list: Evaluator[], input: EvalInput): Results =>
  Object.fromEntries(list.map((e) => [e.id, { ...e.run(input), status: e.status, version: e.version }]));

export interface CandidateVerdict { idx: number; passed: boolean; reasons: string[]; failedGates: string[]; voiceFit: number | null; platformFit: number | null; rank: number }

/**
 * A candidate's verdict, computed from its evaluators' results: approvable only if every gate evaluator passed. Reasons
 * list gate failures first, then tracked findings marked as such. Rank: approvable first, then fewer failed gates, then
 * measured fit (voice, platform, tone), so the candidate shown is the best that passes.
 */
export function verdictOf(idx: number, results: Results): CandidateVerdict {
  const entries = Object.entries(results);
  const failedGates = entries.filter(([, r]) => r.status === 'gate' && !r.pass).map(([id]) => id);
  const reasons = [
    ...entries.filter(([, r]) => r.status === 'gate' && !r.pass).flatMap(([, r]) => r.reasons),
    ...entries.filter(([, r]) => r.status === 'tracked' && !r.pass).flatMap(([, r]) => r.reasons.map((x) => `${x} (tracked)`)),
  ];
  const score = (id: string) => (typeof results[id]?.score === 'number' ? (results[id].score as number) : null);
  const voiceFit = score('voice');
  const platformFit = score('platform');
  const passed = failedGates.length === 0 && entries.some(([, r]) => r.status === 'gate');
  const rank = (passed ? 1000 : 0) - failedGates.length * 100 + Math.round(((voiceFit ?? 0) + (platformFit ?? 100) + (score('tone') ?? 0)) / 3);
  return { idx, passed, reasons, failedGates, voiceFit, platformFit, rank };
}

/** The candidate shown: the highest rank, ties to the lowest index (deterministic). */
export function pick(verdicts: CandidateVerdict[]): number {
  return [...verdicts].sort((a, b) => b.rank - a.rank || a.idx - b.idx)[0].idx;
}

/** Evaluator results without their bulky detail: what a post's record keeps. */
export const briefResults = (r: Results) => Object.fromEntries(Object.entries(r).map(([id, x]) => [id, { pass: x.pass, status: x.status, version: x.version, score: x.score ?? null, reasons: x.reasons.slice(0, 8), model: x.model ?? null }]));

/**
 * The verdict a post carries for exactly one text (PR #99 review: no body is approvable without a passing verdict for
 * its own hash). Written when a draft is saved, after an AI polish and after a person's edit; approval reads it.
 * Findings keep the words each gate points at, so the checks list (checks.ts) is built from the same record.
 */
export interface PostVerdict {
  bodyHash: string;
  passed: boolean;
  failedGates: string[];
  reasons: string[];
  evaluators: ReturnType<typeof briefResults>;
  findings: { slop: string[]; claims: { rule: string; text: string; detail: string }[]; unsupported: string[]; silent: string[] };
  source: 'draft' | 'polish' | 'edit' | 'approval';
  generator: string | null;
  judge: string | null;
  prompt: { key: string; version: number } | null;
  at: string;
}

export function postVerdict(bodyHash: string, results: Results, meta: Pick<PostVerdict, 'source' | 'generator' | 'judge' | 'prompt'>): PostVerdict {
  const v = verdictOf(0, results);
  const claimsDetail = results.claims?.detail as { findings?: { rule: string; text: string; detail: string }[] } | undefined;
  const reviewDetail = results.review_claims?.detail as { claims?: { text: string; supported: boolean }[]; silent?: string[] } | undefined;
  return {
    bodyHash, passed: v.passed, failedGates: v.failedGates, reasons: v.reasons.slice(0, 12), evaluators: briefResults(results),
    findings: {
      slop: (results.slop?.detail as { hits?: string[] } | undefined)?.hits ?? [],
      claims: (claimsDetail?.findings ?? []).map((f) => ({ rule: f.rule, text: f.text.slice(0, 500), detail: f.detail })),
      unsupported: (reviewDetail?.claims ?? []).filter((c) => !c.supported).map((c) => c.text),
      silent: reviewDetail?.silent ?? [],
    },
    ...meta, at: new Date().toISOString(),
  };
}

/** A verdict that could not be computed: never approvable (fail closed), with the reason shown. */
export const failedVerdict = (bodyHash: string, reason: string, meta: Pick<PostVerdict, 'source' | 'generator'>): PostVerdict => ({
  bodyHash, passed: false, failedGates: ['review'], reasons: [`independent checks could not run: ${reason}`], evaluators: {}, findings: { slop: [], claims: [], unsupported: [], silent: [] },
  judge: null, prompt: null, ...meta, at: new Date().toISOString(),
});

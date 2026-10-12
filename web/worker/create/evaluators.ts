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
import { policyVerdict, slopCheck } from '../posts';
import { checkClaims, evidenceSentences, key as sentenceKey, type DraftClaim, type FactRef } from './claims';
import { lintPlatform } from './platform';
import { measureVoice, type VoiceSpec } from './voice';

export const MAX_BODY = 4000;

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
/** A review counts only if it exists and its model shares no family with the writer's, both from the trace. */
function validReview(i: EvalInput): string | null {
  if (!isFindings(i.review)) return 'the independent review did not run';
  if (!differentFamily(i.generator, i.judge)) return 'the reviewer was not of another model family than the writer';
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

// The Post through the whole loop: the UI contract behind PostLifecycle and "Why this?" (ADR-012 decision 3, PR #86;
// contract table in issue #90, row "PostLifecycle": posts plus the registry). Stages map to the Worker's post and
// registration rows (web/worker/posts.ts) and the ADR-013 modules: drafted (X18 brand memory and the model gateway),
// approved (human gate), published (P7 adapter registry), verified (registry), amplified (ambassador posts), results
// (analytics ingest, N5 learn loop).
import { isStale, type Approval, type Approver } from '../lib/approval';

/** The one provenance row a draft has (ADR-012 runtime section): exactly what it was built from. */
export interface DraftProvenance {
  kitVersion: number;
  brainVersion: string;
  /** Brain fact ids the draft used. */
  evidenceIds: string[];
  /** Brain rule ids applied to it. */
  ruleIds: string[];
  /** Brain voice id. */
  voice: string;
  prompt: { id: string; version: string };
  model: string;
}

export interface PlatformRun {
  platform: string;
  /** "Original", "Adapted · 3 lines longer". */
  version: string;
  status: 'published' | 'planned' | 'failed';
  /** "Published Tue 09:30", or why it failed. */
  detail: string;
  /** Registered on Solana (published runs). */
  registered: boolean;
}

export interface AmbassadorRun {
  id: string;
  /** Always bracketed in fixtures: "[Creator name]". */
  who: string;
  platform: string;
  note?: string;
  status: 'paid' | 'awaiting-approval' | 'checking';
  /** "Verified · 10 USDC paid". */
  label: string;
}

export interface PostChecks {
  /** No-AI-slop pass. */
  slop: 'passed' | 'failed';
  claims: { backed: number; total: number };
  disclosure: 'present' | 'n/a' | 'missing';
}

export interface PostLifecycle {
  /** The voice as people read it, e.g. "Founder voice". */
  drafted: { voiceLabel: string };
  approval?: Approval<Approver>;
  published: PlatformRun[];
  /** Registration of the original on Solana: a hash and ids, never the text. */
  verified?: { at: string };
  amplified: AmbassadorRun[];
  results: { status: 'not-started' | 'collecting' | 'ready'; detail: string };
}

export interface Post {
  id: string;
  /** Short label for pickers: "X · Launch week thread". */
  name: string;
  platform: string;
  campaign: string;
  text: string;
  /** "231 of 280 characters". */
  length: string;
  provenance: DraftProvenance;
  checks: PostChecks;
  lifecycle: PostLifecycle;
}

/**
 * What a post approval covers: the text, every input it was drafted from, and the Brain version it was approved
 * under. An edit, or a Brain change (a rule approved or retired), makes an unpublished approval stale.
 */
export const postInputs = (post: Pick<Post, 'text' | 'provenance'>, brainVersion: string): unknown => [post.text, post.provenance, brainVersion];

export type LifecycleStepId = 'drafted' | 'approved' | 'published' | 'verified' | 'amplified' | 'results';
export type LifecycleStepState = 'done' | 'current' | 'failed' | 'blocked' | 'todo';

export interface LifecycleStep {
  id: LifecycleStepId;
  label: string;
  state: LifecycleStepState;
  detail: string;
}

/**
 * Whether the post's approval still holds. A post already published keeps its approval (what went out is fixed);
 * one approved but not yet published goes stale when its text or inputs change.
 */
export type ApprovalState = 'none' | 'valid' | 'stale';

export function approvalState(post: Post, brainVersion: string): ApprovalState {
  const a = post.lifecycle.approval;
  if (!a) return 'none';
  if (post.lifecycle.published.some((r) => r.status === 'published')) return 'valid';
  return isStale(a, postInputs(post, brainVersion)) ? 'stale' : 'valid';
}

const approvedDetail: Record<ApprovalState, (a?: Approval<Approver>) => string> = {
  none: () => 'Waiting for you',
  stale: () => 'Stale: the draft or the Brain changed after approval',
  valid: (a) => `by ${a?.decision.by} · ${a?.decision.at}`,
};

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const label: Record<LifecycleStepId, string> = { drafted: 'Drafted', approved: 'Approved', published: 'Published', verified: 'Verified', amplified: 'Amplified', results: 'Results' };

/** The six lifecycle steps of a post, each done, current, failed, blocked (stale) or to do, under the current Brain. */
export function lifecycleSteps(post: Post, brainVersion: string): LifecycleStep[] {
  const lc = post.lifecycle;
  const approval = approvalState(post, brainVersion);
  const runs = lc.published;
  const live = runs.filter((r) => r.status === 'published');
  const failed = runs.filter((r) => r.status === 'failed');
  const verifiedAmb = lc.amplified.filter((a) => a.status !== 'checking').length;
  const raw: Omit<LifecycleStep, 'state'>[] = [
    { id: 'drafted', label: label.drafted, detail: `Kit v${post.provenance.kitVersion} · ${lc.drafted.voiceLabel} · ${count(post.provenance.evidenceIds.length, 'fact')}, ${count(post.provenance.ruleIds.length, 'rule')}` },
    { id: 'approved', label: label.approved, detail: approvedDetail[approval](lc.approval) },
    { id: 'published', label: label.published, detail: runs.length ? `${live.length} of ${runs.length} platforms${failed.length ? ` · ${failed.map((r) => r.platform).join(', ')} failed` : ''}` : 'Not planned yet' },
    { id: 'verified', label: label.verified, detail: lc.verified ? `Registered on Solana · ${lc.verified.at}` : 'Not registered yet' },
    { id: 'amplified', label: label.amplified, detail: lc.amplified.length ? `${lc.amplified.length} ambassadors · ${verifiedAmb} verified` : 'No ambassadors yet' },
    { id: 'results', label: label.results, detail: lc.results.detail },
  ];
  const done: Record<LifecycleStepId, boolean> = {
    drafted: true,
    approved: approval === 'valid',
    published: live.length > 0 && failed.length === 0 && live.length === runs.filter((r) => r.status !== 'planned').length,
    verified: Boolean(lc.verified),
    amplified: lc.amplified.length > 0 && lc.amplified.every((a) => a.status === 'paid'),
    results: lc.results.status === 'ready',
  };
  const exception: Partial<Record<LifecycleStepId, LifecycleStepState>> = {
    ...(approval === 'stale' ? { approved: 'blocked' as const } : {}),
    ...(failed.length ? { published: 'failed' as const } : {}),
  };
  // The first step that is neither done nor an exception is current; later ones are to do.
  let currentFound = false;
  return raw.map((s) => {
    const ex = exception[s.id];
    if (ex) {
      currentFound = true;
      return { ...s, state: ex };
    }
    if (done[s.id]) return { ...s, state: 'done' };
    if (currentFound) return { ...s, state: 'todo' };
    currentFound = true;
    return { ...s, state: 'current' };
  });
}

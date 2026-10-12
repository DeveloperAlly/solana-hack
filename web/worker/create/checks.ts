// GET /api/drafts/:id/checks (issue #93): a draft's checks in the shape the Ambassador Generate screen reads (#78,
// web/src/screens/ambassador/types.ts DraftCheck on branch ui/53-ambassador: "INTEGRATION: GET /api/drafts/:id/checks
// returns these"). Built only from the verdict stored for the post's current text (checks.verdict, the one approval
// reads), and a finding blocks exactly when its evaluator is a gate that failed: the same source as verdict.passed
// (PR #99 review).
import { platformLimit } from '../posts';
import type { PostVerdict } from './evaluators';

/** #78's DraftRule: how a flag is detected and fixed in the browser. */
export type DraftRule =
  | { kind: 'phrase'; phrase: string; blocks: boolean; fix: { kind: 'remove-line' } | { kind: 'replace'; with: string } }
  | { kind: 'missing'; anyOf: string[]; append: string; blocks: boolean };
/** #78's DraftCheck (AmbCheck plus its rule), with the evaluator it came from. */
export interface DraftCheck { id: string; title: string; phrase?: string; label: string; blocking?: boolean; fixLabel?: string; shortFixLabel?: string; rule: DraftRule }

export interface DraftChecks {
  checks: DraftCheck[];
  /** Measured voice fit, 0-100, from the verdict for the current text (create/voice.ts; never a model's self-grade), or
   * null when there is none. Tracked, not a gate: its bands are uncalibrated. */
  score: number | null;
  /** No score threshold gates a draft yet (architecture §13.3: a measure gates only once calibrated), so null. */
  threshold: null;
  /** The channel's hard character limit, where the platform has one (posts.ts platformLimit; LinkedIn 3,000). */
  charLimit: number | null;
  /** The verdict for the current text passed every gate; false when there is none for it. */
  passed: boolean;
}

const SLOP_FIX: Record<string, { kind: 'replace'; with: string }> = { '—': { kind: 'replace', with: ', ' }, 'exclamation mark': { kind: 'replace', with: '.' } };
const sentence = (s: string) => `${s[0]?.toUpperCase() ?? ''}${s.slice(1)}${/[.!?]$/.test(s) ? '' : '.'}`;

/** Whether an evaluator's findings block: it is a gate, and it failed (evaluators.ts verdictOf uses the same test). */
export const blocks = (v: Pick<PostVerdict, 'evaluators'>, id: string) => {
  const e = v.evaluators[id] as { status?: string; pass?: boolean } | undefined;
  return !!e && e.status === 'gate' && e.pass === false;
};

/** The checks for one post, from the verdict for its current text (the caller checks the hash). */
export function draftChecks(post: { channel: string | null; checks: { verdict?: PostVerdict } }, currentHash: string | null): DraftChecks {
  const limit = /^\s*linkedin\s*$/i.test(post.channel ?? '') ? 3000 : platformLimit(post.channel);
  const v = post.checks.verdict;
  if (!v || (currentHash !== null && v.bodyHash !== currentHash)) return { checks: [], score: null, threshold: null, charLimit: limit, passed: false };
  const out: DraftCheck[] = [];
  const phrase = (id: string, title: string, text: string, label: string, from: string, fix: { kind: 'remove-line' } | { kind: 'replace'; with: string } = { kind: 'remove-line' }) => {
    const b = blocks(v, from);
    out.push({ id, title, phrase: text, label, blocking: b, fixLabel: fix.kind === 'replace' ? 'Replace' : 'Remove line', ...(fix.kind === 'replace' ? {} : { shortFixLabel: 'Remove' }), rule: { kind: 'phrase', phrase: text, blocks: b, fix } });
  };
  v.findings.slop.forEach((hit, i) => phrase(`slop-${i}`, 'Avoided term', hit === 'exclamation mark' ? '!' : hit, 'On the no-AI-slop list.', 'slop', SLOP_FIX[hit]));
  v.findings.claims.forEach((c, i) => phrase(`claim-${i}`, 'Unsupported claim', c.text, sentence(c.detail), 'claims'));
  v.findings.unsupported.forEach((t, i) => phrase(`review-${i}`, 'Unsupported claim', t, 'The independent reviewer found no fact that states this.', 'review_claims'));
  v.findings.silent.forEach((t, i) => phrase(`unreviewed-${i}`, 'Claim not reviewed', t, 'The independent reviewer gave no verdict on this sentence.', 'review_claims'));
  const voice = v.evaluators.voice as { score?: number | null } | undefined;
  return { checks: out, score: typeof voice?.score === 'number' ? voice.score : null, threshold: null, charLimit: limit, passed: v.passed };
}

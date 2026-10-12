// GET /api/drafts/:id/checks (issue #93): a draft's checks in the shape the Ambassador Generate screen reads (#78,
// web/src/screens/ambassador/types.ts DraftCheck on branch ui/53-ambassador: "INTEGRATION: GET /api/drafts/:id/checks
// returns these"). Built only from the verdict the drafting workflow stored on the post (checks.draft), the same record
// the posts API returns, so there is one source of verdicts.
import { platformLimit, type DraftRecord } from '../posts';

/** #78's DraftRule: how a flag is detected and fixed in the browser. */
export type DraftRule =
  | { kind: 'phrase'; phrase: string; blocks: boolean; fix: { kind: 'remove-line' } | { kind: 'replace'; with: string } }
  | { kind: 'missing'; anyOf: string[]; append: string; blocks: boolean };
/** #78's DraftCheck (AmbCheck plus its rule). */
export interface DraftCheck { id: string; title: string; phrase?: string; label: string; blocking?: boolean; fixLabel?: string; shortFixLabel?: string; rule: DraftRule }

export interface DraftChecks {
  checks: DraftCheck[];
  /** Measured voice fit, 0-100 (create/voice.ts), or null when not measured. Tracked, not a gate: its bands are uncalibrated. */
  score: number | null;
  /** No score threshold gates a draft yet (architecture §13.3: a measure gates only once calibrated), so null. */
  threshold: null;
  /** The channel's hard character limit, where the platform has one (posts.ts platformLimit; LinkedIn 3,000). */
  charLimit: number | null;
  /** Every gate evaluator passed (create/evaluators.ts). */
  passed: boolean;
}

type Findings = { slop?: string[]; claims?: { rule: string; text: string; detail: string }[]; unsupported?: string[] };

const SLOP_FIX: Record<string, { kind: 'replace'; with: string }> = { '—': { kind: 'replace', with: ', ' }, 'exclamation mark': { kind: 'replace', with: '.' } };

/** The checks for one post, from its stored draft record. A post not drafted by the workflow has none. */
export function draftChecks(post: { channel: string | null; checks: { draft?: DraftRecord & { findings?: Findings }; voiceFit?: number | null } }): DraftChecks {
  const d = post.checks.draft;
  const limit = /^\s*linkedin\s*$/i.test(post.channel ?? '') ? 3000 : platformLimit(post.channel);
  if (!d) return { checks: [], score: post.checks.voiceFit ?? null, threshold: null, charLimit: limit, passed: false };
  const f = d.findings ?? {};
  const checks: DraftCheck[] = [];
  for (const [i, hit] of (f.slop ?? []).entries()) {
    const phrase = hit === 'exclamation mark' ? '!' : hit;
    const fix = SLOP_FIX[hit] ?? { kind: 'remove-line' as const };
    checks.push({ id: `slop-${i}`, title: 'Avoided term', phrase, label: 'On the no-AI-slop list.', blocking: true, fixLabel: fix.kind === 'replace' ? 'Replace' : 'Remove line', ...(fix.kind === 'replace' ? {} : { shortFixLabel: 'Remove' }), rule: { kind: 'phrase', phrase, blocks: true, fix } });
  }
  for (const [i, c] of (f.claims ?? []).entries()) {
    checks.push({ id: `claim-${i}`, title: 'Unsupported claim', phrase: c.text, label: `${c.detail[0].toUpperCase()}${c.detail.slice(1)}.`, blocking: true, fixLabel: 'Remove line', shortFixLabel: 'Remove', rule: { kind: 'phrase', phrase: c.text, blocks: true, fix: { kind: 'remove-line' } } });
  }
  // The reviewer's findings are tracked, not gates (architecture §13.3): shown, never blocking.
  for (const [i, text] of (f.unsupported ?? []).entries()) {
    checks.push({ id: `review-${i}`, title: 'Claim to check', phrase: text, label: 'The independent reviewer found no fact that states this.', blocking: false, fixLabel: 'Remove line', shortFixLabel: 'Remove', rule: { kind: 'phrase', phrase: text, blocks: false, fix: { kind: 'remove-line' } } });
  }
  return { checks, score: post.checks.voiceFit ?? null, threshold: null, charLimit: limit, passed: !!d.verdict?.passed };
}

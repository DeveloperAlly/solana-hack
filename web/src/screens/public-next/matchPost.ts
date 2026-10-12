// Local stand-in for POST /api/verify, run over fixture posts so the gallery switches results with no network call.
// Exact match uses the Worker's normalisation (web/worker/posts.ts `normalise`). "Edited" needs a similarity method and
// threshold that the backend map leaves open (G-MATCH; canvas note n-v3 "Threshold ... is TBD"); this uses a word diff
// against each approved post, as G-MATCH proposes for the hackathon.
import { normalise } from '../../lib/normalise';
import type { ApprovedPost, DiffPart, VerifyOutcome } from './types';

/** Placeholder threshold between "edited" and "no match": TBD (canvas n-v3, backend map G-MATCH). */
export const EDITED_MIN_SIMILARITY = 0.4;


const tokenise = (s: string) => s.match(/\w+|[^\w\s]+|\s+/g) ?? [];
const isFiller = (s: string) => /^[^\w]*$/.test(s);

/** Longest common subsequence over tokens, walked back into per-token parts. */
function lcsParts(a: string[], b: string[]): DiffPart[] {
  const t: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const out: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { out.push({ kind: 'same', text: a[i] }); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) out.push({ kind: 'removed', text: a[i++] });
    else out.push({ kind: 'added', text: b[j++] });
  }
  while (i < a.length) out.push({ kind: 'removed', text: a[i++] });
  while (j < b.length) out.push({ kind: 'added', text: b[j++] });
  return out;
}

/** Spaces and punctuation that the LCS kept between two changes become part of the change, so diffs read as phrases. */
function absorbFiller(tokens: DiffPart[]): DiffPart[] {
  // Coalesce neighbouring unchanged tokens first, so " " + "." between two changes is judged as one run.
  const parts = tokens.reduce<DiffPart[]>((acc, p) => {
    const last = acc[acc.length - 1];
    if (p.kind === 'same' && last?.kind === 'same') last.text += p.text;
    else acc.push({ ...p });
    return acc;
  }, []);
  const isChange = (p: DiffPart | undefined) => p !== undefined && p.kind !== 'same';
  const out: DiffPart[] = [];
  parts.forEach((p, k) => {
    if (p.kind === 'same' && isFiller(p.text) && isChange(parts[k - 1]) && isChange(parts[k + 1])) {
      out.push({ kind: 'removed', text: p.text }, { kind: 'added', text: p.text });
    } else out.push(p);
  });
  return out;
}

/** Merges runs: within each changed stretch, removed text comes before added text. */
function mergeRuns(parts: DiffPart[]): DiffPart[] {
  const out: DiffPart[] = [];
  let removed = '';
  let added = '';
  const flush = () => {
    if (removed) out.push({ kind: 'removed', text: removed });
    if (added) out.push({ kind: 'added', text: added });
    removed = '';
    added = '';
  };
  for (const p of parts) {
    if (p.kind === 'removed') removed += p.text;
    else if (p.kind === 'added') added += p.text;
    else {
      flush();
      const last = out[out.length - 1];
      if (last?.kind === 'same') last.text += p.text;
      else out.push({ ...p });
    }
  }
  flush();
  return out;
}

/** Word-level diff from `before` to `after`, in the shape DiffView (C23) draws. */
export function wordDiff(before: string, after: string): DiffPart[] {
  return mergeRuns(absorbFiller(lcsParts(tokenise(before), tokenise(after))));
}

/** Dice similarity on characters kept: 2 × same / (before + after). */
export function similarity(diff: DiffPart[]): number {
  const len = (k: DiffPart['kind'][]) => diff.filter((p) => k.includes(p.kind)).reduce((n, p) => n + p.text.length, 0);
  const total = len(['same', 'removed']) + len(['same', 'added']);
  return total === 0 ? 0 : (2 * len(['same'])) / total;
}

/** The first banned phrase of the brand that the added text contains (canvas Verify-3 chip). */
function brokenClaim(post: ApprovedPost, diff: DiffPart[]): string | null {
  const added = diff.filter((p) => p.kind === 'added').map((p) => p.text.toLowerCase()).join(' ');
  return post.bannedPhrases.find((b) => added.includes(b.toLowerCase())) ?? null;
}

/** Exact match first (retracted posts report as retracted), then the closest edited copy, else no match. */
export function matchPost(query: string, posts: ApprovedPost[]): VerifyOutcome {
  const text = normalise(query);
  const exact = posts.find((p) => normalise(p.text) === text);
  if (exact) return exact.retraction ? { kind: 'retracted', post: exact } : { kind: 'match', post: exact };
  const scored = posts
    .filter((p) => !p.retraction)
    .map((post) => {
      const diff = wordDiff(normalise(post.text), text);
      return { post, diff, score: similarity(diff) };
    })
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score < EDITED_MIN_SIMILARITY) return { kind: 'nomatch' };
  return { kind: 'edited', post: best.post, similarity: best.score, diff: best.diff, brokenClaim: brokenClaim(best.post, best.diff) };
}

// Quote alignment for fact extraction (issue #64; architecture §6.1 "Fact extraction with quote check"). A model's
// quote is never stored as the model wrote it. It is located in the source text, and what is stored is the exact
// source text at that place with its offsets: the source-alignment design in Google's LangExtract
// (https://github.com/google/langextract, langextract/resolver.py).
// - Exact: the normalised quote appears in the normalised source (quote.ts, the one normaliser, #40).
// - Fuzzy: only to find the passage when there is no exact match. Tokens are aligned with LangExtract's tightest
//   longest-common-subsequence span (resolver.py _best_lcs_spans), scored with the ratio difflib's SequenceMatcher
//   uses, 2M / T (https://docs.python.org/3/library/difflib.html#difflib.SequenceMatcher.ratio), and accepted only at
//   >= 0.9 (§6.1). A one-word change in a short quote, a changed number or a sentence merged from two places scores
//   below it; a fuzzy hit still only marks where to look, and the fact then faces the support check on the real text.
import { findQuote, mappedIndex, MAX_QUOTE, quoteOnPage, sourceSpan, normaliseQuote, type Mapped } from '../quote';

/** Fuzzy alignment threshold (architecture §6.1: "a fuzzy match (>= 0.9) used only to find the real passage"). */
export const FUZZY_MIN = 0.9;

/**
 * CPU budget for fuzzy search, in dynamic-programming cells (region tokens x quote tokens x (quote tokens + 1) / 2).
 * Measured in Node 22 on the build machine at about 4 ns a cell: a 70-token quote over a 3,200-token chunk is about
 * 8 million cells (about 60 ms); a page of one repeated word can cost 230 million for one quote (about 1 s). The caps
 * keep one quote near 120 ms and one align step near 1.2 s, well inside the 30 s of CPU a Workflows step gets on Workers
 * Paid (https://developers.cloudflare.com/workflows/reference/limits/). Fuzzy search only locates a passage, so a
 * search skipped for budget can only drop a fact, never admit one; skipped searches are counted and reported.
 */
export const FUZZY_CELLS_PER_QUOTE = 30_000_000;
export const FUZZY_CELLS_PER_STEP = 300_000_000;
/** Remaining fuzzy-search cells for one step, and how many searches were skipped for lack of them. */
export interface FuzzyBudget { cells: number; skipped: number }
export const fuzzyBudget = (): FuzzyBudget => ({ cells: FUZZY_CELLS_PER_STEP, skipped: 0 });

export type MatchType = 'exact' | 'fuzzy';
export interface Alignment {
  /** Offsets into the stored source text; text === source.slice(start, end). */
  start: number;
  end: number;
  text: string;
  match: MatchType;
  /** 1 for an exact match; the 2M / T token ratio for a fuzzy one. */
  ratio: number;
}

interface Token { t: string; start: number; end: number }
// Words in normalised text. The line-end hyphen mark (U+E000, quote.ts WRAP) joins the two halves of a wrapped word.
const WORD = /[\p{L}\p{N}]+/gu;
function tokens(s: string, from = 0, to = s.length): Token[] {
  const out: Token[] = [];
  WORD.lastIndex = from;
  for (let m = WORD.exec(s); m && m.index < to; m = WORD.exec(s)) {
    if (m.index + m[0].length > to) break;
    out.push({ t: m[0].replace(//g, ''), start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/**
 * For each achievable match count k, the tightest span of `src` holding k tokens of `ext` in order (LangExtract
 * resolver.py _best_lcs_spans, same recurrence; earliest start wins a tie). O(n * m^2) time, O(m^2) memory.
 */
export function bestLcsSpans(src: string[], ext: string[]): Map<number, { start: number; end: number }> {
  const n = src.length;
  const m = ext.length;
  const best = new Map<number, { start: number; end: number }>();
  if (!n || !m) return best;
  const W = m + 1;
  let prev = new Int32Array(W * W).fill(-1);
  let curr = new Int32Array(W * W).fill(-1);
  for (let j = 0; j <= m; j++) prev[j * W] = 0;
  for (let i = 1; i <= n; i++) {
    const tok = src[i - 1];
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      curr[j * W] = i;
      const hit = tok === ext[j - 1];
      // Entries with k > j are never achievable and stay -1 from the fill.
      for (let k = 1; k <= j; k++) {
        let b = prev[j * W + k];
        const skipExt = curr[(j - 1) * W + k];
        if (skipExt > b) b = skipExt;
        if (hit) {
          const c = k === 1 ? i - 1 : prev[(j - 1) * W + k - 1];
          if (c > b) b = c;
        }
        curr[j * W + k] = b;
      }
    }
    const end = i - 1;
    for (let k = 1; k <= m; k++) {
      const s = curr[m * W + k];
      if (s < 0) continue;
      const had = best.get(k);
      const len = end - s + 1;
      if (!had || len < had.end - had.start + 1 || (len === had.end - had.start + 1 && s < had.start)) best.set(k, { start: s, end });
    }
    [prev, curr] = [curr, prev];
  }
  return best;
}

/**
 * The best fuzzy span of `src` for `ext`: the k and tightest span maximising 2k / (m + span). Only regions that can
 * reach `min` are searched: a span scoring >= min is at most 2m/min - m tokens long and shares at least
 * min*m/(2 - min) tokens with the quote, so every such span lies in a window of that length passing a token-count
 * check (the pre-check LangExtract's legacy aligner uses). Returns null when nothing reaches `min`.
 */
export function bestFuzzySpan(src: string[], ext: string[], min = FUZZY_MIN, budget: FuzzyBudget = fuzzyBudget()): { start: number; end: number; ratio: number } | null | 'over_budget' {
  const m = ext.length;
  if (!m || !src.length) return null;
  const maxSpan = Math.max(1, Math.floor((2 * m) / min - m));
  const minHits = Math.ceil((min * m) / (2 - min));
  const want = new Map<string, number>();
  for (const t of ext) want.set(t, (want.get(t) ?? 0) + 1);
  // Sliding window of maxSpan tokens; `hits` is the size of the multiset intersection with the quote.
  const have = new Map<string, number>();
  let hits = 0;
  const add = (t: string, d: 1 | -1) => {
    const w = want.get(t);
    if (!w) return;
    const before = Math.min(have.get(t) ?? 0, w);
    have.set(t, (have.get(t) ?? 0) + d);
    hits += Math.min(have.get(t)!, w) - before;
  };
  const regions: [number, number][] = [];
  const size = Math.min(maxSpan, src.length);
  for (let i = 0; i < size; i++) add(src[i], 1);
  for (let s = 0; ; s++) {
    if (hits >= minHits) {
      const last = regions[regions.length - 1];
      if (last && s <= last[1]) last[1] = s + size; else regions.push([s, s + size]);
    }
    if (s + size >= src.length) break;
    add(src[s], -1);
    add(src[s + size], 1);
  }
  const cells = regions.reduce((n, [a, b]) => n + (b - a) * ((m * (m + 1)) / 2), 0);
  if (cells > FUZZY_CELLS_PER_QUOTE || cells > budget.cells) { budget.skipped++; return 'over_budget'; }
  budget.cells -= cells;
  let best: { start: number; end: number; ratio: number; k: number } | null = null;
  for (const [a, b] of regions) {
    for (const [k, span] of bestLcsSpans(src.slice(a, b), ext)) {
      const ratio = (2 * k) / (m + (span.end - span.start + 1));
      const start = a + span.start;
      if (!best || ratio > best.ratio || (ratio === best.ratio && (k > best.k || (k === best.k && start < best.start)))) best = { start, end: a + span.end, ratio, k };
    }
  }
  return best && best.ratio >= min ? { start: best.start, end: best.end, ratio: best.ratio } : null;
}

/**
 * Aligns one quote to the source. `page` is normaliseMapped(source). `window` (source offsets, usually the chunk the
 * quote came from) is searched first for an exact match and is the only place a fuzzy match is looked for. Returns
 * null when the quote is not found, or when the passage found is longer than MAX_QUOTE. Every alignment returned
 * passes the quote check against the source (quote.ts quoteOnPage), by construction and checked again here. A fuzzy
 * search over `budget` is skipped (null, counted in budget.skipped).
 */
export function alignQuote(source: string, page: Mapped, quote: string, window: { start: number; end: number } = { start: 0, end: source.length }, budget: FuzzyBudget = fuzzyBudget()): Alignment | null {
  if (!normaliseQuote(quote)) return null;
  const lo = mappedIndex(page, window.start);
  const hi = mappedIndex(page, window.end);
  const local = findQuote(page, quote, lo);
  const hit = local && local.end <= hi ? local : findQuote(page, quote, 0);
  let found: { i: number; j: number; match: MatchType; ratio: number } | null = hit ? { i: hit.start, j: hit.end, match: 'exact', ratio: 1 } : null;
  if (!found) {
    const src = tokens(page.text, lo, hi);
    const ext = tokens(normaliseQuote(quote)).map((t) => t.t);
    const f = bestFuzzySpan(src.map((t) => t.t), ext, FUZZY_MIN, budget);
    if (f && f !== 'over_budget') found = { i: src[f.start].start, j: src[f.end].end, match: 'fuzzy', ratio: f.ratio };
  }
  if (!found || found.j <= found.i) return null;
  const { start, end } = sourceSpan(page, found.i, found.j);
  const text = source.slice(start, end);
  if (text.length > MAX_QUOTE || !quoteOnPage(page.text, text)) return null;
  return { start, end, text, match: found.match, ratio: found.ratio };
}

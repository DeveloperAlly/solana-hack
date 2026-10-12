// Quote integrity (issue #31): a fact read from a page is kept only when its quote is on that page. Page text and
// quote go through this one normaliser, so formatting differences (typography, invisible characters, line breaks,
// Markdown) cannot make a real quote fail, and the same check can be re-run later against the stored source text.
//
// Source alignment (issue #64; architecture §6.1 "Fact extraction with quote check", after Google's LangExtract,
// https://github.com/google/langextract): the same rules also run in an offset-tracking form (normaliseMapped), so a
// quote found in normalised page text maps back to the exact characters of the stored source text and their offsets.
// Both forms are driven by the one RULES table below, so they cannot drift apart; a test checks they agree.

/** The longest quote stored on an evidence row. Longer quotes are refused before the check, never cut after it. */
export const MAX_QUOTE = 500;

// Soft hyphen, zero-width space, zero-width non-joiner and joiner, word joiner, byte order mark.
const INVISIBLE = /[­​‌‍⁠﻿]/g;
// Single quotes, apostrophes and primes; double quotes and double primes; hyphens, dashes and minus signs.
const SINGLE_QUOTES = /[‘’‚‛′‵]/g;
const DOUBLE_QUOTES = /[“”„‟″‶]/g;
const DASHES = /[‐‑‒–—―−﹘﹣－]/g;

/** Marks a hyphen that sat at a line end in page text: it may be a word split ("inter-|national") or a real compound
 * ("brand-|new"), and only the quote can tell which, so each one is decided per occurrence when matching. */
const WRAP = '';

/**
 * One replacement: a global regex and what each match becomes, as pieces. A number keeps that capture group's text
 * (and, in the mapped form, each kept character keeps its own source offsets); a string is inserted literally (and, in
 * the mapped form, points at the whole match it replaced).
 */
type Piece = number | string;
interface Rule { re: RegExp; pieces: Piece[] | ((lineEndHyphen: 'rejoin' | 'mark') => Piece[]) }

/** Everything after NFKC, in order. The `d` flag gives capture-group indices for the mapped form (ES2022 hasIndices). */
const RULES: Rule[] = [
  { re: new RegExp(INVISIBLE.source, 'gd'), pieces: [] },
  { re: new RegExp(WRAP, 'gd'), pieces: [] },
  { re: new RegExp(SINGLE_QUOTES.source, 'gd'), pieces: ["'"] },
  { re: new RegExp(DOUBLE_QUOTES.source, 'gd'), pieces: ['"'] },
  { re: new RegExp(DASHES.source, 'gd'), pieces: ['-'] },
  // A hyphen at a line end between two letters: rejoined for a quote, marked for a page (see WRAP).
  { re: /(\p{L})-[^\S\n]*\r?\n\s*(\p{L})/gdu, pieces: (h) => (h === 'rejoin' ? [1, 2] : [1, WRAP, 2]) },
  // Paired emphasis (**bold**, __bold__, ~~struck~~, *em*, _em_, `code`) keeps its text and drops its marks.
  { re: /(\*\*|__|~~)(?=\S)([\s\S]*?\S)\1/gd, pieces: [2] },
  { re: /\*(?=\S)([^*]*?\S)\*/gd, pieces: [1] },
  { re: /(^|[^\p{L}\p{N}_])_(?=\S)([^_]*?\S)_(?![\p{L}\p{N}_])/gdu, pieces: [1, 2] },
  { re: /`([^`]+)`/gd, pieces: [1] },
  { re: /\s+/gd, pieces: [' '] },
];

const piecesOf = (r: Rule, h: 'rejoin' | 'mark') => (typeof r.pieces === 'function' ? r.pieces(h) : r.pieces);
const template = (pieces: Piece[]) => pieces.map((p) => (typeof p === 'number' ? `$${p}` : p.replace(/\$/g, '$$$$'))).join('');

/**
 * The form used to compare a quote with page text: NFKC; soft hyphens and zero-width characters removed; quotes and
 * dashes unified; words hyphenated across a line end rejoined (or, for page text, marked with WRAP); simple Markdown
 * emphasis removed; whitespace collapsed; lowercase. Apply it to both sides of every comparison.
 */
export function normaliseQuote(s: string, lineEndHyphen: 'rejoin' | 'mark' = 'rejoin'): string {
  let t = s.normalize('NFKC');
  for (const r of RULES) t = t.replace(r.re, template(piecesOf(r, lineEndHyphen)));
  return t.trim().toLowerCase();
}

/** The page text in comparable form, with each line-end hyphen marked so quoteOnPage can read it either way. */
export function normalisePage(text: string): string {
  return normaliseQuote(text, 'mark');
}

const escape = (c: string) => c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** The pattern a normalised quote matches on a normalised page: each '-' may be a hyphen or a marked line-end hyphen,
 * and a marked line-end hyphen may sit between any two characters of the quote (a word split across a line). */
function quotePattern(q: string, flags: string) {
  const chars = [...q];
  return new RegExp(chars.map((c, i) => (c === '-' ? `[-${WRAP}]` : (i ? `${WRAP}?` : '') + escape(c))).join(''), flags);
}

/**
 * True when the quote, normalised, appears on the normalised page. Each line-end hyphen on the page is matched on its
 * own: as a hyphen where the quote has one ("brand-new"), or as nothing where it does not ("international"), so a
 * page that wraps both kinds still matches a quote that contains both. An empty quote never matches.
 */
export function quoteOnPage(page: string, quote: string): boolean {
  const q = normaliseQuote(quote);
  if (!q) return false;
  if (!page.includes(WRAP)) return page.includes(q);
  return quotePattern(q, 'u').test(page);
}

/**
 * Normalised page text with, for every UTF-16 unit of it, the span [from[i], to[i]) of the source text it came from.
 * Spans never decrease, so a normalised range [i, j) maps to the source range [from[i], to[j - 1]).
 */
export interface Mapped { text: string; from: number[]; to: number[] }

/** Marks and Hangul medial and final jamo combine with what precedes them under normalisation (Unicode UAX #15 §1.3,
 * https://unicode.org/reports/tr15/), so they never start a new segment. */
const JOINS = /^[\p{M}ᅠ-ᇿힰ-퟿]/u;

/**
 * NFKC with offsets: the source is cut into segments that normalise independently (a boundary only before an ASCII
 * character, which never composes with what precedes it, or before a character whose normal form is unchanged by the
 * segment before it), and each normalised segment points at its source span. The joined result is checked against
 * NFKC of the whole text; a mismatch throws rather than return offsets that could point at the wrong characters.
 */
function nfkcMapped(src: string): Mapped {
  const out: string[] = [];
  const from: number[] = [];
  const to: number[] = [];
  let segStart = 0;
  let seg = '';
  const flush = (end: number) => {
    if (!seg) return;
    const n = seg.normalize('NFKC');
    out.push(n);
    for (let k = 0; k < n.length; k++) { from.push(segStart); to.push(end); }
  };
  let i = 0;
  for (const ch of src) {
    const ascii = ch.charCodeAt(0) < 0x80;
    const boundary = !seg || ascii || (!JOINS.test(ch) && (seg + ch).normalize('NFKC') === seg.normalize('NFKC') + ch.normalize('NFKC'));
    if (boundary) { flush(i); segStart = i; seg = ch; } else seg += ch;
    i += ch.length;
  }
  flush(i);
  const text = out.join('');
  if (text !== src.normalize('NFKC')) throw new Error('normaliser offset map diverged at NFKC');
  return { text, from, to };
}

/** Applies one rule to a mapped string, carrying offsets through kept groups and pointing inserted text at its match. */
function applyMapped(m: Mapped, rule: Rule, h: 'rejoin' | 'mark'): Mapped {
  const pieces = piecesOf(rule, h);
  const out: string[] = [];
  const from: number[] = [];
  const to: number[] = [];
  const keep = (a: number, b: number) => { out.push(m.text.slice(a, b)); for (let k = a; k < b; k++) { from.push(m.from[k]); to.push(m.to[k]); } };
  const re = new RegExp(rule.re.source, rule.re.flags);
  let last = 0;
  for (let x = re.exec(m.text); x; x = re.exec(m.text)) {
    const [ms, me] = x.indices![0]!;
    keep(last, ms);
    for (const p of pieces) {
      if (typeof p === 'number') {
        const g = x.indices![p];
        if (g) keep(g[0], g[1]);
      } else if (me > ms) {
        out.push(p);
        for (let k = 0; k < p.length; k++) { from.push(m.from[ms]); to.push(m.to[me - 1]); }
      }
    }
    last = me;
    if (me === ms) re.lastIndex++;
  }
  keep(last, m.text.length);
  return { text: out.join(''), from, to };
}

/**
 * normalisePage with offsets. Trim and lowercase are applied per character: lowercase mappings that change length
 * (U+0130) do so for the character alone, and the only context-dependent one (final sigma) keeps length, so each
 * character's lowercase length is fixed (Unicode SpecialCasing.txt, https://www.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt).
 * The result is checked against normalisePage; a mismatch throws.
 */
export function normaliseMapped(source: string): Mapped {
  let m = nfkcMapped(source);
  for (const r of RULES) m = applyMapped(m, r, 'mark');
  const lead = m.text.length - m.text.trimStart().length;
  const kept = m.text.trim();
  m = { text: kept, from: m.from.slice(lead, lead + kept.length), to: m.to.slice(lead, lead + kept.length) };
  const lower = m.text.toLowerCase();
  const from: number[] = [];
  const to: number[] = [];
  let k = 0;
  for (const ch of m.text) {
    const n = ch.toLowerCase().length;
    for (let j = 0; j < n; j++) { from.push(m.from[k]); to.push(m.to[k + ch.length - 1]); }
    k += ch.length;
  }
  const mapped = { text: lower, from, to };
  if (from.length !== lower.length || lower !== normalisePage(source)) throw new Error('normaliser offset map diverged');
  return mapped;
}

/**
 * Where a quote first appears in mapped page text, as a normalised range [start, end), searching from `at`; null when
 * it does not appear. Same matching as quoteOnPage.
 */
export function findQuote(page: Mapped, quote: string, at = 0): { start: number; end: number } | null {
  const q = normaliseQuote(quote);
  if (!q) return null;
  const re = quotePattern(q, 'gu');
  re.lastIndex = at;
  const x = re.exec(page.text);
  return x ? { start: x.index, end: x.index + x[0].length } : null;
}

/** The source range [start, end) that a non-empty normalised range [i, j) of mapped text came from. */
export function sourceSpan(page: Mapped, i: number, j: number): { start: number; end: number } {
  return { start: page.from[i], end: page.to[j - 1] };
}

/** The first normalised index whose source offset is at or after `offset` (binary search; offsets never decrease). */
export function mappedIndex(page: Mapped, offset: number): number {
  let lo = 0;
  let hi = page.from.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (page.from[mid] < offset) lo = mid + 1; else hi = mid;
  }
  return lo;
}

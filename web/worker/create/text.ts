// Text measures shared by the Create evaluators and retrieval (issue #93). Pure functions, no model calls.
import { normaliseQuote } from '../quote';

/** Lower-case word tokens (letters, digits, inner apostrophes and hyphens), after the shared quote normaliser. */
export function words(text: string): string[] {
  return normaliseQuote(text).toLowerCase().match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) ?? [];
}

// Abbreviations a sentence does not end at, before a capitalised word ("Dr. Smith", "Mr. Lee", "No. 1"): a subset of the
// CLDR English sentence-break suppressions (UTS #35 §9.2 Segmentation Suppressions,
// https://unicode.org/reports/tr35/tr35-general.html), which ICU applies only under the locale key "ss" and
// Intl.Segmenter does not expose. Kept to titles and reference words that cannot end a sentence.
const SUPPRESS = /(?:^|[\s(])(?:Mr|Mrs|Ms|Dr|Prof|St|Mt|Gen|Lt|Col|Capt|Sgt|Sen|Rep|Gov|Rev|Hon|No|Nos|Fig|vs|approx)\.\s*$/;
const SEGMENTER = new Intl.Segmenter('en', { granularity: 'sentence' });

/**
 * Sentences, by Unicode sentence boundaries (UAX #29, https://www.unicode.org/reports/tr29/#Sentence_Boundaries) through
 * Intl.Segmenter, which the Workers runtime provides with the rest of Intl (Web standards: Intl,
 * https://developers.cloudflare.com/workers/runtime-apis/web-standards/; posts.ts already segments graphemes with it).
 * UAX #29 keeps "U.S. teams", "e.g. this", "3.5x" and "jamjam.tech/docs" whole and breaks at line breaks; the
 * suppressions above keep "Dr. Smith" whole. One segmenter for claims, review inputs and checks (PR #99 review).
 */
export function sentences(text: string): string[] {
  const out: string[] = [];
  let carry = '';
  for (const { segment } of SEGMENTER.segment(text.normalize('NFC'))) {
    const s = carry + segment;
    if (SUPPRESS.test(s)) { carry = s; continue; }
    carry = '';
    out.push(s);
  }
  if (carry) out.push(carry);
  return out.map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s));
}

/**
 * Syllables in an English word by vowel groups, the heuristic readability tools use when no dictionary entry exists
 * (textstat, cited in research 06, falls back to it): count vowel groups, drop a silent final "e", at least one.
 */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Small English stop-word list for ranking: function words that carry no topic. */
export const STOP = new Set('a an and are as at be been but by can do for from had has have he her his i if in into is it its just me my no not of on or our out so than that the their them then there these they this to too up us was we were what when which who will with you your'.split(' '));

/** Topic terms for ranking: words without stop words, a plural "s" folded ("brands" ~ "brand"). */
export function terms(text: string): string[] {
  return words(text).filter((w) => w.length > 1 && !STOP.has(w)).map(fold);
}

/** Folds a regular English plural onto its singular, so counted nouns compare ("companies" ~ "company"). */
export function fold(w: string): string {
  if (/^\d/.test(w)) return w;
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) return w.slice(0, -1);
  return w;
}

/** Emoji graphemes (pictographs, flags and keycaps), as X counts them (posts.ts xWeightedLength). */
export function emojiCount(text: string): number {
  let n = 0;
  for (const { segment } of new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)) if (/\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(segment)) n++;
  return n;
}

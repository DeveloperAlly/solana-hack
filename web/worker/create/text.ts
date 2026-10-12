// Text measures shared by the Create evaluators and retrieval (issue #93). Pure functions, no model calls.
import { normaliseQuote } from '../quote';

/** Lower-case word tokens (letters, digits, inner apostrophes and hyphens), after the shared quote normaliser. */
export function words(text: string): string[] {
  return normaliseQuote(text).toLowerCase().match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) ?? [];
}

/**
 * Sentences: split after . ! ? (and line breaks, since social posts often end a thought with a line break and no stop).
 * A decimal point (2.5) or a dotted domain (jamjam.tech) does not end a sentence: a stop must be followed by space.
 */
export function sentences(text: string): string[] {
  return text.normalize('NFC')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\p{N}]/u.test(s));
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

// Quote integrity (issue #31): a fact read from a page is kept only when its quote is on that page. Page text and
// quote go through this one normaliser, so formatting differences (typography, invisible characters, line breaks,
// Markdown) cannot make a real quote fail, and the same check can be re-run later against the stored source text.

/** The longest quote stored on an evidence row. Longer quotes are refused before the check, never cut after it. */
export const MAX_QUOTE = 500;

// Soft hyphen, zero-width space, zero-width non-joiner and joiner, word joiner, byte order mark.
const INVISIBLE = /[\u00AD\u200B\u200C\u200D\u2060\uFEFF]/g;
// Single quotes, apostrophes and primes; double quotes and double primes; hyphens, dashes and minus signs.
const SINGLE_QUOTES = /[\u2018\u2019\u201A\u201B\u2032\u2035]/g;
const DOUBLE_QUOTES = /[\u201C\u201D\u201E\u201F\u2033\u2036]/g;
const DASHES = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g;

/** Marks a hyphen that sat at a line end in page text: it may be a word split ("inter-|national") or a real compound
 * ("brand-|new"), and only the quote can tell which, so each one is decided per occurrence when matching. */
const WRAP = '\uE000';

/**
 * The form used to compare a quote with page text: NFKC; soft hyphens and zero-width characters removed; quotes and
 * dashes unified; words hyphenated across a line end rejoined (or, for page text, marked with WRAP); simple Markdown
 * emphasis removed; whitespace collapsed; lowercase. Apply it to both sides of every comparison.
 */
export function normaliseQuote(s: string, lineEndHyphen: 'rejoin' | 'mark' = 'rejoin'): string {
  return s
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .split(WRAP).join('')
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, '-')
    // A hyphen at a line end between two letters: rejoined for a quote, marked for a page (see WRAP).
    .replace(/(\p{L})-[^\S\n]*\r?\n\s*(\p{L})/gu, lineEndHyphen === 'rejoin' ? '$1$2' : `$1${WRAP}$2`)
    // Paired emphasis (**bold**, __bold__, ~~struck~~, *em*, _em_, `code`) keeps its text and drops its marks.
    .replace(/(\*\*|__|~~)(?=\S)([\s\S]*?\S)\1/g, '$2')
    .replace(/\*(?=\S)([^*]*?\S)\*/g, '$1')
    .replace(/(^|[^\p{L}\p{N}_])_(?=\S)([^_]*?\S)_(?![\p{L}\p{N}_])/gu, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** The page text in comparable form, with each line-end hyphen marked so quoteOnPage can read it either way. */
export function normalisePage(text: string): string {
  return normaliseQuote(text, 'mark');
}

const escape = (c: string) => c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * True when the quote, normalised, appears on the normalised page. Each line-end hyphen on the page is matched on its
 * own: as a hyphen where the quote has one ("brand-new"), or as nothing where it does not ("international"), so a
 * page that wraps both kinds still matches a quote that contains both. An empty quote never matches.
 */
export function quoteOnPage(page: string, quote: string): boolean {
  const q = normaliseQuote(quote);
  if (!q) return false;
  if (!page.includes(WRAP)) return page.includes(q);
  const chars = [...q];
  const pattern = chars.map((c, i) => (c === '-' ? `[-${WRAP}]` : (i ? `${WRAP}?` : '') + escape(c))).join('');
  return new RegExp(pattern, 'u').test(page);
}

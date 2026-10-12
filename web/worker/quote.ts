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

/**
 * The form used to compare a quote with page text: NFKC; soft hyphens and zero-width characters removed; quotes and
 * dashes unified; words hyphenated across a line end rejoined; simple Markdown emphasis removed; whitespace collapsed;
 * lowercase. Apply it to both sides of every comparison.
 */
export function normaliseQuote(s: string, lineEndHyphen: 'rejoin' | 'keep' = 'rejoin'): string {
  return s
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, '-')
    // "inter-\nnational" -> "international": a hyphen at a line end between two letters is usually a line break.
    // 'keep' instead joins it as "inter-national", for a real compound ("brand-new") that happens to wrap.
    .replace(/(\p{L})-[^\S\n]*\r?\n\s*(\p{L})/gu, lineEndHyphen === 'rejoin' ? '$1$2' : '$1-$2')
    // Paired emphasis (**bold**, __bold__, ~~struck~~, *em*, _em_, `code`) keeps its text and drops its marks.
    .replace(/(\*\*|__|~~)(?=\S)([\s\S]*?\S)\1/g, '$2')
    .replace(/\*(?=\S)([^*]*?\S)\*/g, '$1')
    .replace(/(^|[^\p{L}\p{N}_])_(?=\S)([^_]*?\S)_(?![\p{L}\p{N}_])/gu, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * The page text in its comparable forms: line-end hyphens rejoined, and (only when the page has any) kept. A quote
 * matches if it is in either, so both "international" and "brand-new" match when the page wrapped them at a hyphen.
 */
export function normalisePage(text: string): string[] {
  const rejoined = normaliseQuote(text, 'rejoin');
  const kept = normaliseQuote(text, 'keep');
  return kept === rejoined ? [rejoined] : [rejoined, kept];
}

/** True when the quote, normalised, appears in one of the page's forms (normalisePage). An empty quote never matches. */
export function quoteOnPage(page: string[], quote: string): boolean {
  const q = normaliseQuote(quote);
  return q.length > 0 && page.some((p) => p.includes(q));
}

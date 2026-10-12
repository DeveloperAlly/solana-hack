// The rules behind lint:tokens (scripts/lint-tokens.mjs), as pure functions so they can be tested.
// Every rule reads code only: comments are prose, so an issue reference such as "#114" (also a valid three-digit hex
// colour) or a note quoting "12px" is never a styling value (PR #99 review: the HEX rule failed on "issue #114").

export const HEX = /(^|[^&\w])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
export const FUNC = /\b(?:rgba?|hsla?)\s*\(/i;
export const PX = /\b\d*\.?\d+px\b/;
// Dimensional properties given a bare number (React adds px), in inline or referenced style objects.
export const DIM_NUMBER = /\b(?:padding\w*|margin\w*|gap|rowGap|columnGap|width|height|min(?:Width|Height)|max(?:Width|Height)|top|left|right|bottom|inset\w*|fontSize|lineHeight|letterSpacing|borderRadius|border\w*Width|outlineWidth|outlineOffset|flexBasis)\s*:\s*-?\d/;
// Only primitives may take a style prop, and only to apply token variables.
export const STYLE_PROP = /\bstyle=\{/;

/**
 * The file's text with every comment replaced by spaces, newlines kept, so line numbers do not move. JS/TS: `//` line
 * comments and `/* *\/` blocks, outside string and template literals (so "https://x" stays code). CSS: `/* *\/` only,
 * since `//` is not a CSS comment.
 */
export function stripComments(text, isScript) {
  let out = '';
  let i = 0;
  let quote = null; // the open string delimiter, if inside a string or template literal
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') { out += next ?? ''; i += 2; continue; }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
      continue;
    }
    if (isScript && c === '/' && next === '/') {
      const end = text.indexOf('\n', i);
      const stop = end === -1 ? text.length : end;
      out += ' '.repeat(stop - i);
      i = stop;
      continue;
    }
    if (isScript && (c === '"' || c === "'" || c === '`')) quote = c;
    out += c;
    i += 1;
  }
  return out;
}

/** The lint:tokens errors for one file under src, given its path relative to src and its text. */
export function lintFile(rel, text) {
  const errors = [];
  if (rel.startsWith('tokens/')) return errors;
  if (rel.startsWith('screens/') && rel.endsWith('.css')) errors.push(`${rel}: screens must not have stylesheets`);
  const isScript = /\.(t|j)sx?$/.test(rel) || /\.m?js$/.test(rel);
  // Test files may name colours as fixture data (they are not shipped or styled).
  const isTest = /\.test\.(t|j)sx?$/.test(rel);
  const lines = text.split('\n');
  stripComments(text, isScript).split('\n').forEach((code, i) => {
    const shown = lines[i].trim();
    if (!isTest && HEX.test(code)) errors.push(`${rel}:${i + 1}: raw hex colour: ${shown}`);
    if (!isTest && FUNC.test(code)) errors.push(`${rel}:${i + 1}: raw rgb()/hsl() colour: ${shown}`);
    if (PX.test(code)) errors.push(`${rel}:${i + 1}: px value: ${shown}`);
    if (/\.(t|j)sx?$/.test(rel) && DIM_NUMBER.test(code)) errors.push(`${rel}:${i + 1}: numeric dimension in a style object: ${shown}`);
    if (rel.endsWith('.tsx') && !rel.startsWith('ui/primitives/') && STYLE_PROP.test(code)) errors.push(`${rel}:${i + 1}: style prop outside ui/primitives: ${shown}`);
  });
  return errors;
}

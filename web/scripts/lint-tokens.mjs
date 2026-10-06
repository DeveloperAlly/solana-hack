// Fails if any file under src (except src/tokens) has a raw colour (test files excepted) or px value,
// a numeric dimension in a style object, a style prop outside ui/primitives, or if a screen has a stylesheet.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(src);

const HEX = /(^|[^&\w])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const FUNC = /\b(?:rgba?|hsla?)\s*\(/i;
const PX = /\b\d*\.?\d+px\b/;
// Dimensional properties given a bare number (React adds px), in inline or referenced style objects.
const DIM_NUMBER = /\b(?:padding\w*|margin\w*|gap|rowGap|columnGap|width|height|min(?:Width|Height)|max(?:Width|Height)|top|left|right|bottom|inset\w*|fontSize|lineHeight|letterSpacing|borderRadius|border\w*Width|outlineWidth|outlineOffset|flexBasis)\s*:\s*-?\d/;
// Only primitives may take a style prop, and only to apply token variables.
const STYLE_PROP = /\bstyle=\{/;

const errors = [];
for (const file of files) {
  const rel = relative(src, file).split(sep).join('/');
  if (rel.startsWith('tokens/')) continue;
  if (rel.startsWith('screens/') && rel.endsWith('.css')) errors.push(`${rel}: screens must not have stylesheets`);
  const text = readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    // Test files may name colours as fixture data (they are not shipped or styled).
    const isTest = /\.test\.(t|j)sx?$/.test(rel);
    if (!isTest && HEX.test(line)) errors.push(`${rel}:${i + 1}: raw hex colour: ${line.trim()}`);
    if (!isTest && FUNC.test(line)) errors.push(`${rel}:${i + 1}: raw rgb()/hsl() colour: ${line.trim()}`);
    if (PX.test(line)) errors.push(`${rel}:${i + 1}: px value: ${line.trim()}`);
    if (/\.(t|j)sx?$/.test(rel) && DIM_NUMBER.test(line)) errors.push(`${rel}:${i + 1}: numeric dimension in a style object: ${line.trim()}`);
    if (rel.endsWith('.tsx') && !rel.startsWith('ui/primitives/') && STYLE_PROP.test(line)) errors.push(`${rel}:${i + 1}: style prop outside ui/primitives: ${line.trim()}`);
  });
}

if (errors.length) {
  console.error(`lint:tokens FAILED (${errors.length})\n` + errors.join('\n'));
  process.exit(1);
}
console.log(`lint:tokens passed: ${files.length} files checked, 0 raw colours, 0 px values, 0 screen stylesheets`);

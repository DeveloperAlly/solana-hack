// Fails if any file under src (except src/tokens) has a raw colour or px value, or if a screen has a stylesheet.
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
const STYLE_PX = /style=\{\{[^}]*\d+px/s;

const errors = [];
for (const file of files) {
  const rel = relative(src, file).split(sep).join('/');
  if (rel.startsWith('tokens/')) continue;
  if (rel.startsWith('screens/') && rel.endsWith('.css')) errors.push(`${rel}: screens must not have stylesheets`);
  const text = readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    if (HEX.test(line)) errors.push(`${rel}:${i + 1}: raw hex colour: ${line.trim()}`);
    if (FUNC.test(line)) errors.push(`${rel}:${i + 1}: raw rgb()/hsl() colour: ${line.trim()}`);
    if (rel.endsWith('.css') && PX.test(line)) errors.push(`${rel}:${i + 1}: px value in CSS: ${line.trim()}`);
  });
  if (rel.endsWith('.tsx') && STYLE_PX.test(text)) errors.push(`${rel}: px value in a style prop`);
}

if (errors.length) {
  console.error(`lint:tokens FAILED (${errors.length})\n` + errors.join('\n'));
  process.exit(1);
}
console.log(`lint:tokens passed: ${files.length} files checked, 0 raw colours, 0 px values, 0 screen stylesheets`);

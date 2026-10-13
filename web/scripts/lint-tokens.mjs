// Fails if any file under src (except src/tokens) has a raw colour (test files excepted) or px value,
// a numeric dimension in a style object, a style prop outside ui/primitives, or if a screen has a stylesheet.
// The rules, which read code and never comments, are in scripts/lint-tokens-lib.mjs.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintFile } from './lint-tokens-lib.mjs';

const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(src);

const errors = files.flatMap((file) => lintFile(relative(src, file).split(sep).join('/'), readFileSync(file, 'utf8')));

if (errors.length) {
  console.error(`lint:tokens FAILED (${errors.length})\n` + errors.join('\n'));
  process.exit(1);
}
console.log(`lint:tokens passed: ${files.length} files checked, 0 raw colours, 0 px values, 0 screen stylesheets`);

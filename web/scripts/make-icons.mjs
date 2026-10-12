// Regenerates the PNG favicons in public/ from public/brand/icon-mark.svg (issue #47): the deck's mark with
// heavier strokes for small sizes.
// The converter is not a project dependency; see public/README.md:
//   npm i --no-save @resvg/resvg-js@2.6.2 && node scripts/make-icons.mjs
// Docs: https://github.com/thx/resvg-js#usage
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const mark = readFileSync(join(pub, 'brand', 'icon-mark.svg'), 'utf8');
// Inner content of the mark (everything inside <svg>, minus <title>), drawn in black.
const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/, '');
const attrs = 'fill="none" stroke="black"';

// pad: white margin around the 64-unit mark, in mark units. The apple-touch icon is an opaque white square with a
// margin; the 32 px favicon has no extra margin so the mark stays as large as possible.
function icon(file, size, pad) {
  const box = 64 + pad * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${box} ${box}"><rect x="${-pad}" y="${-pad}" width="${box}" height="${box}" fill="white"/><g ${attrs}>${inner}</g></svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(pub, file), png);
  console.log(`wrote public/${file} (${size}x${size})`);
}

icon('favicon-32.png', 32, 0);
icon('apple-touch-icon.png', 180, 14);

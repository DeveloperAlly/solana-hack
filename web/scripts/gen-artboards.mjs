// Generates src/config/artboards.ts from the wireframe canvas's canvas.json (issue #46).
// Usage: node scripts/gen-artboards.mjs <path to canvas.json> <canvas version id>
// The canvas is the UI spec (AGENTS rule 8); its link is in .agentic/what/context/links.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [src, version] = process.argv.slice(2);
if (!src || !version) {
  console.error('usage: node scripts/gen-artboards.mjs <canvas.json> <version id>');
  process.exit(2);
}
const ARCHIVE = 'licensee';
const canvas = JSON.parse(readFileSync(src, 'utf8'));
const pageIds = new Set(canvas.pages.map((p) => p.id));
const boards = Object.entries(canvas.boards)
  .map(([file, b]) => [file.replace(/\.dc\.html$/, ''), b.page])
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
for (const [name, page] of boards) if (!pageIds.has(page)) throw new Error(`${name}: unknown canvas page "${page}"`);
const live = boards.filter(([, p]) => p !== ARCHIVE);
const archived = boards.filter(([, p]) => p === ARCHIVE);
const line = ([name, page]) => `  '${name}': '${page}',`;

const out = `// Every artboard on the wireframe canvas, generated from its canvas.json (version ${version},
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #46) by scripts/gen-artboards.mjs. The Archive page
// ("${ARCHIVE}") is not built (issue #45); its boards are listed so a screen still registered there names its page.
// Links between screens take an ArtboardName (screenPath, useScreenHref, ScreenLink), so a misspelled or missing
// board fails typecheck (Codex review on PR #80). Regenerate when the canvas adds or renames a board.
import type { CanvasPageId } from '../screens/registry-types';

export const artboardPages = {
${live.map(line).join('\n')}
  // Archive page: not in the product.
${archived.map(line).join('\n')}
} as const satisfies Record<string, CanvasPageId>;

export type ArtboardName = keyof typeof artboardPages;

/** The ${live.length} non-archived artboard names, in name order: the boards the product builds. */
export const artboards = (Object.keys(artboardPages) as ArtboardName[]).filter((a) => artboardPages[a] !== '${ARCHIVE}');

export function isArtboardName(name: string): name is ArtboardName {
  return Object.prototype.hasOwnProperty.call(artboardPages, name);
}
`;
writeFileSync(fileURLToPath(new URL('../src/config/artboards.ts', import.meta.url)), out);
console.log(`artboards: ${live.length} boards, ${archived.length} archived (canvas ${version})`);

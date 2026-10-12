// Sample data for Kit-Export. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Kit-Export (note n-kex;
// the folder tree is the canvas text; the brand switcher shows aDNA); issue #50; backend map §4, row "Kit-Export".
import type { KitExportData } from './types';

export const kitExportData: KitExportData = {
  brandId: 'adna',
  tree: [
    'jamjam-kit-v1/',
    '  MANIFEST.md',
    '  what/',
    '    brand/          17 section files, one per kit section',
    '    decisions/      gate approvals: who, when, why',
    '    context/',
    '      sources/      every source we read, with links and dates',
    '  how/',
    '    templates/      voice template + per-channel overrides',
  ].join('\n'),
  versions: ['v[n] (current) · [date]', 'v1 · [date]'],
  includes: [
    { id: 'sources', label: 'Source list', checked: true },
    { id: 'decisions', label: 'Decisions', checked: true },
    { id: 'missing', label: 'Missing sections as empty files', checked: false },
  ],
  hash: '[sha256]',
  fileName: 'jamjam-kit-v1.zip',
};

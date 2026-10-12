// Sample data for Kit-Export. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Kit-Export (note n-kex;
// the folder tree is the canvas text, rooted per version; the brand switcher shows aDNA; v1's hash is the Onboard-6 placeholder); issue #50; backend map §4, row "Kit-Export".
import type { KitExportData } from './types';
import type { KitVersion } from '../../ui/domain/BuilderKitExport';

const treeFor = (root: string) =>
  [
    `${root}/`,
    '  MANIFEST.md',
    '  what/',
    '    brand/          17 section files, one per kit section',
    '    decisions/      gate approvals: who, when, why',
    '    context/',
    '      sources/      every source we read, with links and dates',
    '  how/',
    '    templates/      voice template + per-channel overrides',
  ].join('\n');

const version = (v: string, label: string, hash: string): KitVersion => ({ label, hash, fileName: `jamjam-kit-${v}.zip`, tree: treeFor(`jamjam-kit-${v}`) });

export const kitExportData: KitExportData = {
  brandId: 'adna',
  versions: [version('v[n]', 'v[n] (current) · [date]', '[sha256]'), version('v1', 'v1 · [date]', '[sha256 of kit v1]')],
  includes: [
    { id: 'sources', label: 'Source list', checked: true },
    { id: 'decisions', label: 'Decisions', checked: true },
    { id: 'missing', label: 'Missing sections as empty files', checked: false },
  ],
};

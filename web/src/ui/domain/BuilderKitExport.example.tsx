import type { WorkbenchExample } from '../../system/example';
import type { KitFile } from '../../lib/kitZip';
import { BuilderKitExport, type KitVersion } from './BuilderKitExport';

// Folders and options from canvas board Kit-Export (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
// Section text and hashes are bracketed placeholders.
const files = (v: string): KitFile[] => [
  { path: 'MANIFEST.md', content: `# JamJam kit ${v}\n` },
  { path: 'what/brand/02-purpose.md', content: `# Purpose\n\n[JamJam purpose, kit ${v}]\n` },
  { path: 'what/brand/13-visual-kit.md', content: '', group: 'missing' },
  { path: 'what/context/sources/jamjam-tech.md', content: '# jamjam.tech\n\nRead [date].\n', group: 'sources' },
];
const version = (v: string, label: string, hash: string): KitVersion => ({ label, hash, fileName: `jamjam-kit-${v}.zip`, root: `jamjam-kit-${v}`, files: files(v) });

export const exampleVersions: KitVersion[] = [version('v[n]', 'v[n] (current) · [date]', '[sha256 of v[n]]'), version('v1', 'v1 · [date]', '[sha256 of kit v1]')];

export const example: WorkbenchExample = {
  id: 'D49',
  name: 'BuilderKitExport',
  description: 'Version and include options decide the files: the tree, hash, file name and zip follow them.',
  render: () => (
    <BuilderKitExport
      versions={exampleVersions}
      includes={[{ id: 'sources', label: 'Source list', checked: true }, { id: 'missing', label: 'Missing sections as empty files', checked: false }]}
    />
  ),
};

import type { WorkbenchExample } from '../../system/example';
import { BuilderKitExport } from './BuilderKitExport';

// Tree and options from canvas board Kit-Export (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
export const example: WorkbenchExample = {
  id: 'D49',
  name: 'BuilderKitExport',
  description: 'The chosen version drives tree, hash and file name; Download prepares that file.',
  render: () => (
    <BuilderKitExport
      versions={[
        { label: 'v[n] (current) · [date]', hash: '[sha256 of v[n]]', fileName: 'jamjam-kit-v[n].zip', tree: 'jamjam-kit-v[n]/\n  MANIFEST.md\n  what/\n  how/' },
        { label: 'v1 · [date]', hash: '[sha256 of kit v1]', fileName: 'jamjam-kit-v1.zip', tree: 'jamjam-kit-v1/\n  MANIFEST.md\n  what/\n  how/' },
      ]}
      includes={[{ id: 'sources', label: 'Source list', checked: true }, { id: 'missing', label: 'Missing sections as empty files', checked: false }]}
    />
  ),
};

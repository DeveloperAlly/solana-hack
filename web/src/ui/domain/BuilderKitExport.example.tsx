import type { WorkbenchExample } from '../../system/example';
import { BuilderKitExport } from './BuilderKitExport';

// Tree and options from canvas board Kit-Export (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
export const example: WorkbenchExample = {
  id: 'D49',
  name: 'BuilderKitExport',
  description: 'Tree preview, version, include options, hash and Download .zip (preparing on click).',
  render: () => (
    <BuilderKitExport
      tree={'jamjam-kit-v1/\n  MANIFEST.md\n  what/\n    brand/\n    decisions/\n  how/\n    templates/'}
      versions={['v[n] (current) · [date]', 'v1 · [date]']}
      includes={[{ id: 'sources', label: 'Source list', checked: true }, { id: 'missing', label: 'Missing sections as empty files', checked: false }]}
      hash="[sha256]"
      fileName="jamjam-kit-v1.zip"
    />
  ),
};

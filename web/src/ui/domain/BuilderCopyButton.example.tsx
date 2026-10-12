import type { WorkbenchExample } from '../../system/example';
import { BuilderCopyButton } from './BuilderCopyButton';

export const example: WorkbenchExample = {
  id: 'C13',
  name: 'BuilderCopyButton',
  description: 'Copies a value and announces "Copied" (canvas Onboard-2-Domain TXT record).',
  render: () => <BuilderCopyButton value="jamjam-verify=[unique value]" label="Copy value" />,
};

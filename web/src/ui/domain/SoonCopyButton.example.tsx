import type { WorkbenchExample } from '../../system/example';
import { SoonCopyButton } from './SoonCopyButton';

export const example: WorkbenchExample = {
  id: 'D-UI5',
  name: 'SoonCopyButton',
  description: 'Copies text to the clipboard, then says Copied (or Copy failed) and announces it.',
  render: () => <SoonCopyButton text="[approved post text]" label="Copy and post myself" />,
};

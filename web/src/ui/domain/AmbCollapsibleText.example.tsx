import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { AmbCollapsibleText } from './AmbCollapsibleText';

const brief =
  'Explain why agents need shared project context. Start from a real moment when an agent lost context on your project, then show how a shared, versioned context file fixes it. Link to adna.network.';

export const example: WorkbenchExample = {
  id: 'P5',
  name: 'AmbCollapsibleText',
  description: 'Collapsible after four lines with Read more (canvas M-2 brief), and the full text (Amb-2).',
  render: () => (
    <Stack gap={4}>
      <AmbCollapsibleText text={`${brief} ${brief} ${brief}`} collapsible />
      <AmbCollapsibleText text={brief} />
    </Stack>
  ),
};

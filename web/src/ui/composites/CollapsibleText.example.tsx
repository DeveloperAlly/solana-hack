import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { CollapsibleText } from './CollapsibleText';

// Brief text is placeholder copy for canvas board M-2 (note n-m2; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
const brief = '[Sample brief] Write one post about how you use the brand in your own work. Say what problem it solved, show one concrete example, and link to the docs page you found most useful. Keep it under 200 words, mark it as sponsored, and do not make claims about returns or performance.';

export const example: WorkbenchExample = {
  id: 'C33',
  name: 'CollapsibleText',
  description: 'Collapsible at four lines (default) and two lines, and plain full text.',
  render: () => (
    <Stack gap={4}>
      <CollapsibleText text={brief} collapsible />
      <CollapsibleText text={brief} collapsible lines={2} moreLabel="Show the full brief" lessLabel="Show less of the brief" />
      <CollapsibleText text={brief} />
    </Stack>
  ),
};

import type { WorkbenchExample } from '../../system/example';
import { Icon, type IconName } from './Icon';
import { Stack } from './Stack';

const names: IconName[] = ['check', 'alert', 'info', 'cross', 'plus', 'chevron-down'];

export const example: WorkbenchExample = {
  id: 'P10',
  name: 'Icon',
  description: 'Every icon at md, then sm and lg, and a labelled icon.',
  render: () => (
    <Stack direction="row" gap={3} align="center" wrap>
      {names.map((n) => <Icon key={n} name={n} />)}
      <Icon name="check" size="sm" />
      <Icon name="check" size="lg" label="Approved" />
    </Stack>
  ),
};

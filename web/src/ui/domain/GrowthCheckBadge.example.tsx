import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { GrowthCheckBadge, growthBadgeStyles } from './GrowthCheckBadge';

export function GrowthCheckBadgeDemo() {
  return (
    <Stack direction="row" gap={3} wrap align="center">
      {growthBadgeStyles.map((s) => <GrowthCheckBadge key={s.id} brand="aDNA" variant={s.id} />)}
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D62',
  name: 'GrowthCheckBadge',
  description: 'The check-it badge on a verified post: outline, solid and compact.',
  render: () => <GrowthCheckBadgeDemo />,
};

import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { ComingSoonFlag } from './ComingSoonFlag';

export const example: WorkbenchExample = {
  id: 'D56',
  name: 'ComingSoonFlag',
  description: 'From route tags: coming soon, roadmap, experimental (HACKATHON renders nothing).',
  render: () => (
    <Stack direction="row" gap={3} wrap>
      <ComingSoonFlag />
      <ComingSoonFlag tag="ROADMAP" />
      <ComingSoonFlag tag="EXPERIMENTAL" />
      <ComingSoonFlag tag="HACKATHON" />
    </Stack>
  ),
};

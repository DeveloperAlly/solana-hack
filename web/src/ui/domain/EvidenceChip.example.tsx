import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { EvidenceChip, evidenceStatuses } from './EvidenceChip';

export const example: WorkbenchExample = {
  id: 'D57',
  name: 'EvidenceChip',
  description: 'Found, Partly found, Needs you.',
  render: () => (
    <Stack direction="row" gap={3} wrap>
      {evidenceStatuses.map((s) => <EvidenceChip key={s} status={s} />)}
    </Stack>
  ),
};

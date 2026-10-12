import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { VerifyInput } from './VerifyInput';

export const example: WorkbenchExample = {
  id: 'D33',
  name: 'VerifyInput',
  description: 'Default, checking, and with an error.',
  render: () => (
    <Stack gap={4}>
      <VerifyInput label="Text or URL (default)" defaultValue="My coding agent lost a full day of work last week." />
      <VerifyInput label="Text or URL (checking)" defaultValue="My coding agent lost a full day of work last week." checking />
      <VerifyInput label="Text or URL (error)" error="Paste the text of a post to check." />
    </Stack>
  ),
};

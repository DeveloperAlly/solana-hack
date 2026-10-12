import type { WorkbenchExample } from '../../system/example';
import { Button, Stack } from '../primitives';
import { StatePanel } from './StatePanel';

export const example: WorkbenchExample = {
  id: 'C29',
  name: 'StatePanel',
  description: 'Loading, error with retry, success with a next action.',
  render: () => (
    <Stack gap={3}>
      <StatePanel level={4} kind="loading" title="Reading jamjam.tech" body="We keep a fact only if its line is on the page." />
      <StatePanel level={4} kind="error" title="That didn't work" body="The check could not reach Solana. Nothing was lost." actions={<Button variant="secondary">Try again</Button>} />
      <StatePanel level={4} kind="success" title="Kit v1 registered" body="Anyone can now check it on the public ledger." actions={<Button>Open the ledger</Button>} />
    </Stack>
  ),
};

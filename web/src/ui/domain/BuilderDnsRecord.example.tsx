import type { WorkbenchExample } from '../../system/example';
import { Button, Stack } from '../primitives';
import { BuilderDnsRecord } from './BuilderDnsRecord';

// Record and causes from canvas boards Onboard-2-Domain and Onboard-2b-DomainFailed (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
const record = { type: 'TXT', host: '@', value: 'jamjam-verify=[unique value]' };
const causes = ['Added to a subdomain? Use @ or leave the host blank.', 'Extra quotes or spaces in the value? Paste it exactly as shown.', 'DNS not updated yet? Try again in a few minutes.'];

export const example: WorkbenchExample = {
  id: 'D37',
  name: 'BuilderDnsRecord',
  description: 'Waiting for the record (with Copy value), and not found with causes.',
  render: () => (
    <Stack gap={6}>
      <BuilderDnsRecord record={record} domain="jamjam.tech" status="waiting" actions={<Button>Check now</Button>} />
      <BuilderDnsRecord record={record} domain="jamjam.tech" status="not-found" causes={causes} actions={<Button>Check again</Button>} />
    </Stack>
  ),
};

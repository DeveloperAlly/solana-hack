import type { WorkbenchExample } from '../../system/example';
import { Badge, Button, Stack } from '../primitives';
import { HubApprovalCard } from './HubApprovalCard';

export const example: WorkbenchExample = {
  id: 'D1',
  name: 'HubApprovalCard',
  description: 'Drafted reply with actions, held (no draft), blocked, and done (outcome).',
  render: () => (
    <Stack gap={4}>
      <HubApprovalCard
        meta={<><Badge>X · mention</Badge><strong>@[handle]</strong> · 14 min ago</>}
        incoming="Does aDNA work with [agent tool]?"
        note="Drafted reply · Replies voice · Slop check passed"
        draft="Works out of the box."
        actions={<><Button>Approve and send</Button><Button variant="secondary">Skip</Button></>}
      />
      <HubApprovalCard meta={<Badge>Discord · #help</Badge>} incoming="Is there a template for monorepos?" note="No confident answer found. Held for you to write." actions={<Button variant="secondary">Write reply</Button>} />
      <HubApprovalCard meta={<Badge>Threads</Badge>} note="Blocked: watermark not found on this image." blocked actions={<Button>Re-stamp image</Button>} />
      <HubApprovalCard meta={<Badge>LinkedIn</Badge>} draft="Fair question." outcome="Sent" />
    </Stack>
  ),
};
